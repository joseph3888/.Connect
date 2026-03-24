import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, PlaySquare, User as UserIcon, LogOut, Plus, X, MessageSquare, Video, Bell, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CreatePost } from './CreatePost';
import { NotificationsTray } from './NotificationsTray';
import { addPost } from '../services/firebaseDataService';
import { useLocation } from 'react-router-dom';
import './components.css';

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={22} /> },
    { path: '/explore', label: 'Explore', icon: <Compass size={22} /> },
    { path: '/communities', label: 'Communities', icon: <Users size={22} /> },
    { path: '/reels', label: 'Reels', icon: <PlaySquare size={22} /> },
    { path: '/messages', label: 'Messages', icon: <MessageSquare size={22} /> },
    { path: `/profile/${user.uid}`, label: 'Profile', icon: <UserIcon size={22} /> },
  ];

  const handleGlobalPost = async (content, image) => {
    if (user) {
      await addPost(user.uid, user.name, content, image);
      setIsPostModalOpen(false);
      if (location.pathname !== '/') navigate('/');
    }
  };

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="logo">Connect.</Link>

        <div className="nav-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path || (item.path.startsWith('/profile') && location.pathname.startsWith('/profile')) ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}

          <div className="sidebar-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button className="btn-primary" onClick={() => setIsPostModalOpen(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.9rem' }}>
              <Plus size={18} />
              <span className="post-btn-text">Post</span>
            </button>

            <button className="btn-primary" onClick={() => { navigate('/reels'); }} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.9rem', background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', boxShadow: 'none' }}>
              <Video size={18} />
              <span className="post-btn-text">Reel</span>
            </button>

            <button className="btn-primary" onClick={() => setIsNotifOpen(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.9rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none', position: 'relative' }}>
              <Bell size={18} />
              <span className="post-btn-text">Updates</span>
              {unreadCount > 0 && <div className="nav-badge">{unreadCount}</div>}
            </button>
          </div>
        </div>

        <div className="user-profile-widget">
          <div className="avatar" style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-handle">{user.handle || user.email}</span>
          </div>
          <button onClick={logout} className="logout-icon" style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none' }} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {isPostModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPostModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ padding: '0.5rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Create New Post</h2>
              <button onClick={() => setIsPostModalOpen(false)} style={{ background: 'transparent', border: 'none' }}><X size={22} /></button>
            </div>
            <CreatePost onPost={handleGlobalPost} />
          </div>
        </div>
      )}

      {isNotifOpen && <NotificationsTray onClose={() => setIsNotifOpen(false)} onUnreadCount={setUnreadCount} />}
    </>
  );
}
