import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Dashboard from './Dashboard';

const priorityOrder = { high: 0, medium: 1, low: 2 };

const TaskModal = ({ onClose, onSave, members, task = null }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    assigned_to: task?.assigned_to || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSave({ ...form, assigned_to: form.assigned_to || null });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{task ? 'Edit Task' : 'Create Task'}</h3>
        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details…" style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">— Unassigned —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : (task ? 'Update Task' : 'Create Task')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MemberModal = ({ onClose, onAdd }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAdd(email, role);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Add Member</h3>
        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Member Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@example.com" required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project_id=${id}`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const createTask = async (data) => {
    const res = await api.post('/tasks', { ...data, project_id: id });
    setTasks([res.data, ...tasks]);
  };

  const updateTask = async (taskId, data) => {
    const res = await api.put(`/tasks/${taskId}`, data);
    setTasks(tasks.map(t => t.id === taskId ? res.data : t));
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const quickStatusChange = async (task, newStatus) => {
    const res = await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
    setTasks(tasks.map(t => t.id === task.id ? res.data : t));
  };

  const addMember = async (email, role) => {
    const res = await api.post(`/projects/${id}/members`, { email, role });
    setProject({ ...project, members: [...project.members, res.data] });
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    setProject({ ...project, members: project.members.filter(m => m.id !== userId) });
  };

  const isAdmin = project?.role === 'admin';

  const filteredTasks = tasks
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <span className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (!project) return null;

  const tabs = ['tasks', 'dashboard', ...(isAdmin ? ['members'] : [])];

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: '0.75rem', paddingLeft: 0 }}>
          ← Projects
        </button>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title">{project.name}</h1>
              <span className={`badge badge-${project.role}`}>{project.role}</span>
            </div>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{project.description}</p>}
          </div>
          {isAdmin && activeTab === 'tasks' && (
            <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>
              + New Task
            </button>
          )}
          {isAdmin && activeTab === 'members' && (
            <button className="btn btn-primary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="btn btn-ghost"
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text2)',
                fontWeight: activeTab === tab ? 600 : 400,
                textTransform: 'capitalize',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 'auto' }}>
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text3)', alignSelf: 'center' }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
              <h3>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match the filters'}</h3>
              {isAdmin && tasks.length === 0 && (
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowTaskModal(true)}>+ Create First Task</button>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Assigned To</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => {
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                      return (
                        <tr key={task.id}>
                          <td>
                            <div style={{ fontWeight: 500, maxWidth: 280 }}>{task.title}</div>
                            {task.description && <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: '0.2rem' }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                          </td>
                          <td style={{ color: 'var(--text2)' }}>{task.assigned_to_name || <span style={{ color: 'var(--text3)' }}>Unassigned</span>}</td>
                          <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                          <td>
                            <select
                              value={task.status}
                              onChange={e => quickStatusChange(task, e.target.value)}
                              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                              disabled={!isAdmin && task.assigned_to !== parseInt(task.current_user_id)}>
                              <option value="todo">To Do</option>
                              <option value="inprogress">In Progress</option>
                              <option value="done">Done</option>
                            </select>
                          </td>
                          <td style={{ color: isOverdue ? 'var(--danger)' : 'var(--text2)', fontSize: '0.8125rem', fontWeight: isOverdue ? 600 : 400 }}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            {isOverdue && <span style={{ fontSize: '0.7rem', display: 'block' }}>Overdue</span>}
                          </td>
                          <td>
                            {isAdmin && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(task); setShowTaskModal(true); }}>✏️</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && <Dashboard projectId={id} role={project.role} />}

      {/* Members Tab */}
      {activeTab === 'members' && isAdmin && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {project.members.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 500 }}>{m.name}</td>
                    <td style={{ color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: '0.8125rem' }}>{m.email}</td>
                    <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                    <td style={{ color: 'var(--text3)', fontSize: '0.8125rem' }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                    <td>
                      {m.role !== 'admin' && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editTask}
          members={project.members}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={editTask ? (data) => updateTask(editTask.id, data) : createTask}
        />
      )}
      {showMemberModal && (
        <MemberModal onClose={() => setShowMemberModal(false)} onAdd={addMember} />
      )}
    </div>
  );
};

export default ProjectDetail;
