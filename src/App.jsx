import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PeerProvider } from './context/PeerContext';
import { Sidebar } from './components/Sidebar';

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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={
        <div className="w-full h-screen flex-center flex-col bg-bg-dark gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-weight-bold text-muted uppercase tracking-widest animate-pulse">Syncing Cluster...</span>
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
