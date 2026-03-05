import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '@/types';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--color-status-todo)',
  in_progress: 'var(--color-status-in-progress)',
  review: 'var(--color-status-review)',
  done: 'var(--color-status-done)',
};

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] min-h-[200px] transition-all',
        isOver && 'ring-2 ring-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-background))]',
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[id] }}
          />
          <h3 className="font-semibold text-sm text-[var(--color-foreground)]">{title}</h3>
        </div>
        <span className="text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-muted)] rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onCardClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[100px]">
            <p className="text-xs text-[var(--color-muted-foreground)]">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
