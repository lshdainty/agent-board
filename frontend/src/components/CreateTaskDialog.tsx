import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import type { Agent, TaskPriority } from '@/types';

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface CreateTaskDialogProps {
  projectId: number;
  agents: Agent[];
  onClose: () => void;
}

export function CreateTaskDialog({ projectId, agents, onClose }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignee_id: assigneeId ? Number(assigneeId) : null,
        status: 'todo',
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl border border-[var(--color-border)]',
          'bg-[var(--color-card)] shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-card-foreground)]">New Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow resize-none"
            />
          </div>

          {/* Priority & Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
