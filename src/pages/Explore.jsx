import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { dataService } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';
import '../components/components.css'; 

export function Explore() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [], communities: [], reels: [] });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSync = () => {
      if (query.length >= 2) {
        setResults(dataService.searchAll(query));
      } else {
        // Default suggestions
        setResults({
          users: dataService.getAllUsers().slice(0, 5),
          posts: [],
          communities: dataService.getCommunities().slice(0, 3),
          reels: []
        });
      }
    };
    
    handleSync();
    window.addEventListener('db_updated', handleSync);
    return () => window.removeEventListener('db_updated', handleSync);
  }, [query]);

  const handleConnect = (targetId) => {
    if (user && targetId) {
      const currentUserIdentifier = user.id || user.email;
      dataService.toggleConnection(currentUserIdentifier, targetId);
      // Forced local re-render for zero-latency feedback
      setUsers(prev => [...prev]);
    }
  };


  return (
    <div className="explore-page">
      <div className="search-bar glass" style={{marginBottom: '2rem'}}>
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Search for people to connect with..." 
          className="search-input" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <div className="search-results-overlay">
        {/* Users Section */}
        {results.users.length > 0 && (
          <div className="search-section">
            <h4>People</h4>
            <div className="search-list">
              {results.users.map(u => (
                <div key={u.id} className="search-result-item glass" onClick={() => navigate(`/profile/${u.id}`)}>
                  <div className="res-avatar" style={{ backgroundImage: u.avatar ? `url(${u.avatar})` : 'none' }}>
                    {!u.avatar && (u.name?.[0] || 'U')}
                  </div>
                  <div className="res-info">
                    <span className="res-name">{u.name}</span>
                    <span className="res-sub">{u.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communities Section */}
        {results.communities.length > 0 && (
          <div className="search-section">
            <h4>Communities</h4>
            <div className="search-list">
              {results.communities.map(c => (
                <div key={c.id} className="search-result-item glass" onClick={() => navigate(`/communities/${c.id}`)}>
                  <div className="res-avatar rect" style={{ backgroundImage: `url(${c.avatar})` }} />
                  <div className="res-info">
                    <span className="res-name">{c.name}</span>
                    <span className="res-sub">{c.members.length} members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts Section */}
        {results.posts.length > 0 && (
          <div className="search-section">
            <h4>Posts</h4>
            <div className="search-list">
              {results.posts.map(p => (
                <div key={p.id} className="search-result-item glass" onClick={() => navigate('/')}>
                  <div className="res-info">
                    <span className="res-name">{p.author}</span>
                    <span className="res-sub">{p.content.substring(0, 60)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.users.length === 0 && results.posts.length === 0 && results.communities.length === 0 && query.length >= 2 && (
          <p style={{color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '3rem'}}>No matches found for "{query}"</p>
        )}
      </div>
    </div>
  );
}
