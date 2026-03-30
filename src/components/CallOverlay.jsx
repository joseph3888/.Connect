import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, Video, MicOff, VideoOff, PhoneMissed, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePeer } from '../context/PeerContext';
import { getPeerRegistry } from '../services/firebaseDataService';
import { Button } from './ui/Primitives';

export function CallOverlay() {
  const { user } = useAuth();
  const { peer, peerStatus } = usePeer();
  
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callTarget, setCallTarget] = useState(null);
  const [isVideo, setIsVideo] = useState(true);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const [callTime, setCallTime] = useState(0);

  const getSafeStream = async (requestVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: requestVideo, audio: true });
      if (!requestVideo) {
         stream.getVideoTracks().forEach(t => t.enabled = false);
         setIsCameraOff(true);
      }
      return stream;
    } catch (err) {
      console.warn("Hardware camera/mic unavailable. Falling back to Mock Native Stream.", err);
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#6366f1';
      ctx.font = '24px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Camera Blocked / Not Found', 320, 240);
      const stream = canvas.captureStream(15);
      
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      } catch (e) {
        console.warn('Failed to add mock audio track:', e);
      }
      
      return stream;
    }
  };

  useEffect(() => {
    if (activeCall && !timerRef.current) {
      timerRef.current = setInterval(() => setCallTime(prev => prev + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [activeCall]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const endCall = useCallback((triggerClose = true) => {
     if (triggerClose && activeCall) activeCall.close();
     if (triggerClose && incomingCall) incomingCall.close();
     if (localStream) localStream.getTracks().forEach(track => track.stop());
     setActiveCall(null);
     setIsCalling(false);
     setLocalStream(null);
     setRemoteStream(null);
     setIncomingCall(null);
     setCallTime(0);
     setIsMicMuted(false);
     setIsCameraOff(false);
  }, [activeCall, localStream, incomingCall]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  useEffect(() => {
    if (!peer) return;
    
    const handleIncoming = (call) => {
      setIsVideo(call.metadata?.isVideo ?? true);
      setIsCameraOff(!(call.metadata?.isVideo ?? true));
      setIncomingCall(call);

      // Handle caller hanging up while ringing (CRITICAL BUG FIX)
      call.on('close', () => {
        setIncomingCall(null);
        if (localStream) localStream.getTracks().forEach(t => t.stop());
      });
    };

    peer.on('call', handleIncoming);
    return () => {
      peer.off('call', handleIncoming);
    };
  }, [peer, localStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
       localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
       remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  useEffect(() => {
    const handleInitiateCall = async (e) => {
       const { target, isVideo: reqVideo } = e.detail;
       setCallTarget(target);
       setIsVideo(reqVideo);
       setIsCalling(true);
       setIsCameraOff(!reqVideo);
       
       if (peerStatus !== 'ready' || !peer) {
          console.warn("Signaling still initializing. Blocking call request.");
          setIsCalling(false);
          return;
       }

       try {
         const peerId = await getPeerRegistry(target.id || target.uid || target.email);
         if (!peerId) {
           alert("User is offline. Signaling ID not found.");
           setIsCalling(false);
           return;
         }

         const stream = await getSafeStream(reqVideo);
         setLocalStream(stream);
         
         const call = peer.call(peerId, stream, { metadata: { isVideo: reqVideo, callerName: user.name, callerId: user.uid, callerAvatar: user.avatar } });
         
         call.on('stream', (userVideoStream) => {
            setIsCalling(false);
            setActiveCall(call);
            setRemoteStream(userVideoStream);
         });

         call.on('close', () => {
            endCall(false);
         });

         setActiveCall(call);
       } catch (err) {
         console.error('Failed to bind P2P WebRTC Streams', err);
         alert('Failed to establish WebRTC media framework natively.');
         setIsCalling(false);
       }
    };

    window.addEventListener('initiate_call', handleInitiateCall);
    return () => window.removeEventListener('initiate_call', handleInitiateCall);
  }, [peer, peerStatus, user, endCall]);

  const answerCall = async () => {
    if (!incomingCall) return;
    try {
       const stream = await getSafeStream(isVideo); 
       setLocalStream(stream);
       incomingCall.answer(stream);
       
       incomingCall.on('stream', (userVideoStream) => {
          setRemoteStream(userVideoStream);
       });

       setActiveCall(incomingCall);
       setIncomingCall(null);
       setCallTarget({ name: incomingCall.metadata?.callerName || 'Unknown', avatar: incomingCall.metadata?.callerAvatar });
    } catch (err) {
       console.error('Answer call failed:', err);
       alert("Could not physically access camera devices to answer P2P stream.");
       setIncomingCall(null);
    }
  };

  const rejectCall = () => {
     if (incomingCall) {
        incomingCall.close();
        setIncomingCall(null);
     }
  };

  if (!incomingCall && !activeCall && !isCalling) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex-center bg-black/80 backdrop-blur-3xl"
      >
         {incomingCall && (
           <motion.div 
             initial={{ scale: 0.9, y: 20 }}
             animate={{ scale: 1, y: 0 }}
             className="glass-heavy p-12 text-center rounded-[40px] flex flex-col gap-8 max-w-[400px] border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),_inset_0_1px_rgba(255,255,255,0.05)] w-full mx-4"
           >
              <div className="relative w-32 h-32 mx-auto">
                 <div className="absolute inset-0 bg-primary rounded-full opacity-30 animate-ping" />
                 <div className="absolute inset-2 bg-primary rounded-full flex-center z-10 shadow-glow">
                    <Phone size={48} color="white" className="animate-pulse" />
                 </div>
              </div>
              <div className="space-y-2">
                 <h2 className="text-white text-3xl font-weight-black tracking-tight">{incomingCall.metadata?.callerName || 'Incoming Call'}</h2>
                 <p className="text-primary font-weight-bold tracking-widest uppercase text-sm">Ultra-Sync Active</p>
              </div>
              <div className="flex gap-6 justify-center mt-4">
                 <Button variant="danger" size="icon" onClick={rejectCall} className="w-16 h-16 rounded-full">
                    <PhoneMissed size={28} />
                 </Button>
                 <Button onClick={answerCall} className="bg-green-500 hover:bg-green-400 text-white w-16 h-16 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                    <Phone size={28} />
                 </Button>
              </div>
           </motion.div>
         )}

         {isCalling && !remoteStream && (
           <motion.div 
             initial={{ scale: 0.9 }}
             animate={{ scale: 1 }}
             className="glass-heavy p-12 text-center rounded-[40px] max-w-[400px] border-white/10 w-full mx-4"
           >
              <div 
                className="w-32 h-32 mx-auto mb-8 rounded-full border-4 border-primary shadow-glow relative"
                style={{ backgroundImage: callTarget?.avatar ? `url(${callTarget.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
              >
                 <div className="absolute -inset-4 border-2 border-primary/30 rounded-full animate-ping" />
              </div>
              <h2 className="text-2xl text-white font-weight-black tracking-tight mb-2">Connecting to {callTarget?.name}...</h2>
              <p className="text-secondary font-style-italic mb-10">Establishing Zero-Trust Enclave...</p>
              
              <div className="flex justify-center gap-6">
                <Button variant="glass" size="icon" onClick={toggleMic} className={`w-14 h-14 ${isMicMuted ? 'text-red-400 bg-red-500/10' : ''}`}>
                   {isMicMuted ? <MicOff size={24} /> : <Phone size={24} />}
                </Button>
                <Button variant="danger" onClick={() => endCall(true)} className="px-8 rounded-full font-weight-bold">
                   End Call
                </Button>
              </div>
           </motion.div>
         )}

         {activeCall && remoteStream && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="relative w-full h-full bg-black overflow-hidden"
           >
              {/* Main Remote View */}
              <div className="absolute inset-0 flex-center">
                 {isVideo && !isCameraOff ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                 ) : (
                    <div className="text-center">
                       <div className="w-40 h-40 mx-auto mb-6 rounded-full border border-white/10" style={{ backgroundImage: callTarget?.avatar ? `url(${callTarget.avatar})` : 'none', backgroundSize: 'cover', filter: 'grayscale(0.5)' }} />
                       <h3 className="text-white text-3xl font-weight-bold tracking-tight mb-2">{callTarget?.name || 'Remote Peer'}</h3>
                       <p className="text-accent tracking-widest uppercase text-sm font-weight-bold">Secure Voice Session</p>
                    </div>
                 )}
              </div>

              {/* PIP Local View */}
              <motion.div 
                drag
                dragConstraints={{ top: 20, left: 20, right: 300, bottom: 300 }}
                className="absolute top-8 right-8 w-48 h-72 rounded-[24px] overflow-hidden shadow-2xl border border-white/10 bg-surface-active cursor-move"
              >
                 {isVideo && !isCameraOff ? (
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                 ) : (
                    <div className="w-full h-full flex-center text-secondary bg-black/40 backdrop-blur-md">
                      <VideoOff size={40} />
                    </div>
                 )}
              </motion.div>

              {/* Floating Controls Overlay */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
                 <div className="text-white bg-black/60 px-6 py-2 rounded-full text-lg font-weight-black tracking-widest backdrop-blur-md border border-white/10">
                    {formatTime(callTime)}
                 </div>
                 
                 <div className="flex gap-6 glass-heavy p-6 rounded-[40px] border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                    <Button variant="glass" size="icon" onClick={toggleMic} className={`w-14 h-14 rounded-full ${isMicMuted ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'hover:bg-white/10'}`}>
                       {isMicMuted ? <MicOff size={24} /> : <Phone size={24} />}
                    </Button>
                    {isVideo && (
                      <Button variant="glass" size="icon" onClick={toggleCamera} className={`w-14 h-14 rounded-full ${isCameraOff ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'hover:bg-white/10'}`}>
                         {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                      </Button>
                    )}
                    <Button variant="danger" size="icon" onClick={() => endCall(true)} className="w-14 h-14 rounded-full">
                       <PhoneMissed size={24} />
                    </Button>
                 </div>
              </div>
           </motion.div>
         )}
      </motion.div>
    </AnimatePresence>
  );
}
