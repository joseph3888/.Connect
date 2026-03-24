import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import {
  getUserProfile, getPosts, toggleLikePost,
  toggleConnection, isConnected, blockUser, unblockUser, isBlocked,
  updateUserProfile
} from '../services/firebaseDataService';
import { X, Camera, ShieldAlert } from 'lucide-react';
import { processImage } from '../utils/imageUtils';

export function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);

  const targetUid = id || currentUser?.uid;

  useEffect(() => {
    if (!targetUid) return;
    let unsubPosts;
    const load = async () => {
      const profile = await getUserProfile(targetUid);
      setProfileUser(profile || currentUser);
      setConnectionCount((profile?.connections || []).length);

      if (currentUser && targetUid !== currentUser.uid) {
        const conn = await isConnected(currentUser.uid, targetUid);
        setConnected(conn);
      }

      // Real-time posts for this user
      unsubPosts = getPosts(allPosts => {
        setUserPosts(allPosts.filter(p => p.authorId === targetUid));
        setLoading(false);
      });
    };
    load();
    return () => unsubPosts && unsubPosts();
  }, [targetUid, currentUser]);

  const handleLike = async (postId) => {
    if (currentUser) await toggleLikePost(postId, currentUser.uid);
  };

  const handleConnect = async () => {
    if (!currentUser) return;
    const newStatus = await toggleConnection(currentUser.uid, targetUid);
    setConnected(newStatus);
    setConnectionCount(c => newStatus ? c + 1 : Math.max(0, c - 1));
  };

  const handleBlock = async () => {
    if (!currentUser) return;
    const blocked = await isBlocked(currentUser.uid, targetUid);
    if (blocked) {
      await unblockUser(currentUser.uid, targetUid);
    } else if (confirm(`Block ${profileUser?.name}? You won't see each other's content.`)) {
      await blockUser(currentUser.uid, targetUid);
      navigate('/');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) processImage(file, 400).then(b64 => setEditAvatarPreview(b64));
  };

  const saveProfile = async () => {
    const updates = { name: editName, bio: editBio, avatar: editAvatarPreview };
    await updateUser(updates);
    setProfileUser(prev => ({ ...prev, ...updates }));
    setIsEditing(false);
  };

  const openEditModal = () => {
    setEditName(currentUser?.name || '');
    setEditBio(currentUser?.bio || '');
    setEditAvatarPreview(currentUser?.avatar || null);
    setIsEditing(true);
  };

  if (loading && !profileUser) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading profile...</div>
  );
  if (!profileUser) return (
    <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>User not found</div>
  );

  const isOwnProfile = currentUser?.uid === targetUid;
  const displayHandle = profileUser.handle || `@${(profileUser.name || 'user').toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div className="profile-page">
      <div className="profile-header glass">
        <div className="profile-banner" />
        <div className="profile-info-container">
          <div className="profile-avatar" style={{ backgroundImage: profileUser.avatar ? `url(${profileUser.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="profile-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!isOwnProfile && (
              <button onClick={handleBlock} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.1rem', borderRadius: '999px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700, cursor: 'pointer' }}>
                <ShieldAlert size={16} /> Block
              </button>
            )}
            {isOwnProfile ? (
              <button className="btn-primary" onClick={openEditModal}>Edit Profile</button>
            ) : (
              <button className="btn-primary" onClick={handleConnect} style={{ background: connected ? 'transparent' : '', border: connected ? '1px solid var(--accent-secondary)' : 'none', color: connected ? 'var(--text-primary)' : 'white' }}>
                {connected ? 'Following' : '+ Connect'}
              </button>
            )}
          </div>
        </div>
        <div className="profile-details">
          <h2>{profileUser.name}</h2>
          <p className="user-handle">{displayHandle}</p>
          <p className="bio">{profileUser.bio || 'Digital creator & enthusiast.'}</p>
          <div className="profile-stats">
            <span><strong>{connectionCount}</strong> Connections</span>
            <span><strong>{userPosts.length}</strong> Posts</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button className="tab active">Posts ({userPosts.length})</button>
      </div>

      <div className="profile-feed">
        {userPosts.map(post => (
          <PostCard key={post.id} {...post} comments={Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)} onLike={() => handleLike(post.id)} />
        ))}
        {userPosts.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>No posts yet.</p>
        )}
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsEditing(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none' }}><X size={22} /></button>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Edit Profile</h2>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                <div className="profile-avatar" style={{ width: '90px', height: '90px', backgroundImage: editAvatarPreview ? `url(${editAvatarPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', marginTop: 0 }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-color)', color: 'white', padding: '6px', borderRadius: '50%' }}><Camera size={14} /></div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="post-input" style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.4)' }} placeholder="Display Name" value={editName} onChange={e => setEditName(e.target.value)} />
              <textarea className="post-input" rows={3} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.4)' }} placeholder="Bio" value={editBio} onChange={e => setEditBio(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={saveProfile} style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
