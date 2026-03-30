/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MessageSquare, Grid, Compass, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchAll, getAllUsers, getCommunities } from '../services/firebaseDataService';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Badge } from '../components/ui/Primitives';

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
    <div className="p-8 h-screen overflow-y-auto no-scrollbar">
      <div className="explore-page max-w-5xl mx-auto pb-space-xl">
      {/* Header Section */}
      <header className="mb-space-xl">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="primary" className="!px-3 !py-1">Discovery</Badge>
          <h1 className="text-3xl font-weight-bold text-main">Explore the Network</h1>
        </div>
        <p className="text-muted max-w-xl">Find industry leaders, innovative communities, and trending insights from across the globe.</p>
      </header>

      {/* Modern Search Bar */}
      <Card glass className="mb-space-xl !p-space-md border-white/5 shadow-xl">
        <div className="flex items-center gap-space-md bg-surface-active/50 rounded-radius-md px-space-md border border-white/5 focus-within:border-primary/50 transition-all">
          <Search size={22} className="text-muted" />
          <input
            type="text"
            placeholder="Search people, professional hubs, or insights..."
            className="flex-1 bg-transparent border-none outline-none py-4 text-main font-weight-semi placeholder:text-muted/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button variant="glass" size="icon" onClick={() => setQuery('')} className="!w-8 !h-8">
              <X size={14} />
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-space-xl">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-center py-20 flex-col gap-4"
            >
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-weight-bold uppercase tracking-widest text-muted">Indexing Real-time Results...</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-space-xl"
            >
              {/* People Section */}
              {results.users.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-space-lg text-muted px-2">
                    <Users size={18} />
                    <h4 className="font-weight-bold uppercase tracking-wider text-xs">Recommended for you</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                    {results.users.map(u => (
                      <Card 
                        key={u.id} 
                        glass 
                        padded={false} 
                        className="group hover:scale-[1.02] transition-all cursor-pointer overflow-hidden border-white/5 hover:border-primary/20"
                        onClick={() => navigate(`/profile/${u.id}`)}
                      >
                        <div className="h-20 bg-gradient-to-br from-primary/10 to-accent/5" />
                        <div className="px-space-md pb-space-md -mt-10 flex flex-col items-center">
                          <div className="avatar w-20 h-20 rounded-full border-4 border-bg-main shadow-lg mb-3" style={{ backgroundImage: u.avatar ? `url(${u.avatar})` : 'none' }}>
                            {!u.avatar && (u.name?.[0] || 'U')}
                          </div>
                          <div className="text-center w-full">
                            <div className="font-weight-bold text-main truncate px-2">{u.name}</div>
                            <div className="text-xs text-muted truncate mb-4">@{u.handle || 'member'}</div>
                            <Button variant="primary" className="w-full !rounded-full !py-2 text-xs">View Profile</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Communities Section */}
              {results.communities.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-space-lg text-muted px-2">
                    <Compass size={18} />
                    <h4 className="font-weight-bold uppercase tracking-wider text-xs">Trending Hubs</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                    {results.communities.map(c => (
                      <Card 
                        key={c.id} 
                        glass 
                        className="flex gap-space-lg hover:bg-surface-active/30 transition-all cursor-pointer border-white/5"
                        onClick={() => navigate(`/communities/${c.id}`)}
                      >
                        <div className="w-24 h-24 rounded-radius-md overflow-hidden flex-shrink-0 border border-white/10">
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 py-1">
                          <div className="flex-between mb-2">
                            <h3 className="font-weight-bold text-lg text-main">{c.name}</h3>
                            <Badge variant="accent">{(c.members || []).length} Members</Badge>
                          </div>
                          <p className="text-sm text-muted line-clamp-2 mb-4">Dedicated space for professionals to share insights and collaborate on industry trends.</p>
                          <div className="flex gap-2">
                            <Button variant="glass" className="!py-1.5 text-[10px] uppercase font-weight-bold">Join Community</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* No Results Fallback */}
              {!loading && results.users.length === 0 && results.posts.length === 0 && results.communities.length === 0 && query.length >= 2 && (
                <div className="py-20 text-center glass rounded-radius-lg border-white/5">
                  <div className="w-16 h-16 glass rounded-full flex-center mx-auto mb-6">
                    <Zap size={32} className="text-muted" />
                  </div>
                  <h3 className="text-xl font-weight-bold mb-2">No matches found</h3>
                  <p className="text-muted max-w-xs mx-auto">We couldn't find any results for "{query}". Try searching for specific names or interests.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
