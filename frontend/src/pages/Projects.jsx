import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/projects', form);
      setProjects([res.data, ...projects]);
      setShowModal(false);
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s' }}
              onClick={() => navigate(`/projects/${p.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)' }}>
                  {p.name}
                </div>
                <span className={`badge badge-${p.role}`}>{p.role}</span>
              </div>
              {p.description && (
                <p style={{ color: 'var(--text2)', fontSize: '0.8125rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {p.description.length > 80 ? p.description.slice(0, 80) + '…' : p.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--text3)', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <span>📝 {p.task_count || 0} tasks</span>
                <span>👥 {p.member_count || 0} members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Create New Project</h3>
            {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Project Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's this project about?" style={{ resize: 'vertical' }} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
