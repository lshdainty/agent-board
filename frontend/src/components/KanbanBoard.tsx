import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskDialog } from './CreateTaskDialog';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { Plus, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface KanbanBoardProps {
  projectId: number;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: tasks = [], isLoading, isError, refetch } = useTasks(projectId);
  const { data: agents = [] } = useAgents(projectId);
  const updateStatus = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<number | 'all'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all' && t.assignee_id !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === Number(event.active.id));
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      updateStatus.mutate({ taskId, status: newStatus });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-center justify-between shrink-0">
          <div className="h-5 w-16 bg-[var(--color-muted)] rounded animate-pulse" />
          <div className="h-8 w-24 bg-[var(--color-muted)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex flex-col rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] min-h-0 h-full overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <div className="h-4 w-20 bg-[var(--color-muted)] rounded animate-pulse" />
                <div className="h-5 w-6 bg-[var(--color-muted)] rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5 p-2 flex-1">
                {[...Array(col.id === 'todo' ? 3 : col.id === 'in_progress' ? 2 : 1)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-[var(--color-muted)] rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-[var(--color-muted)] rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-4 w-12 bg-[var(--color-muted)] rounded-full animate-pulse" />
                      <div className="h-4 w-16 bg-[var(--color-muted)] rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-muted-foreground)]">
        <AlertTriangle size={40} className="text-red-400" />
        <p className="text-sm font-medium">Failed to load tasks</p>
        <p className="text-xs">Something went wrong. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all';

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full gap-3">
        {/* Header with New Task button */}
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Tasks</h2>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="appearance-none pl-7 pr-6 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <select
            value={assigneeFilter === 'all' ? 'all' : String(assigneeFilter)}
            onChange={(e) => setAssigneeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="appearance-none px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow cursor-pointer"
          >
            <option value="all">All Assignees</option>
            {agents.map((agent) => (
              <option key={agent.id} value={String(agent.id)}>{agent.name}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setAssigneeFilter('all');
              }}
              className="px-2 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={filteredTasks.filter((t) => t.status === col.id)}
              onTaskClick={(task) => setSelectedTask(task)}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          agents={agents}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {showCreateDialog && (
        <CreateTaskDialog
          projectId={projectId}
          agents={agents}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </DndContext>
  );
}
