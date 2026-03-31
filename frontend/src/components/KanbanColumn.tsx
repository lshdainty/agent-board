import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '@/types';
import { ClipboardList, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import type { ComponentType } from 'react';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--color-status-todo)',
  in_progress: 'var(--color-status-in-progress)',
  review: 'var(--color-status-review)',
  done: 'var(--color-status-done)',
};

const EMPTY_STATE: Record<TaskStatus, { icon: ComponentType<{ size?: number; className?: string }>; message: string; colorClass?: string }> = {
  todo: { icon: ClipboardList, message: '할 일을 추가해보세요' },
  in_progress: { icon: Loader2, message: '진행 중인 태스크 없음' },
  review: { icon: Eye, message: '리뷰 대기 없음' },
  done: { icon: CheckCircle2, message: '모두 완료!', colorClass: 'text-green-500' },
};

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const emptyState = EMPTY_STATE[id];
  const EmptyIcon = emptyState.icon;

  return (
    <div
      ref={setNodeRef}
      role="listbox"
      aria-label={`${title} column, ${tasks.length} tasks`}
      className={cn(
        'flex flex-col rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] min-h-0 h-full overflow-hidden transition-all',
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
      <div className="flex flex-col gap-1.5 p-2 flex-1 min-h-0 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onCardClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-2">
            <EmptyIcon size={24} className={cn('opacity-50', emptyState.colorClass || 'text-[var(--color-muted-foreground)]')} />
            <p className={cn('text-xs text-center px-2', emptyState.colorClass || 'text-[var(--color-muted-foreground)]')}>
              {emptyState.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
