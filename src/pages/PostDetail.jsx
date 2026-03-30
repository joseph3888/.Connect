import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { PostCard } from '../components/PostCard';
import { getPostById, toggleLikePost, addComment } from '../services/firebaseDataService';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Send } from 'lucide-react';

export function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!id) return;
    getPostById(id).then(setPost);
  }, [id]);

  const handleLike = async () => {
    if (user && post) {
      await toggleLikePost(post.id, user.uid);
      const updated = await getPostById(post.id);
      setPost(updated);
    }
  };

  const handleComment = async () => {
    if (commentText.trim() && user && post) {
      await addComment(post.id, user.uid, user.name, commentText);
      const updated = await getPostById(post.id);
      setPost(updated);
      setCommentText('');
    } else if (!user) {
      alert("Please log in to comment.");
    }
  };

  if (!post) return <div className="glass" style={{padding: '3rem', textAlign: 'center'}}>Post not found.</div>;

  const likeCount = (post.likes || []).length;
  const isLiked = (post.likes || []).includes(user?.uid);

  return (
    <div className="post-detail-page">
      <div style={{marginBottom: '1.5rem'}}>
        <Link to="/" style={{color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '1.1rem', transition: 'color 0.2s'}} className="back-link">
          ← Back to Feed
        </Link>
      </div>
      
      {/* Passing no id prevents click-through since we are already on the detail page */}
      <PostCard 
        {...post} 
        id={null} 
        onLike={handleLike} 
        comments={(post.comments || []).length} 
      />
      
      <div className="comments-section glass" style={{padding: '2rem', marginTop: '1.5rem'}}>
        <h3 style={{marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 800}}>Comments ({(post.comments || []).length})</h3>
        
        <div className="create-comment" style={{display: 'flex', gap: '1rem', marginBottom: '2.5rem'}}>
          <div className="avatar small"></div>
          <input 
            type="text" 
            placeholder="Write a comment..." 
            className="post-input" 
            style={{background: 'rgba(155,140,204,0.1)', padding: '1rem 1.25rem', borderRadius: '16px'}}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
          />
          <button className="btn-primary" onClick={handleComment}>Reply</button>
        </div>

        <div className="comments-list" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {(post.comments || []).slice().reverse().map(comment => (
            <div key={comment.id} className="comment" style={{display: 'flex', gap: '1.25rem'}}>
              <div className="avatar small" style={{background: 'var(--surface-color)'}}></div>
              <div className="comment-body" style={{background: 'var(--surface-hover)', padding: '1.25rem', borderRadius: '16px', flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem'}}>
                  <strong style={{fontSize: '1.05rem', color: 'var(--text-primary)'}}>{comment.author}</strong>
                  <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>{comment.time}</span>
                </div>
                <p style={{lineHeight: 1.6, color: 'var(--text-primary)'}}>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="post-actions" style={{justifyContent: 'flex-start', gap: '2rem'}}>
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={24} className="icon" fill={isLiked ? "var(--accent-color)" : "none"} stroke={isLiked ? "var(--accent-color)" : "currentColor"} /> 
            <span style={{ color: isLiked ? 'var(--accent-color)' : 'inherit', fontWeight: isLiked ? 800 : 'inherit', fontSize: '1.1rem' }}>{likeCount}</span>
          </button>
          <button className="action-btn">
            <MessageCircle size={24} className="icon" /> <span style={{fontSize: '1.1rem'}}>{(post.comments || []).length}</span>
          </button>
          <button className="action-btn">
            <Send size={24} className="icon" /> <span style={{fontSize: '1.1rem'}}>Share</span>
          </button>
        </div>
    </div>
  );
}
