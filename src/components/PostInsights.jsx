/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion';
import { TrendingUp, Users, Heart, MessageCircle, BarChart2 } from 'lucide-react';
import { Card, Badge } from './ui/Primitives';

export function PostInsights({ post }) {
  // Mock data for UI demonstration
  const stats = [
    { label: 'Reach', value: '1.2k', change: '+12%', icon: <BarChart2 size={16} /> },
    { label: 'Engagement', value: '450', change: '+5%', icon: <Users size={16} /> },
    { label: 'Likes', value: post.likes?.length || 0, change: '+2%', icon: <Heart size={16} /> },
    { label: 'Comments', value: post.comments?.length || 0, change: '0%', icon: <MessageCircle size={16} /> },
  ];

  return (
    <div className="post-insights-overlay flex flex-col gap-space-lg">
      <div className="flex-between">
        <h3 className="text-lg font-weight-bold flex items-center gap-2">
          <TrendingUp className="text-primary" /> Post Performance
        </h3>
        <Badge variant="accent">Live Data</Badge>
      </div>

      <div className="grid grid-cols-2 gap-space-md">
        {stats.map((stat, idx) => (
          <Card key={idx} glass padded={false} className="p-space-md flex flex-col gap-1 border-white/5">
            <div className="flex-between text-muted mb-1">
              <span className="text-[10px] uppercase font-weight-bold tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-weight-bold">{stat.value}</span>
              <span className={`text-[10px] font-weight-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-muted'}`}>
                {stat.change}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="engagement-chart mt-space-sm h-32 glass rounded-radius-md overflow-hidden relative">
        <svg className="w-full h-full" viewBox="0 0 100 40">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            d="M0 35 Q 20 10, 40 25 T 80 5 T 100 15"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <path d="M0 35 Q 20 10, 40 25 T 80 5 T 100 15 V 40 H 0 Z" fill="url(#gradient)" opacity="0.1" />
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-2 left-2 text-[8px] text-muted uppercase font-weight-bold">Engagement Over Time (24h)</div>
      </div>
    </div>
  );
}
