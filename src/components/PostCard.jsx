/* eslint-disable no-unused-vars */
import { Link, useNavigate } from 'react-router-dom';
import { PostInsights } from './PostInsights';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserProfile, isConnected, toggleConnection, reportContent, reactToPost, toggleBookmark, repostPost } from '../services/firebaseDataService';
import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Repeat, MoreHorizontal, Send, Smile, BarChart2, Flag } from 'lucide-react';
import './components.css';

export function PostCard({ id, authorId, author, time, content, image, likes, comments, reactions, onLike }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const emojiPickerRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike && user) {
      if (!isLiked) {
        setIsLiking(true);
        setTimeout(() => setIsLiking(false), 400);
      }
      onLike();
    }
  };

  const handleReact = async (emoji, e) => {
    e.stopPropagation();
    if (user && id) {
      await reactToPost(id, user.uid, emoji);
      setShowEmojiPicker(false);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (user && id) {
      const status = await toggleBookmark(user.uid, id);
      setIsBookmarked(status);
    }
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    if (user && id) {
      const quote = prompt("Add a quote to your repost (optional):");
      if (quote !== null) {
        await repostPost(user.uid, user.name, { id, author, content, image }, quote);
        alert("Post shared to your feed!");
      }
    }
  };

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
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleCardClick}
      className="glass-heavy rounded-radius-lg overflow-hidden cursor-pointer group/card hover:border-white/15 transition-all duration-500"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Post Header */}
      <div className="p-8 pb-5 flex items-center gap-5">
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={e => { e.stopPropagation(); }}
          className="relative"
        >
          <Link to={`/profile/${authorId}`} onClick={e => e.stopPropagation()}>
            <div
              className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden shadow-xl"
              style={{ backgroundImage: authorAvatar ? `url(${authorAvatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#1a1a1c' }}
            />
          </Link>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#0a0a0b]" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <Link to={`/profile/${authorId}`} onClick={e => e.stopPropagation()} className="font-weight-bold text-main text-base hover:text-indigo-400 transition-colors tracking-tight">
            {author}
          </Link>
          <div className="text-[11px] text-muted font-weight-semi uppercase tracking-widest mt-0.5">{time}</div>
        </div>

        <div className="flex items-center gap-2">
          {user && authorId && user.uid !== authorId && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConnect}
              className={`px-4 py-2 rounded-full text-xs font-weight-bold uppercase tracking-widest transition-all duration-300 ${
                connected
                  ? 'bg-white/5 text-muted border border-white/10'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
              }`}
            >
              {connected ? '✓ Connected' : '+ Connect'}
            </motion.button>
          )}
          <button
            onClick={e => { e.stopPropagation(); handleReport(e); }}
            className="p-2 rounded-full text-muted hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/card:opacity-100"
          >
            <Flag size={16} />
          </button>
        </div>
      </div>

      {/* Post Content */}
      {content && (
        <div className="px-8 pb-5 text-[15px] leading-relaxed text-main/90 font-weight-semi tracking-wide">
          {content}
        </div>
      )}

      {/* Post Media — Full Bleed */}
      {image && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="mx-4 mb-5 rounded-radius-md overflow-hidden border border-white/10 shadow-2xl cursor-zoom-in"
        >
          <img src={image} alt="Post attachment" className="w-full block" />
        </motion.div>
      )}

      {/* Reaction Badges */}
      {reactions && Object.keys(reactions).length > 0 && (
        <div className="flex gap-2 px-8 pb-4 flex-wrap">
          {Object.entries(reactions).map(([uid, emoji]) => (
            <div key={uid} className="glass px-2.5 py-1 rounded-full text-xs border-white/5">
              {emoji}
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-8 py-5 flex items-center gap-1 border-t border-white/5 relative">
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-weight-bold uppercase tracking-wider transition-all duration-300 ${
            isLiked
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'text-muted hover:text-red-400 hover:bg-red-500/10'
          } ${isLiking ? 'scale-110' : ''}`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </motion.button>

        {/* Comments */}
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-weight-bold uppercase tracking-wider text-muted hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
          <MessageCircle size={18} />
          <span>{Array.isArray(comments) ? comments.length : (comments || 0)}</span>
        </button>

        {/* Emoji Reaction */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            onClick={e => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-weight-bold text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-all"
          >
            <Smile size={18} />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute bottom-full left-0 mb-2 glass-heavy rounded-radius-md p-2 flex gap-2 shadow-2xl border-white/10 z-20"
              >
                {['🔥', '🙌', '✨', '😂', '💯'].map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => handleReact(emoji, e)}
                    className="text-xl"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Repost */}
        <button onClick={handleRepost} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-weight-bold text-muted hover:text-cyan-400 hover:bg-cyan-400/10 transition-all">
          <Repeat size={18} />
        </button>

        <div className="flex-1" />

        {/* Bookmark */}
        <button onClick={handleBookmark} className={`p-2.5 rounded-full transition-all ${isBookmarked ? 'text-indigo-400 bg-indigo-500/10' : 'text-muted hover:text-indigo-400 hover:bg-indigo-500/10'}`}>
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Share */}
        <button onClick={handleShare} className="p-2.5 rounded-full text-muted hover:text-main hover:bg-white/5 transition-all">
          <Share2 size={18} />
        </button>

        {/* Insights (author only) */}
        {user?.uid === authorId && (
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`p-2.5 rounded-full transition-all ${showInsights ? 'text-indigo-400 bg-indigo-500/10' : 'text-muted hover:text-indigo-400 hover:bg-indigo-500/10'}`}
          >
            <BarChart2 size={18} />
          </button>
        )}
      </div>

      {/* Expandable Insights */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-8 pt-6">
              <PostInsights post={{ id, authorId, author, time, content, image, likes, comments, reactions }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
