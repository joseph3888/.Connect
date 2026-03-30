import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PeerProvider } from './context/PeerContext';
import { Sidebar } from './components/Sidebar';
import { Bell, Search, PlusCircle } from 'lucide-react';

// Performance Optimization: Lazy Load Pages
const Feed = lazy(() => import('./pages/Feed').then(module => ({ default: module.Feed })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Explore = lazy(() => import('./pages/Explore').then(module => ({ default: module.Explore })));
const Reels = lazy(() => import('./pages/Reels').then(module => ({ default: module.Reels })));
const PostDetail = lazy(() => import('./pages/PostDetail').then(module => ({ default: module.PostDetail })));
const Messages = lazy(() => import('./pages/Messages').then(module => ({ default: module.Messages })));
const Communities = lazy(() => import('./pages/Communities').then(module => ({ default: module.Communities })));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail').then(module => ({ default: module.CommunityDetail })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
import { ProtectedRoute } from './components/ProtectedRoute';
import { CallOverlay } from './components/CallOverlay';
import { PageTransition } from './components/Motion';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './App.css';

/**
 * MobileHeader - New component for small screens
 */
function MobileHeader() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <header className="mobile-header show-mobile">
      <NavLink to="/" className="mobile-logo text-main font-bold">Connect.</NavLink>
      <div className="flex items-center gap-4">
        <button className="text-secondary hover:text-primary transition-all"><Search size={22} /></button>
        <button className="text-secondary hover:text-primary transition-all"><Bell size={22} /></button>
        <div 
          className="w-9 h-9 rounded-full border border-primary/40 overflow-hidden bg-surface-active shadow-glow" 
          style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
      </div>
    </header>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={
        <div className="w-full h-screen flex-center flex-col bg-bg-dark gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-weight-bold text-muted uppercase tracking-widest animate-pulse font-sans">Syncing Cluster...</span>
        </div>
      }>
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Application Routes */}
          <Route path="/" element={<ProtectedRoute><PageTransition><Feed /></PageTransition></ProtectedRoute>} />
          <Route path="/profile/:id?" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><PageTransition><Explore /></PageTransition></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><PageTransition><Reels /></PageTransition></ProtectedRoute>} />
          <Route path="/communities" element={<ProtectedRoute><PageTransition><Communities /></PageTransition></ProtectedRoute>} />
          <Route path="/communities/:id" element={<ProtectedRoute><PageTransition><CommunityDetail /></PageTransition></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><PageTransition><Messages /></PageTransition></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PageTransition><PostDetail /></PageTransition></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <PeerProvider>
        <Router>
          <div className="aurora-bg">
            <div className="aurora-blob"></div>
          </div>
          
          <MobileHeader />
          <div className="layout-container">
            <Sidebar />
            <main className="content">
              <AnimatedRoutes />
            </main>
          </div>
          <CallOverlay />
        </Router>
      </PeerProvider>
    </AuthProvider>
  );
}

export default App;
