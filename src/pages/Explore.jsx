import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchAll, getAllUsers, getCommunities } from '../services/firebaseDataService';
import '../components/components.css';

export function Explore() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [], communities: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const runSearch = useCallback(async (q) => {
    setLoading(true);
    if (q.length >= 2) {
      const res = await searchAll(q);
      setResults(res);
    } else {
      const [users, communities] = await Promise.all([getAllUsers(), getCommunities()]);
      // Filter out yourself
      const filtered = users.filter(u => u.id !== user?.uid && u.email !== user?.email);
      setResults({ users: filtered.slice(0, 8), posts: [], communities: communities.slice(0, 4) });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <div className="explore-page">
      <div className="search-bar glass" style={{ marginBottom: '2rem' }}>
        <Search size={20} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search people, posts, communities..."
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="search-results-overlay">
        {loading && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
            Searching...
          </p>
        )}

        {/* People Section */}
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
                    <span className="res-sub">{u.handle || u.email}</span>
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
                    <span className="res-sub">{(c.members || []).length} members</span>
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
                <div key={p.id} className="search-result-item glass" onClick={() => navigate(`/post/${p.id}`)}>
                  <div className="res-info">
                    <span className="res-name">{p.author}</span>
                    <span className="res-sub">{(p.content || '').substring(0, 60)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && results.users.length === 0 && results.posts.length === 0 && results.communities.length === 0 && query.length >= 2 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>
            No matches found for "{query}"
          </p>
        )}
      </div>
    </div>
  );
}
