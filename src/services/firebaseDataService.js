// src/services/firebaseDataService.js
// Cloud-backed data service using Firebase Firestore
// Replaces localforage (device-local) with a global cloud database

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, setDoc, arrayUnion, arrayRemove,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

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

export const updateUserProfile = async (uid, updates) => {
  await updateDoc(doc(db, 'users', uid), updates);
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
  return onSnapshot(q, snap => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(posts);
  });
};

export const addPost = async (authorId, authorName, content, imageBase64 = null) => {
  const post = {
    authorId,
    author: authorName,
    content,
    image: imageBase64 || null,
    likes: [],
    comments: [],
    createdAt: serverTimestamp(),
    time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
  const ref = await addDoc(collection(db, 'posts'), post);
  return { id: ref.id, ...post };
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
  const comment = { id: Date.now(), authorId, author: authorName, text, time: new Date().toISOString() };
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
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const sendMessage = async (myUid, theirUid, text, audioUrl = null) => {
  const chatId = getChatId(myUid, theirUid);
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId: myUid,
    receiverId: theirUid,
    text: text || '',
    audioUrl: audioUrl || null,
    createdAt: serverTimestamp()
  });
};

export const deleteMessage = async (myUid, theirUid, messageId) => {
  const chatId = getChatId(myUid, theirUid);
  await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
};

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────

export const getCommunities = async () => {
  const snap = await getDocs(collection(db, 'communities'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getCommunityById = async (id) => {
  const snap = await getDoc(doc(db, 'communities', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createCommunity = async (name, description, ownerId) => {
  const ref = await addDoc(collection(db, 'communities'), {
    name,
    description,
    avatar: `https://i.pravatar.cc/150?u=${name}`,
    members: [ownerId],
    ownerId,
    createdAt: serverTimestamp()
  });
  return { id: ref.id, name, description, members: [ownerId], ownerId };
};

export const toggleCommunityMembership = async (commId, userId) => {
  const comm = await getCommunityById(commId);
  if (!comm) return false;
  const isMember = (comm.members || []).includes(userId);
  await updateDoc(doc(db, 'communities', commId), {
    members: isMember ? arrayRemove(userId) : arrayUnion(userId)
  });
  return !isMember;
};

export const getCommunityPosts = (commId, callback) => {
  const q = query(collection(db, 'posts'), where('communityId', '==', commId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const addCommunityPost = async (commId, authorId, authorName, content, imageBase64) => {
  const post = {
    authorId, author: authorName, content, image: imageBase64 || null,
    likes: [], comments: [], communityId: commId,
    createdAt: serverTimestamp(),
    time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
  const ref = await addDoc(collection(db, 'posts'), post);
  return { id: ref.id, ...post };
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const getNotifications = (uid, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('targetId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const addNotification = async (targetId, fromId, fromName, type, refId) => {
  await addDoc(collection(db, 'notifications'), {
    targetId, fromId, fromName, type, refId,
    read: false,
    createdAt: serverTimestamp()
  });
};

export const markNotificationsRead = async (uid) => {
  const q = query(collection(db, 'notifications'), where('targetId', '==', uid), where('read', '==', false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true })));
};

// ─── BLOCK / REPORT ────────────────────────────────────────────────────────────

export const blockUser = async (myUid, targetUid) => {
  await updateDoc(doc(db, 'users', myUid), { blockedUsers: arrayUnion(targetUid) });
};

export const unblockUser = async (myUid, targetUid) => {
  await updateDoc(doc(db, 'users', myUid), { blockedUsers: arrayRemove(targetUid) });
};

export const isBlocked = async (myUid, targetUid) => {
  const me = await getUserProfile(myUid);
  const them = await getUserProfile(targetUid);
  return (me?.blockedUsers || []).includes(targetUid) || (them?.blockedUsers || []).includes(myUid);
};

export const reportContent = async (type, contentId, reporterId, reason) => {
  await addDoc(collection(db, 'reports'), {
    type, contentId, reporterId, reason, createdAt: serverTimestamp()
  });
};

// ─── SEARCH ────────────────────────────────────────────────────────────────────

export const searchAll = async (queryStr) => {
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
};

// ─── TRENDING ─────────────────────────────────────────────────────────────────

export const getTrendingTopics = async () => {
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
};
