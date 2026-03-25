import { useTasks } from '@/hooks/useTasks';
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

export function TaskSummaryTab({ projectId }: TaskSummaryTabProps) {
  const { data: tasks = [] } = useTasks(projectId);

  const counts = STATUS_CONFIG.map(({ status, label, color }) => ({
    label,
    color,
    count: tasks.filter((t) => t.status === status).length,
  }));

  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

  return (
    <div className="flex flex-col gap-3">
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
