import { useState, useRef } from 'react';
import { Image as ImageIcon, Smile, X } from 'lucide-react';
import { processImage } from '../utils/imageUtils';
import { Button } from './ui/Primitives';
import './components.css';

export function CreatePost({ onPost }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const filters = [
    { id: 'none', label: 'Original', style: 'none' },
    { id: 'grayscale', label: 'Mono', style: 'grayscale(100%)' },
    { id: 'sepia', label: 'Vintage', style: 'sepia(80%)' },
    { id: 'vibrant', label: 'Vivid', style: 'saturate(180%) contrast(110%)' },
    { id: 'warm', label: 'Warm', style: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' },
    { id: 'cool', label: 'Cool', style: 'saturate(120%) hue-rotate(180deg) brightness(1.1)' },
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setSelectedFilter('none');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (content.trim() || imageFile) {
      setLoading(true);
      let finalImage = imageFile;
      if (imagePreview && selectedFilter !== 'none') {
        const filteredDataUrl = await processImage(imagePreview, 1200, selectedFilter);
        // Convert dataUrl to blob/file
        const res = await fetch(filteredDataUrl);
        finalImage = await res.blob();
      }
      await onPost(content, finalImage);
      setContent('');
      handleRemoveImage();
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedFilter('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="create-post glass p-space-md rounded-radius-lg border border-main mb-space-lg">
      <div className="flex gap-space-md mb-space-md">
        <div className="avatar small bg-surface-active rounded-full flex-shrink-0" style={{ width: '40px', height: '40px' }} />
        <textarea 
          placeholder="What's happening?"
          className="w-full bg-transparent border-none focus:outline-none text-main resize-none pt-2"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      
      {imagePreview && (
        <div className="mb-space-md">
          <div className="relative rounded-radius-lg overflow-hidden border border-white/10 group">
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                maxHeight: '400px', 
                objectFit: 'cover',
                filter: filters.find(f => f.id === selectedFilter)?.style || 'none',
                transition: 'filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
            <button 
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
              onClick={handleRemoveImage}
            >
              <X size={18} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex gap-3 overflow-x-auto no-scrollbar">
              {filters.map(filter => (
                <div 
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`
                    flex-shrink-0 cursor-pointer rounded-radius-md border-2 transition-all p-0.5
                    ${selectedFilter === filter.id ? 'border-primary' : 'border-transparent hover:border-white/30'}
                  `}
                >
                  <div 
                    style={{ 
                      width: '45px', 
                      height: '45px', 
                      backgroundImage: `url(${imagePreview})`, 
                      backgroundSize: 'cover',
                      filter: filter.style,
                      borderRadius: '6px'
                    }} 
                  />
                  <span className="text-[10px] text-white font-weight-semi text-center block mt-1">{filter.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-space-sm border-t border-main">
        <div className="flex gap-2">
          <label className="p-2 hover:bg-surface-hover rounded-full cursor-pointer transition-colors text-primary flex items-center gap-2 text-sm font-weight-semi">
            <ImageIcon size={20} />
            <span className="hidden sm:inline">Photo</span>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          </label>
          <button className="p-2 hover:bg-surface-hover rounded-full transition-colors text-muted flex items-center gap-2 text-sm font-weight-semi">
            <Smile size={20} />
            <span className="hidden sm:inline">Emoji</span>
          </button>
        </div>
        <Button
          variant="primary"
          className="px-8 rounded-full shadow-glow"
          onClick={handlePost}
          disabled={!content.trim() && !imageFile || loading}
        >
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}
