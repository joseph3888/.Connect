import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleLikeStory, commentStory } from '../services/firebaseDataService';

export function StoryViewer({ group, onClose, onNext }) {
  const { user } = useAuth();
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const timerRef = useRef(null);
  const SLIDE_DURATION = 5000; // 5 seconds

  const currentSlide = group.slides[slideIndex];

  const handleNext = useCallback(() => {
    setSlideIndex(prev => {
      if (prev < group.slides.length - 1) {
        return prev + 1;
      } else {
        onNext();
        return prev;
      }
    });
  }, [group.slides.length, onNext]);

  const handlePrev = useCallback(() => {
    setSlideIndex(prev => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 100;
          }
          return prev + (100 / (SLIDE_DURATION / 100));
        });
      }, 100);
    }

    return () => clearInterval(timerRef.current);
  }, [slideIndex, isPaused, handleNext]);

  return createPortal(
    <div className="fixed inset-0 z-[4000] bg-zinc-950 flex-center backdrop-blur-3xl animate-in fade-in duration-300">
      
      {/* Background Close Click Zone */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Main Instagram-like Viewer Container */}
      <div className="relative w-full h-[100dvh] sm:w-[450px] sm:h-[95vh] sm:rounded-[24px] overflow-hidden bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 z-10 mx-auto flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-0 inset-x-0 z-20 flex gap-1 p-2 pt-3">
          {group.slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] rounded-full" 
                style={{ 
                  width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%',
                  transition: i === slideIndex ? 'width 0.1s linear' : 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Overlay */}
        <div className="absolute top-5 inset-x-0 z-20 flex justify-between items-center px-4 mix-blend-difference pb-8 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full border-2 border-primary shadow-md bg-cover bg-center" 
              style={{ backgroundImage: group.userAvatar ? `url(${group.userAvatar})` : 'none' }}
            />
            <span className="text-white font-weight-bold text-[15px] tracking-tight drop-shadow-md">{group.userName}</span>
            <span className="text-white/60 text-xs font-weight-semi">2h</span>
          </div>
        </div>

        {/* Global Close Button (Outside the Video Frame for Web) */}
        <div className="fixed top-6 right-6 z-[4010] hidden sm:flex">
          <button 
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-xl" 
            onClick={onClose}
          >
            <X size={28} color="white" />
          </button>
        </div>

        {/* Mobile Close Button (Inside Frame) */}
        <button 
          className="absolute top-5 right-4 z-[4010] sm:hidden p-2 bg-black/20 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors" 
          onClick={onClose}
        >
          <X size={24} color="white" />
        </button>

        {/* Slide Content */}
        <div 
          className="relative flex-1 w-full bg-black" 
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => !showCommentInput && setIsPaused(false)}
        >
          {currentSlide.type === 'video' ? (
            <video src={currentSlide.content} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex-center bg-zinc-900/50">
               <img src={currentSlide.content} alt="Story" className="w-full h-full object-contain backdrop-blur-md" />
            </div>
          )}

          {/* Invisible Tap zones for previous/next */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} aria-label="Previous story" />
          <div className="absolute inset-y-0 right-0 w-3/4 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} aria-label="Next story" />
        </div>

        {/* Action Overlay */}
        <div className="absolute bottom-6 right-2 z-20 flex flex-col gap-6 items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleLikeStory(currentSlide.id, user.id || user.email); }}
            className={`flex flex-col items-center gap-1 group transition-transform active:scale-90 ${(currentSlide.likes || []).includes(user.id || user.email) ? 'text-red-500' : 'text-white'}`}
          >
            <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors">
              <Heart size={30} fill={(currentSlide.likes || []).includes(user.id || user.email) ? 'currentColor' : 'none'} className={(currentSlide.likes || []).includes(user.id || user.email) ? 'animate-ping' : ''} />
            </div>
            <span className="text-sm font-weight-bold drop-shadow-lg">{(currentSlide.likes || []).length || 0}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPaused(true); setShowCommentInput(true); }}
            className="flex flex-col items-center gap-1 group transition-transform active:scale-90 text-white"
          >
            <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors">
              <MessageCircle size={30} />
            </div>
            <span className="text-sm font-weight-bold drop-shadow-lg">{(currentSlide.comments || []).length || 0}</span>
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (navigator.share) navigator.share({ title: 'Connect Story', url: window.location.href });
              else alert('Link copied to clipboard!'); 
            }}
            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-colors active:scale-90"
          >
            <Send size={28} />
          </button>
        </div>

        {/* Comment Input Overlay */}
        {showCommentInput && (
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-30 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
            <input 
              type="text" 
              autoFocus
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Reply to story..."
              className="flex-1 px-5 py-3 rounded-full bg-white/20 border border-white/10 text-white placeholder-white/50 backdrop-blur-md outline-none focus:bg-white/30 transition-colors"
              onKeyDown={(e) => {
                if(e.key === 'Enter' && commentText.trim()) {
                  commentStory(currentSlide.id, user.id || user.email, user.name, commentText);
                  setCommentText('');
                  setShowCommentInput(false);
                  setIsPaused(false);
                }
              }}
            />
            <button 
              onClick={() => { setShowCommentInput(false); setIsPaused(false); }}
              className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
