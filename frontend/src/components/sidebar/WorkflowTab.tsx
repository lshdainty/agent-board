import { useMemo } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { useActivities } from '@/hooks/useActivities';
import { GitBranch, Clock } from 'lucide-react';

interface WorkflowTabProps {
  projectId: number;
}

const STATUS_COLORS: Record<string, string> = {
  working: '#3b82f6',
  idle: '#22c55e',
  offline: '#6b7280',
};

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function WorkflowTab({ projectId }: WorkflowTabProps) {
  const { data: agents = [] } = useAgents(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: activities = [] } = useActivities(projectId, 200);

  // Build timeline data: per-agent active time ranges from activity_logs
  const agentTimelines = useMemo(() => {
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const timelineStart = dayStart.getTime();
    const timelineEnd = now;
    const totalMs = timelineEnd - timelineStart;

    return agents.map((agent) => {
      const agentActivities = activities
        .filter((a) => a.agent_id === agent.id)
        .map((a) => new Date(a.created_at).getTime())
        .filter((t) => t >= timelineStart)
        .sort((a, b) => a - b);

      // Group activities into work sessions (gap > 5min = new session)
      const sessions: { start: number; end: number }[] = [];
      for (const ts of agentActivities) {
        const last = sessions[sessions.length - 1];
        if (last && ts - last.end < 5 * 60 * 1000) {
          last.end = ts;
        } else {
          sessions.push({ start: ts, end: ts + 60000 });
        }
      }

      // Current task for this agent
      const currentTask = tasks.find(
        (t) => t.assignee_id === agent.id && t.status === 'in_progress',
      );

      // Progress estimate from tasks
      const agentTasks = tasks.filter((t) => t.assignee_id === agent.id);
      const doneTasks = agentTasks.filter((t) => t.status === 'done').length;
      const totalAgentTasks = agentTasks.length;
      const progress = totalAgentTasks > 0 ? Math.round((doneTasks / totalAgentTasks) * 100) : 0;

      // Total active time
      const totalActiveMs = sessions.reduce((sum, s) => sum + (s.end - s.start), 0);

      return {
        agent,
        sessions,
        currentTask,
        progress,
        totalActiveMs,
        timelineStart,
        totalMs,
      };
    });
  }, [agents, tasks, activities]);

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--color-muted-foreground)]">
        <GitBranch size={28} className="opacity-40" />
        <p className="text-xs text-center">No agents found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch size={14} className="text-[var(--color-primary)]" />
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Agent Workflow Timeline
        </h4>
      </div>

      {/* Time axis header */}
      <div className="flex items-center gap-2 px-1">
        <span className="w-20 shrink-0" />
        <div className="flex-1 flex justify-between text-[8px] text-[var(--color-muted-foreground)]">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>Now</span>
        </div>
      </div>

      {/* Gantt-like timeline per agent */}
      <div className="flex flex-col gap-2">
        {agentTimelines.map(({ agent, sessions, currentTask, progress, totalActiveMs, timelineStart, totalMs }) => {
          const statusColor = STATUS_COLORS[agent.status] || '#6b7280';
          return (
            <div key={agent.id} className="rounded-lg p-2 bg-[var(--color-background)]">
              {/* Agent name + status */}
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: statusColor }}
                />
                <span className="text-xs font-medium text-[var(--color-card-foreground)] w-16 truncate shrink-0">
                  {agent.name}
                </span>
                <span className="text-[9px] text-[var(--color-muted-foreground)] capitalize">
                  {agent.status}
                </span>
                <span className="ml-auto text-[9px] text-[var(--color-muted-foreground)]">
                  {progress}%
                </span>
              </div>

              {/* Timeline bar */}
              <div className="relative h-5 rounded bg-[var(--color-muted)] overflow-hidden">
                {/* Progress fill */}
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: statusColor,
                    opacity: 0.25,
                  }}
                />
                {/* Active sessions */}
                {totalMs > 0 && sessions.map((session, i) => {
                  const left = ((session.start - timelineStart) / totalMs) * 100;
                  const width = Math.max(0.5, ((session.end - session.start) / totalMs) * 100);
                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 rounded-sm"
                      style={{
                        left: `${Math.max(0, Math.min(100, left))}%`,
                        width: `${Math.min(100 - left, width)}%`,
                        backgroundColor: statusColor,
                        opacity: 0.7,
                      }}
                      title={`${formatTime(new Date(session.start).toISOString())} - ${formatTime(new Date(session.end).toISOString())}`}
                    />
                  );
                })}
                {/* Progress text overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-medium text-[var(--color-card-foreground)] drop-shadow-sm">
                    {agent.status === 'working' ? `${progress}%` : agent.status === 'idle' ? 'done' : ''}
                  </span>
                </div>
              </div>

              {/* Current task + active time */}
              <div className="flex items-center justify-between mt-1">
                {currentTask ? (
                  <span className="text-[9px] text-[var(--color-card-foreground)] truncate flex-1">
                    {currentTask.title}
                  </span>
                ) : (
                  <span className="text-[9px] text-[var(--color-muted-foreground)] italic">
                    {agent.current_comment || 'No active task'}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-[9px] text-[var(--color-muted-foreground)] shrink-0 ml-2">
                  <Clock size={8} />
                  {formatDuration(totalActiveMs)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
          <span className="text-[9px] text-[var(--color-muted-foreground)]">Working</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-[9px] text-[var(--color-muted-foreground)]">Idle</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#6b7280' }} />
          <span className="text-[9px] text-[var(--color-muted-foreground)]">Offline</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg p-2 text-center bg-[var(--color-background)]">
          <div className="text-lg font-bold text-[var(--color-card-foreground)]">
            {agents.filter((a) => a.status === 'working').length}
          </div>
          <div className="text-[9px] text-[var(--color-muted-foreground)] uppercase">Active</div>
        </div>
        <div className="rounded-lg p-2 text-center bg-[var(--color-background)]">
          <div className="text-lg font-bold text-[var(--color-card-foreground)]">
            {tasks.filter((t) => t.status === 'in_progress').length}
          </div>
          <div className="text-[9px] text-[var(--color-muted-foreground)] uppercase">In Progress</div>
        </div>
        <div className="rounded-lg p-2 text-center bg-[var(--color-background)]">
          <div className="text-lg font-bold text-[var(--color-card-foreground)]">
            {tasks.filter((t) => t.status === 'done').length}
          </div>
          <div className="text-[9px] text-[var(--color-muted-foreground)] uppercase">Done</div>
        </div>
      </div>
    </div>
  );
}
