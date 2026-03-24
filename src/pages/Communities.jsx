import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCommunities, createCommunity, toggleCommunityMembership } from '../services/firebaseDataService';
import { Users, Plus } from 'lucide-react';

export function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const load = async () => {
    const list = await getCommunities();
    setCommunities(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

  return (
    <div className="communities-page">
      <header className="page-header">
        <div className="header-content">
          <Users size={32} className="header-icon" />
          <div>
            <h1>Communities</h1>
            <p>Join groups that share your passions.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} /> Create Community
        </button>
      </header>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Loading communities...</p>}

      <div className="communities-grid">
        {communities.map(comm => {
          const isMember = (comm.members || []).includes(user?.uid);
          return (
            <div key={comm.id} className="community-card glass clickable" onClick={() => navigate(`/communities/${comm.id}`)}>
              <div className="comm-banner" />
              <div className="comm-info">
                <div className="comm-avatar" style={{ backgroundImage: `url(${comm.avatar})` }} />
                <div className="comm-text">
                  <h3>{comm.name}</h3>
                  <p>{comm.description}</p>
                  <span className="member-count">{(comm.members || []).length} members</span>
                </div>
                <button className={`btn-join ${isMember ? 'member' : ''}`} onClick={(e) => handleJoinToggle(e, comm.id)}>
                  {isMember ? 'Joined' : 'Join'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <h2>Start a New Community</h2>
            <form onSubmit={handleCreate} className="create-comm-form">
              <input type="text" placeholder="Community Name" value={newName} onChange={e => setNewName(e.target.value)} required />
              <textarea placeholder="What is this community about?" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Launch Community</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
