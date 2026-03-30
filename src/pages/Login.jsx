import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input, Badge } from '../components/ui/Primitives';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import '../auth.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container relative overflow-hidden">
      {/* Decorative Aurora Background for Auth */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vh] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vh] bg-accent/10 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Card glass className="p-10 shadow-2xl border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
          
          <div className="flex-center flex-col mb-10">
            <h1 className="text-4xl font-weight-black text-main tracking-tighter mb-2">Connect<span className="text-primary">.</span></h1>
            <Badge variant="glass" className="uppercase tracking-widest text-[10px] py-1">Enterprise Networking</Badge>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-weight-bold text-main">Welcome Back</h2>
            <p className="text-sm text-muted mt-1 font-weight-semi">Enter your credentials to sync with the network.</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-radius-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-weight-bold mb-6 text-center"
            >
              System Error: {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-weight-black uppercase text-muted tracking-widest px-1">Node Identifier</label>
              <Input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@access.net"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-weight-black uppercase text-muted tracking-widest px-1">Access Protocol</label>
              <Input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <Button 
              type="submit" 
              variant="primary" 
              className="mt-4 !py-4 !rounded-full shadow-glow font-weight-black uppercase tracking-widest flex-center gap-2"
              disabled={loading}
            >
              {loading ? 'Authorizing...' : (
                <>Authorize Access <ArrowRight size={18} /></>
              )}
            </Button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-muted">
              New to the ecosystem? <Link to="/register" className="text-primary font-weight-bold hover:underline ml-1">Establish Node</Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
