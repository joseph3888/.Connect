// src/services/firebaseDataService.js
// Cloud-backed data service using Firebase Firestore
// Replaces localforage (device-local) with a global cloud database

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, setDoc, arrayUnion, arrayRemove,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary, compressAndConvertToBase64 } from './mediaService';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const createUserProfile = async (uid, profileData) => {
  await setDoc(doc(db, 'users', uid), {
    ...profileData,
    createdAt: serverTimestamp(),
    connections: [],
    blockedUsers: []
  });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  // Ensure we don't accidentally wipe coverPhoto if it's not in the update
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const searchUsers = async (query_str) => {
  const all = await getAllUsers();
  const q = query_str.toLowerCase();
  return all.filter(u =>
    (u.name && u.name.toLowerCase().includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q)) ||
    (u.handle && u.handle.toLowerCase().includes(q))
  ).slice(0, 10);
};

// ─── CONNECTIONS ─────────────────────────────────────────────────────────────

export const isConnected = async (myUid, theirUid) => {
  const me = await getUserProfile(myUid);
  return (me?.connections || []).includes(theirUid);
};

export const toggleConnection = async (myUid, theirUid) => {
  const me = await getUserProfile(myUid);
  const connected = (me?.connections || []).includes(theirUid);
  await updateDoc(doc(db, 'users', myUid), {
    connections: connected ? arrayRemove(theirUid) : arrayUnion(theirUid)
  });
  return !connected;
};

// ─── POSTS ───────────────────────────────────────────────────────────────────

export const getPosts = (callback) => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q,
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error("Firestore getPosts error:", err);
      callback([]);
    }
  );
};

export const addPost = async (userId, userName, content, mediaFile, onProgress = null) => {
  let mediaUrl = null;
  if (mediaFile && (mediaFile instanceof File || mediaFile instanceof Blob)) {
    mediaUrl = await uploadToCloudinary(mediaFile, onProgress);
  }

  return addDoc(collection(db, 'posts'), {
    authorId: userId,
    authorName: userName,
    text: content,
    image: mediaUrl,
    createdAt: new Date(),
    likes: [],
    comments: [],
    reactions: {}
  });
};

export const toggleLikePost = async (postId, userId) => {
  const ref = doc(db, 'posts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  await updateDoc(ref, {
    likes: likes.includes(userId) ? arrayRemove(userId) : arrayUnion(userId)
  });
};

export const addComment = async (postId, authorId, authorName, text) => {
  const ref = doc(db, 'posts', postId);
  const comment = {
    id: Date.now().toString(),
    authorId,
    author: authorName,
    text,
    time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
  await updateDoc(ref, { comments: arrayUnion(comment) });
  return comment;
};

export const getPostById = async (postId) => {
  const snap = await getDoc(doc(db, 'posts', postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────

const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

export const getMessages = (myUid, theirUid, callback) => {
  const chatId = getChatId(myUid, theirUid);
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error("Firestore getMessages error:", err);
      callback([]);
    }
  );
};

export const sendMessage = async (senderId, receiverId, text, audioBlob = null, imageFile = null, onProgress = null) => {
  const chatId = [senderId, receiverId].sort().join('_');
  let mediaUrl = null;
  let mediaType = 'text';

  if (audioBlob) {
    mediaUrl = await uploadToCloudinary(audioBlob, onProgress);
    mediaType = 'audio';
  } else if (imageFile) {
    mediaUrl = await uploadToCloudinary(imageFile, onProgress);
    mediaType = 'image';
  }

  const messageData = {
    senderId,
    text,
    mediaUrl,
    mediaType,
    createdAt: new Date(),
    read: false,
    reactions: {}
  };

  if (onProgress && !audioBlob && !imageFile) onProgress(100);
  return addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
};

export const setTypingStatus = async (myUid, theirUid, isTyping) => {
  try {
    const chatId = getChatId(myUid, theirUid);
    await setDoc(doc(db, 'chats', chatId, 'presence', myUid), {
      isTyping,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error setting typing status:", error);
    throw error;
  }
};

export const markMessageAsRead = async (chatId, messageId) => {
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      read: true
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

export const addMessageReaction = async (chatId, messageId, userId, emoji) => {
  try {
    const ref = doc(db, 'chats', chatId, 'messages', messageId);
    await updateDoc(ref, {
      [`reactions.${userId}`]: emoji
    });
  } catch (error) {
    console.error("Error adding message reaction:", error);
    throw error;
  }
};

export const reactToPost = async (postId, userId, emoji) => {
  try {
    const ref = doc(db, 'posts', postId);
    await updateDoc(ref, {
      [`reactions.${userId}`]: emoji
    });
  } catch (error) {
    console.error("Error reacting to post:", error);
    throw error;
  }
};

export const toggleBookmark = async (userId, postId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;

    const bookmarks = userSnap.data().bookmarks || [];
    const isBookmarked = bookmarks.includes(postId);

    await updateDoc(userRef, {
      bookmarks: isBookmarked ? arrayRemove(postId) : arrayUnion(postId)
    });
    return !isBookmarked;
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    throw error;
  }
};

export const repostPost = async (userId, userName, originalPost, quote = '') => {
  try {
    const post = {
      authorId: userId,
      author: userName,
      content: quote,
      repostOf: originalPost.id,
      originalAuthor: originalPost.author,
      originalContent: originalPost.content,
      originalImage: originalPost.image || null,
      createdAt: serverTimestamp(),
      likes: [],
      comments: [],
      reactions: {}
    };
    const res = await addDoc(collection(db, 'posts'), post);
    return { id: res.id, ...post };
  } catch (error) {
    console.error("Error reposting post:", error);
    throw error;
  }
};

export const deleteMessage = async (myUid, theirUid, messageId) => {
  try {
    const chatId = getChatId(myUid, theirUid);
    await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────

export const getCommunities = async () => {
  try {
    const snap = await getDocs(collection(db, 'communities'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting communities:", error);
    throw error;
  }
};

export const getCommunityById = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'communities', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error("Error getting community by ID:", error);
    throw error;
  }
};

export const createCommunity = async (name, description, ownerId) => {
  try {
    const ref = await addDoc(collection(db, 'communities'), {
      name,
      description,
      avatar: `https://i.pravatar.cc/150?u=${name}`,
      members: [ownerId],
      ownerId,
      createdAt: serverTimestamp()
    });
    return { id: ref.id, name, description, members: [ownerId], ownerId };
  } catch (error) {
    console.error("Error creating community:", error);
    throw error;
  }
};

export const updateCommunityProfile = async (commId, data) => {
  try {
    const ref = doc(db, 'communities', commId);
    await updateDoc(ref, data);
    return true;
  } catch (error) {
    console.error("Error updating community profile:", error);
    throw error;
  }
};

export const toggleCommunityMembership = async (commId, userId) => {
  try {
    const comm = await getCommunityById(commId);
    if (!comm) return false;
    const isMember = (comm.members || []).includes(userId);
    await updateDoc(doc(db, 'communities', commId), {
      members: isMember ? arrayRemove(userId) : arrayUnion(userId)
    });
    return !isMember;
  } catch (error) {
    console.error("Error toggling community membership:", error);
    throw error;
  }
};

export const getCommunityPosts = (commId, callback) => {
  const q = query(collection(db, 'posts'), where('communityId', '==', commId), orderBy('createdAt', 'desc'));
  return onSnapshot(q,
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error("Firestore getCommunityPosts error:", err);
      callback([]);
    }
  );
};

export const addCommunityPost = async (commId, authorId, authorName, content, file = null, onProgress = null) => {
  let imageUrl = null;
  try {
    if (file && (file instanceof File || file instanceof Blob)) {
      imageUrl = await uploadToCloudinary(file, onProgress);
    }

    const post = {
      authorId, author: authorName, content, image: imageUrl,
      likes: [], comments: [], communityId: commId,
      createdAt: serverTimestamp(),
      time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
    const res = await addDoc(collection(db, 'posts'), post);
    return { id: res.id, ...post };
  } catch (error) {
    console.error("Error adding community post:", error);
    throw error;
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const getNotifications = (uid, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q,
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error("Firestore getNotifications error:", err);
      callback([]);
    }
  );
};

export const addNotification = async (targetId, fromId, fromName, type, refId) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      targetId, fromId, fromName, type, refId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding notification:", error);
    throw error;
  }
};

export const markNotificationsRead = async (uid) => {
  try {
    const q = query(collection(db, 'notifications'), where('targetId', '==', uid), where('read', '==', false));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true })));
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

// ─── BLOCK / REPORT ────────────────────────────────────────────────────────────

export const blockUser = async (myUid, targetUid) => {
  try {
    await updateDoc(doc(db, 'users', myUid), { blockedUsers: arrayUnion(targetUid) });
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
};

export const unblockUser = async (myUid, targetUid) => {
  try {
    await updateDoc(doc(db, 'users', myUid), { blockedUsers: arrayRemove(targetUid) });
  } catch (error) {
    console.error("Error unblocking user:", error);
    throw error;
  }
};

export const isBlocked = async (myUid, targetUid) => {
  try {
    const me = await getUserProfile(myUid);
    const them = await getUserProfile(targetUid);
    return (me?.blockedUsers || []).includes(targetUid) || (them?.blockedUsers || []).includes(myUid);
  } catch (error) {
    console.error("Error checking if user is blocked:", error);
    throw error;
  }
};

export const reportContent = async (type, contentId, reporterId, reason) => {
  try {
    await addDoc(collection(db, 'reports'), {
      type, contentId, reporterId, reason, createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error reporting content:", error);
    throw error;
  }
};

// ─── SEARCH ────────────────────────────────────────────────────────────────────

export const searchAll = async (queryStr) => {
  try {
    if (!queryStr || queryStr.length < 2) return { users: [], posts: [], communities: [] };
    const q = queryStr.toLowerCase();
    const [users, posts, communities] = await Promise.all([
      getAllUsers(),
      getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
      getCommunities()
    ]);
    return {
      users: users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)).slice(0, 5),
      posts: posts.filter(p => p.content?.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q)).slice(0, 5),
      communities: communities.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)).slice(0, 5)
    };
  } catch (error) {
    console.error("Error in searchAll:", error);
    throw error;
  }
};

// ─── TRENDING ─────────────────────────────────────────────────────────────────

export const getTrendingTopics = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100)));
    const tags = {};
    snap.docs.forEach(d => {
      const content = d.data().content;
      if (!content) return;
      const found = content.match(/#\w+/g);
      if (found) found.forEach(t => {
        const clean = t.replace('#', '').toLowerCase();
        tags[clean] = (tags[clean] || 0) + 1;
      });
    });
    return Object.entries(tags)
      .map(([tag, count]) => ({ name: `#${tag}`, posts: count, id: tag }))
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 5);
  } catch (error) {
    console.error("Error getting trending topics:", error);
    throw error;
  }
};

// ─── STORIES ─────────────────────────────────────────────────────────────────

export const addStory = async (userId, userName, userAvatar, mediaFile, onProgress = null) => {
  try {
    let mediaUrl = null;
    if (mediaFile && (mediaFile instanceof File || mediaFile instanceof Blob)) {
      mediaUrl = await uploadToCloudinary(mediaFile, onProgress);
    }

    return addDoc(collection(db, 'stories'), {
      authorId: userId,
      authorName: userName,
      authorAvatar: userAvatar,
      content: mediaUrl,
      type: mediaFile && mediaFile.type && mediaFile.type.startsWith('image') ? 'image' : 'video',
      createdAt: new Date(),
      timestampMs: Date.now(),
      views: [],
      likes: [],
      comments: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error("Error adding story:", error);
    throw error;
  }
};

export const getConnectedStories = async (myUid, callback) => {
  try {
    const me = await getUserProfile(myUid);
    const myConnections = me?.connections || [];
    const oneDayAgoMs = Date.now() - (24 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'stories'),
      where('timestampMs', '>', oneDayAgoMs),
      orderBy('timestampMs', 'asc')
    );

    return onSnapshot(q, (snap) => {
      const allActiveStories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const visibleStories = allActiveStories.filter(s =>
        s.authorId === myUid || myConnections.includes(s.authorId)
      );

      const groups = {};
      visibleStories.forEach(story => {
        if (!groups[story.authorId]) {
          groups[story.authorId] = {
            userId: story.authorId,
            userName: story.authorName,
            userAvatar: story.authorAvatar,
            slides: []
          };
        }
        groups[story.authorId].slides.push(story);
      });

      callback(Object.values(groups).sort((a, b) => (a.userId === myUid ? -1 : (b.userId === myUid ? 1 : 0))));
    });
  } catch (error) {
    console.error("Error fetching connected stories:", error);
    callback([]);
  }
};

export const toggleLikeStory = async (storyId, userId) => {
  const ref = doc(db, 'stories', storyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  await updateDoc(ref, {
    likes: likes.includes(userId) ? arrayRemove(userId) : arrayUnion(userId)
  });
};

export const commentStory = async (storyId, authorId, authorName, text) => {
  const ref = doc(db, 'stories', storyId);
  const comment = { id: Date.now().toString(), authorId, authorName, text, time: new Date().toISOString() };
  await updateDoc(ref, { comments: arrayUnion(comment) });
  return comment;
};

// ─── REELS ───────────────────────────────────────────────────────────────────

export const getReels = (callback) => {
  const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const addReel = async (userId, userName, userAvatar, description, mediaFile, onProgress = null) => {
  try {
    let mediaUrl = null;
    if (mediaFile && (mediaFile instanceof File || mediaFile instanceof Blob)) {
      mediaUrl = await uploadToCloudinary(mediaFile, onProgress);
    } else if (typeof mediaFile === 'string') {
      mediaUrl = mediaFile;
    }

    return addDoc(collection(db, 'reels'), {
      authorId: userId,
      authorName: userName,
      authorAvatar: userAvatar,
      description,
      image: mediaUrl,
      createdAt: new Date(),
      likes: [],
      comments: [],
      shares: 0,
      views: 0
    });
  } catch (error) {
    console.error("Error adding reel:", error);
    throw error;
  }
};

export const toggleLikeReel = async (reelId, userId) => {
  const ref = doc(db, 'reels', reelId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const likes = snap.data().likes || [];
  await updateDoc(ref, {
    likes: likes.includes(userId) ? arrayRemove(userId) : arrayUnion(userId)
  });
};

export const commentReel = async (reelId, authorId, authorName, text) => {
  const ref = doc(db, 'reels', reelId);
  const comment = { id: Date.now().toString(), authorId, authorName, text, time: new Date().toISOString() };
  await updateDoc(ref, { comments: arrayUnion(comment) });
  return comment;
};

// ─── PEER REGISTRY (Signaling) ───────────────────────────────────────────────

export const updatePeerRegistry = async (profileId, peerId) => {
  await setDoc(doc(db, 'signaling', profileId), {
    peerId,
    updatedAt: serverTimestamp()
  });
};

export const getPeerRegistry = async (profileId) => {
  const snap = await getDoc(doc(db, 'signaling', profileId));
  return snap.exists() ? snap.data().peerId : null;
};
