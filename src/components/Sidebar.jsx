import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, PlaySquare, User as UserIcon, LogOut, Plus, X, MessageSquare, Bell, Users, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CreatePost } from './CreatePost';
import { NotificationsTray } from './NotificationsTray';
import { addPost } from '../services/firebaseDataService';
import { Button, Card } from './ui/Primitives';
import './components.css';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.body.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleGlobalPost = async (content, imageFile) => {
    try {
      setUploadProgress(0);
      await addPost(user.uid, user.name, content, imageFile, (p) => setUploadProgress(p));
      setIsPostModalOpen(false);
      setUploadProgress(0);
    } catch (err) {
      console.error('Post creation failed:', err);
    }
  };

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={22} strokeWidth={2.5} /> },
    { path: '/explore', label: 'Explore', icon: <Compass size={22} strokeWidth={2.5} /> },
    { path: '/communities', label: 'Communities', icon: <Users size={22} strokeWidth={2.5} /> },
    { path: '/reels', label: 'Reels', icon: <PlaySquare size={22} strokeWidth={2.5} /> },
    { path: '/messages', label: 'Messages', icon: <MessageSquare size={22} strokeWidth={2.5} /> },
    { path: `/profile/${user.uid}`, label: 'Profile', icon: <UserIcon size={22} strokeWidth={2.5} /> },
  ];

  return (
    <>
      <aside className="sidebar">
        <NavLink to="/" className="logo hide-mobile">Connect.</NavLink>

        <div className="nav-links">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="relative flex-center">
                {item.icon}
                {item.label === 'Messages' && unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-bg-darker" />
                )}
              </div>
              <span className="nav-label hide-mobile">{item.label}</span>
            </NavLink>
          ))}

          <div className="mt-8 flex flex-col gap-4 hide-mobile">
             <Button variant="primary" onClick={() => setIsPostModalOpen(true)} className="shadow-lg shadow-indigo-500/20">
                <Plus size={20} />
                <span className="post-btn-text">Quick Post</span>
             </Button>
             
             <button 
                onClick={() => setIsNotifOpen(true)}
                className="relative flex items-center gap-4 p-4 rounded-radius-md hover:bg-white/5 transition-all text-secondary hover:text-main group"
             >
                <div className="relative">
                  <Bell size={22} strokeWidth={2.5} />
                  {unreadCount > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-bg-darker" />}
                </div>
                <span className="nav-label">Notifications</span>
             </button>
          </div>
        </div>

        <div className="user-profile-widget glass-heavy border-white/5 group relative hide-mobile">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-full border-2 border-primary/30 shadow-xl overflow-hidden bg-surface-active" 
                style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} 
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-4 border-bg-glass-heavy shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
            </div>
            
            <div className="user-info flex-1 min-w-0">
              <div className="font-weight-bold text-main truncate text-sm tracking-tight">{user.name}</div>
              <div className="text-[10px] text-primary font-weight-bold uppercase tracking-widest">{user.handle || 'Platinum Member'}</div>
            </div>
          </div>

          <div className="absolute bottom-full left-0 right-0 mb-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none group-hover:pointer-events-auto">
            <Card className="glass-heavy p-2 flex gap-1 justify-center border-white/10 shadow-2xl">
              <button onClick={toggleTheme} className="p-3 hover:bg-white/10 rounded-radius-md transition-colors text-main"><Sun size={18} /></button>
              <button onClick={() => navigate('/settings')} className="p-3 hover:bg-white/10 rounded-radius-md transition-colors text-main"><SettingsIcon size={18} /></button>
              <button onClick={logout} className="p-3 hover:bg-red-500/20 rounded-radius-md transition-colors text-red-400"><LogOut size={18} /></button>
            </Card>
          </div>
        </div>
      </aside>

      {isPostModalOpen && (
        <div className="fixed inset-0 z-[2000] flex-center bg-black/80 backdrop-blur-md p-4" onClick={() => setIsPostModalOpen(false)}>
          <div className="glass-heavy w-full max-w-2xl rounded-radius-lg overflow-hidden border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
            <div className="flex-between items-center p-6 border-b border-white/5">
              <h2 className="text-xl font-weight-bold text-main tracking-tight">Create New Post</h2>
              <Button variant="glass" size="icon" onClick={() => setIsPostModalOpen(false)}><X size={20} /></Button>
            </div>
            <div className="p-4"><CreatePost onPost={handleGlobalPost} /></div>
          </div>
        </div>
      )}

      {isNotifOpen && <NotificationsTray onClose={() => setIsNotifOpen(false)} onUnreadCount={setUnreadCount} />}
    </>
  );
}
