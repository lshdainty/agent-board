import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskDialog } from './CreateTaskDialog';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useAgents } from '@/hooks/useAgents';
import type { Task, TaskStatus } from '@/types';
import { Plus } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

interface KanbanBoardProps {
  projectId: number;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: tasks = [] } = useTasks(projectId);
  const { data: agents = [] } = useAgents(projectId);
  const updateStatus = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

        <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasks.filter((t) => t.status === col.id)}
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
