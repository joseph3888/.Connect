/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCommunities, createCommunity, toggleCommunityMembership, updateCommunityProfile } from '../services/firebaseDataService';
import { compressAndConvertToBase64, uploadToCloudinary } from '../services/mediaService';
import { Users, Plus, Shield, Globe, Award, Search, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Badge } from '../components/ui/Primitives';

export function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [uploadingAvatarId, setUploadingAvatarId] = useState(null);

  const load = async () => {
    const list = await getCommunities();
    setCommunities(list);
    setLoading(false);
  };

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newName && user) {
      await createCommunity(newName, newDesc, user.uid);
      setShowCreateModal(false);
      setNewName(''); setNewDesc('');
      load();
    }
  };

  const handleJoinToggle = async (e, commId) => {
    e.stopPropagation();
    if (user) {
      await toggleCommunityMembership(commId, user.uid);
      load();
    }
  };

  const handleAvatarUpload = async (e, commId) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploadingAvatarId(commId);
    try {
      const mediaUrl = await uploadToCloudinary(file);
      await updateCommunityProfile(commId, { avatar: mediaUrl });
      
      // Update local state to reflect instantly
      setCommunities(prev => prev.map(c => c.id === commId ? { ...c, avatar: mediaUrl } : c));
    } catch (err) {
      console.error(err);
      alert('Failed to upload community profile picture.');
    } finally {
      setUploadingAvatarId(null);
    }
  };

  return (
    <div className="communities-page max-w-5xl mx-auto pb-space-xl">
      <header className="flex-between items-end mb-space-xl">
        <div className="flex items-center gap-space-lg">
          <div className="w-16 h-16 glass rounded-full flex-center bg-gradient-to-br from-primary/20 to-accent/20 border-white/5">
            <Users size={32} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="accent" className="!text-[10px] uppercase font-weight-bold tracking-widest px-2">Global Hubs</Badge>
              <h1 className="text-3xl font-weight-bold text-main">Professional Communities</h1>
            </div>
            <p className="text-muted line-clamp-1">Sync with industry-specific groups and collaborative professional networks.</p>
          </div>
        </div>
        <Button variant="primary" className="gap-2 shadow-glow !rounded-full py-3" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} /> Start New Hub
        </Button>
      </header>

      {loading && (
        <div className="flex-center py-20 animate-pulse flex-col gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-weight-bold text-muted uppercase tracking-widest">Synchronizing Clusters...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <AnimatePresence>
          {communities.map((comm, index) => {
            const isMember = (comm.members || []).includes(user?.uid);
            return (
              <motion.div
                key={comm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  glass 
                  padded={false} 
                  className="group hover:scale-[1.01] transition-all cursor-pointer overflow-hidden border-white/5 hover:border-primary/20"
                  onClick={() => navigate(`/communities/${comm.id}`)}
                >
                  <div className="h-24 bg-gradient-to-r from-primary/10 via-surface-active to-accent/10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                  </div>
                  <div className="px-space-md pb-space-md -mt-10 flex gap-space-lg relative z-10">
                    <div className="w-20 h-20 rounded-radius-md border-4 border-bg-main shadow-xl flex-shrink-0 bg-surface-active relative group/avatar">
                      <img src={comm.avatar} alt={comm.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform rounded-radius-md" />
                      
                      {/* Admin Avatar Upload */}
                      {comm.ownerId === user?.uid && (
                        <label 
                          className="absolute inset-0 bg-black/50 flex-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-radius-md z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Camera size={20} className="text-white drop-shadow-md" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleAvatarUpload(e, comm.id)} 
                            disabled={uploadingAvatarId === comm.id} 
                          />
                        </label>
                      )}
                      
                      {uploadingAvatarId === comm.id && (
                        <div className="absolute inset-0 bg-black/70 flex-center z-30 rounded-radius-md">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pt-12">
                      <div className="flex-between items-start mb-2">
                        <h3 className="text-xl font-weight-bold text-main line-clamp-1 group-hover:text-primary transition-colors">{comm.name}</h3>
                        <Badge variant="primary">{(comm.members || []).length} Members</Badge>
                      </div>
                      <p className="text-sm text-muted line-clamp-2 mb-6 leading-relaxed">
                        {comm.description || "The premier space for discussing innovations and sharing professional insights within this domain."}
                      </p>
                      <div className="flex-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-weight-bold text-muted uppercase tracking-tighter">
                          <Globe size={12} className="text-primary/60" /> Verified Hub
                        </div>
                        <Button 
                          variant={isMember ? 'glass' : 'primary'} 
                          className={`!py-1.5 !px-6 !text-xs !rounded-full ${isMember ? 'border-primary/20 text-primary' : 'shadow-glow'}`}
                          onClick={(e) => handleJoinToggle(e, comm.id)}
                        >
                          {isMember ? 'Member' : 'Join Network'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[1000] flex-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <Card glass className="relative border-white/10 shadow-2xl p-space-xl">
                <Button variant="glass" size="icon" className="absolute top-4 right-4" onClick={() => setShowCreateModal(false)}>
                  <X size={20} />
                </Button>
                
                <div className="flex items-center gap-3 mb-space-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex-center text-primary"><Shield size={20} /></div>
                  <h2 className="text-2xl font-weight-bold text-main">New Community</h2>
                </div>

                <form onSubmit={handleCreate} className="space-y-space-lg">
                  <div className="space-y-2">
                    <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">Identity</label>
                    <Input 
                      placeholder="Community Title (e.g. Future of AI)" 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      required 
                      className="bg-surface-active/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">Mission Statement</label>
                    <textarea 
                      className="w-full bg-surface-active/50 border border-white/5 rounded-radius-md p-space-md text-main outline-none focus:border-primary/50 transition-all min-h-[120px] text-sm leading-relaxed"
                      placeholder="Define the purpose and goals of this hub..." 
                      value={newDesc} 
                      onChange={e => setNewDesc(e.target.value)} 
                    />
                  </div>
                  <div className="pt-space-md flex gap-space-md">
                    <Button type="button" variant="glass" className="flex-1 !rounded-full py-3" onClick={() => setShowCreateModal(false)}>Discard</Button>
                    <Button type="submit" variant="primary" className="flex-1 !rounded-full py-3 shadow-glow">Launch Network</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
