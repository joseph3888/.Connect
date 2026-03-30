import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCommunityById, getCommunityPosts, toggleCommunityMembership, 
  addCommunityPost, toggleLikePost, updateCommunityProfile 
} from '../services/firebaseDataService';
import { compressAndConvertToBase64, uploadToCloudinary } from '../services/mediaService';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/PostCard';
import { CreatePost } from '../components/CreatePost';
import { ArrowLeft, Users, Info, Camera, Shield, Award, Globe } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui/Primitives';

export function CommunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comm, setComm] = useState(null);
  const [posts, setPosts] = useState([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!id) return;
    let unsubPosts;
    
    getCommunityById(id).then(community => {
      if (community) setComm(community);
    });

    unsubPosts = getCommunityPosts(id, (livePosts) => {
      setPosts(livePosts);
    });

    return () => unsubPosts && unsubPosts();
  }, [id]);

  const handleJoinToggle = async () => {
    if (user && comm) {
      const isNowMember = await toggleCommunityMembership(comm.id, user.uid);
      setComm(prev => ({
        ...prev,
        members: isNowMember 
          ? [...(prev.members || []), user.uid] 
          : (prev.members || []).filter(m => m !== user.uid)
      }));
    }
  };

  const handleNewPost = async (content, image) => {
    if (user && comm) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        await addCommunityPost(comm.id, user.uid, user.name, content, image, (p) => setUploadProgress(p));
      } catch (err) {
        console.error('Add community post failed:', err);
        alert("Failed to post to community.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user || comm?.ownerId !== user.uid) return;

    setUploadingAvatar(true);
    try {
      const mediaUrl = await uploadToCloudinary(file);
      await updateCommunityProfile(comm.id, { avatar: mediaUrl });
      setComm(prev => ({ ...prev, avatar: mediaUrl }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload community profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!comm) return (
    <div className="flex-center py-20 animate-pulse flex-col gap-4 max-w-5xl mx-auto">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-xs font-weight-bold text-muted uppercase tracking-widest">Loading Hub...</span>
    </div>
  );

  const isMember = (comm.members || []).includes(user?.uid);
  const isOwner = comm.ownerId === user?.uid;

  return (
    <div className="max-w-5xl mx-auto pb-space-xl">
      {/* Immersive Dark Header */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-primary/10 via-surface-active to-accent/10 rounded-b-radius-lg overflow-hidden mb-16 border-b border-white/5">
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <Button 
          variant="glass" size="icon" 
          className="absolute top-4 left-4 z-10" 
          onClick={() => navigate('/communities')}
        >
          <ArrowLeft size={20} />
        </Button>
      </div>

      <div className="px-6 -mt-32 md:-mt-40 relative z-20 flex flex-col md:flex-row gap-6 md:items-end">
        {/* Avatar Editor Container */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-radius-md border-4 border-bg-main shadow-xl flex-shrink-0 bg-surface-active group/avatar">
          <img src={comm.avatar} alt={comm.name} className="w-full h-full object-cover rounded-radius-md" />
          
          {isOwner && (
            <label className="absolute inset-0 bg-black/60 flex-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-radius-md z-10">
              <Camera size={28} className="text-white drop-shadow-md pb-1" />
              <div className="absolute bottom-4 text-[10px] font-weight-bold text-white uppercase tracking-widest">Update</div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                disabled={uploadingAvatar} 
              />
            </label>
          )}

          {uploadingAvatar && (
            <div className="absolute inset-0 bg-black/80 flex-center z-20 rounded-radius-md">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Community Info */}
        <div className="flex-1 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-primary" />
                <Badge variant="primary" className="!text-[10px] uppercase font-weight-bold tracking-widest px-2">Official Hub</Badge>
              </div>
              <h1 className="text-4xl font-weight-black text-main tracking-tight">{comm.name}</h1>
              <p className="text-muted font-weight-semi uppercase tracking-widest text-xs mt-1">{(comm.members || []).length} Members connected</p>
            </div>
            <Button 
              variant={isMember ? 'glass' : 'primary'} 
              className={`!py-3 !px-8 shadow-glow !rounded-full text-sm uppercase tracking-widest ${isMember ? 'text-primary border-primary/20' : ''}`}
              onClick={handleJoinToggle}
            >
              {isMember ? 'Joined Network' : 'Join Community'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-space-xl mt-space-xl px-2">
        {/* Main Feed */}
        <div className="flex flex-col gap-space-lg">
          {isMember ? (
            <div className="mb-4">
              <CreatePost onPost={handleNewPost} placeholder={`Share insights with ${comm.name}...`} />
              {isUploading && (
                <div className="mt-4 p-3 bg-surface-active rounded-radius-md text-sm font-weight-semi text-primary border border-primary/20 flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   Publishing to Hub... {Math.round(uploadProgress)}%
                </div>
              )}
            </div>
          ) : (
            <Card glass className="flex items-center gap-4 p-space-lg border-primary/20 bg-primary/5">
              <div className="p-3 bg-primary/20 rounded-full text-primary">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-weight-bold text-main">Join the Discussion</h3>
                <p className="text-sm text-muted">Become a member to share your thoughts and participate in this professional network.</p>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-space-lg">
            {posts.map(post => (
              <PostCard 
                key={post.id}
                {...post}
                onLike={() => toggleLikePost(post.id, user?.uid)}
              />
            ))}
            {posts.length === 0 && (
              <div className="py-20 text-center glass rounded-radius-lg border-white/5">
                <Award size={40} className="mx-auto mb-4 opacity-50 text-primary" />
                <h3 className="text-xl font-weight-bold text-main mb-2">No transmissions yet</h3>
                <p className="text-muted">Be the first to shape the conversation in {comm.name}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Sidebar */}
        <aside className="flex flex-col gap-space-lg">
          <Card glass className="border-white/5 shadow-xl">
            <h3 className="text-sm font-weight-bold text-muted uppercase tracking-widest mb-4 border-b border-white/5 pb-4">Mission Statement</h3>
            <p className="text-main leading-relaxed text-sm">
              {comm.description || "The premier space for discussing innovations and sharing professional insights within this domain."}
            </p>
            <div className="mt-6 flex items-center gap-3 p-3 bg-surface-active rounded-radius-md">
              <Users size={18} className="text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-weight-bold text-main">{(comm.members || []).length}</span>
                <span className="text-[10px] text-muted uppercase tracking-widest">Active Members</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
