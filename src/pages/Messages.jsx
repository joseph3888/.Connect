import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePeer } from '../context/PeerContext';
import { getAllUsers, getMessages, sendMessage, deleteMessage, toggleConnection, isConnected } from '../services/firebaseDataService';
import { Phone, Video, Send, MessageSquare, Mic, Square, Play, Pause, Trash2 } from 'lucide-react';

export function Messages() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [unsubscribeMsg, setUnsubscribeMsg] = useState(null);
  const { peerStatus } = usePeer();
  const messagesEndRef = useRef(null);

  // Load all cloud users as potential contacts
  useEffect(() => {
    if (!user) return;
    getAllUsers().then(all => {
      const others = all.filter(u => u.id !== user.uid);
      setContacts(others);
    });
  }, [user]);

  // Subscribe to real-time messages in active chat
  useEffect(() => {
    if (unsubscribeMsg) unsubscribeMsg();
    if (!activeChat || !user) return;

    const unsub = getMessages(user.uid, activeChat.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    setUnsubscribeMsg(() => unsub);
    return unsub;
  }, [activeChat, user]);

  const handleSelectChat = (contact) => {
    setActiveChat(contact);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    await sendMessage(user.uid, activeChat.id, inputText);
    setInputText('');
  };

  const handleDeleteMessage = async (messageId) => {
    if (confirm('Unsend this message? It will be removed for everyone.')) {
      await deleteMessage(user.uid, activeChat.id, messageId);
    }
  };

  const openCall = (isVideo) => {
    window.dispatchEvent(new CustomEvent('initiate_call', { detail: { target: activeChat, isVideo } }));
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
        reader.onloadend = async () => {
          await sendMessage(user.uid, activeChat.id, '', reader.result);
          stream.getTracks().forEach(t => t.stop());
        };
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      alert('Mic access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) { mediaRecorder.stop(); setIsRecording(false); setMediaRecorder(null); }
  };

  const VoiceMessage = ({ url, isMe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(new Audio(url));
    useEffect(() => {
      const audio = audioRef.current;
      audio.onended = () => { setIsPlaying(false); setProgress(0); };
      audio.ontimeupdate = () => setProgress((audio.currentTime / audio.duration) * 100);
      return () => { audio.pause(); audio.onended = null; audio.ontimeupdate = null; };
    }, []);
    const togglePlay = () => { isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); };
    return (
      <div onClick={togglePlay} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--bg-color)', borderRadius: '99px', cursor: 'pointer', minWidth: '180px' }}>
        <div style={{ background: isMe ? 'white' : 'var(--accent-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMe ? 'var(--accent-color)' : 'white' }}>
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isMe ? 'white' : 'var(--text-primary)' }}>Voice Note</div>
        <div style={{ flex: 1, height: '4px', background: isMe ? 'rgba(255,255,255,0.3)' : 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: isMe ? 'white' : 'var(--accent-color)', transition: 'width 0.1s linear' }} />
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1.5rem' }} className="messages-layout-wrapper">
      {/* Left Contacts */}
      <div className="glass" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto', borderRadius: '28px', flexShrink: 0 }}>
        <h2 style={{ padding: '0.5rem 0.5rem 1rem 0.5rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Messages</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {contacts.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem', textAlign: 'center' }}>
              No users yet. Go to Explore to find people!
            </p>
          )}
          {contacts.map(c => (
            <div
              key={c.id}
              onClick={() => handleSelectChat(c)}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem', borderRadius: '16px', cursor: 'pointer', background: activeChat?.id === c.id ? 'var(--surface-hover)' : 'transparent', transition: 'all 0.2s ease' }}
            >
              <div className="avatar small" style={{ backgroundImage: c.avatar ? `url(${c.avatar})` : 'none', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.handle || c.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Chat */}
      <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '28px' }}>
        {activeChat ? (
          <>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="avatar" style={{ backgroundImage: activeChat.avatar ? `url(${activeChat.avatar})` : 'none', width: '42px', height: '42px' }} />
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>{activeChat.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: peerStatus === 'ready' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {peerStatus === 'ready' ? '● Online' : '● Connecting...'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="action-btn" onClick={() => openCall(false)} style={{ background: 'var(--bg-color)', width: '42px', height: '42px', justifyContent: 'center' }} title="Audio Call">
                  <Phone size={18} />
                </button>
                <button className="action-btn" onClick={() => openCall(true)} style={{ background: 'var(--bg-color)', width: '42px', height: '42px', justifyContent: 'center' }} title="Video Call">
                  <Video size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
                  🔒 End-to-end encrypted.<br />Say hello to {activeChat.name}!
                </div>
              )}
              {messages.map(m => {
                const isMe = m.senderId === user.uid;
                return (
                  <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <div style={{ padding: m.audioUrl ? '0.5rem' : '0.85rem 1.15rem', background: isMe ? 'linear-gradient(135deg, var(--accent-hover), var(--accent-color))' : 'var(--surface-hover)', color: isMe ? 'white' : 'var(--text-primary)', borderBottomRightRadius: isMe ? '6px' : '20px', borderBottomLeftRadius: isMe ? '20px' : '6px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', fontWeight: 600 }}>
                        {m.audioUrl ? <VoiceMessage url={m.audioUrl} isMe={isMe} /> : m.text}
                      </div>
                      {isMe && (
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          title="Unsend"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '8px', transition: 'color 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'now'}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', background: 'var(--surface-hover)', alignItems: 'center' }}>
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className="action-btn" style={{ background: isRecording ? '#ef4444' : 'var(--bg-color)', width: '48px', height: '48px', justifyContent: 'center', borderRadius: '50%', color: isRecording ? 'white' : 'var(--text-secondary)', boxShadow: isRecording ? '0 0 12px rgba(239,68,68,0.4)' : 'none', flexShrink: 0 }}>
                {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
              </button>
              <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} className="post-input" style={{ background: 'var(--bg-color)', padding: '0.9rem 1.25rem', borderRadius: '999px', fontSize: '0.95rem', width: '100%' }} placeholder={isRecording ? 'Recording...' : `Message ${activeChat.name}...`} disabled={isRecording} />
              <button type="submit" className="btn-primary" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} disabled={!inputText.trim() || isRecording}>
                <Send size={18} style={{ marginLeft: '2px' }} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
            <div style={{ background: 'var(--surface-hover)', padding: '2rem', borderRadius: '50%' }}>
              <MessageSquare size={56} />
            </div>
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Live Sync Chat</h2>
              <p>Select someone from the list to start a real-time encrypted conversation.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
