/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePeer } from '../context/PeerContext';
import { getAllUsers, getMessages, sendMessage, deleteMessage, setTypingStatus, markMessageAsRead, addMessageReaction } from '../services/firebaseDataService';
import { Phone, Video, Send, MessageSquare, Mic, Square, Play, Pause, Trash2, Image as ImageIcon, Smile, Heart, Compass, Plus, Search, MoreHorizontal, ShieldAlert, ChevronLeft } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge } from '../components/ui/Primitives';

export function Messages() {
  const { user } = useAuth();
  const { peer, peerStatus, manualRetry, errorType } = usePeer();
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    getAllUsers().then(all => {
      setContacts(all.filter(u => u.id !== user.uid));
    });
  }, [user]);

  useEffect(() => {
    if (!activeChat || !user) return;

    const chatId = [user.uid, activeChat.id].sort().join('_');
    const unsub = getMessages(user.uid, activeChat.id, (msgs) => {
      setMessages(msgs);
      msgs.forEach(m => {
        if (!m.read && m.senderId !== user.uid) markMessageAsRead(chatId, m.id);
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    
    const unsubTyping = onSnapshot(doc(db, 'chats', chatId, 'presence', activeChat.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPartnerTyping(data.isTyping && (Date.now() - (data.updatedAt?.toMillis() || 0) < 5000));
      } else {
        setPartnerTyping(false);
      }
    });

    return () => {
      unsub();
      unsubTyping();
    };
  }, [activeChat?.id, user?.uid]);

  const handleSelectChat = (contact) => setActiveChat(contact);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    const text = inputText;
    setInputText('');
    await sendMessage(user.uid, activeChat.id, text);
  };

  const handleTyping = () => {
    if (!activeChat) return;
    if (!isTyping) {
      setIsTyping(true);
      setTypingStatus(user.uid, activeChat.id, true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingStatus(user.uid, activeChat.id, false);
    }, 3000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await sendMessage(user.uid, activeChat.id, '', null, null, blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) { console.error('Mic access denied:', err); }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && activeChat) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        await sendMessage(user.uid, activeChat.id, '', null, file);
      } catch (err) { console.error('Image upload failed:', err); } 
      finally { setIsUploading(false); }
    }
  };

  const openCall = (isVideo) => {
    if (!activeChat) return;
    window.dispatchEvent(new CustomEvent('initiate_call', { detail: { target: activeChat, isVideo } }));
  };

  const VoiceMessage = ({ url, isMe }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(new Audio(url));
    useEffect(() => {
       const a = audioRef.current;
       const handleEnd = () => setPlaying(false);
       a.addEventListener('ended', handleEnd);
       return () => a.removeEventListener('ended', handleEnd);
    }, []);
    const toggle = () => {
       if (playing) audioRef.current.pause();
       else audioRef.current.play();
       setPlaying(!playing);
    };
    return (
      <div className={`flex items-center gap-3 p-2 rounded-full ${isMe ? 'bg-white/20' : 'bg-primary/20'}`}>
        <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/10 flex-center hover:bg-white/20 transition-all">
           {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="flex gap-0.5 h-3 items-center">
           {[...Array(6)].map((_, i) => (
              <div key={i} className={`w-0.5 bg-white/40 rounded-full ${playing ? 'animate-pulse' : ''}`} style={{ height: `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }} />
           ))}
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="flex bg-bg-dark h-[calc(100vh-var(--mobile-header-height)-var(--mobile-nav-height))] md:h-screen w-full overflow-hidden relative animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
      
      {/* ─── CONTACTS PANE ─────────────────────────────────── */}
      <div className={`
        ${isMobile && activeChat ? 'hidden' : 'w-full md:w-[320px] flex'} 
        flex-col border-r border-white/5 bg-bg-glass-heavy/40 backdrop-blur-3xl z-20 transition-all
      `}>
        <div className="p-6 flex flex-col gap-4 border-b border-white/5">
          <div className="flex-between">
             <h2 className="text-xl font-weight-bold tracking-tighter text-white uppercase italic">Neural Sync</h2>
             <Button variant="glass" size="icon"><Plus size={18} /></Button>
          </div>
          <div className="relative group">
             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
             <input type="text" placeholder="Access identity..." className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-xs font-weight-bold tracking-wider outline-none focus:border-primary/40 transition-all font-sans" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar space-y-1">
          {contacts.map(c => (
            <div
              key={c.id}
              onClick={() => handleSelectChat(c)}
              className={`
                flex items-center gap-3 p-3 rounded-radius-md cursor-pointer transition-all border
                ${activeChat?.id === c.id 
                  ? 'bg-primary/20 border-primary/30 shadow-glow mx-1' 
                  : 'hover:bg-white/5 border-transparent'}
              `}
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-full border border-white/10 overflow-hidden" style={{ backgroundImage: c.avatar ? `url(${c.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#1a1a1c' }} />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-bg-dark ${c.online ? 'bg-green-500 shadow-glow' : 'bg-muted'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex-between mb-0.5">
                  <span className="font-weight-bold text-main truncate text-xs">{c.name}</span>
                  <Badge variant="glass" className="text-[8px] opacity-40">NODE</Badge>
                </div>
                <div className="text-[11px] text-muted truncate opacity-80">@{c.handle || 'platinum'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CHAT MAIN WINDOW ──────────────────────────── */}
      <div className={`
        ${isMobile && !activeChat ? 'hidden' : 'flex-1 flex'} 
        flex-col min-w-0 h-full relative z-10 bg-bg-dark/50 shadow-inner
      `}>
        <AnimatePresence mode="popLayout" initial={false}>
          {activeChat ? (
            <div 
              key={activeChat.id} 
              className="flex flex-col h-full overflow-hidden"
            >
              <header className="px-4 md:px-8 py-5 flex-between border-b border-white/5 bg-bg-glass-heavy/60 backdrop-blur-xl z-20 shadow-lg">
                <div className="flex items-center gap-2 md:gap-4">
                  {isMobile && (
                    <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors mr-1">
                      <ChevronLeft size={24} className="text-secondary" />
                    </button>
                  )}
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-primary/20 p-0.5 shadow-2xl overflow-hidden">
                     <div className="w-full h-full rounded-full" style={{ backgroundImage: activeChat.avatar ? `url(${activeChat.avatar})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#1a1a1c' }} />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-weight-bold text-white mb-0.5">{activeChat.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${peerStatus === 'ready' ? 'bg-green-500 shadow-glow' : peerStatus === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                       <span onClick={peerStatus === 'error' ? manualRetry : undefined} className={`text-[8px] md:text-[10px] font-weight-bold uppercase tracking-widest ${peerStatus === 'ready' ? 'text-green-400' : peerStatus === 'error' ? 'text-red-400 cursor-pointer hover:underline' : 'text-amber-400'}`}>
                         {peerStatus === 'ready' ? 'Neural Sync Active' : peerStatus === 'error' ? `Signaling Offline` : 'Building Protocol...'}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 md:gap-2">
                  <Button variant="glass" size="icon" onClick={() => openCall(false)} disabled={peerStatus === 'error'} className="!rounded-full !w-9 !h-9 md:!w-10 md:!h-10"><Phone size={16} /></Button>
                  <Button variant="glass" size="icon" onClick={() => openCall(true)} disabled={peerStatus === 'error'} className="!rounded-full !w-9 !h-9 md:!w-10 md:!h-10"><Video size={16} /></Button>
                  <Button variant="glass" size="icon" className="!rounded-full !w-9 !h-9 md:!w-10 md:!h-10 hide-mobile"><MoreHorizontal size={16} /></Button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-4 no-scrollbar relative shadow-inner">
                {peerStatus === 'error' && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 top-4 z-50 flex justify-center">
                       <div className="glass-heavy bg-red-600/20 border-red-500/30 px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-3 shadow-glow backdrop-blur-3xl">
                          <ShieldAlert size={16} className="text-red-400" />
                          <span className="text-[8px] md:text-[10px] font-weight-bold uppercase tracking-widest text-red-100">Signaling Blocked. Click status badge to retry.</span>
                       </div>
                    </motion.div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none opacity-20" />
                
                {messages.map((m, idx) => {
                  const isMe = m.senderId === user.uid;
                  const showAvatar = idx === 0 || messages[idx-1].senderId !== m.senderId;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[90%] md:max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                      {!isMe && <div className={`w-7 h-7 rounded-full border border-white/10 overflow-hidden mb-1 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}><img src={activeChat.avatar} className="w-full h-full object-cover" /></div>}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1.5`}>
                        <div className={`px-4 py-3 relative border shadow-2xl transition-all ${isMe ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl rounded-tr-none border-white/20' : 'bg-bg-glass-heavy text-main rounded-2xl rounded-tl-none border-white/10'}`}>
                           {m.mediaType === 'audio' && <VoiceMessage url={m.mediaUrl} isMe={isMe} />}
                           {m.mediaType === 'image' && <img src={m.mediaUrl} alt="Visual Payload" className="max-w-full md:max-w-[280px] rounded-lg block border border-white/10 shadow-2xl" />}
                           {m.text && <div className="text-[12px] md:text-[13px] leading-relaxed font-weight-semi tracking-wide">{m.text}</div>}
                        </div>
                        <div className="flex items-center gap-2 px-1 text-[8px] font-weight-bold uppercase tracking-widest text-muted/50 italic">{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Syncing'}</div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              <footer className="px-4 md:px-8 pb-6 md:pb-8 pt-4 bg-transparent border-t border-white/5">
                {partnerTyping && <div className="text-[10px] text-primary italic mb-3 ml-6 font-weight-bold animate-pulse">Neural partner manifested thoughts...</div>}
                <form onSubmit={handleSend} className="bg-bg-glass-heavy/60 backdrop-blur-3xl rounded-3xl md:rounded-full p-2 flex items-center gap-1 border border-white/10 shadow-3xl hover:border-white/20 transition-all focus-within:border-primary/40">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <Button variant="glass" size="icon" onClick={() => fileInputRef.current.click()} className="!rounded-full !w-10 !h-10 text-muted hover:text-primary transition-all"><ImageIcon size={18} /></Button>
                  <Button variant={isRecording ? 'danger' : 'glass'} size="icon" onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} className={`!rounded-full !w-10 !h-10 ${isRecording ? 'animate-pulse' : 'text-muted'}`}>{isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={18} />}</Button>
                  <input value={inputText} onChange={e => { setInputText(e.target.value); handleTyping(); }} placeholder="Establish sync..." className="flex-1 bg-transparent border-none py-2 px-3 text-sm focus:outline-none placeholder:text-muted/40 font-weight-bold tracking-wide" />
                  <Button type="submit" variant="primary" size="icon" className="!rounded-full !w-11 !h-11 shadow-glow active:scale-95 transition-transform" disabled={!inputText.trim()}><Send size={18} className="ml-1" /></Button>
                </form>
              </footer>
            </div>
          ) : (
            <div className="flex-1 flex-center flex-col gap-6 text-center animate-in zoom-in duration-700">
               <div className="w-32 h-32 rounded-full bg-primary/5 flex-center border border-primary/20 shadow-glow"><MessageSquare size={48} className="text-primary/60" /></div>
               <div className="max-w-[240px]"><h2 className="text-2xl font-weight-bold text-white mb-2 tracking-tight">Connect Ultra</h2><p className="text-xs text-muted leading-relaxed font-weight-bold uppercase tracking-widest opacity-60">Establish a secure sync link for zero-latency communication.</p></div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
