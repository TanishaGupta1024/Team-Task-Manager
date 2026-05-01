import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';

const COLORS = { todo: '#94a3b8', inprogress: '#f59e0b', done: '#10b981' };
const P_COLORS = { low: '#10b981', medium: '#f97316', high: '#ef4444' };

const Dashboard = ({ projectId, role }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/dashboard?project_id=${projectId}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>;
  if (!data) return null;

  const statusData = [
    { name: 'To Do', value: data.byStatus.todo, color: COLORS.todo },
    { name: 'In Progress', value: data.byStatus.inprogress, color: COLORS.inprogress },
    { name: 'Done', value: data.byStatus.done, color: COLORS.done },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Low', value: data.byPriority.low, fill: P_COLORS.low },
    { name: 'Medium', value: data.byPriority.medium, fill: P_COLORS.medium },
    { name: 'High', value: data.byPriority.high, fill: P_COLORS.high },
  ];

  const completionRate = data.total > 0 ? Math.round((data.byStatus.done / data.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="fade-in">
      {/* Stat Cards */}
      <div className="grid-4">
        <div className="stat-card accent">
          <div className="stat-value">{data.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">{data.byStatus.inprogress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{data.overdue}</div>
          <div className="stat-label">Overdue Tasks</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8125rem' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8125rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>No data yet</div>}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} barSize={36}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text2)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8125rem' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-user breakdown (admin only) */}
      {role === 'admin' && data.perUser.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tasks per Member</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Total Tasks</th><th>Completed</th><th>Progress</th></tr></thead>
              <tbody>
                {data.perUser.map((u, i) => {
                  const pct = u.task_count > 0 ? Math.round((u.done_count / u.task_count) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td>{u.task_count}</td>
                      <td style={{ color: 'var(--accent2)' }}>{u.done_count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent2)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text2)', minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {data.recentTasks.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Tasks</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due Date</th></tr></thead>
              <tbody>
                {data.recentTasks.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td style={{ color: 'var(--text2)' }}>{t.assigned_to_name || '—'}</td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.status}`}>{t.status === 'inprogress' ? 'In Progress' : t.status === 'todo' ? 'To Do' : 'Done'}</span></td>
                    <td style={{ color: t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' ? 'var(--danger)' : 'var(--text2)', fontSize: '0.8125rem' }}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
