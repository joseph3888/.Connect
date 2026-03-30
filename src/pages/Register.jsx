import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { processImage } from '../utils/imageUtils';
import { Button, Card, Input, Badge } from '../components/ui/Primitives';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Camera } from 'lucide-react';
import '../auth.css';

export function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file, 200).then(base64 => setPreview(base64));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.startsWith('@') || username.length < 3) {
      setError("Username must start with @ and be at least 3 characters");
      return;
    }

    try {
      const success = await register(name, username, email, password, preview);
      if (success) {
        navigate('/');
      } else {
        setError('Email or username already exists');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed');
    }
  };

  return (
    <div className="auth-container relative overflow-hidden">
      {/* Decorative Aurora Background for Auth */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vh] bg-primary/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vh] bg-accent/10 blur-[110px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        <Card glass className="p-10 shadow-2xl border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent opacity-50" />
          
          <div className="flex-center flex-col mb-8">
            <h1 className="text-3xl font-weight-black text-main tracking-tighter mb-2">Connect<span className="text-primary">.</span></h1>
            <Badge variant="glass" className="uppercase tracking-widest text-[10px] py-1">Join the Network</Badge>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-weight-bold text-main">Establish Node</h2>
            <p className="text-xs text-muted mt-1 font-weight-semi">Create your digital identity in the ecosystem.</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-radius-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-weight-bold mb-6 text-center"
            >
              Protocol Error: {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex-center mb-4">
              <label className="relative group cursor-pointer">
                <div 
                  className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl bg-surface-active flex-center relative"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-muted/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex-center flex-col gap-1">
                    <Camera size={18} className="text-white" />
                    <span className="text-[8px] font-weight-black text-white uppercase tracking-tighter">Upload</span>
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-weight-black uppercase text-muted tracking-widest px-1">Display Name</label>
                <Input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-weight-black uppercase text-muted tracking-widest px-1">Username</label>
                <Input 
                  type="text" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@handle"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-weight-black uppercase text-muted tracking-widest px-1">Node Identifier</label>
              <Input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@access.net"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-weight-black uppercase text-muted tracking-widest px-1">Access Protocol</label>
              <Input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure Password"
              />
            </div>
            
            <Button 
              type="submit" 
              variant="primary" 
              className="mt-4 !py-4 !rounded-full shadow-glow font-weight-black uppercase tracking-widest flex-center gap-2"
            >
              Synchronize Node <ArrowRight size={18} />
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-muted">
              Already synchronized? <Link to="/login" className="text-accent font-weight-bold hover:underline ml-1">Authorize Link</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
