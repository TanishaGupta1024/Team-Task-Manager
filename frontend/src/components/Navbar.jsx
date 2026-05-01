import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/projects" style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
          ⬡ TaskFlow
        </Link>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Link to="/projects" className="btn btn-ghost btn-sm"
            style={{ color: isActive('/projects') ? 'var(--text)' : 'var(--text2)', background: isActive('/projects') ? 'var(--surface2)' : '' }}>
            Projects
          </Link>
        </div>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text2)' }}>Signed in as </span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{user.name}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
