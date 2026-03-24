import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, isConnected, toggleConnection, reportContent } from '../services/firebaseDataService';
import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Flag } from 'lucide-react';
import './components.css';

export function PostCard({ id, authorId, author, time, content, image, likes, comments, onLike }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (authorId) {
        const authorData = await getUserProfile(authorId);
        if (mounted && authorData?.avatar) {
          setAuthorAvatar(authorData.avatar);
        }
      }
      if (user && authorId && user.uid !== authorId) {
        const status = await isConnected(user.uid, authorId);
        if (mounted) setConnected(status);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [user, authorId]);

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('label')) return;
    if (id) navigate(`/post/${id}`);
  };

  const handleConnect = async (e) => {
    e.stopPropagation();
    if (user && authorId) {
      const status = await toggleConnection(user.uid, authorId);
      setConnected(status);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    alert("Post copied to clipboard!");
  };

  const handleReport = async (e) => {
    e.stopPropagation();
    if (user) {
      const reason = prompt("Why are you reporting this post?");
      if (reason) {
        await reportContent('post', id, user.uid, reason);
        alert("Thank you. Our moderation team will review this post.");
      }
    }
  };

  const likeCount = Array.isArray(likes) ? likes.length : (typeof likes === 'number' ? likes : 0);
  const isLiked = Array.isArray(likes) && user ? likes.includes(user.uid) : false;

  return (
    <article className="post-card glass" onClick={handleCardClick} style={{ cursor: id ? 'pointer' : 'default' }}>
      <div className="post-header">
        <div className="avatar" style={{ backgroundImage: authorAvatar ? `url(${authorAvatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="post-meta" style={{ flex: 1 }}>
          <Link to={`/profile/${authorId}`} className="author-name" onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', transition: 'color 0.2s', display: 'inline-block' }}>{author}</Link>
          <span className="post-time" style={{ display: 'block' }}>{time}</span>
        </div>
        {user && authorId && user.uid !== authorId && (
          <button className="option-btn" onClick={handleConnect} style={{ background: connected ? 'rgba(155,140,204,0.1)' : '', border: connected ? '1px solid var(--border-color)' : 'none', color: connected ? 'var(--text-primary)' : '' }}>
            {connected ? '✓ Connected' : '+ Connect'}
          </button>
        )}
      </div>
      <div className="post-content">
        {content && <p>{content}</p>}
        {image && (
          <div style={{ marginTop: '1rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img src={image} alt="Post attachment" style={{ width: '100%', display: 'block' }} />
          </div>
        )}
      </div>
      <div className="post-actions">
        <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); if (onLike && user) onLike(); }}>
          <Heart size={20} className="icon" fill={isLiked ? "var(--accent-color)" : "none"} stroke={isLiked ? "var(--accent-color)" : "currentColor"} />
          <span style={{ color: isLiked ? 'var(--accent-color)' : 'inherit', fontWeight: isLiked ? 800 : 'inherit' }}>{likeCount}</span>
        </button>
        <button className="action-btn" onClick={(e) => { if (!id) e.stopPropagation(); }}>
          <MessageCircle size={20} className="icon" /> {Array.isArray(comments) ? comments.length : (comments || 0)}
        </button>
        <button className="action-btn" onClick={handleShare}>
          <Send size={20} className="icon" /> Share
        </button>
        <button className="action-btn report-btn" onClick={handleReport} title="Report post">
          <Flag size={20} className="icon" />
        </button>
      </div>
    </article>
  );
}
