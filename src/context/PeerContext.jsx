import { createContext, useState, useContext, useEffect } from 'react';
import Peer from 'peerjs';
import { useAuth } from './AuthContext';
import { dataService } from '../services/mockDataService';

const PeerContext = createContext(null);

export const getPeerId = (idOrEmail) => {
  if (!idOrEmail) return null;
  return 'u-' + String(idOrEmail).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

export const PeerProvider = ({ children }) => {
  const { user } = useAuth();
  const [peer, setPeer] = useState(null);
  const [peerStatus, setPeerStatus] = useState('offline'); // offline, connecting, ready, error

  useEffect(() => {
    if (!user) {
      if (peer) {
        peer.destroy();
        setPeer(null);
        setPeerStatus('offline');
      }
      return;
    }

    // Ensure ID starts with a letter and has no special chars that might break DNS-like routing
    const baseId = getPeerId(user.id || user.email);
    let timeoutId;
    
    const initPeer = (id) => {
      setPeerStatus('connecting');
      console.log('Initiating WebRTC Signaling for: ' + id);
      const newPeer = new Peer(id, {
        debug: 3 // Enable detailed logging for debugging
      });

      // Connection Watchdog
      timeoutId = setTimeout(() => {
        if (newPeer.disconnected || !newPeer.open) {
           console.warn("Signaling timeout. Retrying with anonymous ID...");
           newPeer.destroy();
           setPeerStatus('error');
        }
      }, 10000);

      newPeer.on('open', (id) => {
        console.log('WebRTC Peer ID Connected: ' + id);
        clearTimeout(timeoutId);
        setPeerStatus('ready');
        setPeer(newPeer);
        
        // Register this ID globally for discovery
        const identity = user.id || user.email;
        dataService.updatePeerRegistry(identity, id);
      });

      newPeer.on('error', (err) => {
        console.error('PeerJS Global Error:', err);
        clearTimeout(timeoutId);
        if (err.type === 'unavailable-id') {
           const retryId = `${id}-${Math.floor(Math.random() * 1000)}`;
           console.warn(`ID Collision. Retrying as ${retryId}`);
           newPeer.destroy();
           initPeer(retryId);
        } else {
           setPeerStatus('error');
        }
      });

      newPeer.on('disconnected', () => {
        console.log('Peer disconnected. Attempting reconnect...');
        newPeer.reconnect();
      });
      
      return newPeer;
    };

    const p = initPeer(baseId);

    return () => {
      clearTimeout(timeoutId);
      p.destroy();
    };
  }, [user]);

  return (
    <PeerContext.Provider value={{ peer, peerStatus }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => useContext(PeerContext);
