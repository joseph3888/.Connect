import { createContext, useState, useContext, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { createUserProfile, getUserProfile, updateUserProfile } from '../services/firebaseDataService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch the full profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error('Login error:', err.message);
      return false;
    }
  };

  const register = async (name, handle, email, password, avatarBase64) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;

      // Save display name to Firebase Auth
      await updateProfile(credential.user, { displayName: name });

      // Save full profile to Firestore so all devices/users can discover it
      await createUserProfile(uid, {
        name,
        handle: handle || `@${name.toLowerCase().replace(/\s+/g, '')}`,
        email,
        avatar: avatarBase64 || null,
        bio: 'Digital creator & enthusiast.',
        connections: [],
        blockedUsers: []
      });

      return true;
    } catch (err) {
      console.error('Register error:', err.message);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = async (updatedData) => {
    if (!user?.uid) return;
    await updateUserProfile(user.uid, updatedData);
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-color)', 
      color: 'var(--text-secondary)', fontFamily: 'var(--font-base)',
      flexDirection: 'column', gap: '1rem'
    }}>
      <div style={{
        width: '48px', height: '48px', border: '3px solid var(--border-color)',
        borderTopColor: 'var(--accent-color)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{fontWeight: 600, fontSize: '1rem'}}>Connecting to server...</span>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
