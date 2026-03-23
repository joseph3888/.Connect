// src/services/mockDataService.js
import localforage from 'localforage';

let cache = {
  users: [],
  posts: [],
  reels: [],
  stories: [],
  notifications: [],
  communities: [],
  blockedUsers: {},
  reports: [],
  connections: {},
  messages: [],
  peerRegistry: {} 
};

const syncChannel = new BroadcastChannel('data_sync');

export const forceRefresh = async () => {
  await initDB();
  window.dispatchEvent(new CustomEvent('db_updated'));
};

syncChannel.onmessage = (event) => {
  if (event.data === 'REFRESH') {
    forceRefresh();
  } else if (event.data?.type === 'PEER_REGISTRY_UPDATE') {
    cache.peerRegistry[event.data.userId] = event.data.peerId;
    // Notify local listeners that registry changed
    window.dispatchEvent(new CustomEvent('db_updated'));
  }
};

const notifySync = () => {
  syncChannel.postMessage('REFRESH');
};

const defaultUsers = [
  { id: '@alice', email: 'alice@test.com', name: "Alice Johnson", avatar: "AJ", bio: "Digital creator & tech enthusiast." },
  { id: '@david', email: 'david@test.com', name: "David Chen", avatar: "DC", bio: "I like sunsets and gradients." },
  { id: '@tech', email: 'tech@test.com', name: "Tech Insider", avatar: "TI", bio: "Breaking news in tech." },
  { id: '@john', email: 'john@test.com', name: "John Doe", avatar: "JD", bio: "Just here for the vibes." }
];

const defaultPosts = [
  { id: 1, authorId: '@alice', author: "Alice Johnson", time: "2 hours ago", content: "Just launched my new portfolio site! So excited to share it. 🚀✨", likes: [], comments: [] },
  { id: 2, authorId: '@david', author: "David Chen", time: "5 hours ago", content: "The sunset today was absolutely incredible. 🌅📸", likes: [], comments: [{id: 101, author: "Sarah W.", text: "Beautiful!", time: "1 hr ago"}] },
  { id: 3, authorId: '@tech', author: "Tech Insider", time: "1 day ago", content: "Breaking: New AI models are showing unprecedented capabilities.", likes: [], comments: [] }
];

const defaultReels = [
  { id: 999, author: "@nature_pro", description: "Breathtaking views from Big Buck Bunny 🐰 HD Video Benchmark", image: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", color1: "#8b5cf6", color2: "#d946ef", likes: ['tech@test.com'], comments: 1452 },
  { id: 998, author: "@animation_guru", description: "Elephants Dream Cinematic Flow 🐘", image: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", color1: "#10b981", color2: "#0ea5e9", likes: [], comments: 810 },
  { id: 1, author: "@creative_mind", description: "Designing the future ✨", color1: "#8b5cf6", color2: "#d946ef", likes: [], comments: 452 },
  { id: 2, author: "@tech_guru", description: "Wait for the drop 🎧", color1: "#10b981", color2: "#0ea5e9", likes: [], comments: 210 },
  { id: 3, author: "@daily_aesthetic", description: "Vibes only 🌅", color1: "#f59e0b", color2: "#ef4444", likes: [], comments: 1205 }
];

export const initDB = async () => {
  const [storedUsers, storedPosts, storedReels, storedMessages, storedStories, storedNotifs, storedConns, storedComms, storedBlocked, storedReports] = await Promise.all([
    localforage.getItem('users'),
    localforage.getItem('posts'),
    localforage.getItem('reels'),
    localforage.getItem('messages'),
    localforage.getItem('stories'),
    localforage.getItem('notifications'),
    localforage.getItem('connections'),
    localforage.getItem('communities'),
    localforage.getItem('blockedUsers'),
    localforage.getItem('reports')
  ]);

  let users = storedUsers || defaultUsers;
  cache.posts = storedPosts || defaultPosts;
  cache.reels = storedReels || defaultReels;
  cache.messages = storedMessages || [];
  cache.stories = storedStories || [];
  cache.notifications = storedNotifs || [];
  cache.communities = storedComms || [
    { id: 'tech-hub', name: 'Tech Hub', description: 'Everything about AI and Web Dev.', avatar: 'https://i.pravatar.cc/150?u=tech', members: ['@alice', '@tech'], ownerId: '@tech' },
    { id: 'nature-lovers', name: 'Nature Lovers', description: 'Share your best landscape shots.', avatar: 'https://i.pravatar.cc/150?u=nature', members: ['@david'], ownerId: '@david' }
  ];
  cache.blockedUsers = storedBlocked || {};
  cache.reports = storedReports || [];
  let conns = storedConns || {};

  let migrated = false;
  users = users.map(u => {
    if (!u) return u;
    // If id looks like an email and email is missing, move it
    if (u.id?.includes('@') && !u.id.startsWith('@') && !u.email) {
      const email = u.id;
      const handle = `@${email.split('@')[0]}`;
      migrated = true;
      return { ...u, id: handle, email: email };
    }
    // Ensure all handles start with @
    if (u.id && !u.id.startsWith('@') && !u.id.includes('@')) {
       u.id = `@${u.id}`;
       migrated = true;
    }
    return u;
  });

  cache.users = users;
  
  // MIGRATION: Shift connection keys from emails to handles if needed
  if (migrated) {
    const newConns = {};
    for (let oldKey in conns) {
      const user = users.find(u => u.email === oldKey || u.id === oldKey);
      const newKey = user ? user.id : oldKey;
      newConns[newKey] = (conns[oldKey] || []).map(targetId => {
        const targetUser = users.find(u => u.email === targetId || u.id === targetId);
        return targetUser ? targetUser.id : targetId;
      });
    }
    conns = newConns;
    await localforage.setItem('connections', conns);
    await localforage.setItem('users', cache.users);
  }
  cache.connections = conns;
  
  // Seed massive videos if missing from old caches
  if (!cache.reels.find(r => r.id === 999)) {
     cache.reels.unshift(defaultReels[1]);
     cache.reels.unshift(defaultReels[0]);
     await localforage.setItem('reels', cache.reels);
  }

  // Initial persist for empty DBs
  if (!storedUsers) localforage.setItem('users', cache.users);
  if (!storedPosts) localforage.setItem('posts', cache.posts);
  if (!storedReels) localforage.setItem('reels', cache.reels);
  if (!storedConns) localforage.setItem('connections', cache.connections);
  if (!storedMessages) localforage.setItem('messages', cache.messages);
  if (!storedComms) localforage.setItem('communities', cache.communities);
  if (!storedBlocked) localforage.setItem('blockedUsers', cache.blockedUsers);
  if (!storedReports) localforage.setItem('reports', cache.reports);
};

export const dataService = {
  // --- USERS ---
  getAllUsers: () => cache.users,
  
  getUserById: (id) => {
    return cache.users.find(u => u.id === id || u.email === id) || { id, name: String(id || '').split('@')[0], bio: "No bio available." };
  },

  searchUsers: (query) => {
    if (!query) return cache.users;
    const q = (query || '').toLowerCase();
    return (cache.users || []).filter(u => {
      if (!u) return false;
      const nameMatch = u.name && String(u.name).toLowerCase().includes(q);
      const idMatch = u.id && String(u.id).toLowerCase().includes(q);
      const emailMatch = u.email && String(u.email).toLowerCase().includes(q);
      return nameMatch || idMatch || emailMatch;
    });
  },

  // --- POSTS ---
  getPosts: () => cache.posts,
  
  getPostById: (id) => {
    return cache.posts.find(p => p.id === Number(id));
  },
  
  addPost: (authorId, authorName, content, imageBase64) => {
    const newPost = {
      id: Date.now(),
      authorId,
      author: authorName,
      time: "Just now",
      content,
      image: imageBase64 || null,
      likes: [],
      comments: []
    };
    cache.posts = [newPost, ...cache.posts];
    localforage.setItem('posts', cache.posts);
    notifySync();
    return newPost;
  },

  toggleLikePost: (postId, userId) => {
    if (!userId) return;
    const post = cache.posts.find(p => p.id === postId);
    if (post) {
      if (!Array.isArray(post.likes)) post.likes = [];
      const liked = post.likes.includes(userId);
      if (liked) {
        post.likes = post.likes.filter(id => id !== userId);
      } else {
        post.likes.push(userId);
        // Notify author if it's not their own post
        if (post.authorId !== userId) {
          const fromUser = cache.users.find(u => u.id === userId || u.email === userId);
          dataService.addNotification(post.authorId, userId, fromUser?.name || userId, 'like', postId);
        }
      }
      localforage.setItem('posts', cache.posts);
      notifySync();
      return post;
    }
  },

  addComment: (postId, authorId, authorName, text) => {
    const post = cache.posts.find(p => p.id === postId);
    if (post) {
      const newComment = {
        id: Date.now(),
        author: authorName,
        text,
        time: "Just now"
      };
      post.comments.push(newComment);
      // Notify author if it's not their own post
      if (post.authorId !== authorId) {
        dataService.addNotification(post.authorId, authorId, authorName, 'comment', postId);
      }
      localforage.setItem('posts', cache.posts);
      notifySync();
      return post;
    }
  },

  // --- REELS ---
  getReels: () => {
    // Combine mock reels with user-uploaded persistent reels
    const mockReels = [
      { id: 'mock-1', user: 'saimon', avatar: 'https://i.pravatar.cc/150?u=saimon', video: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4', likes: 1200, comments: 450, desc: 'Neon vibes only! 🚀 #nightlife' },
      { id: 'mock-2', user: 'tech_guru', avatar: 'https://i.pravatar.cc/150?u=tech', video: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-1589-large.mp4', likes: 850, comments: 120, desc: 'Fall is here. #nature' },
    ];
    // Note: The existing `cache.reels` already contains default reels and user-added reels.
    // The new mockReels are added on top of that.
    return [...cache.reels, ...mockReels];
  },
  
  addReel: (userId, authorName, desc, videoFile, audioFile) => {
    const newReel = {
      id: Date.now(),
      authorId: userId,
      author: authorName,
      description: desc,
      image: videoFile, 
      audio: audioFile,
      color1: "rgba(118, 123, 111, 0.2)",
      color2: "rgba(43, 48, 44, 0.4)",
      likes: [],
      comments: 0
    };
    cache.reels.unshift(newReel);
    localforage.setItem('reels', cache.reels);
    notifySync();
    return newReel;
  },

  // --- STORIES (Ephemeral 24h) ---
  getStories: () => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    // Filter out expired stories
    const activeStories = cache.stories.filter(s => (now - s.timestamp) < twentyFourHours);
    
    // Group by user for the tray
    const grouped = activeStories.reduce((acc, s) => {
      if (!acc[s.userId]) acc[s.userId] = { userId: s.userId, userName: s.userName, userAvatar: s.userAvatar, slides: [] };
      acc[s.userId].slides.push(s);
      return acc;
    }, {});
    
    return Object.values(grouped);
  },

  addStory: (userId, userName, userAvatar, content, type = 'image') => {
    const newStory = {
      id: Date.now(),
      userId,
      userName,
      userAvatar,
      content, // Base64 or URL
      type, // 'image' or 'video'
      timestamp: Date.now()
    };
    cache.stories.push(newStory);
    localforage.setItem('stories', cache.stories);
    notifySync();
    return newStory;
  },

  // --- NOTIFICATIONS ---
  getNotifications: (userId) => {
    return cache.notifications
      .filter(n => n.toUserId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  addNotification: (toUserId, fromUserId, fromUserName, type, referenceId) => {
    const newNotif = {
      id: Date.now(),
      toUserId,
      fromUserId,
      fromUserName,
      type, // 'like', 'comment', 'connect'
      referenceId,
      timestamp: Date.now(),
      read: false
    };
    cache.notifications.unshift(newNotif);
    localforage.setItem('notifications', cache.notifications);
    notifySync();
    return newNotif;
  },

  markNotificationsRead: (userId) => {
    cache.notifications.forEach(n => {
      if (n.toUserId === userId) n.read = true;
    });
    localforage.setItem('notifications', cache.notifications);
    notifySync();
  },

  toggleLikeReel: (reelId, userId) => {
    if (!userId) return;
    const reel = cache.reels.find(r => r.id === reelId);
    if (reel) {
      if (!Array.isArray(reel.likes)) reel.likes = [];
      const liked = reel.likes.includes(userId);
      if (liked) {
        reel.likes = reel.likes.filter(id => id !== userId);
      } else {
        reel.likes.push(userId);
        // Notify author if we have an authorId
        if (reel.authorId && reel.authorId !== userId) {
          const fromUser = cache.users.find(u => u.id === userId || u.email === userId);
          dataService.addNotification(reel.authorId, userId, fromUser?.name || userId, 'like', reelId);
        }
      }
      localforage.setItem('reels', cache.reels);
      notifySync();
      return reel;
    }
  },

  // --- CONNECTIONS ---
  getConnectedCount: (userId) => {
    let count = 0;
    for (let key in cache.connections) {
      if (cache.connections[key] && cache.connections[key].includes(userId)) {
        count++;
      }
    }
    return count;
  },

  getFollowingCount: (userId) => {
    return (cache.connections[userId] || []).length;
  },

  isConnected: (fromUserId, toUserId) => {
    return (cache.connections[fromUserId] || []).includes(toUserId);
  },

  toggleConnection: (fromUserId, toUserId) => {
    let userConns = cache.connections[fromUserId] || [];
    const isConnecting = !userConns.includes(toUserId);
    
    if (!isConnecting) {
      userConns = userConns.filter(id => id !== toUserId);
    } else {
      userConns.push(toUserId);
      // Notify target user
      const fromUser = cache.users.find(u => u.id === fromUserId || u.email === fromUserId);
      dataService.addNotification(toUserId, fromUserId, fromUser?.name || fromUserId, 'connect', fromUserId);
    }
    
    cache.connections[fromUserId] = userConns;
    localforage.setItem('connections', cache.connections);
    notifySync();
    return isConnecting;
  },

  // --- MESSAGES ---
  getMessages: (userId) => {
    return cache.messages.filter(m => m.senderId === userId || m.receiverId === userId);
  },

  addMessage: (senderId, receiverId, text, audioUrl = null) => {
    const newMsg = {
      id: Date.now(),
      senderId,
      receiverId,
      text,
      audioUrl,
      time: new Date().toISOString()
    };
    cache.messages.push(newMsg);
    localforage.setItem('messages', cache.messages);
    notifySync();
    return newMsg;
  },

  deleteMessage: (id) => {
    cache.messages = cache.messages.filter(m => m.id !== id);
    localforage.setItem('messages', cache.messages);
    notifySync();
  },

  updatePeerRegistry: (userId, peerId) => {
    cache.peerRegistry[userId] = peerId;
    syncChannel.postMessage({ type: 'PEER_REGISTRY_UPDATE', userId, peerId });
    window.dispatchEvent(new CustomEvent('db_updated'));
  },

  getPeerIdFromRegistry: (userId) => {
    return cache.peerRegistry[userId];
  },

  // --- COMMUNITIES ---
  getCommunities: () => cache.communities,

  getCommunityById: (id) => cache.communities.find(c => c.id === id),

  createCommunity: (name, description, ownerId) => {
    const newComm = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description,
      avatar: `https://i.pravatar.cc/150?u=${name}`,
      members: [ownerId],
      ownerId
    };
    cache.communities.push(newComm);
    localforage.setItem('communities', cache.communities);
    notifySync();
    return newComm;
  },

  toggleCommunityMembership: (commId, userId) => {
    const comm = cache.communities.find(c => c.id === commId);
    if (!comm) return;
    if (comm.members.includes(userId)) {
      comm.members = comm.members.filter(m => m !== userId);
    } else {
      comm.members.push(userId);
    }
    localforage.setItem('communities', cache.communities);
    notifySync();
    return comm.members.includes(userId);
  },

  getCommunityPosts: (commId) => {
    return cache.posts.filter(p => p.communityId === commId);
  },

  addCommunityPost: (commId, authorId, authorName, content, imageBase64) => {
    const post = dataService.addPost(authorId, authorName, content, imageBase64);
    post.communityId = commId;
    localforage.setItem('posts', cache.posts);
    return post;
  },

  // --- UNIFIED SEARCH ---
  searchAll: (query) => {
    if (!query || query.length < 2) return { users: [], posts: [], communities: [], reels: [] };
    const q = query.toLowerCase();
    
    return {
      users: (cache.users || []).filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.id && u.id.toLowerCase().includes(q))
      ).slice(0, 5),
      
      posts: (cache.posts || []).filter(p => 
        (p.content && p.content.toLowerCase().includes(q)) ||
        (p.author && p.author.toLowerCase().includes(q))
      ).slice(0, 5),
      
      communities: (cache.communities || []).filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      ).slice(0, 5),

      reels: (cache.reels || []).filter(r => 
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.author && r.author.toLowerCase().includes(q))
      ).slice(0, 5)
    };
  },

  // --- PRIVACY & SAFETY ---
  blockUser: (blockerId, targetId) => {
    if (!cache.blockedUsers[blockerId]) cache.blockedUsers[blockerId] = [];
    if (!cache.blockedUsers[blockerId].includes(targetId)) {
      cache.blockedUsers[blockerId].push(targetId);
      localforage.setItem('blockedUsers', cache.blockedUsers);
      notifySync();
    }
  },

  unblockUser: (blockerId, targetId) => {
    if (cache.blockedUsers[blockerId]) {
      cache.blockedUsers[blockerId] = cache.blockedUsers[blockerId].filter(id => id !== targetId);
      localforage.setItem('blockedUsers', cache.blockedUsers);
      notifySync();
    }
  },

  isBlocked: (id1, id2) => {
    return (cache.blockedUsers[id1]?.includes(id2)) || (cache.blockedUsers[id2]?.includes(id1));
  },

  reportContent: (type, contentId, reporterId, reason) => {
    const report = {
      id: Date.now(),
      type,
      contentId,
      reporterId,
      reason,
      timestamp: new Date().toISOString()
    };
    cache.reports.push(report);
    localforage.setItem('reports', cache.reports);
    return report;
  },

  // --- SOCIAL TRENDS ---
  getTrendingTopics: () => {
    const tags = {};
    cache.posts.forEach(p => {
      if (!p.content) return;
      const found = p.content.match(/#\w+/g);
      if (found) {
        found.forEach(t => {
          const clean = t.replace('#', '').toLowerCase();
          tags[clean] = (tags[clean] || 0) + 1;
        });
      }
    });

    const entries = Object.entries(tags).map(([tag, count]) => ({
      name: `#${tag}`,
      posts: count,
      id: tag
    }));

    return entries.sort((a,b) => b.posts - a.posts).slice(0, 5);
  }
};
