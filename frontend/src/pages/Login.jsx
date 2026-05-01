import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '1.75rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>⬡ TaskFlow</div>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Team Task Manager</p>
        </div>

        <div className="card fade-in">
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Sign In</h2>

          {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text2)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
