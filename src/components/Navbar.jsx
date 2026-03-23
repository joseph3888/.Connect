import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './components.css';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar glass">
      <Link to="/" className="logo">Connect.</Link>
      
      {user ? (
        <>
          <div className="nav-links">
            <Link to="/" className="nav-item active">Home</Link>
            <button className="nav-item">Explore</button>
            <span className="nav-item" style={{color: 'var(--accent-secondary)'}}>
              @{user.name.split(' ')[0]}
            </span>
          </div>
          <button className="btn-primary" onClick={logout}>Log Out</button>
        </>
      ) : (
        <div className="nav-links" style={{marginLeft: 'auto'}}>
          <Link to="/login" className="nav-item" style={{marginRight: '1rem'}}>Log In</Link>
          <Link to="/register" className="btn-primary">Sign Up</Link>
        </div>
      )}
    </nav>
  );
}
