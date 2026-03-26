import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { AlertTriangle, RefreshCw, ListChecks } from 'lucide-react';
import type { TaskStatus } from '@/types';

const STATUS_CONFIG: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'Todo', color: 'var(--color-status-todo, #6b7280)' },
  { status: 'in_progress', label: 'In Progress', color: 'var(--color-status-in-progress, #3b82f6)' },
  { status: 'review', label: 'Review', color: 'var(--color-status-review, #f59e0b)' },
  { status: 'done', label: 'Done', color: 'var(--color-status-done, #22c55e)' },
];

interface TaskSummaryTabProps {
  projectId: number;
}

function SkeletonSummaryCard() {
  return (
    <div className="rounded-lg p-3 bg-[var(--color-muted)] animate-pulse">
      <div className="h-7 w-8 bg-[var(--color-background)] rounded mx-auto mb-1 opacity-30" />
      <div className="h-3 w-14 bg-[var(--color-background)] rounded mx-auto opacity-30" />
    </div>
  );
}

export function TaskSummaryTab({ projectId }: TaskSummaryTabProps) {
  const { data: tasks = [], isLoading, isError, refetch } = useTasks(projectId);
  const { data: agents = [] } = useAgents(projectId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-16 bg-[var(--color-muted)] rounded-lg animate-pulse" />
        <div className="h-12 bg-[var(--color-muted)] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
          <SkeletonSummaryCard />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-[var(--color-muted-foreground)]">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-xs font-medium">Failed to load tasks</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--color-muted-foreground)]">
        <ListChecks size={28} className="opacity-40" />
        <p className="text-xs text-center">No tasks yet</p>
      </div>
    );
  }

  const counts = STATUS_CONFIG.map(({ status, label, color }) => ({
    label,
    color,
    count: tasks.filter((t) => t.status === status).length,
  }));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Today completed count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCompleted = tasks.filter((t) => {
    if (t.status !== 'done') return false;
    const updated = new Date(t.updated_at);
    return updated >= todayStart;
  }).length;

  // Agent workload: count of assigned (non-done) tasks per agent
  const agentWorkload = agents.map((agent) => {
    const assignedCount = tasks.filter(
      (t) => t.assignee_id === agent.id && t.status !== 'done',
    ).length;
    return { name: agent.name, count: assignedCount };
  });
  const maxWorkload = Math.max(1, ...agentWorkload.map((a) => a.count));

  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Progress
            </span>
            <span className="text-xs font-medium text-[var(--color-card-foreground)]">
              {doneTasks}/{totalTasks} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: 'var(--color-status-done, #22c55e)',
              }}
            />
          </div>
        </div>
      )}

      {/* Today completed */}
      <div className="p-3 rounded-lg bg-[var(--color-background)] flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Today Completed
        </span>
        <span className="text-lg font-bold text-[var(--color-card-foreground)]">{todayCompleted}</span>
      </div>

      {/* Status counts grid */}
      <div className="grid grid-cols-2 gap-2">
        {counts.map(({ label, color, count }) => (
          <div
            key={label}
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: color, opacity: 0.85 }}
          >
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Agent workload mini bar chart */}
      {agentWorkload.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
            Agent Workload
          </h4>
          <div className="flex flex-col gap-1.5">
            {agentWorkload.map((agent) => (
              <div key={agent.name} className="flex items-center gap-2 px-1">
                <span className="text-xs text-[var(--color-card-foreground)] w-20 truncate shrink-0">
                  {agent.name}
                </span>
                <div className="flex-1 h-4 rounded bg-[var(--color-muted)] overflow-hidden">
                  {agent.count > 0 && (
                    <div
                      className="h-full rounded bg-[var(--color-primary)] transition-all duration-300"
                      style={{ width: `${(agent.count / maxWorkload) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-[var(--color-muted-foreground)] w-5 text-right shrink-0">
                  {agent.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-progress tasks */}
      {inProgressTasks.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
            In Progress
          </h4>
          <div className="flex flex-col gap-1">
            {inProgressTasks.map((task) => (
              <div key={task.id} className="text-xs p-2 rounded-lg bg-[var(--color-background)]">
                <p className="font-medium text-[var(--color-card-foreground)] truncate">{task.title}</p>
                {task.description && (
                  <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{task.description}</p>
                )}
                {task.assignee_name && (
                  <p className="text-[var(--color-muted-foreground)] mt-0.5">{task.assignee_name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
