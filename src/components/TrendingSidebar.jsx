import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, ChevronRight } from 'lucide-react';
import { getTrendingTopics, getCommunities } from '../services/firebaseDataService';

export function TrendingSidebar() {
  const navigate = useNavigate();
  const [trends, setTrends] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [t, g] = await Promise.all([getTrendingTopics(), getCommunities()]);
      setTrends(t);
      setGroups(g.slice(0, 3));
    };
    load();
  }, []);

  return (
    <aside className="trending-sidebar">
      <div className="trending-card glass">
        <div className="card-header">
          <TrendingUp size={20} className="header-icon" />
          <h3>What's Trending</h3>
        </div>
        <div className="trends-list">
          {trends.map(t => (
            <div key={t.id} className="trend-item clickable" onClick={() => navigate('/explore')}>
              <span className="trend-name">{t.name}</span>
              <span className="trend-count">{t.posts} posts</span>
            </div>
          ))}
          {trends.length === 0 && (
            <p className="empty-msg">No trending topics yet. Start posting with #hashtags!</p>
          )}
        </div>
      </div>

      <div className="trending-card glass">
        <div className="card-header">
          <Users size={20} className="header-icon" />
          <h3>Suggested Groups</h3>
        </div>
        <div className="groups-list">
          {groups.map(g => (
            <div key={g.id} className="group-item clickable" onClick={() => navigate(`/communities/${g.id}`)}>
              <div className="group-avatar-mini" style={{ backgroundImage: `url(${g.avatar})` }} />
              <div className="group-info-mini">
                <span className="group-name-mini">{g.name}</span>
                <span className="group-members-mini">{(g.members || []).length} members</span>
              </div>
              <ChevronRight size={16} className="arrow-icon" />
            </div>
          ))}
        </div>
        <button className="view-more-btn" onClick={() => navigate('/communities')}>
          See all communities
        </button>
      </div>

      <div className="footer-links">
        <span>About</span>
        <span>Privacy</span>
        <span>Terms</span>
        <span>© 2026 Connect.</span>
      </div>
    </aside>
  );
}
