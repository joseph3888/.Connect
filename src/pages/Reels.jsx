import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, MoreHorizontal, Plus, Music, Video, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getReels, addReel, toggleLikeReel, commentReel } from '../services/firebaseDataService';
import { Button, Card } from '../components/ui/Primitives';
import { motion, AnimatePresence } from 'framer-motion';

// Extracted Reel Component for isolated lifecycle/memory-management of massive Object URLs
const ReelNode = ({ reel, user, handleLike, isActive }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) videoRef.current.play().catch(() => {});
      if (audioRef.current) audioRef.current.play().catch(() => {});
    } else {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isActive]);

  useEffect(() => {
    let url;
    if (reel.image && typeof reel.image === 'object') {
      url = URL.createObjectURL(reel.image);
      setVideoSrc(url);
    } else if (typeof reel.image === 'string') {
      setVideoSrc(null); // Keep as image payload
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [reel.image]);

  useEffect(() => {
    let url;
    if (reel.audio && typeof reel.audio === 'object') {
      url = URL.createObjectURL(reel.audio);
      setAudioSrc(url);
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [reel.audio]);

  const togglePlayback = () => {
    if (videoRef.current) { 
      if (videoRef.current.paused) {
        videoRef.current.play();
        if (audioRef.current) audioRef.current.play();
      } else {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
      }
    }
  };

  const isVideoBlob = reel.image && typeof reel.image === 'object' && reel.image.type && reel.image.type.startsWith('video/');
  const isImageBlob = reel.image && typeof reel.image === 'object' && reel.image.type && reel.image.type.startsWith('image/');
  const isStringVideo = typeof reel.image === 'string' && reel.image !== '' && !reel.image.toLowerCase().match(/\.(jpeg|jpg|gif|png)(\?|$)/);
  const stringImageFallbackStyle = typeof reel.image === 'string' && !isStringVideo ? `url(${reel.image})` : 'none';

  const likeCount = Array.isArray(reel.likes) ? reel.likes.length : (typeof reel.likes === 'number' ? reel.likes : 0);
  const isLiked = Array.isArray(reel.likes) && user ? reel.likes.includes(user.id || user.email) : false;

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden flex-center cursor-pointer group"
      onClick={togglePlayback}
    >
      {/* Media Layer */}
      {(isVideoBlob || isStringVideo) && (
        <video 
          ref={videoRef} src={videoSrc || reel.image} loop muted={!!audioSrc} playsInline
          className="absolute inset-0 w-full h-full object-cover" 
        />
      )}
      {(isImageBlob || (typeof reel.image === 'string' && !isStringVideo)) && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: isImageBlob ? `url(${videoSrc})` : stringImageFallbackStyle }} 
        />
      )}
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop autoPlay />}

      {/* Action / Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 pointer-events-none">
        <div className="pointer-events-auto flex items-end justify-between w-full relative z-10">
          
          {/* Reel Info */}
          <div className="text-white w-3/4 pb-4">
            <h3 className="text-xl font-weight-black mb-2 tracking-tight drop-shadow-md">{reel.author}</h3>
            <p className="text-sm font-weight-semi text-white/90 drop-shadow-md leading-snug line-clamp-3">{reel.description}</p>
            {audioSrc && (
              <div className="flex items-center gap-2 mt-4 text-xs font-weight-bold uppercase tracking-widest text-primary bg-primary/20 px-3 py-1.5 rounded-full w-fit backdrop-blur-md border border-primary/30">
                <Music size={14} className="animate-pulse" /> Original Audio
              </div>
            )}
          </div>

          {/* Interactive Actions */}
          <div className="flex flex-col gap-6 items-center mb-4">
            <button 
              onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }} 
              className={`flex flex-col items-center gap-1 group/btn transition-transform active:scale-90 ${isLiked ? 'text-red-500' : 'text-white'}`}
            >
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover/btn:bg-white/20 transition-colors">
                <Heart size={30} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-ping" : ""} />
              </div>
              <span className="text-sm font-weight-bold drop-shadow-lg">{likeCount}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!user) return;
                const text = window.prompt("Write a comment:");
                if (text && text.trim()) commentReel(reel.id, user.id || user.email, user.name, text);
              }}
              className="flex flex-col items-center gap-1 group/btn transition-transform active:scale-90 text-white"
            >
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover/btn:bg-white/20 transition-colors">
                <MessageCircle size={30} />
              </div>
              <span className="text-sm font-weight-bold drop-shadow-lg">{(reel.comments || []).length}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) navigator.share({ title: 'Connect Reel', url: window.location.href });
                else alert("Link copied to clipboard!");
              }}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-colors active:scale-90"
            >
              <Send size={28} />
            </button>
            <button 
              onClick={(e) => e.stopPropagation()} 
              className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-colors active:scale-90"
            >
              <MoreHorizontal size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setActiveId(Number(entry.target.getAttribute('data-id')));
        }
      });
    }, { threshold: [0.5] });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);
  
  // Create Reel State
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = getReels(setReels);
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleLike = (id) => {
    if (user) toggleLikeReel(id, user.id || user.email);
  };

  const handleCreateReel = async () => {
    if ((videoFile || description) && user) {
      if (isUploading) return;
      setIsUploading(true);
      try {
        if (videoFile && videoFile.size > 50 * 1024 * 1024) {
          alert('Error: This video exceeds the 50MB limit. Please choose a smaller file.');
          setIsUploading(false); return;
        }

        await addReel(
          user.id || user.email, 
          user.name, 
          user.avatar || '',
          description, 
          videoFile,
          (progress) => setUploadProgress(progress)
        );
        
        setIsCreatorOpen(false);
        setVideoFile(null);
        setAudioFile(null);
        setDescription('');
      } catch (error) {
        console.error('Reel upload failed:', error);
        alert('Failed to upload Reel. Make sure Firebase Storage rules are in Test Mode! Error: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="h-[100dvh] lg:h-[calc(100vh-2rem)] w-full flex-center relative">
      
      {/* Floating Action Button */}
      <Button 
        variant="primary" size="icon" 
        className="fixed top-8 right-8 z-[100] w-14 h-14 shadow-glow"
        onClick={() => setIsCreatorOpen(true)}
      >
        <Plus size={32} />
      </Button>

      {/* Master Creator Overlay */}
      <AnimatePresence>
        {isCreatorOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex-center bg-black/80 backdrop-blur-xl p-6" 
            onClick={() => setIsCreatorOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-heavy w-full max-w-md rounded-[32px] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-between items-center mb-8">
                <h2 className="text-2xl font-weight-black text-white">Publish Reel</h2>
                <Button variant="glass" size="icon" onClick={() => setIsCreatorOpen(false)} className="w-10 h-10">
                  <X size={20} />
                </Button>
              </div>
              
              <textarea 
                className="w-full bg-surface-active border border-white/5 rounded-radius-lg p-5 text-main outline-none focus:border-primary/50 transition-all min-h-[120px] resize-none mb-6 font-weight-semi"
                placeholder="Give your masterpiece a caption..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />

              <div className="space-y-4 mb-8">
                {/* Genuine Video Input Mapper */}
                <label className={`flex items-center justify-center p-4 border-2 border-dashed rounded-radius-lg cursor-pointer transition-all ${videoFile ? 'border-primary bg-primary/20 text-white' : 'border-white/20 bg-surface-active text-muted hover:border-primary/50'}`}>
                  {videoFile ? `✓ ${videoFile.name}` : <><Video size={20} className="mr-3 text-primary" /> Select .MP4 Video</>}
                  <input type="file" accept="video/*,image/*" className="hidden" onChange={e => { if(e.target.files[0]) setVideoFile(e.target.files[0]); }} />
                </label>

                {/* Native Music Track Layer Tracker */}
                {videoFile && (
                  <label className={`flex items-center justify-center p-4 border border-white/10 rounded-radius-lg cursor-pointer transition-all ${audioFile ? 'bg-accent/20 text-white border-accent' : 'bg-surface-active text-muted hover:bg-white/5'}`}>
                    {audioFile ? `✓ ${audioFile.name}` : <><Music size={20} className="mr-3 text-accent" /> Add Background Music (.mp3)</>}
                    <input type="file" accept="audio/*" className="hidden" onChange={e => { if(e.target.files[0]) setAudioFile(e.target.files[0]); }} />
                  </label>
                )}
              </div>

              <Button 
                variant="primary" 
                className="w-full !rounded-full !py-4 shadow-glow font-weight-black uppercase tracking-widest flex-center gap-3"
                onClick={handleCreateReel}
                disabled={isUploading || !videoFile}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Syncing {Math.round(uploadProgress)}%
                  </>
                ) : (
                  <>
                    <Video size={20} /> Share Masterpiece
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mapped Playback Loop */}
      <div className="relative w-full max-w-[440px] h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory no-scrollbar bg-black lg:rounded-[32px] lg:border border-white/10 lg:shadow-2xl">
        {reels.length === 0 && (
          <div className="h-full w-full flex-center flex-col text-white/50 bg-black">
            <Video size={72} className="mb-6 opacity-30 animate-pulse text-primary" />
            <h2 className="text-2xl font-weight-black mb-2 text-white">No Reels Yet</h2>
            <p className="font-weight-semi text-center max-w-[200px] text-sm">Be the first to share an immersive vertical video!</p>
          </div>
        )}

        {reels.map(reel => (
          <div 
            key={reel.id} 
            data-id={reel.id}
            ref={el => { if (el && observerRef.current) observerRef.current.observe(el); }}
            className="snap-start snap-always w-full h-full relative bg-black"
          >
            <ReelNode reel={reel} user={user} handleLike={handleLike} isActive={activeId === reel.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
