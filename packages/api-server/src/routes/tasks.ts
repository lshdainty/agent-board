import { Router } from 'express';
import pool from '../db.js';
import { broadcastEvent } from '../websocket.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;
    const status = req.query.status as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    let whereClause = 'WHERE t.project_id = ?';
    const countParams: (string | number)[] = [projectId];
    if (status) { whereClause += ' AND t.status = ?'; countParams.push(status); }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM tasks t ${whereClause}`,
      countParams
    );
    const total = (countRows[0] as { total: number }).total;

    const query = `
      SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
      FROM tasks t
      LEFT JOIN agents a ON t.assignee_id = a.id
      LEFT JOIN agents c ON t.created_by_id = c.id
      ${whereClause}
      ORDER BY t.sort_order ASC
      LIMIT ? OFFSET ?
    `;
    const params = [...countParams, limit, offset];

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    res.json({ success: true, data: rows, total });
  } catch (err: unknown) {
    console.error('GET /tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, title, description, status, priority, assignee_id, created_by_id, sort_order } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Invalid title' });
      return;
    }
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority' });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, created_by_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id,
        title,
        description ?? null,
        status ?? 'todo',
        priority ?? 'medium',
        assignee_id ?? null,
        created_by_id ?? null,
        sort_order ?? 0,
      ]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
       FROM tasks t
       LEFT JOIN agents a ON t.assignee_id = a.id
       LEFT JOIN agents c ON t.created_by_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );
    const task = rows[0];

    broadcastEvent({
      event: 'task:created',
      project_id: project_id as number,
      data: task as Record<string, unknown>,
    });

    res.json({ success: true, data: task });
  } catch (err: unknown) {
    console.error('POST /tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, sort_order, title, description, priority, assignee_id } = req.body as {
      status?: string;
      sort_order?: number;
      title?: string;
      description?: string;
      priority?: string;
      assignee_id?: number | null;
    };
    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    if (status) { setClauses.push('status = ?'); params.push(status); }
    if (sort_order !== undefined) { setClauses.push('sort_order = ?'); params.push(sort_order); }
    if (title) { setClauses.push('title = ?'); params.push(title); }
    if (description !== undefined) { setClauses.push('description = ?'); params.push(description); }
    if (priority) { setClauses.push('priority = ?'); params.push(priority); }
    if (assignee_id !== undefined) { setClauses.push('assignee_id = ?'); params.push(assignee_id); }

    if (setClauses.length === 0) {
      res.status(400).json({ success: false, message: 'No fields to update' });
      return;
    }

    setClauses.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT t.*, a.name AS assignee_name, c.name AS created_by_name
       FROM tasks t
       LEFT JOIN agents a ON t.assignee_id = a.id
       LEFT JOIN agents c ON t.created_by_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    const task = rows[0];

    if (task) {
      broadcastEvent({
        event: 'task:updated',
        project_id: task.project_id as number,
        data: task as Record<string, unknown>,
      });
    }

    res.json({ success: true, data: task });
  } catch (err: unknown) {
    console.error('PATCH /tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [id]);
    const task = rows[0];

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

    broadcastEvent({
      event: 'task:updated',
      project_id: task.project_id as number,
      data: { id, deleted: true } as Record<string, unknown>,
    });

    res.json({ success: true, data: { id } });
  } catch (err: unknown) {
    console.error('DELETE /tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
});

export default router;
