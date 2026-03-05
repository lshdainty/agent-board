import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { X, User, Calendar, Clock, Flag, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateStr;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-lg rounded-xl border border-[var(--color-border)]',
          'bg-[var(--color-card)] shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
          'max-h-[85vh] flex flex-col',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-card-foreground)] leading-snug flex-1">
            {task.title}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status & Priority badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-status-${task.status.replace('_', '-')}) 20%, transparent)`,
                color: `var(--color-status-${task.status.replace('_', '-')})`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `var(--color-status-${task.status.replace('_', '-')})` }}
              />
              {STATUS_LABELS[task.status]}
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-priority-${task.priority}) 20%, transparent)`,
                color: `var(--color-priority-${task.priority})`,
              }}
            >
              <Flag size={10} />
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>

          {/* Assignee */}
          {task.assignee_name && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-sm text-[var(--color-muted-foreground)]">Assignee:</span>
              <span className="text-sm font-medium text-[var(--color-card-foreground)]">
                {task.assignee_name}
              </span>
            </div>
          )}

          {/* Created by */}
          {task.created_by_name && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-sm text-[var(--color-muted-foreground)]">Created by:</span>
              <span className="text-sm font-medium text-[var(--color-card-foreground)]">
                {task.created_by_name}
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlignLeft size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--color-muted-foreground)]">
                Description
              </span>
            </div>
            {task.description ? (
              <div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-3">
                <p className="text-sm text-[var(--color-card-foreground)] whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)] italic">
                No description provided.
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Created: {formatDate(task.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Updated: {formatDate(task.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
