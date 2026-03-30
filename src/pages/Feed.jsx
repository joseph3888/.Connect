import { useState, useEffect } from 'react';
import { PostCard } from '../components/PostCard';
import { CreatePost } from '../components/CreatePost';
import { StoryTray } from '../components/StoryTray';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { Skeleton } from '../components/Motion';
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

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleNewPost = async (content, image) => {
    if (user) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        await addPost(user.uid, user.name, content, image, (p) => setUploadProgress(p));
      } catch (err) {
        console.error("Post upload failed:", err);
        alert("Failed to upload post. Check your connection!");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleLike = async (id) => {
    if (user) await toggleLikePost(id, user.uid);
  };

  if (loading) return (
    <div className="p-8 h-full overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col min-w-0 w-full col-span-1">
          <div className="flex flex-col gap-6 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-heavy rounded-radius-lg h-[340px] animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col min-w-0 w-full col-span-1">
          <StoryTray />
          <CreatePost onPost={handleNewPost} />
          
          {isUploading && (
            <div className="glass-heavy rounded-radius-lg p-6 text-center border-primary/20 my-4 shadow-glow">
              <div className="text-sm font-weight-bold text-primary uppercase tracking-widest animate-pulse flex items-center justify-center gap-3">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="ml-2">Publishing to Connect: {Math.round(uploadProgress)}%</span>
              </div>
            </div>
          )}

          <div className="feed flex flex-col gap-5 mt-2">
            {!loading && posts.length === 0 && (
              <div className="glass-heavy rounded-radius-lg p-20 text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-weight-bold text-main mb-2">It's quiet here</h3>
                <p className="text-sm text-muted">Be the first to share something with your network!</p>
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
    </div>
  );
}
