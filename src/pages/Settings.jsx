/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { User, Shield, Bell, Eye, Palette, HelpCircle, ChevronRight, LogOut, Check } from 'lucide-react';
import { Button, Card, Input } from '../components/ui/Primitives';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/firebaseDataService';
// Global styles handled by designSystem.css and App.css

export function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'privacy', label: 'Privacy & Safety', icon: <Shield size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={18} /> },
  ];

  return (
    <div className="settings-container max-w-6xl mx-auto p-space-lg flex flex-col md:flex-row gap-space-xl min-h-[calc(100vh-6rem)]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 flex flex-col gap-2">
        <div className="px-space-md mb-space-md">
          <h1 className="text-2xl font-weight-bold text-main tracking-tight">Settings</h1>
          <p className="text-xs text-muted font-weight-semi mt-1">Manage your account and preferences</p>
        </div>
        
        <nav className="flex flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-space-md p-space-md rounded-radius-lg transition-all duration-300 group
                ${activeTab === tab.id 
                  ? 'bg-primary text-white shadow-glow translate-x-1' 
                  : 'hover:bg-surface-hover text-muted hover:text-main'}
              `}
            >
              <span className={`${activeTab === tab.id ? 'text-white' : 'text-primary'}`}>{tab.icon}</span>
              <span className="font-weight-bold text-sm">{tab.label}</span>
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          ))}
        </nav>
        
        <div className="mt-8 pt-space-xl border-t border-white/5 px-space-md">
          <button 
            onClick={logout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors font-weight-bold text-sm group"
          >
            <div className="p-2 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 transition-colors">
              <LogOut size={18} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            <Card className="glass h-full border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                {tabs.find(t => t.id === activeTab)?.icon}
              </div>
              <div className="p-space-xl relative z-10">
                {activeTab === 'account' && <AccountSettings user={user} />}
                {activeTab === 'privacy' && <PrivacySettings />}
                {activeTab === 'appearance' && <AppearanceSettings />}
                {activeTab === 'notifications' && (
                  <div className="flex-center flex-col gap-4 py-20 text-muted">
                    <Bell size={48} className="opacity-20" />
                    <p className="font-weight-semi">Notification preferences coming soon.</p>
                  </div>
                )}
                {activeTab === 'help' && (
                  <div className="flex-center flex-col gap-4 py-20 text-muted">
                    <HelpCircle size={48} className="opacity-20" />
                    <p className="font-weight-semi">Need help? Contact support@connect.io</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AccountSettings({ user }) {
  const [name, setName] = useState(user?.name || '');
  const [handle, setHandle] = useState(user?.handle || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { name, handle });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-xl">
      <div className="section-header">
        <h2 className="text-lg font-weight-semi mb-1 text-main">Account Information</h2>
        <p className="text-sm text-muted">Update your personal details and public profile.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-space-lg">
        <div className="space-y-2">
          <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">Display Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">Username</label>
          <Input value={handle} onChange={e => setHandle(e.target.value)} placeholder="e.g. jdoe" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">Email Address</label>
          <Input value={user?.email} disabled className="opacity-50" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-weight-bold uppercase text-muted tracking-widest px-1">Location</label>
          <Input placeholder="City, Country" />
        </div>
      </div>

      <div className="flex justify-end gap-space-md pt-space-md border-t border-white/5">
        <Button variant="glass">Discard Changes</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving} className="shadow-glow">
          {isSaving ? 'Saving...' : 'Save Updates'}
        </Button>
      </div>
    </div>
  );
}

function PrivacySettings() {
  const [isPrivate, setIsPrivate] = useState(false);
  return (
    <div className="flex flex-col gap-space-xl">
      <div className="section-header">
        <h2 className="text-lg font-weight-semi mb-1">Privacy & Safety</h2>
        <p className="text-sm text-muted">Control who can see your content and interact with you.</p>
      </div>

      <div className="flex flex-col gap-space-md">
        <div className="flex-between p-space-md hover:bg-surface-hover rounded-radius-md cursor-pointer transition-colors" onClick={() => setIsPrivate(!isPrivate)}>
          <div>
            <p className="font-weight-semi">Private Account</p>
            <p className="text-xs text-muted">Only approved followers can see your posts.</p>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-primary' : 'bg-surface-active'}`}>
            <motion.div 
              animate={{ x: isPrivate ? 24 : 4 }}
              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm" 
            />
          </div>
        </div>

        <div className="flex-between p-space-md hover:bg-surface-hover rounded-radius-md cursor-pointer transition-colors">
          <div>
            <p className="font-weight-semi">Blocked Users</p>
            <p className="text-xs text-muted">View and manage users you've blocked.</p>
          </div>
          <ChevronRight size={18} className="text-dim" />
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const themes = [
    { id: 'light', label: 'Light', color: '#ffffff' },
    { id: 'dark', label: 'Dark', color: '#000000' },
    { id: 'glass', label: 'Glassmorphism', color: 'rgba(255,255,255,0.1)' },
  ];

  return (
    <div className="flex flex-col gap-space-xl">
      <div className="section-header">
        <h2 className="text-lg font-weight-semi mb-1">Appearance</h2>
        <p className="text-sm text-muted">Customize the look and feel of your Connect experience.</p>
      </div>

      <div className="grid grid-cols-3 gap-space-md">
        {themes.map(t => (
          <div 
            key={t.id} 
            onClick={() => setSelectedTheme(t.id)}
            className={`
              p-space-md rounded-radius-lg border-2 transition-all cursor-pointer
              ${selectedTheme === t.id ? 'border-primary' : 'border-main hover:border-text-dim'}
            `}
          >
            <div className="w-full h-12 rounded-radius-sm mb-space-sm" style={{ background: t.color, border: '1px solid var(--border-main)' }} />
            <div className="flex-between">
              <span className="text-xs font-weight-semi">{t.label}</span>
              {selectedTheme === t.id && <Check size={14} className="text-primary" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
