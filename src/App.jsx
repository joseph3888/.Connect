import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PeerProvider } from './context/PeerContext';
import { Sidebar } from './components/Sidebar';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { Explore } from './pages/Explore';
import { Reels } from './pages/Reels';
import { PostDetail } from './pages/PostDetail';
import { Messages } from './pages/Messages';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CallOverlay } from './components/CallOverlay';
import './App.css';

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
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Application Routes */}
                <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/profile/:id?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
          <CallOverlay />
        </Router>
      </PeerProvider>
    </AuthProvider>
  );
}

export default App;
