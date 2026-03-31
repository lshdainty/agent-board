import { Router } from 'express';
import pool from '../db.js';
import type { RowDataPacket } from 'mysql2/promise';

const router = Router();

// GET /api/metrics/agents?project_id=N — 에이전트별 성능 메트릭
router.get('/agents', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        a.id AS agent_id,
        a.name AS agent_name,
        a.role,
        a.status,
        COUNT(CASE WHEN t.status = 'done' AND t.assignee_id = a.id THEN 1 END) AS tasks_completed,
        COUNT(CASE WHEN t.status = 'in_progress' AND t.assignee_id = a.id THEN 1 END) AS tasks_in_progress,
        (SELECT COUNT(*) FROM activity_logs al WHERE al.agent_id = a.id AND al.project_id = ?) AS total_activities,
        a.last_seen_at AS last_active_at
      FROM agents a
      LEFT JOIN tasks t ON t.assignee_id = a.id AND t.project_id = ?
      WHERE a.project_id = ?
      GROUP BY a.id`,
      [projectId, projectId, projectId]
    );

    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    console.error('GET /metrics/agents error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch agent metrics' });
  }
});

// GET /api/metrics/summary?project_id=N — 프로젝트 전체 요약
router.get('/summary', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;

    // Agent counts by status
    const [agentRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total_agents,
        SUM(CASE WHEN status = 'working' THEN 1 ELSE 0 END) AS agents_working,
        SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) AS agents_idle,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) AS agents_offline
      FROM agents
      WHERE project_id = ?`,
      [projectId]
    );

    // Task counts
    const [taskRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) AS todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) AS p_low,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) AS p_medium,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS p_high,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) AS p_urgent
      FROM tasks
      WHERE project_id = ?`,
      [projectId]
    );

    // Recent activity count (last 24h)
    const [activityRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS recent_activity_count_24h
      FROM activity_logs
      WHERE project_id = ? AND created_at >= NOW() - INTERVAL 24 HOUR`,
      [projectId]
    );

    const agents = agentRows[0];
    const tasks = taskRows[0];
    const activity = activityRows[0];

    res.json({
      success: true,
      data: {
        total_agents: Number(agents.total_agents) || 0,
        agents_working: Number(agents.agents_working) || 0,
        agents_idle: Number(agents.agents_idle) || 0,
        agents_offline: Number(agents.agents_offline) || 0,
        total_tasks: Number(tasks.total_tasks) || 0,
        tasks_by_status: {
          todo: Number(tasks.todo) || 0,
          in_progress: Number(tasks.in_progress) || 0,
          review: Number(tasks.review) || 0,
          done: Number(tasks.done) || 0,
        },
        tasks_by_priority: {
          low: Number(tasks.p_low) || 0,
          medium: Number(tasks.p_medium) || 0,
          high: Number(tasks.p_high) || 0,
          urgent: Number(tasks.p_urgent) || 0,
        },
        recent_activity_count_24h: Number(activity.recent_activity_count_24h) || 0,
      },
    });
  } catch (err: unknown) {
    console.error('GET /metrics/summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch summary metrics' });
  }
});

// GET /api/metrics/timeline?project_id=N&days=7 — 일별 활동 타임라인
router.get('/timeline', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;
    const days = Number(req.query.days) || 7;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        dates.date,
        COALESCE(tc.tasks_created, 0) AS tasks_created,
        COALESCE(td.tasks_completed, 0) AS tasks_completed,
        COALESCE(ac.activities, 0) AS activities
      FROM (
        SELECT DATE(DATE_SUB(CURDATE(), INTERVAL n DAY)) AS date
        FROM (
          SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
          UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
          UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
          UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
          UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
          UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23
          UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27
          UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
        ) numbers
        WHERE n < ?
      ) dates
      LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS tasks_created
        FROM tasks
        WHERE project_id = ?
        GROUP BY DATE(created_at)
      ) tc ON tc.date = dates.date
      LEFT JOIN (
        SELECT DATE(updated_at) AS date, COUNT(*) AS tasks_completed
        FROM tasks
        WHERE project_id = ? AND status = 'done'
        GROUP BY DATE(updated_at)
      ) td ON td.date = dates.date
      LEFT JOIN (
        SELECT DATE(created_at) AS date, COUNT(*) AS activities
        FROM activity_logs
        WHERE project_id = ?
        GROUP BY DATE(created_at)
      ) ac ON ac.date = dates.date
      ORDER BY dates.date ASC`,
      [days, projectId, projectId, projectId]
    );

    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    console.error('GET /metrics/timeline error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline metrics' });
  }
});

// GET /api/metrics/agent-history?agent_id=N&limit=50 — 에이전트별 작업 이력
router.get('/agent-history', async (req, res) => {
  try {
    const agentId = Number(req.query.agent_id);
    const limit = Number(req.query.limit) || 50;

    if (!agentId) {
      res.status(400).json({ success: false, message: 'agent_id is required' });
      return;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT al.*, a.name AS agent_name, t.title AS task_title
       FROM activity_logs al
       LEFT JOIN agents a ON al.agent_id = a.id
       LEFT JOIN tasks t ON al.task_id = t.id
       WHERE al.agent_id = ?
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [agentId, limit]
    );

    res.json({ success: true, data: rows });
  } catch (err: unknown) {
    console.error('GET /metrics/agent-history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch agent history' });
  }
});

// GET /api/metrics/costs?project_id=N — 에이전트별/일별 비용 추정
router.get('/costs', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;
    const COST_PER_ACTIVITY = 0.0225;

    // Total activities
    const [totalRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_activities FROM activity_logs WHERE project_id = ?`,
      [projectId]
    );
    const totalActivities = Number(totalRows[0].total_activities) || 0;

    // By agent
    const [agentRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        a.id AS agent_id,
        a.name,
        COUNT(al.id) AS activities
      FROM agents a
      LEFT JOIN activity_logs al ON al.agent_id = a.id AND al.project_id = ?
      WHERE a.project_id = ?
      GROUP BY a.id
      ORDER BY activities DESC`,
      [projectId, projectId]
    );

    // By day (last 7 days)
    const [dayRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS activities
      FROM activity_logs
      WHERE project_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [projectId]
    );

    res.json({
      success: true,
      data: {
        total_activities: totalActivities,
        estimated_cost_usd: Math.round(totalActivities * COST_PER_ACTIVITY * 100) / 100,
        by_agent: agentRows.map((r) => ({
          agent_id: r.agent_id,
          name: r.name,
          activities: Number(r.activities),
          estimated_cost: Math.round(Number(r.activities) * COST_PER_ACTIVITY * 100) / 100,
        })),
        by_day: dayRows.map((r) => ({
          date: r.date,
          activities: Number(r.activities),
          cost: Math.round(Number(r.activities) * COST_PER_ACTIVITY * 100) / 100,
        })),
      },
    });
  } catch (err: unknown) {
    console.error('GET /metrics/costs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cost metrics' });
  }
});

// GET /api/metrics/security?project_id=N — 보안 메트릭
router.get('/security', async (req, res) => {
  try {
    const projectId = Number(req.query.project_id) || 1;

    // 에이전트별 활동/에러 카운트
    const [agentRows] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id AS agent_id, a.name,
        COUNT(al.id) AS total_actions,
        SUM(CASE WHEN al.action LIKE '%error%' OR al.action LIKE '%fail%' THEN 1 ELSE 0 END) AS error_actions,
        MAX(CASE WHEN al.action LIKE '%error%' OR al.action LIKE '%fail%' THEN al.created_at END) AS last_error
      FROM agents a
      LEFT JOIN activity_logs al ON al.agent_id = a.id AND al.project_id = ?
      WHERE a.project_id = ?
      GROUP BY a.id`,
      [projectId, projectId]
    );

    // 최근 24시간 에이전트별 활동 수 (이상 감지용)
    const [recentRows] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id AS agent_id,
        COUNT(al.id) AS recent_actions
      FROM agents a
      LEFT JOIN activity_logs al ON al.agent_id = a.id AND al.project_id = ? AND al.created_at >= NOW() - INTERVAL 24 HOUR
      WHERE a.project_id = ?
      GROUP BY a.id`,
      [projectId, projectId]
    );

    const recentMap = new Map<number, number>();
    for (const r of recentRows) {
      recentMap.set(Number(r.agent_id), Number(r.recent_actions) || 0);
    }

    // 평균 시간당 활동 계산
    const totalRecentActions = Array.from(recentMap.values()).reduce((a, b) => a + b, 0);
    const agentCount = agentRows.length || 1;
    const avgActionsPerHour = totalRecentActions / agentCount / 24;

    const agents = agentRows.map((row) => {
      const errorActions = Number(row.error_actions) || 0;
      const totalActions = Number(row.total_actions) || 0;
      const recentActions = recentMap.get(Number(row.agent_id)) || 0;
      const agentActionsPerHour = recentActions / 24;
      const trustScore = Math.max(0, 100 - errorActions * 5);
      const anomalyDetected = avgActionsPerHour > 0 && agentActionsPerHour >= avgActionsPerHour * 3;

      return {
        agent_id: Number(row.agent_id),
        name: row.name,
        trust_score: trustScore,
        total_actions: totalActions,
        error_actions: errorActions,
        last_error: row.last_error || null,
        avg_actions_per_hour: Math.round(agentActionsPerHour * 10) / 10,
        anomaly_detected: anomalyDetected,
      };
    });

    // 최근 에러 로그
    const [errorRows] = await pool.execute<RowDataPacket[]>(
      `SELECT al.agent_id, a.name AS agent_name, al.action, al.message, al.created_at
      FROM activity_logs al
      LEFT JOIN agents a ON al.agent_id = a.id
      WHERE al.project_id = ? AND (al.action LIKE '%error%' OR al.action LIKE '%fail%')
      ORDER BY al.created_at DESC
      LIMIT 5`,
      [projectId]
    );

    // 24시간 API 호출 통계
    const [callRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS api_calls_24h,
        SUM(CASE WHEN action LIKE '%error%' OR action LIKE '%fail%' THEN 1 ELSE 0 END) AS failed_calls_24h
      FROM activity_logs
      WHERE project_id = ? AND created_at >= NOW() - INTERVAL 24 HOUR`,
      [projectId]
    );

    const calls = callRows[0];

    res.json({
      success: true,
      data: {
        agents,
        recent_errors: errorRows.map((r) => ({
          agent_id: r.agent_id,
          agent_name: r.agent_name,
          action: r.action,
          message: r.message,
          created_at: r.created_at,
        })),
        api_calls_24h: Number(calls.api_calls_24h) || 0,
        failed_calls_24h: Number(calls.failed_calls_24h) || 0,
      },
    });
  } catch (err: unknown) {
    console.error('GET /metrics/security error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch security metrics' });
  }
});

export default router;
