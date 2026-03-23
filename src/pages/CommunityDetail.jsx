import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { CreatePost } from '../components/CreatePost';
import { ArrowLeft, Users, Info } from 'lucide-react';

export function CommunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comm, setComm] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = () => {
      const community = dataService.getCommunityById(id);
      if (community) {
        setComm(community);
        setPosts(dataService.getCommunityPosts(id));
      }
    };
    load();
    window.addEventListener('db_updated', load);
    return () => window.removeEventListener('db_updated', load);
  }, [id]);

  const handleJoinToggle = () => {
    if (user && comm) {
      dataService.toggleCommunityMembership(comm.id, user.id || user.email);
    }
  };

  const handleNewPost = (content, image) => {
    if (user && comm) {
      dataService.addCommunityPost(comm.id, user.id || user.email, user.name, content, image);
    }
  };

  if (!comm) return <div className="loading">Community not found</div>;

  const isMember = comm.members.includes(user?.id || user?.email);

  return (
    <div className="community-detail">
      <header className="comm-header">
        <button className="back-btn" onClick={() => navigate('/communities')}>
          <ArrowLeft size={24} />
        </button>
        <div className="comm-header-info">
          <div className="comm-avatar-large" style={{ backgroundImage: `url(${comm.avatar})` }} />
          <div>
            <h1>{comm.name}</h1>
            <span className="member-count">{comm.members.length} members</span>
          </div>
        </div>
        <button 
          className={`btn-primary ${isMember ? 'btn-secondary' : ''}`}
          onClick={handleJoinToggle}
        >
          {isMember ? 'Member' : 'Join Community'}
        </button>
      </header>

      <div className="comm-layout">
        <div className="comm-main">
          {isMember ? (
            <CreatePost onPost={handleNewPost} placeholder={`Post to ${comm.name}...`} />
          ) : (
            <div className="join-prompt glass">
              <Info size={24} />
              <p>Join this community to share your thoughts and participate in discussions.</p>
            </div>
          )}

          <div className="feed">
            {posts.map(post => (
              <PostCard 
                key={post.id}
                {...post}
                onLike={() => dataService.toggleLikePost(post.id, user?.id || user?.email)}
              />
            ))}
            {posts.length === 0 && (
              <div className="empty-feed">
                <p>Be the first to post in {comm.name}!</p>
              </div>
            )}
          </div>
        </div>

        <aside className="comm-sidebar">
          <div className="comm-about glass">
            <h3>About Community</h3>
            <p>{comm.description}</p>
            <div className="comm-stats">
              <div className="stat">
                <Users size={18} />
                <span>{comm.members.length} Members</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
