// src/services/mockDataService.js
import localforage from 'localforage';

let cache = {
  users: [],
  posts: [],
  reels: [],
  connections: {},
  messages: [],
  peerRegistry: {} // Mapping of user handle/email to active Peer ID
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
  const storedUsers = await localforage.getItem('users');
  let users = storedUsers || defaultUsers;

  // MIGRATION: Ensure all users have normalized id AND email
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
  if (migrated) await localforage.setItem('users', cache.users);
  
  const storedPosts = await localforage.getItem('posts');
  cache.posts = storedPosts || defaultPosts;
  
  const storedReels = await localforage.getItem('reels');
  cache.reels = storedReels || defaultReels;
  
  const storedConns = await localforage.getItem('connections');
  let conns = storedConns || {};

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
  }
  cache.connections = conns;
  
  const storedMessages = await localforage.getItem('messages');
  cache.messages = storedMessages || [];

  // Seed massive videos if missing from old caches
  if (!cache.reels.find(r => r.id === 999)) {
     cache.reels.unshift(defaultReels[1]);
     cache.reels.unshift(defaultReels[0]);
     await localforage.setItem('reels', cache.reels);
  }

  if (!storedUsers) await localforage.setItem('users', cache.users);
  if (!storedPosts) await localforage.setItem('posts', cache.posts);
  if (!storedReels) await localforage.setItem('reels', cache.reels);
  if (!storedConns) await localforage.setItem('connections', cache.connections);
  if (!storedMessages) await localforage.setItem('messages', cache.messages);
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
      if (post.likes.includes(userId)) {
        post.likes = post.likes.filter(id => id !== userId);
      } else {
        post.likes.push(userId);
      }
      localforage.setItem('posts', cache.posts);
      notifySync();
      return post;
    }
  },

  addComment: (postId, authorName, text) => {
    const post = cache.posts.find(p => p.id === postId);
    if (post) {
      const newComment = {
        id: Date.now(),
        author: authorName,
        text,
        time: "Just now"
      };
      post.comments.push(newComment);
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
      image: videoFile, // Using 'image' as the property for the main video blob
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

  toggleLikeReel: (reelId, userId) => {
    if (!userId) return;
    const reel = cache.reels.find(r => r.id === reelId);
    if (reel) {
      if (!Array.isArray(reel.likes)) reel.likes = [];
      if (reel.likes.includes(userId)) {
        reel.likes = reel.likes.filter(id => id !== userId);
      } else {
        reel.likes.push(userId);
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
    
    if (userConns.includes(toUserId)) {
      userConns = userConns.filter(id => id !== toUserId);
    } else {
      userConns.push(toUserId);
    }
    
    cache.connections[fromUserId] = userConns;
    localforage.setItem('connections', cache.connections);
    notifySync();
    return userConns.includes(toUserId);
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

  updatePeerRegistry: (userId, peerId) => {
    cache.peerRegistry[userId] = peerId;
    syncChannel.postMessage({ type: 'PEER_REGISTRY_UPDATE', userId, peerId });
    window.dispatchEvent(new CustomEvent('db_updated'));
  },

  getPeerIdFromRegistry: (userId) => {
    return cache.peerRegistry[userId];
  }
};
