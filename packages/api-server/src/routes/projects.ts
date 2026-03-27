import { Router } from 'express';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    console.error('GET /projects error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO projects (name, description) VALUES (?, ?)',
      [name, description ?? null]
    );
    res.json({ success: true, data: { id: result.insertId, name, description } });
  } catch (err: unknown) {
    console.error('POST /projects error:', err);
    res.status(500).json({ success: false, message: 'Failed to create project' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && description === undefined) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }

    values.push(id);

    await pool.execute(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM projects WHERE id = ?', [id]);
    const project = rows[0];

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (err: unknown) {
    console.error('PATCH /projects/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update project' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute<ResultSetHeader>('DELETE FROM projects WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: { id: Number(id) } });
  } catch (err: unknown) {
    console.error('DELETE /projects/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
});

export default router;
