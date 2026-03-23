import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, MoreHorizontal, Plus, Music, Video, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/mockDataService';
import '../components/components.css';

// Extracted Reel Component for isolated lifecycle/memory-management of massive Object URLs
const ReelNode = ({ reel, user, handleLike, isActive }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isActive) {
      if (videoRef.current) videoRef.current.play().catch(() => {});
      if (audioRef.current) audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
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
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const isVideoBlob = reel.image && typeof reel.image === 'object' && reel.image.type && reel.image.type.startsWith('video/');
  const isImageBlob = reel.image && typeof reel.image === 'object' && reel.image.type && reel.image.type.startsWith('image/');
  const isStringVideo = typeof reel.image === 'string' && reel.image.toLowerCase().includes('.mp4');
  const stringImageFallbackStyle = typeof reel.image === 'string' && !isStringVideo ? `url(${reel.image})` : 'none';

  const likeCount = Array.isArray(reel.likes) ? reel.likes.length : (typeof reel.likes === 'number' ? reel.likes : 0);
  const isLiked = Array.isArray(reel.likes) && user ? reel.likes.includes(user.id || user.email) : false;

  return (
    <div 
      className="reel-item" 
      style={{ background: `linear-gradient(135deg, ${reel.color1}, ${reel.color2})`, position: 'relative', overflow: 'hidden' }}
      onClick={togglePlayback}
    >
      {/* Video Payload Layer */}
      {(isVideoBlob || isStringVideo) && (
        <video 
          ref={videoRef} src={videoSrc || reel.image} loop muted={!!audioSrc} playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
        />
      )}
      {/* Photo Payload Layer */}
      {(isImageBlob || (typeof reel.image === 'string' && !isStringVideo)) && (
        <div style={{ width: '100%', height: '100%', backgroundImage: isImageBlob ? `url(${videoSrc})` : stringImageFallbackStyle, backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', top: 0, left: 0 }} />
      )}
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop autoPlay />}

      <div className="reel-overlay" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', padding: '2rem 1.5rem 2.5rem 1.5rem', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%'}}>
        <div style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="reel-info" style={{color: 'white', maxWidth: '80%'}}>
            <h3 style={{textShadow: '0 4px 15px rgba(0,0,0,0.9)', color: 'white', fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '0.5px'}}>{reel.author}</h3>
            <p style={{textShadow: '0 4px 15px rgba(0,0,0,0.9)', fontSize: '1.05rem', lineHeight: '1.5'}}>{reel.description}</p>
            {audioSrc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '0.9rem', opacity: 0.9 }}>
                <Music size={14} /> <span>Original Audio</span>
              </div>
            )}
          </div>
          <div className="reel-actions" style={{ pointerEvents: 'auto' }}>
            <button onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }} className={isLiked ? 'liked' : ''}>
              <Heart size={28} className="icon" fill={isLiked ? "var(--accent-color)" : "none"} stroke={isLiked ? "var(--accent-color)" : "currentColor"} />
              <br/><span style={{ color: isLiked ? 'var(--accent-color)' : 'inherit' }}>{likeCount}</span>
            </button>
            <button onClick={(e) => e.stopPropagation()}>
              <MessageCircle size={28} />
              <br/><span>{reel.comments}</span>
            </button>
            <button onClick={(e) => e.stopPropagation()}>
              <Send size={28} />
            </button>
            <button onClick={(e) => e.stopPropagation()}>
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

  useEffect(() => {
    setReels(dataService.getReels());
    
    const handleSync = () => setReels([...dataService.getReels()]);
    window.addEventListener('db_updated', handleSync);
    return () => window.removeEventListener('db_updated', handleSync);
  }, []);

  const handleLike = (id) => {
    if (user) {
      dataService.toggleLikeReel(id, user.id || user.email);
      setReels(dataService.getReels());
    }
  };

  const handleCreateReel = () => {
    if ((videoFile || description) && user) {
      dataService.addReel(
        user.id || user.email, 
        user.name, 
        description, 
        videoFile, 
        audioFile
      );
      setReels(dataService.getReels());
      setIsCreatorOpen(false);
      setVideoFile(null);
      setAudioFile(null);
      setDescription('');
    }
  };

  return (
    <div className="reels-container">
      {/* Floating Action Button for Genuine Video Reels */}
      <button 
        className="btn-primary" 
        style={{position: 'fixed', top: '20px', right: '20px', zIndex: 100, borderRadius: '50%', width: '56px', height: '56px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(156, 137, 200, 0.8)'}}
        onClick={() => setIsCreatorOpen(true)}
      >
        <Plus size={32} />
      </button>

      {/* Absolute Master Video/Music IndexedDB Creator Overlay */}
      {isCreatorOpen && (
        <div className="modal-overlay" onClick={() => setIsCreatorOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{padding: '2rem', maxWidth: '400px', width: '90%'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2>Publish Video Reel</h2>
              <button onClick={() => setIsCreatorOpen(false)} style={{background: 'none', border: 'none', color: 'var(--text-secondary)'}}><X size={24}/></button>
            </div>
            
            <textarea 
              className="post-input" 
              placeholder="Give your masterpiece a caption..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{width: '100%', minHeight: '100px', marginBottom: '1rem', padding: '1rem', borderRadius: '12px'}}
            />

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
              {/* Genuine Video Input Mapper */}
              <label className="btn-primary" style={{textAlign: 'center', cursor: 'pointer', background: videoFile ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface-color)', color: videoFile ? 'white' : 'var(--text-primary)', border: '2px dashed var(--accent-color)', boxShadow: 'none'}}>
                {videoFile ? `✓ ${videoFile.name}` : <><Video size={20} style={{verticalAlign: 'middle', marginRight: '8px'}} /> Select .MP4 Video</>}
                <input type="file" accept="video/*,image/*" style={{display: 'none'}} onChange={e => {
                  if(e.target.files[0]) setVideoFile(e.target.files[0]);
                }} />
              </label>

              {/* Native Music Track Layer Tracker */}
              {videoFile && (
                <label className="btn-primary" style={{textAlign: 'center', cursor: 'pointer', background: audioFile ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(156, 137, 200, 0.1)', color: audioFile ? 'white' : 'var(--text-primary)', boxShadow: 'none'}}>
                  {audioFile ? `✓ ${audioFile.name}` : <><Music size={20} style={{verticalAlign: 'middle', marginRight: '8px'}} /> Add Background Music (.mp3)</>}
                  <input type="file" accept="audio/*" style={{display: 'none'}} onChange={e => {
                    if(e.target.files[0]) setAudioFile(e.target.files[0]);
                  }} />
                </label>
              )}
            </div>

            <button className="btn-primary" style={{width: '100%'}} onClick={handleCreateReel} disabled={!videoFile && !description}>
              Share Masterpiece
            </button>
          </div>
        </div>
      )}

      {/* Mapped Playback Loop */}
      <div className="reels-feed" style={{ scrollSnapType: 'y mandatory', height: '100vh', overflowY: 'auto' }}>
        {reels.map(reel => (
          <div 
            key={reel.id} 
            data-id={reel.id}
            ref={el => {
              if (el && observerRef.current) observerRef.current.observe(el);
            }}
            style={{ scrollSnapAlign: 'start', height: '100vh', width: '100%' }}
          >
            <ReelNode reel={reel} user={user} handleLike={handleLike} isActive={activeId === reel.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
