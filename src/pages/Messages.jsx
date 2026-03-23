import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePeer } from '../context/PeerContext';
import { dataService } from '../services/mockDataService';
import { Phone, Video, Send, MessageSquare, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

export function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { peer, peerStatus } = usePeer();
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const handleSync = () => {
      if (!user) return;
      const currentUserIdentity = user.id || user.email;
      const allUsers = dataService.getAllUsers().filter(u => {
        if (!u) return false;
        const targetIdentifier = u.id || u.email;
        const isSelf = u.id === currentUserIdentity || u.email === currentUserIdentity;
        const isConnected = dataService.isConnected(currentUserIdentity, targetIdentifier);
        return !isSelf && isConnected;
      });
      setContacts(allUsers);
      
      if (activeChat) {
        loadMessages(activeChat.id || activeChat.email);
      }
    };

    window.addEventListener('db_updated', handleSync);
    return () => window.removeEventListener('db_updated', handleSync);
  }, [user, activeChat]);

  useEffect(() => {
    if (user) {
       const currentUserIdentity = user.id || user.email;
       const allUsers = dataService.getAllUsers().filter(u => {
         if (!u) return false;
         const targetIdentifier = u.id || u.email;
         const isSelf = u.id === currentUserIdentity || u.email === currentUserIdentity;
         const isConnected = dataService.isConnected(currentUserIdentity, targetIdentifier);
         return !isSelf && isConnected;
       });
       setContacts(allUsers);
    }
  }, [user]);

  const loadMessages = (contactId) => {
    const msgs = dataService.getMessages(user.id || user.email);
    const conversation = msgs.filter(m => 
      (m.senderId === (user.id || user.email) && m.receiverId === contactId) ||
      (m.receiverId === (user.id || user.email) && m.senderId === contactId)
    );
    setMessages(conversation);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSelectChat = (contact) => {
    setActiveChat(contact);
    loadMessages(contact.id || contact.email);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    dataService.addMessage(user.id || user.email, activeChat.id || activeChat.email, inputText);
    setInputText('');
    loadMessages(activeChat.id || activeChat.email);
  };

  const handleDeleteMessage = (id) => {
    if (confirm('Unsend this message? It will be removed for everyone.')) {
      dataService.deleteMessage(id);
      loadMessages(activeChat.id || activeChat.email);
    }
  };

  const openCall = (isVideo) => {
     window.dispatchEvent(new CustomEvent('initiate_call', { detail: { target: activeChat, isVideo }}));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          dataService.addMessage(user.id || user.email, activeChat.id || activeChat.email, '', reader.result);
          loadMessages(activeChat.id || activeChat.email);
        };
        stream.getTracks().forEach(t => t.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Mic access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const VoiceMessage = ({ url, isMe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(new Audio(url));

    useEffect(() => {
      const audio = audioRef.current;
      const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
      audio.onended = () => { setIsPlaying(false); setProgress(0); };
      audio.ontimeupdate = updateProgress;
      return () => { audio.pause(); audio.onended = null; audio.ontimeupdate = null; };
    }, []);

    const togglePlay = () => {
      if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
      setIsPlaying(!isPlaying);
    };

    return (
      <div onClick={togglePlay} style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.6rem 1rem',
        background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)',
        borderRadius: '99px', cursor: 'pointer', minWidth: '200px',
        border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{background: isMe ? 'white' : 'var(--accent-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMe ? 'var(--accent-color)' : 'white', zIndex: 2}}>
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{marginLeft: '2px'}} />}
        </div>
        <div style={{fontSize: '0.85rem', fontWeight: 700, zIndex: 2, color: isMe ? 'white' : 'var(--text-primary)'}}>Voice Note</div>
        <div style={{flex: 1, height: '4px', background: isMe ? 'rgba(255,255,255,0.3)' : 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', zIndex: 2}}>
           <div style={{width: `${progress}%`, height: '100%', background: isMe ? 'white' : 'var(--accent-color)', transition: 'width 0.1s linear'}} />
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div style={{display: 'flex', height: '100%', gap: '1.5rem'}} className="messages-layout-wrapper">
       {/* Left Contacts Sidebar */}
       <div className="glass" style={{width: '350px', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto', borderRadius: '28px'}}>
          <h2 style={{padding: '0.5rem 0.5rem 1rem 0.5rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>Recent Chat</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
             {contacts.map(c => (
                <div 
                  key={c.id || c.email} 
                  onClick={() => handleSelectChat(c)}
                  style={{display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '16px', cursor: 'pointer', background: activeChat && (activeChat.id === c.id || activeChat.email === c.email) ? 'var(--surface-hover)' : 'transparent', transition: 'all 0.2s ease'}}
                >
                   <div className="avatar small" style={{backgroundImage: c.avatar ? `url(${c.avatar})` : 'none', flexShrink: 0}} />
                   <div style={{overflow: 'hidden'}}>
                     <div style={{fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{c.name}</div>
                     <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Tap to message</div>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Active Chat Viewer */}
       <div className="glass" style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '28px'}}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <div className="avatar" style={{backgroundImage: activeChat.avatar ? `url(${activeChat.avatar})` : 'none', width: '45px', height: '45px'}} />
                  <div>
                    <h3 style={{margin: 0, color: 'var(--text-primary)'}}>{activeChat.name}</h3>
                    <div style={{fontSize: '0.75rem', color: peerStatus === 'ready' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600}}>
                      <div style={{width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor'}} />
                      {peerStatus === 'ready' ? 'Signaling Ready' : 'Connecting...'}
                    </div>
                  </div>
               </div>
               <div style={{display: 'flex', gap: '1rem'}}>
                  <button className={`action-btn ${peerStatus !== 'ready' ? 'disabled' : ''}`} onClick={() => openCall(false)} style={{background: 'var(--bg-color)', width: '45px', height: '45px', justifyContent: 'center', opacity: peerStatus !== 'ready' ? 0.5 : 1}} disabled={peerStatus !== 'ready'} title={peerStatus !== 'ready' ? 'Initializing Signaling...' : 'Audio Call'}>
                     <Phone fill="var(--text-secondary)" size={20} />
                  </button>
                  <button className={`action-btn ${peerStatus !== 'ready' ? 'disabled' : ''}`} onClick={() => openCall(true)} style={{background: 'var(--bg-color)', width: '45px', height: '45px', justifyContent: 'center', opacity: peerStatus !== 'ready' ? 0.5 : 1}} disabled={peerStatus !== 'ready'} title={peerStatus !== 'ready' ? 'Initializing Signaling...' : 'Video Call'}>
                     <Video fill="var(--text-secondary)" size={22} />
                  </button>
               </div>
              </div>

              {/* Chat Feed */}
              <div style={{flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                 {messages.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem'}}>End-to-End Encrypted Sandbox.<br/>Send a message to start syncing!</div>}
                 
                 {messages.map(m => {
                    const isMe = m.senderId === (user.id || user.email);
                    return (
                      <div key={m.id} style={{alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start'}}>
                        {/* Bubble + unsend button row */}
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isMe ? 'row-reverse' : 'row'}}>
                          <div style={{
                            padding: m.audioUrl ? '0.5rem' : '1rem 1.25rem',
                            background: isMe ? 'linear-gradient(135deg, var(--accent-hover), var(--accent-color))' : 'var(--surface-hover)',
                            color: isMe ? 'white' : 'var(--text-primary)',
                            borderBottomRightRadius: isMe ? '8px' : '24px',
                            borderBottomLeftRadius: isMe ? '24px' : '8px',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                            boxShadow: 'var(--shadow-sm)', lineHeight: 1.4, fontWeight: 600
                          }}>
                            {m.audioUrl ? <VoiceMessage url={m.audioUrl} isMe={isMe} /> : m.text}
                          </div>
                          {isMe && (
                            <button
                              onClick={() => handleDeleteMessage(m.id)}
                              title="Unsend message"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-tertiary, #aaa)', padding: '5px',
                                display: 'flex', alignItems: 'center', borderRadius: '8px',
                                transition: 'color 0.2s, background 0.2s', flexShrink: 0
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary, #aaa)'; e.currentTarget.style.background = 'none'; }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 500}}>
                          {new Date(m.time).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
                        </div>
                      </div>
                    );
                 })}
                 <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
               <form onSubmit={handleSend} style={{padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', background: 'var(--surface-hover)'}}>
                  <button 
                    type="button" 
                    onClick={isRecording ? stopRecording : startRecording}
                    className="action-btn" 
                    style={{
                      background: isRecording ? '#ef4444' : 'var(--bg-color)', 
                      width: '56px', height: '56px', justifyContent: 'center', borderRadius: '50%',
                      color: isRecording ? 'white' : 'var(--text-secondary)',
                      boxShadow: isRecording ? '0 0 15px rgba(239,68,68,0.4)' : 'none'
                    }}
                  >
                     {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={22} />}
                  </button>
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="post-input" 
                    style={{background: 'var(--bg-color)', padding: '1.15rem 1.5rem', borderRadius: '999px', fontSize: '1rem', width: '100%'}}
                    placeholder={isRecording ? 'Recording audio...' : `Message ${activeChat.name}...`} 
                    disabled={isRecording}
                  />
                  <button type="submit" className="btn-primary" style={{padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', flexShrink: 0, boxShadow: '0 8px 15px -4px rgba(118, 123, 111, 0.5)'}} disabled={!inputText.trim() || isRecording}>
                    <Send size={20} style={{marginLeft: '2px'}} />
                  </button>
               </form>
            </>
          ) : (
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1.5rem', padding: '2rem', textAlign: 'center'}}>
               <div style={{background: 'var(--surface-hover)', padding: '2rem', borderRadius: '50%', color: 'var(--accent-secondary)'}}>
                  <MessageSquare size={64} />
               </div>
               <div>
                 <h2 style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>Live Sync Chat</h2>
                 <p style={{fontSize: '1.1rem', maxWidth: '350px'}}>Select a contact to start an instantly synchronized chat mapped directly across IndexedDB Broadcast Channels.</p>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}
