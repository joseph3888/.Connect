import { createContext, useState, useContext, useEffect } from 'react';
import localforage from 'localforage';
import { dataService } from '../services/mockDataService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localforage.getItem('currentUser').then(storedUser => {
      if (storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    });
  }, []);

  const login = (emailOrHandle, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = dataService.getAllUsers();
        const foundUser = users.find(u => (u.email === emailOrHandle || u.id === emailOrHandle) && u.password === password);
        
        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localforage.setItem('currentUser', userWithoutPassword);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  };

  const register = (name, handle, email, password, avatarBase64) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = dataService.getAllUsers();
        if (!handle || handle.length < 3) {
          resolve(false);
          return;
        }
        if (users.find(u => u.email === email || u.id === handle)) {
           resolve(false);
           return;
        }
        
        const newUser = { 
          id: handle, 
          email: email, 
          name, 
          password, 
          avatar: avatarBase64,
          bio: "Digital creator & enthusiast."
        };
        
        users.push(newUser);
        localforage.setItem('users', users);
        
        // Notify other tabs that a new user exists
        const syncChannel = new BroadcastChannel('data_sync');
        syncChannel.postMessage('REFRESH');
        syncChannel.close();

        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localforage.setItem('currentUser', userWithoutPassword);
        resolve(true);
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localforage.removeItem('currentUser');
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const next = { ...prev, ...updatedData };
      localforage.setItem('currentUser', next);
      
      const users = dataService.getAllUsers();
      const index = users.findIndex(u => u.id === next.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updatedData };
        localforage.setItem('users', users);
      }
      return next;
    });
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
