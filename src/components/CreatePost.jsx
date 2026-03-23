import { useState } from 'react';
import { Image as ImageIcon, Smile, X } from 'lucide-react';
import { processImage } from '../utils/imageUtils';
import './components.css';

export function CreatePost({ onPost }) {
  const [content, setContent] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file, 800).then(base64 => setAttachedImage(base64));
    }
  };

  const handlePost = () => {
    if (content.trim() || attachedImage) {
      onPost(content, attachedImage);
      setContent('');
      setAttachedImage(null);
    }
  };

  return (
    <div className="create-post glass">
      <div className="create-post-header">
        <div className="avatar small"></div>
        <textarea 
          placeholder="What's on your mind?"
          className="post-input"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
      </div>
      
      {attachedImage && (
        <div style={{position: 'relative', margin: '0 0 1rem 3.5rem', borderRadius: '12px', overflow: 'hidden', display: 'inline-block'}}>
          <img src={attachedImage} alt="Attachment preview" style={{maxHeight: '250px', borderRadius: '12px', display: 'block'}} />
          <button 
            onClick={() => setAttachedImage(null)}
            style={{position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', padding: '6px', border: 'none', display: 'flex'}}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="create-post-footer">
        <div className="post-options">
          <label className="option-btn" style={{cursor: 'pointer'}}>
            <ImageIcon size={20} /> Photo
            <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleImageChange} />
          </label>
          <button className="option-btn"><Smile size={20} /> Emoji</button>
        </div>
        <button className="btn-primary" onClick={handlePost}>Post</button>
      </div>
    </div>
  );
}
