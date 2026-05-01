const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/dashboard?project_id=X
router.get('/', auth, async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [project_id, req.user.id]
    );
    if (memberCheck.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    const role = memberCheck.rows[0].role;

    const taskFilter = role === 'admin' ? 'WHERE t.project_id = $1' : 'WHERE t.project_id = $1 AND t.assigned_to = $2';
    const params = role === 'admin' ? [project_id] : [project_id, req.user.id];

    // Total tasks
    const totalResult = await pool.query(`SELECT COUNT(*) FROM tasks t ${taskFilter}`, params);
    const total = parseInt(totalResult.rows[0].count);

    // Tasks by status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM tasks t ${taskFilter} GROUP BY status`, params
    );
    const byStatus = { todo: 0, inprogress: 0, done: 0 };
    statusResult.rows.forEach(r => { byStatus[r.status] = parseInt(r.count); });

    // Tasks by priority
    const priorityResult = await pool.query(
      `SELECT priority, COUNT(*) as count FROM tasks t ${taskFilter} GROUP BY priority`, params
    );
    const byPriority = { low: 0, medium: 0, high: 0 };
    priorityResult.rows.forEach(r => { byPriority[r.priority] = parseInt(r.count); });

    // Overdue tasks
    const overdueResult = await pool.query(
      `SELECT COUNT(*) FROM tasks t ${taskFilter} AND t.due_date < CURRENT_DATE AND t.status != 'done'`, params
    );
    const overdue = parseInt(overdueResult.rows[0].count);

    // Tasks per user (admin only)
    let perUser = [];
    if (role === 'admin') {
      const perUserResult = await pool.query(
        `SELECT u.name, COUNT(t.id) as task_count,
          SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         LEFT JOIN tasks t ON t.assigned_to = pm.user_id AND t.project_id = pm.project_id
         WHERE pm.project_id = $1
         GROUP BY u.name`,
        [project_id]
      );
      perUser = perUserResult.rows;
    }

    // Recent tasks
    const recentResult = await pool.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, u.name as assigned_to_name
       FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
       ${taskFilter} ORDER BY t.created_at DESC LIMIT 5`, params
    );

    res.json({
      total,
      byStatus,
      byPriority,
      overdue,
      perUser,
      recentTasks: recentResult.rows,
      role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
