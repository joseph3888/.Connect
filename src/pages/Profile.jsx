import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { dataService } from '../services/mockDataService';
import { X, Camera, ShieldAlert, ShieldCheck } from 'lucide-react';
import { processImage } from '../utils/imageUtils';

export function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  
  const [connectedCount, setConnectedCount] = useState(0); 
  const [followingCount, setFollowingCount] = useState(0); 
  const [isConnected, setIsConnected] = useState(false);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);

  const loadProfileData = (targetEmail) => {
    const u = dataService.getUserById(targetEmail);
    if (!u && (targetEmail === currentUser?.email || targetEmail === currentUser?.id)) {
      setProfileUser(currentUser);
    } else {
      setProfileUser(u);
    }
    
    const allPosts = dataService.getPosts();
    const myPosts = allPosts.filter(p => p.authorId === targetEmail);
    setUserPosts(myPosts);
    
    setConnectedCount(dataService.getConnectedCount(targetEmail));
    setFollowingCount(dataService.getFollowingCount(targetEmail));
    
    if (currentUser && targetEmail !== currentUser.email && targetEmail !== currentUser.id) {
      setIsConnected(dataService.isConnected(currentUser.id || currentUser.email, targetEmail));
    }
  };

  useEffect(() => {
    const targetEmail = id || currentUser?.id || currentUser?.email;
    if (targetEmail) {
      loadProfileData(targetEmail);
    }
  }, [id, currentUser]);

  const handleLike = (postId) => {
    dataService.toggleLikePost(postId);
    const targetEmail = id || currentUser?.id || currentUser?.email;
    loadProfileData(targetEmail);
  };
  
  const handleConnect = () => {
    if (currentUser && profileUser) {
      const status = dataService.toggleConnection(currentUser.id || currentUser.email, profileUser.id || profileUser.email);
      setIsConnected(status);
      setConnectedCount(dataService.getConnectedCount(profileUser.id || profileUser.email));
    }
  };

  const handleBlockToggle = () => {
    if (currentUser && profileUser) {
      const targetId = profileUser.id || profileUser.email;
      const myId = currentUser.id || currentUser.email;
      if (dataService.isBlocked(myId, targetId)) {
        dataService.unblockUser(myId, targetId);
      } else {
        if (confirm(`Block ${profileUser.name}? You won't see each other's content.`)) {
          dataService.blockUser(myId, targetId);
          navigate('/'); // Redirect to home after blocking
        }
      }
    }
  };

  const openEditModal = () => {
    setEditName(currentUser.name || '');
    setEditUsername(currentUser.id || currentUser.email || '');
    setEditBio(currentUser.bio || '');
    setEditAvatarPreview(currentUser.avatar || null);
    setIsEditing(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file, 400).then(base64 => setEditAvatarPreview(base64));
    }
  };

  const saveProfile = () => {
    updateUser({
      name: editName,
      id: editUsername,
      bio: editBio,
      avatar: editAvatarPreview
    });
    setIsEditing(false);
  };

  if (!profileUser) return <div className="glass" style={{padding: '2rem', textAlign: 'center'}}>User not found</div>;

  const isOwnProfile = currentUser && (profileUser.id === currentUser.id || profileUser.email === currentUser.email);
  const displayHandle = String(profileUser.id || profileUser.email || profileUser.name || 'user').split('@')[0].toLowerCase();

  return (
    <div className="profile-page">
      <div className="profile-header glass">
        <div className="profile-banner"></div>
        <div className="profile-info-container">
          <div 
            className="profile-avatar"
            style={{
              backgroundImage: profileUser.avatar ? `url(${profileUser.avatar})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}
          ></div>
          <div className="profile-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            {!isOwnProfile && (
              <button 
                className="btn-secondary" 
                onClick={handleBlockToggle}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <ShieldAlert size={18} /> Block
              </button>
            )}
            {isOwnProfile ? (
              <button className="btn-primary" onClick={openEditModal}>Edit Profile</button>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleConnect}
                style={{
                  background: isConnected ? 'transparent' : '',
                  border: isConnected ? '1px solid var(--accent-secondary)' : 'none',
                  color: isConnected ? 'var(--text-primary)' : 'white'
                }}
              >
                {isConnected ? 'Following' : '+ Connect'}
              </button>
            )}
          </div>
        </div>
        <div className="profile-details">
          <h2>{profileUser.name}</h2>
          <p className="user-handle">@{displayHandle}</p>
          <p className="bio">{profileUser.bio || "Digital creator & tech enthusiast."}</p>
          <div className="profile-stats">
            <span><strong>{connectedCount}</strong> Connected</span>
            <span><strong>{followingCount}</strong> Following</span>
          </div>
        </div>
      </div>
      
      <div className="profile-tabs">
        <button className="tab active">Posts ({userPosts.length})</button>
        <button className="tab">Media</button>
        <button className="tab">Likes</button>
      </div>
      
      <div className="profile-feed">
        {userPosts.map(post => (
          <PostCard 
            key={post.id} 
            {...post} 
            comments={post.comments.length}
            onLike={() => handleLike(post.id)} 
          />
        ))}
        {userPosts.length === 0 && (
          <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem'}}>No posts yet.</p>
        )}
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsEditing(false)} style={{background: 'transparent', border: 'none'}}><X size={24} /></button>
            <h2 style={{fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)'}}>Edit Profile</h2>
            
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
              <label style={{cursor: 'pointer', position: 'relative'}}>
                <div 
                  className="profile-avatar" 
                  style={{
                    width: '100px', height: '100px', border: '2px solid var(--border-color)',
                    backgroundImage: editAvatarPreview ? `url(${editAvatarPreview})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center', marginTop: 0
                  }}
                />
                <div style={{position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-color)', color: 'white', padding: '6px', borderRadius: '50%'}}>
                  <Camera size={16} />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{display: 'none'}} />
              </label>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600}}>Name</label>
              <input type="text" className="post-input" style={{background: 'rgba(255,255,255,0.4)', padding: '0.75rem', borderRadius: '8px'}} value={editName} onChange={e => setEditName(e.target.value)} />
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600}}>Username</label>
              <input type="text" className="post-input" style={{background: 'rgba(255,255,255,0.4)', padding: '0.75rem', borderRadius: '8px'}} value={editUsername} onChange={e => setEditUsername(e.target.value)} />
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600}}>Bio</label>
              <textarea className="post-input" rows={3} style={{background: 'rgba(255,255,255,0.4)', padding: '0.75rem', borderRadius: '8px'}} value={editBio} onChange={e => setEditBio(e.target.value)} />
            </div>

            <button className="btn-primary" onClick={saveProfile} style={{marginTop: '1rem', padding: '1rem', fontSize: '1.1rem'}}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
