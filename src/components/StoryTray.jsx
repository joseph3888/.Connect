import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getConnectedStories, addStory } from '../services/firebaseDataService';
import { useAuth } from '../context/AuthContext';
import { StoryViewer } from './StoryViewer';
import { Card } from './ui/Primitives';

export function StoryTray() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    let unsubscribeFn;

    getConnectedStories(user.id || user.email, (fetchedStories) => {
      setStories(fetchedStories);
      setActiveStoryGroup(prev => {
        if (!prev) return null;
        return fetchedStories.find(g => g.userId === prev.userId) || prev;
      });
    }).then(unsub => {
      unsubscribeFn = unsub;
    });

    return () => { if (unsubscribeFn) unsubscribeFn(); };
  }, [user]);

  const handleAddStory = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Error: Story file exceeds 50MB limit.');
        return;
      }
      setIsUploading(true);
      try {
        await addStory(
          user.id || user.email, 
          user.name, 
          user.avatar, 
          file,
          (progress) => setUploadProgress(progress)
        );
      } catch (err) {
        console.error("Story upload error:", err);
        alert("Upload failed. Please check your Cloudinary configuration in .env. Error: " + err.message);
      } finally {
        setIsUploading(false);
        e.target.value = null; // reset input
      }
    }
  };

  return (
    <Card glass padded={false} className="mb-8 border-white/5 overflow-hidden">
      <div className="flex gap-4 p-5 overflow-x-auto no-scrollbar scroll-smooth">
        
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 group">
          <label 
            className={`relative w-16 h-16 rounded-full border-2 border-dashed flex-center bg-surface-active overflow-hidden shadow-lg transition-all
              ${isUploading ? 'cursor-wait border-accent opacity-70' : 'cursor-pointer border-white/20 hover:border-primary group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
              style={{ backgroundImage: user?.avatar ? `url(${user.avatar})` : 'none' }}
            >
              {!user?.avatar && <div className="w-full h-full flex-center text-xl font-weight-black">{user?.name?.[0] || 'U'}</div>}
            </div>
            
            {!isUploading ? (
              <div className="absolute inset-0 flex-center">
                <div className="p-1.5 bg-primary rounded-full shadow-glow">
                  <Plus size={18} color="white" strokeWidth={4} />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex-center flex-col gap-1 bg-black/40">
                 <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                 <span className="text-[10px] text-white font-weight-black">{Math.round(uploadProgress)}%</span>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleAddStory}
              disabled={isUploading}
            />
          </label>
          <span className={`text-xs font-weight-bold tracking-tight truncate w-16 text-center ${isUploading ? 'text-accent animate-pulse' : 'text-main group-hover:text-primary transition-colors'}`}>
            {isUploading ? `Syncing...` : 'Your Story'}
          </span>
        </div>

        {/* Other Users: View Stories */}
        {stories.map((group) => (
          <div 
            key={group.userId} 
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
            onClick={() => setActiveStoryGroup(group)}
          >
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-accent via-primary to-accent shadow-glow group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-bg-main rounded-full border-2 border-bg-main overflow-hidden flex-center relative">
                 <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: group.userAvatar ? `url(${group.userAvatar})` : 'none' }}
                >
                  {!group.userAvatar && <span className="text-xl font-weight-black text-white">{group.userName?.[0] || '?'}</span>}
                </div>
              </div>
            </div>
            <span className="text-xs font-weight-bold text-main tracking-tight truncate w-16 text-center group-hover:text-primary transition-colors">
              {group.userName.split(' ')[0]}
            </span>
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
    </Card>
  );
}
