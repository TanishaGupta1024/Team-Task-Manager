const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/projects - get all projects for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role, u.name as creator_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - create a project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const proj = await client.query(
        'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
        [name, description || '', req.user.id]
      );
      // Creator becomes admin
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [proj.rows[0].id, req.user.id, 'admin']
      );
      await client.query('COMMIT');
      res.status(201).json({ ...proj.rows[0], role: 'admin' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id - get project details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check membership
    const member = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (member.rows.length === 0)
      return res.status(403).json({ error: 'Access denied' });

    const project = await pool.query(
      'SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE p.id = $1',
      [id]
    );
    if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [id]
    );

    res.json({ ...project.rows[0], role: member.rows[0].role, members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (member.rows.length === 0 || member.rows[0].role !== 'admin')
      return res.status(403).json({ error: 'Only admins can delete projects' });

    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members - add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    const adminCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin')
      return res.status(403).json({ error: 'Only admins can add members' });

    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];
    const existing = await pool.query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [id, user.id]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'User already a member' });

    await pool.query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)', [id, user.id, role]);
    res.status(201).json({ ...user, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const adminCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin')
      return res.status(403).json({ error: 'Only admins can remove members' });

    if (parseInt(userId) === req.user.id)
      return res.status(400).json({ error: 'Cannot remove yourself' });

    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
