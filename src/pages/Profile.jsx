/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  isConnected,
  toggleConnection,
  getPosts, toggleLikePost,
  blockUser,
} from '../services/firebaseDataService';
import { 
  Settings, Grid, PlaySquare, Heart, MapPin, Calendar, Link as LinkIcon, Edit3, 
  MessageSquare, UserPlus, UserMinus, ShieldAlert, Share2, Camera, Check, X, Users
} from 'lucide-react';
import { compressAndConvertToBase64, uploadToCloudinary } from '../services/mediaService';
import { Button, Card, Badge } from '../components/ui/Primitives';

export function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [mutualConnections, setMutualConnections] = useState([]);
  
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ cover: 0, avatar: 0 });

  const targetUid = id || currentUser?.uid;
  const isMyProfile = currentUser?.uid === targetUid;

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!targetUid) return;
      setLoading(true);
      
      const data = await getUserProfile(targetUid);
      if (mounted && data) {
        setProfile(data);

        if (!isMyProfile && currentUser) {
          const conn = await isConnected(currentUser.uid, targetUid);
          setConnected(conn);

          // Find mutual connections
          const myProfile = await getUserProfile(currentUser.uid);
          if (myProfile?.connections && data.connections) {
            const mutual = myProfile.connections.filter(c => data.connections.includes(c));
            const allUsers = await getAllUsers();
            setMutualConnections(allUsers.filter(u => mutual.includes(u.id)));
          }
        }
      }
      setLoading(false);
    };

    let unsubPosts;
    if (targetUid) {
      unsubPosts = getPosts(allPosts => {
        if (mounted) setUserPosts(allPosts.filter(p => p.authorId === targetUid));
      });
    }

    loadProfile();
    return () => {
      mounted = false;
      unsubPosts && unsubPosts();
    };
  }, [targetUid, currentUser, isMyProfile]);

  const handleToggleConnection = async () => {
    if (!currentUser || !profile) return;
    const newStatus = await toggleConnection(currentUser.uid, profile.id);
    setConnected(newStatus);
    setProfile(p => ({
      ...p,
      connections: newStatus 
        ? [...(p.connections || []), currentUser.uid] 
        : (p.connections || []).filter(c => c !== currentUser.uid)
    }));
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!currentUser || !file) return;

    if (type === 'cover') setUploadingCover(true);
    if (type === 'avatar') setUploadingAvatar(true);

    try {
      // Use Cloudinary for storage instead of Base64 Firestore
      const mediaUrl = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(prev => ({ ...prev, [type]: percent }));
      });
      
      const update = type === 'cover' ? { coverPhoto: mediaUrl } : { avatar: mediaUrl };
      await updateUserProfile(currentUser.uid, update);
      setProfile(prev => ({ ...prev, ...update }));
    } catch (err) {
      console.error(err);
      alert(`Failed to upload ${type}. Cloudinary error.`);
    } finally {
      if (type === 'cover') setUploadingCover(false);
      if (type === 'avatar') setUploadingAvatar(false);
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !profile) return;
    if (confirm(`Block ${profile?.name}?`)) {
      await blockUser(currentUser.uid, profile.id);
      navigate('/');
    }
  };

  if (loading && !profile) {
    return <div className="flex-center h-64 text-muted animate-pulse">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="flex-center h-64 text-muted">User not found</div>;
  }

  return (
    <div className="profile-wrapper max-w-5xl mx-auto pb-space-xl">
      {/* Cover Photo */}
      <div className="relative h-72 md:h-80 w-full overflow-hidden bg-surface-active rounded-b-radius-lg group/cover">
        {profile.coverPhoto ? (
          <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
        )}
        {isMyProfile && (
          <label className="absolute bottom-4 right-4 p-3 glass rounded-full cursor-pointer transition-all hover:scale-105 opacity-0 group-hover/cover:opacity-100 z-20">
            <Camera size={20} className="text-main" />
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'cover')} disabled={uploadingCover} />
          </label>
        )}
        {uploadingCover && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${uploadProgress.cover}%` }} 
              className="h-full bg-primary shadow-glow" 
            />
          </div>
        )}
      </div>

      {/* Profile Info Header */}
      <div className="px-6 relative -mt-16 md:-mt-20">
        <div className="flex flex-col md:flex-row md:items-end gap-space-lg">
          {/* Avatar Area */}
          <div className="relative group/avatar">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-bg-main overflow-hidden glass shadow-lg">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex-center text-4xl font-weight-bold text-muted bg-surface-active">
                  {profile.name?.[0]}
                </div>
              )}
            </div>
            {isMyProfile && (
              <label className="absolute bottom-2 right-2 p-2.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'avatar')} disabled={uploadingAvatar} />
              </label>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex-center">
                <span className="text-white text-xs font-weight-bold">{Math.round(uploadProgress.avatar)}%</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 pb-2">
            <div className="flex-between items-start">
              <div className="pt-2 md:pt-0">
                <h1 className="text-3xl font-weight-bold text-main leading-tight flex items-center gap-2">
                  {profile.name}
                  {(isMyProfile || profile.isPremium) && <Badge variant="accent">PRO</Badge>}
                </h1>
                <p className="text-muted font-weight-semi">@{profile.handle || 'user'}</p>
              </div>
              <div className="flex gap-space-md mt-4 md:mt-0">
                {isMyProfile ? (
                  <Button variant="glass" className="gap-2" onClick={() => navigate('/settings')}>
                    <Settings size={18} /> Settings
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={connected ? 'danger' : 'primary'} 
                      className="gap-2 shadow-glow" 
                      onClick={handleToggleConnection}
                    >
                      {connected ? <UserMinus size={18} /> : <UserPlus size={18} />}
                      {connected ? 'Disconnect' : 'Connect'}
                    </Button>
                    <Button variant="glass" size="icon" onClick={() => navigate('/messages')}>
                      <MessageSquare size={18} />
                    </Button>
                  </>
                )}
                {!isMyProfile && (
                  <Button variant="glass" size="icon" onClick={handleBlock}>
                    <ShieldAlert size={18} className="text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio, Stats & Taps */}
        <div className="mt-space-xl grid md:grid-cols-3 gap-space-xl">
          <div className="md:col-span-2 flex flex-col gap-space-md">
            <p className="text-main leading-relaxed text-lg max-w-2xl">
              {profile.bio || "Crafting a digital legacy. Join me."}
            </p>
            <div className="flex flex-wrap gap-space-lg text-sm text-muted">
              <div className="flex items-center gap-1.5"><MapPin size={16} /> {profile.location || 'Distributed'}</div>
              <div className="flex items-center gap-1.5"><Calendar size={16} /> Joined Feb 2024</div>
              {profile.website && <div className="flex items-center gap-1.5 text-primary"><LinkIcon size={16} /> {profile.website}</div>}
            </div>

            {/* Mutuals Display */}
            {mutualConnections.length > 0 && (
              <div className="mt-space-md flex items-center gap-4 p-space-md glass rounded-radius-md border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex -space-x-4">
                  {mutualConnections.slice(0, 3).map(m => (
                    <div key={m.id} className="w-10 h-10 rounded-full border-2 border-bg-main overflow-hidden shadow-sm bg-surface-active">
                      <img src={m.avatar || `https://i.pravatar.cc/100?u=${m.id}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-weight-bold text-main">Mutual Friends</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">
                    {mutualConnections[0].name} {mutualConnections.length > 1 && `+ ${mutualConnections.length - 1} more`}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <Card glass className="flex items-center justify-around md:flex-col md:items-stretch md:gap-space-lg p-space-lg shadow-xl border-white/5">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-weight-bold text-main">{(profile.connections || []).length}</span>
              <span className="text-xs font-weight-semi text-muted uppercase tracking-widest">Network</span>
            </div>
            <div className="hidden md:block h-px bg-white/5" />
            <div className="flex flex-col items-center md:items-start">
              <span className="text-2xl font-weight-bold text-main">{userPosts.length}</span>
              <span className="text-xs font-weight-semi text-muted uppercase tracking-widest">Creations</span>
            </div>
          </Card>
        </div>

        {/* Navigation Taps */}
        <div className="mt-space-xl flex gap-space-xl border-b border-white/5 overflow-x-auto no-scrollbar">
          {['posts', 'reels', 'tagged'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-space-md pb-space-md text-sm font-weight-bold uppercase tracking-widest transition-all relative
                ${activeTab === tab ? 'text-primary' : 'text-muted hover:text-main'}
              `}
            >
              <div className="flex items-center gap-2">
                {tab === 'posts' && <Grid size={16} />}
                {tab === 'reels' && <PlaySquare size={16} />}
                {tab === 'tagged' && <Heart size={16} />}
                {tab}
              </div>
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-tab-profile"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-glow"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Feed */}
        <div className="mt-space-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 gap-space-lg"
            >
              {activeTab === 'posts' && (
                userPosts.length > 0 ? (
                  userPosts.map(post => (
                    <PostCard key={post.id} {...post} onLike={() => toggleLikePost(post.id, currentUser.uid)} />
                  ))
                ) : (
                  <div className="py-20 text-center glass rounded-radius-lg border-white/5 text-muted">No posts found.</div>
                )
              )}
              {activeTab === 'reels' && (
                <div className="py-20 text-center glass rounded-radius-lg border-white/5 text-muted">No reels yet.</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
