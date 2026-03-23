import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, PlaySquare, User as UserIcon, LogOut, Plus, X, MessageSquare, Video } from 'lucide-react';
import { useState } from 'react';
import { CreatePost } from './CreatePost';
import { dataService } from '../services/mockDataService';
import './components.css'; 

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const handleGlobalPost = (content, image) => {
    if (user) {
      dataService.addPost(user.id || user.email, user.name, content, image);
      setIsPostModalOpen(false);
      navigate('/');
      if (location.pathname === '/') {
        window.location.reload();
      }
    }
  };

  if (!user) return null; 

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={24} /> },
    { path: '/explore', label: 'Explore', icon: <Compass size={24} /> },
    { path: '/reels', label: 'Reels', icon: <PlaySquare size={24} /> },
    { path: '/messages', label: 'Messages', icon: <MessageSquare size={24} /> },
    { path: `/profile/${user.email}`, label: 'Profile', icon: <UserIcon size={24} /> },
  ];

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
            <span className="icon" style={{display: 'flex', alignItems: 'center'}}>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
        
        {/* Action Buttons */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem'}}>
          <button 
            className="btn-primary" 
            onClick={() => setIsPostModalOpen(true)}
            style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem'}}
          >
            <Plus size={20} />
            <span className="post-btn-text">Post</span>
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => {
              navigate('/reels');
              setTimeout(() => {
                const btn = document.querySelector('.reels-container button.btn-primary');
                if (btn) btn.click();
              }, 100);
            }}
            style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', boxShadow: 'none'}}
          >
            <Video size={20} />
            <span className="post-btn-text">Reel</span>
          </button>
        </div>
      </div>

      <div className="user-profile-widget">
        <div 
          className="avatar"
          style={{
            backgroundImage: user.avatar ? `url(${user.avatar})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center'
          }}
        ></div>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-handle">{user.id?.startsWith('@') ? user.id : `@${String(user.id || user.email || 'user').split('@')[0].toLowerCase()}`}</span>
        </div>
        <button onClick={logout} className="logout-icon" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none'}} title="Log Out">
          <LogOut size={20} />
        </button>
      </div>
    </aside>

    {/* Global Create Post Modal */}
    {isPostModalOpen && (
      <div className="modal-overlay" onClick={() => setIsPostModalOpen(false)}>
        <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{padding: '0.5rem', background: 'var(--surface-color)', maxWidth: '600px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0rem', padding: '1.5rem 1.5rem 0rem 1.5rem'}}>
            <h2 style={{fontSize: '1.25rem', color: 'var(--text-primary)'}}>Create New Post</h2>
            <button onClick={() => setIsPostModalOpen(false)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)'}}><X size={24} /></button>
          </div>
          <CreatePost onPost={handleGlobalPost} />
        </div>
      </div>
    )}
    </>
  );
}
