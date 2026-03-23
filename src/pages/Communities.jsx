import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, ChevronRight } from 'lucide-react';

export function Communities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    setCommunities(dataService.getCommunities());
    const handleSync = () => setCommunities(dataService.getCommunities());
    window.addEventListener('db_updated', handleSync);
    return () => window.removeEventListener('db_updated', handleSync);
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (newName && user) {
      dataService.createCommunity(newName, newDesc, user.id || user.email);
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
    }
  };

  const handleJoinToggle = (e, commId) => {
    e.stopPropagation();
    if (user) {
      dataService.toggleCommunityMembership(commId, user.id || user.email);
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

      <div className="communities-grid">
        {communities.map(comm => {
          const isMember = comm.members.includes(user?.id || user?.email);
          return (
            <div 
              key={comm.id} 
              className="community-card glass clickable"
              onClick={() => navigate(`/communities/${comm.id}`)}
            >
              <div className="comm-banner" />
              <div className="comm-info">
                <div 
                  className="comm-avatar" 
                  style={{ backgroundImage: `url(${comm.avatar})` }}
                />
                <div className="comm-text">
                  <h3>{comm.name}</h3>
                  <p>{comm.description}</p>
                  <span className="member-count">{comm.members.length} members</span>
                </div>
                <button 
                  className={`btn-join ${isMember ? 'member' : ''}`}
                  onClick={(e) => handleJoinToggle(e, comm.id)}
                >
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
              <input 
                type="text" 
                placeholder="Community Name (e.g. Photography, Gaming)" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <textarea 
                placeholder="What is this community about?" 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
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
