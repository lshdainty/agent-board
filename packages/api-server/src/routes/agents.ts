import { Router } from 'express';
import pool from '../db.js';
import { broadcastEvent } from '../websocket.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM agents WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    console.error('GET /agents error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch agents' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, name, role, status } = req.body;
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO agents (project_id, name, role, status) VALUES (?, ?, ?, ?)',
      [project_id, name, role ?? 'developer', status ?? 'idle']
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM agents WHERE id = ?',
      [result.insertId]
    );
    const agent = rows[0];

    broadcastEvent({
      event: 'agent:registered',
      project_id: project_id as number,
      data: agent as Record<string, unknown>,
    });

    res.json({ success: true, data: agent });
  } catch (err: unknown) {
    console.error('POST /agents error:', err);
    res.status(500).json({ success: false, message: 'Failed to create agent' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, role, name } = req.body as { status?: string; role?: string; name?: string };
    const setClauses: string[] = [];
    const params: (string | number)[] = [];

    if (status) { setClauses.push('status = ?'); params.push(status); }
    if (role) { setClauses.push('role = ?'); params.push(role); }
    if (name) { setClauses.push('name = ?'); params.push(name); }

    if (setClauses.length === 0) {
      res.status(400).json({ success: false, message: 'No fields to update' });
      return;
    }

    setClauses.push('last_seen_at = NOW()');
    params.push(id);

    await pool.execute(`UPDATE agents SET ${setClauses.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM agents WHERE id = ?', [id]);
    const agent = rows[0];

    if (agent) {
      broadcastEvent({
        event: 'agent:status_changed',
        project_id: agent.project_id as number,
        data: agent as Record<string, unknown>,
      });
    }

    res.json({ success: true, data: agent });
  } catch (err: unknown) {
    console.error('PATCH /agents error:', err);
    res.status(500).json({ success: false, message: 'Failed to update agent' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM agents WHERE id = ?', [id]);
    const agent = rows[0];

    await pool.execute('DELETE FROM agents WHERE id = ?', [id]);

    if (agent) {
      broadcastEvent({
        event: 'agent:removed',
        project_id: agent.project_id as number,
        data: agent as Record<string, unknown>,
      });
    }

    res.json({ success: true, data: { id } });
  } catch (err: unknown) {
    console.error('DELETE /agents error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete agent' });
  }
});

export default router;
