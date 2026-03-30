import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, ChevronRight } from 'lucide-react';
import { getTrendingTopics, getCommunities } from '../services/firebaseDataService';
import { Card, Button, Badge } from './ui/Primitives';

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
    <aside className="sticky top-24 hidden lg:flex flex-col gap-6 h-max">
      {/* Trending Card */}
      <Card glass className="border-white/5 shadow-xl">
        <div className="flex items-center gap-3 mb-6 p-1 border-b border-white/5 pb-4">
          <div className="p-2 rounded-radius-md bg-accent/20 text-accent">
            <TrendingUp size={20} />
          </div>
          <h3 className="font-weight-bold text-main text-lg tracking-tight">What's Trending</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          {trends.map((t, idx) => (
            <div 
              key={t.id || idx} 
              className="group flex-between cursor-pointer hover:bg-white/5 p-2 rounded-radius-md transition-colors"
              onClick={() => navigate('/explore')}
            >
              <div className="flex flex-col">
                <span className="font-weight-bold text-main group-hover:text-primary transition-colors">{t.name}</span>
                <span className="text-xs text-muted font-weight-semi uppercase tracking-widest">{t.posts} posts</span>
              </div>
            </div>
          ))}
          {trends.length === 0 && (
            <p className="text-sm text-muted text-center py-4 bg-surface-active rounded-radius-md border border-white/5">
              No trending topics yet.<br/>Start posting with #hashtags!
            </p>
          )}
        </div>
      </Card>

      {/* Suggested Groups Card */}
      <Card glass className="border-white/5 shadow-xl">
        <div className="flex items-center gap-3 mb-6 p-1 border-b border-white/5 pb-4">
          <div className="p-2 rounded-radius-md bg-primary/20 text-primary">
            <Users size={20} />
          </div>
          <h3 className="font-weight-bold text-main text-lg tracking-tight">Suggested Groups</h3>
        </div>

        <div className="flex flex-col gap-5">
          {groups.map((g, idx) => (
            <div 
              key={g.id || idx} 
              className="group flex items-center justify-between cursor-pointer hover:bg-surface-active/50 p-2 -mx-2 rounded-radius-md transition-all border border-transparent hover:border-white/5"
              onClick={() => navigate(`/communities/${g.id}`)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-radius-md bg-surface-active bg-cover bg-center border border-white/10 group-hover:border-primary/50 transition-colors shadow-md"
                  style={{ backgroundImage: `url(${g.avatar})` }}
                />
                <div className="flex flex-col">
                  <span className="font-weight-bold text-sm text-main group-hover:text-main line-clamp-1 truncate w-32">{g.name}</span>
                  <span className="text-[10px] text-primary uppercase font-weight-bold tracking-widest">
                    {(g.members || []).length} members
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
        
        <Button 
          variant="glass" 
          className="w-full mt-6 text-xs !py-3 uppercase tracking-widest"
          onClick={() => navigate('/communities')}
        >
          See all communities
        </Button>
      </Card>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted/60 font-weight-semi px-2">
        <span className="hover:text-primary cursor-pointer transition-colors">About</span>
        <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
        <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
        <span className="w-full mt-2">© 2026 Connect.</span>
      </div>
    </aside>
  );
}
