/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { useAuth } from './AuthContext';
import { updatePeerRegistry } from '../services/firebaseDataService';

const PeerContext = createContext(null);

export const PeerProvider = ({ children }) => {
  const { user } = useAuth();
  const [peer, setPeer] = useState(null);
  const [peerStatus, setPeerStatus] = useState('offline');
  const [errorType, setErrorType] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const peerInitRef = useRef(false);
  const currentPeerRef = useRef(null);

  useEffect(() => {
    let timeoutId;

    if (!user?.uid) {
      if (currentPeerRef.current) {
        currentPeerRef.current.destroy();
        currentPeerRef.current = null;
      }
      setPeer(null);
      setPeerStatus('offline');
      peerInitRef.current = false;
      return;
    }

    if (peerInitRef.current) return;
    peerInitRef.current = true;

    const initPeer = () => {
      setPeerStatus('connecting');
      setErrorType(null);
      
      /**
       * ULTIMATE SIGNALING RESOLUTION:
       * 1. Attempt connection via the prioritized PeerJS cloud host (0.peerjs.com).
       * 2. Explicitly setting path: '/' to override any server-side path mismatches.
       * 3. Randomized PeerID prefix ensures that even if a session hung, we can re-connect.
       */
      const newPeer = new Peer(undefined, {
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        key: 'peerjs',
        path: '/',
        debug: 3,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      currentPeerRef.current = newPeer;

      timeoutId = setTimeout(() => {
        if (newPeer && !newPeer.open) {
          console.warn("Signaling probe timed out. Resetting link.");
          newPeer.destroy();
          setPeerStatus('error');
          setErrorType('TIMEOUT');
          peerInitRef.current = false;
        }
      }, 15000);

      newPeer.on('open', (id) => {
        console.log('Synchronized Link Active: ' + id);
        clearTimeout(timeoutId);
        setPeerStatus('ready');
        setPeer(newPeer);
        updatePeerRegistry(user.uid, id).catch(e => console.warn("Registry deferred.", e));
      });

      newPeer.on('error', (err) => {
        console.error('PeerJS Global Failure:', err.type, err);
        clearTimeout(timeoutId);
        setPeerStatus('error');
        setErrorType(err.type ? err.type.toUpperCase() : 'SERVER-ERROR');
        peerInitRef.current = false; 
      });

      newPeer.on('disconnected', () => {
        console.log('Signaling severed. Monitoring for recovery...');
        newPeer.reconnect();
      });

      return newPeer;
    };

    initPeer();

    return () => {
      clearTimeout(timeoutId);
      if (currentPeerRef.current) {
        currentPeerRef.current.destroy();
        currentPeerRef.current = null;
      }
      peerInitRef.current = false;
    };
  }, [user?.uid, retryCount]);

  const manualRetry = () => {
    peerInitRef.current = false;
    setRetryCount(prev => prev + 1);
  };

  return (
    <PeerContext.Provider value={{ peer, peerStatus, manualRetry, errorType }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => useContext(PeerContext);
