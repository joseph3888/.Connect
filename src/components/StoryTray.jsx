import { useState, useEffect } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { dataService } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';
import { processImage } from '../utils/imageUtils';
import { StoryViewer } from './StoryViewer';

export function StoryTray() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  useEffect(() => {
    const handleSync = () => setStories(dataService.getStories());
    handleSync();
    window.addEventListener('db_updated', handleSync);
    return () => window.removeEventListener('db_updated', handleSync);
  }, []);

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      const base64 = await processImage(file, 1080);
      dataService.addStory(user.id || user.email, user.name, user.avatar, base64);
    }
  };

  return (
    <div className="story-tray-container glass">
      <div className="story-scroll">
        {/* Current User: Add Story */}
        <div className="story-item add-story">
          <label className="story-avatar-container clickable">
            <div 
              className="story-avatar"
              style={{ backgroundImage: user?.avatar ? `url(${user.avatar})` : 'none' }}
            >
              {!user?.avatar && (user?.name?.[0] || 'U')}
            </div>
            <div className="add-badge">
              <Plus size={14} color="white" strokeWidth={3} />
            </div>
            <input type="file" accept="image/*" onChange={handleAddStory} style={{ display: 'none' }} />
          </label>
          <span className="story-label">Your Story</span>
        </div>

        {/* Other Users: View Stories */}
        {stories.map((group) => (
          <div 
            key={group.userId} 
            className="story-item"
            onClick={() => setActiveStoryGroup(group)}
          >
            <div className="story-avatar-container active-ring">
              <div 
                className="story-avatar" 
                style={{ backgroundImage: group.userAvatar ? `url(${group.userAvatar})` : 'none' }}
              >
                {!group.userAvatar && (group.userName?.[0] || '?')}
              </div>
            </div>
            <span className="story-label">{group.userName.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {activeStoryGroup && (
        <StoryViewer 
          group={activeStoryGroup} 
          onClose={() => setActiveStoryGroup(null)} 
          onNext={() => {
            const index = stories.findIndex(g => g.userId === activeStoryGroup.userId);
            if (index < stories.length - 1) {
              setActiveStoryGroup(stories[index + 1]);
            } else {
              setActiveStoryGroup(null);
            }
          }}
        />
      )}
    </div>
  );
}
