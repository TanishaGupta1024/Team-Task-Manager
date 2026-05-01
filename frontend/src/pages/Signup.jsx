import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
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
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Create Account</h2>

          {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password <span style={{ color: 'var(--text3)' }}>(min 6 chars)</span></label>
              <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text2)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
