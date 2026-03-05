import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { GripVertical, User } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'border-l-[var(--color-priority-low)]',
  medium: 'border-l-[var(--color-priority-medium)]',
  high: 'border-l-[var(--color-priority-high)]',
  urgent: 'border-l-[var(--color-priority-urgent)]',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
  onCardClick?: (task: Task) => void;
}

export function TaskCard({ task, isDragOverlay, onCardClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      className={cn(
        'rounded-lg border border-l-4 bg-[var(--color-card)] p-3 shadow-sm transition-all',
        PRIORITY_COLORS[task.priority],
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-xl rotate-2 scale-105',
        !isDragOverlay && 'hover:shadow-md cursor-pointer',
      )}
      onClick={() => {
        if (!isDragOverlay && onCardClick) onCardClick(task);
      }}
    >
      <div className="flex items-start gap-2">
        {!isDragOverlay && (
          <button
            {...listeners}
            {...attributes}
            className="mt-0.5 cursor-grab text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-card-foreground)] leading-snug">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-priority-${task.priority}) 20%, transparent)`,
                color: `var(--color-priority-${task.priority})`,
              }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.assignee_name && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--color-muted-foreground)]">
                <User size={10} />
                {task.assignee_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
