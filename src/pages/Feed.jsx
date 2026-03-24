import { useState, useEffect } from 'react';
import { PostCard } from '../components/PostCard';
import { CreatePost } from '../components/CreatePost';
import { StoryTray } from '../components/StoryTray';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { useAuth } from '../context/AuthContext';
import { getPosts, addPost, toggleLikePost } from '../services/firebaseDataService';

export function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time Firestore listener — updates Feed on ALL devices instantly
    const unsubscribe = getPosts((livePosts) => {
      setPosts(livePosts);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleNewPost = async (content, image) => {
    if (user) await addPost(user.uid, user.name, content, image);
  };

  const handleLike = async (id) => {
    if (user) await toggleLikePost(id, user.uid);
  };

  return (
    <>
      <div className="feed-layout">
        <div className="feed-main">
          <StoryTray />
          <CreatePost onPost={handleNewPost} />
          <div className="feed">
            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Loading posts...
              </div>
            )}
            {!loading && posts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No posts yet. Be the first to share something! 🚀
              </div>
            )}
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
