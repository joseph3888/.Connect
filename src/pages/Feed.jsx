import { useState, useEffect } from 'react';
import { PostCard } from '../components/PostCard';
import { CreatePost } from '../components/CreatePost';
import { StoryTray } from '../components/StoryTray';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { dataService } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';

export function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    setPosts(dataService.getPosts());
    
    const handleSync = () => setPosts([...dataService.getPosts()]);
    window.addEventListener('db_updated', handleSync);
    return () => window.removeEventListener('db_updated', handleSync);
  }, []);

  const handleNewPost = (content, image) => {
    if (user) {
      dataService.addPost(user.id || user.email, user.name, content, image);
      setPosts(dataService.getPosts());
    }
  };

  const handleLike = (id) => {
    dataService.toggleLikePost(id);
    setPosts(dataService.getPosts());
  };

  return (
    <>
      <div className="feed-layout">
        <div className="feed-main">
          <StoryTray />
          <CreatePost onPost={handleNewPost} />
          <div className="feed">
            {posts.map(post => (
              <PostCard 
                key={post.id}
                {...post}
                onLike={() => handleLike(post.id)}
              />
            ))}
          </div>
        </div>
        <TrendingSidebar />
      </div>
    </>
  );
}
