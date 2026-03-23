import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/mockDataService';
import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import './components.css';

export function PostCard({ id, authorId, author, time, content, image, likes, comments, onLike }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState(null);

  useEffect(() => {
    if (user && authorId) {
      setIsConnected(dataService.isConnected(user.email, authorId) || dataService.isConnected(user.id, authorId));
    }
    
    // Attempt to grab precise user profile dynamically
    const authorData = dataService.getUserById(authorId);
    if (authorData?.avatar) {
      setAuthorAvatar(authorData.avatar);
    } else if ((authorData?.id === user?.id || authorData?.id === user?.email) && user?.avatar) {
       setAuthorAvatar(user.avatar);
    }
  }, [user, authorId]);

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('label')) return;
    if (id) navigate(`/post/${id}`);
  };

  const handleConnect = (e) => {
    e.stopPropagation();
    if (user && authorId) {
      const status = dataService.toggleConnection(user.id || user.email, authorId);
      setIsConnected(status);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    alert("Post copied to clipboard!");
  };

  const likeCount = Array.isArray(likes) ? likes.length : (typeof likes === 'number' ? likes : 0);
  const isLiked = Array.isArray(likes) && user ? likes.includes(user.id || user.email) : false;

  return (
    <article 
      className="post-card glass" 
      onClick={handleCardClick}
      style={{ cursor: id ? 'pointer' : 'default' }}
    >
      <div className="post-header">
        <div 
          className="avatar" 
          style={{
            backgroundImage: authorAvatar ? `url(${authorAvatar})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center'
          }}
        ></div>
        <div className="post-meta" style={{flex: 1}}>
          <Link to={`/profile/${authorId}`} className="author-name" onClick={e => e.stopPropagation()} style={{textDecoration: 'none', transition: 'color 0.2s', display: 'inline-block'}}>{author}</Link>
          <span className="post-time" style={{display: 'block'}}>{time}</span>
        </div>
        {user && authorId && user.email !== authorId && user.id !== authorId && (
          <button 
            className="option-btn" 
            onClick={handleConnect}
            style={{
              background: isConnected ? 'rgba(155,140,204,0.1)' : '', 
              border: isConnected ? '1px solid var(--border-color)' : 'none', 
              color: isConnected ? 'var(--text-primary)' : ''
            }}
          >
            {isConnected ? '✓ Connected' : '+ Connect'}
          </button>
        )}
      </div>
      <div className="post-content">
        {content && <p>{content}</p>}
        {image && (
          <div style={{marginTop: '1rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)'}}>
            <img src={image} alt="Post attachment" style={{width: '100%', display: 'block'}} />
          </div>
        )}
      </div>
      <div className="post-actions">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`} 
          onClick={(e) => { e.stopPropagation(); if (onLike && user) onLike(); }}
        >
          <Heart 
            size={20} 
            className="icon" 
            fill={isLiked ? "var(--accent-color)" : "none"} 
            stroke={isLiked ? "var(--accent-color)" : "currentColor"}
          /> 
          <span style={{ color: isLiked ? 'var(--accent-color)' : 'inherit', fontWeight: isLiked ? 800 : 'inherit' }}>{likeCount}</span>
        </button>
        <button className="action-btn" onClick={(e) => { if (!id) e.stopPropagation(); }}>
          <MessageCircle size={20} className="icon" /> {comments}
        </button>
        <button className="action-btn" onClick={handleShare}>
          <Send size={20} className="icon" /> Share
        </button>
      </div>
    </article>
  );
}
