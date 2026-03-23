import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { PhoneCall, Video, MicOff, VideoOff, PhoneMissed, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePeer, getPeerId } from '../context/PeerContext';
import { dataService } from '../services/mockDataService';
import './components.css';

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
      ctx.fillStyle = '#2b302c';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#babbac';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Camera Blocked / Not Found', 320, 240);
      const stream = canvas.captureStream(15);
      
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      } catch(e) {}
      
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
    };

    peer.on('call', handleIncoming);
    return () => {
      peer.off('call', handleIncoming);
    };
  }, [peer]);

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
          alert("Real-time signaling is still initializing. Please wait 2-3 seconds.");
          setIsCalling(false);
          return;
       }

       try {
         const stream = await getSafeStream(reqVideo);
         setLocalStream(stream);
         
         const identity = target.id || target.email;
         const targetId = dataService.getPeerIdFromRegistry(identity) || getPeerId(identity);
         console.log(`Initiating P2P Call to Registry ID: ${targetId}`);
         const call = peer.call(targetId, stream, { metadata: { isVideo: reqVideo } });
         
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
  }, [peer, peerStatus]);

  const answerCall = async () => {
    if (!incomingCall) return;
    try {
       const stream = await getSafeStream(isVideo); 
       setLocalStream(stream);
       incomingCall.answer(stream);
       
       incomingCall.on('stream', (userVideoStream) => {
          setRemoteStream(userVideoStream);
       });

       incomingCall.on('close', () => {
          endCall(false);
       });

       setActiveCall(incomingCall);
       setIncomingCall(null);
    } catch (err) {
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

  const endCall = (triggerClose = true) => {
     if (triggerClose && activeCall) activeCall.close();
     if (localStream) localStream.getTracks().forEach(track => track.stop());
     setActiveCall(null);
     setIsCalling(false);
     setLocalStream(null);
     setRemoteStream(null);
     setIncomingCall(null);
     setCallTime(0);
     setIsMicMuted(false);
     setIsCameraOff(false);
  };

  if (!incomingCall && !activeCall && !isCalling) return null;

  return (
    <div className="modal-overlay" style={{zIndex: 9999, background: 'rgba(10, 15, 8, 0.95)', backdropFilter: 'blur(30px)'}}>
       {incomingCall && (
         <div className="glass" style={{padding: '3rem', textAlign: 'center', borderRadius: '40px', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}>
            <div style={{position: 'relative', width: '120px', height: '120px', margin: '0 auto'}}>
               <div style={{position: 'absolute', inset: 0, background: 'var(--accent-color)', borderRadius: '50%', opacity: 0.3, animation: 'heart-pop 2s infinite'}} />
               <div style={{position: 'absolute', inset: '10px', background: 'var(--accent-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 10px 20px rgba(118, 123, 111, 0.4)'}}>
                  <Phone size={48} color="white" />
               </div>
            </div>
            <div>
               <h2 style={{color: 'white', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800}}>Incoming Call</h2>
               <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', letterSpacing: '0.5px'}}>@{incomingCall.peer.split('-')[1]}</p>
            </div>
            <div style={{display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem'}}>
               <button onClick={rejectCall} className="action-btn" style={{background: '#ef4444', width: '70px', height: '70px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: 'scale(1)'}} onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                  <PhoneMissed size={32} />
               </button>
               <button onClick={answerCall} className="action-btn" style={{background: '#10b981', width: '70px', height: '70px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: 'scale(1)'}} onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                  <Phone size={32} />
               </button>
            </div>
         </div>
       )}

       {isCalling && !remoteStream && (
         <div className="glass" style={{padding: '4rem', textAlign: 'center', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)'}}>
            <div className="avatar" style={{width: '100px', height: '100px', margin: '0 auto 2rem auto', backgroundImage: callTarget?.avatar ? `url(${callTarget.avatar})` : 'none', border: '3px solid var(--accent-color)', animation: 'pulse-ring 2s infinite'}} />
            <h2 style={{fontSize: '1.75rem', color: 'white', fontWeight: 700}}>Calling {callTarget?.name}...</h2>
            <p style={{color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic'}}>Waiting for response from satellite registry...</p>
            <div style={{display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '3rem'}}>
              <button onClick={toggleMic} className="action-btn" style={{background: isMicMuted ? '#ef4444' : 'rgba(255,255,255,0.1)'}}>
                 {isMicMuted ? <MicOff size={22} /> : <Phone size={22} />}
              </button>
              <button onClick={() => endCall(true)} className="btn-primary" style={{background: '#ef4444', padding: '1rem 2rem', borderRadius: '999px', fontWeight: 700}}>Hang Up</button>
            </div>
         </div>
       )}

       {activeCall && remoteStream && (
         <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden'}}>
            {/* Main Remote View */}
            <div style={{width: '100%', height: '100%', background: '#050a05', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               {isVideo && !isCameraOff ? (
                  <video ref={remoteVideoRef} autoPlay playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />
               ) : (
                  <div style={{textAlign: 'center'}}>
                     <div className="avatar" style={{width: '150px', height: '150px', margin: '0 auto 2rem auto', backgroundImage: callTarget?.avatar ? `url(${callTarget.avatar})` : 'none', filter: 'grayscale(0.5)'}} />
                     <h3 style={{color: 'white', fontSize: '1.5rem'}}>{callTarget?.name}</h3>
                     <p style={{color: 'var(--text-secondary)'}}>Audio Only Session</p>
                  </div>
               )}
            </div>

            {/* PIP Local View */}
            <div style={{position: 'absolute', top: '2rem', right: '2rem', width: '220px', height: '140px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.1)'}}>
               {isVideo && !isCameraOff ? (
                  <video ref={localVideoRef} autoPlay muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />
               ) : (
                  <div style={{width: '100%', height: '100%', background: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'}}>
                    <VideoOff size={32} />
                  </div>
               )}
            </div>

            {/* Floating Controls Overlay */}
            <div style={{position: 'absolute', bottom: '4rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'}}>
               <div style={{color: 'white', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1.25rem', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 700, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'}}>
                  {formatTime(callTime)}
               </div>
               
               <div style={{display: 'flex', gap: '1.5rem', background: 'rgba(10, 15, 8, 0.7)', padding: '1rem 2rem', borderRadius: '40px', backdropFilter: 'blur(25px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'}}>
                  <button onClick={toggleMic} className="action-btn" style={{background: isMicMuted ? '#ef4444' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '60px', height: '60px'}}>
                     {isMicMuted ? <MicOff size={24} /> : <Phone size={24} />}
                  </button>
                  {isVideo && (
                    <button onClick={toggleCamera} className="action-btn" style={{background: isCameraOff ? '#ef4444' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '60px', height: '60px'}}>
                       {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                  )}
                  <button onClick={() => endCall(true)} className="action-btn" style={{background: '#ef4444', color: 'white', borderRadius: '50%', width: '60px', height: '60px', transform: 'scale(1.1)'}}>
                     <PhoneMissed size={24} />
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
