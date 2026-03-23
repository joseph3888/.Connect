import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function StoryViewer({ group, onClose, onNext }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const SLIDE_DURATION = 5000; // 5 seconds

  const currentSlide = group.slides[slideIndex];

  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + (100 / (SLIDE_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [slideIndex]);

  const handleNext = () => {
    if (slideIndex < group.slides.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
    }
  };

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer-content">
        {/* Progress Bars */}
        <div className="story-progress-container">
          {group.slides.map((_, i) => (
            <div key={i} className="story-progress-bg">
              <div 
                className="story-progress-fill" 
                style={{ 
                  width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%',
                  transition: i === slideIndex ? 'width 0.1s linear' : 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <div 
              className="story-avatar" 
              style={{ width: 32, height: 32, backgroundImage: group.userAvatar ? `url(${group.userAvatar})` : 'none' }}
            />
            <span className="story-viewer-name">{group.userName}</span>
          </div>
          <button className="story-close" onClick={onClose}><X size={24} color="white" /></button>
        </div>

        {/* Slide Content */}
        <div className="story-slide">
          {currentSlide.type === 'video' ? (
            <video src={currentSlide.content} autoPlay muted playsInline />
          ) : (
            <img src={currentSlide.content} alt="Story" />
          )}
        </div>

        {/* Navigation Areas */}
        <div className="story-nav-prev" onClick={handlePrev} />
        <div className="story-nav-next" onClick={handleNext} />
      </div>
    </div>
  );
}
