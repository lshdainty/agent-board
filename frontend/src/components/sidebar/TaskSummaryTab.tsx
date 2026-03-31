import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import { AlertTriangle, RefreshCw, ListChecks, GitBranch, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/types';

const STATUS_CONFIG: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'Todo', color: 'var(--color-status-todo, #6b7280)' },
  { status: 'in_progress', label: 'In Progress', color: 'var(--color-status-in-progress, #3b82f6)' },
  { status: 'review', label: 'Review', color: 'var(--color-status-review, #f59e0b)' },
  { status: 'done', label: 'Done', color: 'var(--color-status-done, #22c55e)' },
];

const PRIORITY_CONFIG: { priority: TaskPriority; label: string; color: string }[] = [
  { priority: 'urgent', label: 'Urgent', color: '#ef4444' },
  { priority: 'high', label: 'High', color: '#f97316' },
  { priority: 'medium', label: 'Medium', color: '#eab308' },
  { priority: 'low', label: 'Low', color: '#6b7280' },
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

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  working: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  idle: { bg: 'bg-green-500/20', text: 'text-green-400' },
  offline: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

export function TaskSummaryTab({ projectId }: TaskSummaryTabProps) {
  const { data: tasks = [], isLoading, isError, refetch } = useTasks(projectId);
  const { data: agents = [] } = useAgents(projectId);
  const [viewMode, setViewMode] = useState<'summary' | 'workflow'>('summary');

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

  // Agent workload: completed + in-progress per agent
  const agentWorkloadDetailed = agents.map((agent) => {
    const completed = tasks.filter(
      (t) => t.assignee_id === agent.id && t.status === 'done',
    ).length;
    const inProgress = tasks.filter(
      (t) => t.assignee_id === agent.id && t.status !== 'done',
    ).length;
    return { name: agent.name, completed, inProgress };
  });
  const maxAgentTotal = Math.max(1, ...agentWorkloadDetailed.map((a) => a.completed + a.inProgress));

  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

  // Workflow: group in-progress tasks by agent
  const agentWorkflow = agents
    .map((agent) => {
      const agentInProgress = tasks.filter(
        (t) => t.assignee_id === agent.id && t.status === 'in_progress',
      );
      return { agent, tasks: agentInProgress };
    })
    .filter((entry) => entry.tasks.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* View toggle */}
      <div className="flex rounded-lg bg-[var(--color-background)] p-0.5">
        <button
          onClick={() => setViewMode('summary')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-md transition-colors',
            viewMode === 'summary'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          )}
        >
          <BarChart3 size={12} />
          Summary
        </button>
        <button
          onClick={() => setViewMode('workflow')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium rounded-md transition-colors',
            viewMode === 'workflow'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          )}
        >
          <GitBranch size={12} />
          Workflow
        </button>
      </div>

      {/* Workflow view */}
      {viewMode === 'workflow' && (
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1">
            Active Workflows
          </h4>
          {agentWorkflow.length > 0 ? (
            <div className="flex flex-col gap-2">
              {agentWorkflow.map(({ agent, tasks: agentTasks }) => {
                const badge = STATUS_BADGE[agent.status] || STATUS_BADGE.offline;
                return (
                  <div
                    key={agent.id}
                    className="p-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-[var(--color-card-foreground)]">
                        {agent.name}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[9px] rounded font-medium',
                          badge.bg,
                          badge.text,
                        )}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {agentTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                          <div className="flex-1 flex items-center gap-1.5 min-w-0">
                            <span className="h-px flex-1 border-t border-dashed border-[var(--color-border)]" />
                            <span className="text-[11px] text-[var(--color-card-foreground)] truncate max-w-[160px]">
                              {task.title}
                            </span>
                          </div>
                          <span className="shrink-0 px-1.5 py-0.5 text-[9px] rounded bg-blue-500/20 text-blue-400 font-medium">
                            WIP
                          </span>
                        </div>
                      ))}
                    </div>
                    {agent.current_comment && (
                      <p className="mt-1.5 text-[10px] text-[var(--color-muted-foreground)] italic truncate">
                        {agent.current_comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
              No active workflows
            </p>
          )}
        </div>
      )}

      {viewMode === 'summary' && <>
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

      {/* Priority breakdown */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
          Priority Breakdown
        </h4>
        <div className="flex flex-col gap-1">
          {PRIORITY_CONFIG.map(({ priority, label, color }) => {
            const count = tasks.filter((t) => t.priority === priority).length;
            const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
            return (
              <div key={priority} className="flex items-center gap-2 px-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-[var(--color-card-foreground)] w-14 shrink-0">{label}</span>
                <div className="flex-1 h-3 rounded bg-[var(--color-muted)] overflow-hidden">
                  {count > 0 && (
                    <div
                      className="h-full rounded transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-[var(--color-muted-foreground)] w-5 text-right shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent workload bar chart (completed vs in-progress) */}
      {agentWorkloadDetailed.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
            Agent Workload
          </h4>
          <div className="flex flex-col gap-1.5">
            {agentWorkloadDetailed.map((agent) => {
              const totalAgent = agent.completed + agent.inProgress;
              const completedPct = maxAgentTotal > 0 ? (agent.completed / maxAgentTotal) * 100 : 0;
              const inProgressPct = maxAgentTotal > 0 ? (agent.inProgress / maxAgentTotal) * 100 : 0;
              return (
                <div key={agent.name} className="flex items-center gap-2 px-1">
                  <span className="text-xs text-[var(--color-card-foreground)] w-20 truncate shrink-0">
                    {agent.name}
                  </span>
                  <div className="flex-1 h-4 rounded bg-[var(--color-muted)] overflow-hidden flex">
                    {agent.completed > 0 && (
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${completedPct}%`,
                          backgroundColor: 'var(--color-status-done, #22c55e)',
                        }}
                        title={`Completed: ${agent.completed}`}
                      />
                    )}
                    {agent.inProgress > 0 && (
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${inProgressPct}%`,
                          backgroundColor: 'var(--color-status-in-progress, #3b82f6)',
                        }}
                        title={`In Progress: ${agent.inProgress}`}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)] w-5 text-right shrink-0">
                    {totalAgent}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'var(--color-status-done, #22c55e)' }} />
              <span className="text-[9px] text-[var(--color-muted-foreground)]">Done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'var(--color-status-in-progress, #3b82f6)' }} />
              <span className="text-[9px] text-[var(--color-muted-foreground)]">In Progress</span>
            </div>
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
      </>}
    </div>
  );
}
