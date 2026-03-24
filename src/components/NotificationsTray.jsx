import { useState, useEffect } from 'react';
import { X, Bell, Heart, MessageCircle, UserPlus, Trash2 } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '../services/firebaseDataService';
import { useAuth } from '../context/AuthContext';

export function NotificationsTray({ onClose, onUnreadCount }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    // Real-time listener for notifications
    const unsub = getNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      if (onUnreadCount) {
        onUnreadCount(notifs.filter(n => !n.read).length);
      }
      
      // Mark as read after a short delay so they see what was new
      setTimeout(() => {
        markNotificationsRead(user.uid).catch(console.error);
      }, 2000);
    });

    return unsub;
  }, [user, onUnreadCount]);

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={18} color="#ff4757" fill="#ff4757" />;
      case 'comment': return <MessageCircle size={18} color="#0ea5e9" fill="#0ea5e9" />;
      case 'connect': return <UserPlus size={18} color="#10b981" />;
      default: return <Bell size={18} />;
    }
  };

  const getMessage = (n) => {
    switch (n.type) {
      case 'like': return "liked your post.";
      case 'comment': return "commented on your post.";
      case 'connect': return "started following you.";
      default: return "sent you a notification.";
    }
  };

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-tray glass" onClick={e => e.stopPropagation()}>
        <div className="notif-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="notif-list">
          {notifications.map(n => (
            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <div className="notif-icon-container">
                {getIcon(n.type)}
              </div>
              <div className="notif-content">
                <span className="notif-user">{n.fromName}</span>
                <span className="notif-text">{getMessage(n)}</span>
                <span className="notif-time">
                  {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                </span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="notif-empty">
              <Bell size={48} color="var(--text-secondary)" opacity={0.3} />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
