import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority, Agent } from '@/types';
import { X, User, Calendar, Clock, Flag, AlignLeft, Pencil, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateTask } from '@/hooks/useTasks';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

interface TaskDetailModalProps {
  task: Task;
  agents?: Agent[];
  onClose: () => void;
}

export function TaskDetailModal({ task, agents = [], onClose }: TaskDetailModalProps) {
  const updateTask = useUpdateTask();
  const modalRef = useRef<HTMLDivElement>(null);

  // Editable state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [descValue, setDescValue] = useState(task.description || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus trap
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleFocusTrap(e);
      if (e.key === 'Escape') {
        if (editingTitle) { setEditingTitle(false); setTitleValue(task.title); return; }
        if (editingDesc) { setEditingDesc(false); setDescValue(task.description || ''); return; }
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, editingTitle, editingDesc, task.title, task.description, handleFocusTrap]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (editingDesc && descInputRef.current) descInputRef.current.focus();
  }, [editingDesc]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateStr;
    }
  };

  const saveTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask.mutate({ taskId: task.id, data: { title: trimmed } });
    } else {
      setTitleValue(task.title);
    }
    setEditingTitle(false);
  };

  const saveDescription = () => {
    const trimmed = descValue.trim();
    if (trimmed !== (task.description || '')) {
      updateTask.mutate({ taskId: task.id, data: { description: trimmed || null } });
    }
    setEditingDesc(false);
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (status !== task.status) {
      updateTask.mutate({ taskId: task.id, data: { status } });
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    if (priority !== task.priority) {
      updateTask.mutate({ taskId: task.id, data: { priority } });
    }
  };

  const handleAssigneeChange = (assigneeId: string) => {
    const newId = assigneeId ? Number(assigneeId) : null;
    if (newId !== task.assignee_id) {
      updateTask.mutate({ taskId: task.id, data: { assignee_id: newId } });
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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Task details: ${task.title}`}
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
          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }}
                className="flex-1 text-lg font-semibold text-[var(--color-card-foreground)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button onClick={saveTitle} className="p-1 rounded text-green-500 hover:bg-green-500/10">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 group cursor-pointer" onClick={() => setEditingTitle(true)}>
              <h2 className="text-lg font-semibold text-[var(--color-card-foreground)] leading-snug flex-1">
                {task.title}
              </h2>
              <Pencil size={14} className="text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status & Priority dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-card-foreground)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={task.priority}
              onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
              className="text-xs font-medium px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-card-foreground)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>

          {/* Assignee dropdown */}
          <div className="flex items-center gap-2">
            <User size={14} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-muted-foreground)]">Assignee:</span>
            <select
              value={task.assignee_id ?? ''}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="text-sm font-medium text-[var(--color-card-foreground)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

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
              {!editingDesc && (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="ml-auto p-1 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  ref={descInputRef}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-card-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setEditingDesc(false); setDescValue(task.description || ''); }}
                    className="px-3 py-1 text-xs rounded-md border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveDescription}
                    className="px-3 py-1 text-xs rounded-md bg-[var(--color-primary)] text-white hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : task.description ? (
              <div
                className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-3 cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                onClick={() => setEditingDesc(true)}
              >
                <p className="text-sm text-[var(--color-card-foreground)] whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            ) : (
              <p
                className="text-sm text-[var(--color-muted-foreground)] italic cursor-pointer hover:text-[var(--color-foreground)]"
                onClick={() => setEditingDesc(true)}
              >
                Click to add description...
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
