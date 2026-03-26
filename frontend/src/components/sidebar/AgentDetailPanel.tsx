import { useState } from 'react';
import { useAgents, useUpdateAgent, useDeleteAgent } from '@/hooks/useAgents';
import { useTasks } from '@/hooks/useTasks';
import { useActivities } from '@/hooks/useActivities';
import { cn } from '@/lib/utils';
import { ArrowLeft, Pencil, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AgentStatus } from '@/types';

const STATUS_INDICATOR: Record<AgentStatus, string> = {
  idle: 'bg-green-400',
  working: 'bg-amber-400 animate-pulse',
  offline: 'bg-gray-500',
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  offline: 'Offline',
};

interface AgentDetailPanelProps {
  agentId: number;
  projectId: number;
  onClose: () => void;
}

export function AgentDetailPanel({ agentId, projectId, onClose }: AgentDetailPanelProps) {
  const { data: agents = [] } = useAgents(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: activities = [] } = useActivities(projectId);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const agent = agents.find((a) => a.id === agentId);
  const agentActivities = activities
    .filter((act) => act.agent_id === agentId)
    .slice(0, 5);

  // Task breakdowns for this agent
  const agentTasks = tasks.filter((t) => t.assignee_id === agentId);
  const currentTasks = agentTasks.filter((t) => t.status === 'in_progress');
  const assignedTasks = agentTasks.filter((t) => t.status !== 'done');
  const completedCount = agentTasks.filter((t) => t.status === 'done').length;

  // Last activity timestamp
  const lastActivity = agentActivities.length > 0 ? agentActivities[0] : null;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!agent) {
    return (
      <div className="p-4">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3">
          <ArrowLeft size={14} />
          Back
        </button>
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">Agent not found</p>
      </div>
    );
  }

  const startEditing = () => {
    setEditName(agent.name);
    setEditRole(agent.role);
    setEditing(true);
    setConfirmDelete(false);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEdit = () => {
    const trimmedName = editName.trim();
    const trimmedRole = editRole.trim();
    if (!trimmedName || !trimmedRole) return;

    const data: Record<string, string> = {};
    if (trimmedName !== agent.name) data.name = trimmedName;
    if (trimmedRole !== agent.role) data.role = trimmedRole;

    if (Object.keys(data).length > 0) {
      updateAgent.mutate({ agentId: agent.id, data });
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteAgent.mutate(agent.id, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={startEditing}
              className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              title="Edit agent"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleteAgent.isPending}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              confirmDelete
                ? 'text-white bg-red-500 hover:bg-red-600'
                : 'text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10',
            )}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete agent'}
          >
            <Trash2 size={14} />
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
              title="Cancel delete"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
          Click the delete button again to permanently remove this agent.
        </div>
      )}

      <div className="p-3 rounded-lg bg-[var(--color-background)]">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-muted-foreground)] mb-1">Name</label>
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-muted-foreground)] mb-1">Role</label>
              <input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelEditing}
                className="px-3 py-1 text-xs rounded-md border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!editName.trim() || !editRole.trim() || updateAgent.isPending}
                className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-50"
              >
                <Check size={12} />
                {updateAgent.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('w-3 h-3 rounded-full shrink-0', STATUS_INDICATOR[agent.status])} />
              <h3 className="font-semibold text-sm">{agent.name}</h3>
            </div>
            <div className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]">
              <span>Role: {agent.role}</span>
              <span>Status: {STATUS_LABELS[agent.status]}</span>
              <span>Completed: {completedCount} tasks</span>
              {lastActivity && (
                <span>
                  Last activity: {formatDistanceToNow(new Date(lastActivity.created_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Current tasks (in_progress) */}
      {currentTasks.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
            Current Task
          </h4>
          <div className="flex flex-col gap-1">
            {currentTasks.map((task) => (
              <div key={task.id} className="text-xs p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="font-medium text-[var(--color-card-foreground)] truncate">{task.title}</p>
                {task.description && (
                  <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{task.description}</p>
                )}
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400">
                  In Progress
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned tasks (non-done) */}
      {assignedTasks.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
            Assigned Tasks ({assignedTasks.length})
          </h4>
          <div className="flex flex-col gap-1">
            {assignedTasks.map((task) => (
              <div key={task.id} className="text-xs p-2 rounded-lg bg-[var(--color-background)]">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-medium text-[var(--color-card-foreground)] truncate">{task.title}</p>
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                    {task.status === 'in_progress' ? 'WIP' : task.status === 'review' ? 'Review' : 'Todo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
          Recent Activity
        </h4>
        <div className="flex flex-col gap-1">
          {agentActivities.map((activity) => (
            <div key={activity.id} className="text-xs p-2 rounded-lg bg-[var(--color-background)]">
              <p className="text-[var(--color-card-foreground)] leading-relaxed break-words [overflow-wrap:anywhere]">
                {activity.message}
              </p>
              <p className="text-[var(--color-muted-foreground)] mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          ))}
          {agentActivities.length === 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
