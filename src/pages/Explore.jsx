import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { dataService } from '../services/mockDataService';
import { useAuth } from '../context/AuthContext';
import '../components/components.css'; 

export function Explore() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const { user } = useAuth(); // Current logged-in user

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (user) {
      const handleSync = () => {
        const currentUserIdentity = user.id || user.email;
        const results = query 
          ? dataService.searchUsers(query).filter(u => u && u.id !== currentUserIdentity && u.email !== currentUserIdentity)
          : dataService.getAllUsers().filter(u => u && u.id !== currentUserIdentity && u.email !== currentUserIdentity);
        setUsers([...results]);
      };
      
      handleSync(); // Initial load
      window.addEventListener('db_updated', handleSync);
      return () => window.removeEventListener('db_updated', handleSync);
    }
  }, [user, query]);

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
          onChange={handleSearch}
        />
      </div>
      
      <h3 style={{marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600}}>Suggested Connections</h3>
      <div className="users-list" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        {users.map((u, i) => {
          if (!u) return null;
          const targetIdentifier = u.id || u.email;
          const currentUserIdentifier = user.id || user.email;
          const isConnected = dataService.isConnected(currentUserIdentifier, targetIdentifier);
          
          const strId = String(targetIdentifier);
          const handle = u.id ? u.id : (strId.includes('@') ? strId : `@${strId}`);
          const name = u.name ? String(u.name) : 'Unknown User';
          
          return (
            <div key={targetIdentifier} className="user-card glass" style={{display: 'flex', alignItems: 'center', padding: '1.5rem', gap: '1.5rem', background: 'var(--surface-color)'}}>
              <div className="avatar" style={{width: '60px', height: '60px', borderRadius: '50%', backgroundImage: u.avatar ? `url(${u.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}></div>
              <div className="user-info" style={{flex: 1}}>
                <Link to={`/profile/${targetIdentifier}`} className="author-name" style={{fontSize: '1.25rem', textDecoration: 'none', transition: 'color 0.2s'}}>{name}</Link>
                <div style={{color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.2rem'}}>{handle}</div>
                <div style={{marginTop: '0.5rem', fontSize: '1.05rem', color: 'var(--text-primary)'}}>{u.bio || "Digital creator & enthusiast."}</div>
              </div>
              <button 
                className="btn-primary"
                onClick={() => handleConnect(targetIdentifier)}
                style={{
                  background: isConnected ? 'rgba(118,123,111,0.1)' : '',
                  border: isConnected ? '2px solid var(--accent-color)' : 'none',
                  color: isConnected ? 'var(--accent-color)' : 'white',
                  boxShadow: isConnected ? 'none' : '',
                  fontWeight: 'bold'
                }}
              >
                {isConnected ? 'Connected' : '+ Connect'}
              </button>
            </div>
          );
        })}
        {users.length === 0 && <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem', fontSize: '1.1rem'}}>No users found matching "{query}".</p>}
      </div>
    </div>
  );
}
