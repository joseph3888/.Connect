import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { processImage } from '../utils/imageUtils';

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
      setError('Registration failed');
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="glass" style={{padding: '3rem', width: '100%', maxWidth: '400px'}}>
        <h2 style={{fontSize: '2rem', marginBottom: '2rem', textAlign: 'center'}}>Create Account</h2>
        {error && <div style={{color: 'red', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
            <label style={{cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <div 
                className="avatar" 
                style={{
                  width: '80px', height: '80px', marginBottom: '0.5rem', 
                  backgroundImage: preview ? `url(${preview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <span style={{fontSize: '0.85rem', color: 'var(--accent-secondary)'}}>Upload Avatar</span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{display: 'none'}} />
            </label>
          </div>

          <input 
            type="text" 
            placeholder="Display Name" 
            className="post-input"
            style={{background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px'}}
            value={name} onChange={e => setName(e.target.value)} required 
          />
          <input 
            type="text" 
            placeholder="@username" 
            className="post-input"
            style={{background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px'}}
            value={username} onChange={e => setUsername(e.target.value)} required 
          />
          <input 
            type="email" 
            placeholder="Email" 
            className="post-input"
            style={{background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px'}}
            value={email} onChange={e => setEmail(e.target.value)} required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="post-input"
            style={{background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '12px'}}
            value={password} onChange={e => setPassword(e.target.value)} required 
          />
          <button type="submit" className="btn-primary" style={{marginTop: '1rem'}}>Sign Up</button>
        </form>
        <p style={{marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
          Already have an account? <Link to="/login" style={{color: 'var(--accent-color)', fontWeight: 'bold'}}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
