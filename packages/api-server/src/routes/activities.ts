import { Router } from 'express';
import pool from '../db.js';
import { broadcastEvent } from '../websocket.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM activity_logs WHERE project_id = ?',
      [projectId]
    );
    const total = (countRows[0] as { total: number }).total;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT al.*, a.name AS agent_name, t.title AS task_title
       FROM activity_logs al
       LEFT JOIN agents a ON al.agent_id = a.id
       LEFT JOIN tasks t ON al.task_id = t.id
       WHERE al.project_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [projectId, limit, offset]
    );
    res.json({ success: true, data: rows, total });
  } catch (err: unknown) {
    console.error('GET /activities error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, task_id, agent_id, action, message } = req.body;
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO activity_logs (project_id, task_id, agent_id, action, message)
       VALUES (?, ?, ?, ?, ?)`,
      [project_id, task_id ?? null, agent_id ?? null, action, message]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT al.*, a.name AS agent_name, t.title AS task_title
       FROM activity_logs al
       LEFT JOIN agents a ON al.agent_id = a.id
       LEFT JOIN tasks t ON al.task_id = t.id
       WHERE al.id = ?`,
      [result.insertId]
    );
    const activity = rows[0];

    broadcastEvent({
      event: 'activity:logged',
      project_id: project_id as number,
      data: activity as Record<string, unknown>,
    });

    res.json({ success: true, data: activity });
  } catch (err: unknown) {
    console.error('POST /activities error:', err);
    res.status(500).json({ success: false, message: 'Failed to create activity' });
  }
});

export default router;
