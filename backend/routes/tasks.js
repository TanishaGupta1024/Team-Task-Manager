const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Helper: check if user is project member and get role
const getMemberRole = async (projectId, userId) => {
  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0 ? result.rows[0].role : null;
};

// GET /api/tasks?project_id=X
router.get('/', auth, async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    const role = await getMemberRole(project_id, req.user.id);
    if (!role) return res.status(403).json({ error: 'Access denied' });

    let query, params;
    if (role === 'admin') {
      query = `SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
               FROM tasks t
               LEFT JOIN users u ON u.id = t.assigned_to
               LEFT JOIN users c ON c.id = t.created_by
               WHERE t.project_id = $1
               ORDER BY t.created_at DESC`;
      params = [project_id];
    } else {
      // Members see only assigned tasks
      query = `SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
               FROM tasks t
               LEFT JOIN users u ON u.id = t.assigned_to
               LEFT JOIN users c ON c.id = t.created_by
               WHERE t.project_id = $1 AND t.assigned_to = $2
               ORDER BY t.created_at DESC`;
      params = [project_id, req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks - create task (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, due_date, project_id, assigned_to } = req.body;
    if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id are required' });

    const role = await getMemberRole(project_id, req.user.id);
    if (role !== 'admin') return res.status(403).json({ error: 'Only admins can create tasks' });

    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, due_date, project_id, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description || '', priority || 'medium', due_date || null, project_id, req.user.id, assigned_to || null]
    );

    // Join user names
    const task = await pool.query(
      `SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN users c ON c.id = t.created_by
       WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(task.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id - update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const task = taskResult.rows[0];

    const role = await getMemberRole(task.project_id, req.user.id);
    if (!role) return res.status(403).json({ error: 'Access denied' });

    if (role === 'admin') {
      // Admin can update everything
      const { title, description, priority, status, due_date, assigned_to } = req.body;
      const result = await pool.query(
        `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description),
         priority = COALESCE($3, priority), status = COALESCE($4, status),
         due_date = COALESCE($5, due_date), assigned_to = $6
         WHERE id = $7 RETURNING *`,
        [title, description, priority, status, due_date, assigned_to !== undefined ? assigned_to : task.assigned_to, id]
      );
      const updated = await pool.query(
        `SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
         FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN users c ON c.id = t.created_by
         WHERE t.id = $1`, [id]
      );
      res.json(updated.rows[0]);
    } else {
      // Member can only update status of their own assigned tasks
      if (task.assigned_to !== req.user.id)
        return res.status(403).json({ error: 'You can only update your assigned tasks' });

      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Members can only update task status' });

      await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, id]);
      const updated = await pool.query(
        `SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
         FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN users c ON c.id = t.created_by
         WHERE t.id = $1`, [id]
      );
      res.json(updated.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const role = await getMemberRole(taskResult.rows[0].project_id, req.user.id);
    if (role !== 'admin') return res.status(403).json({ error: 'Only admins can delete tasks' });

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
