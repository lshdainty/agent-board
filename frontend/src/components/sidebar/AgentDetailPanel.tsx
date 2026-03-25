import { useAgents } from '@/hooks/useAgents';
import { useActivities } from '@/hooks/useActivities';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
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
  const { data: activities = [] } = useActivities(projectId);

  const agent = agents.find((a) => a.id === agentId);
  const agentActivities = activities
    .filter((act) => act.agent_id === agentId)
    .slice(0, 5);

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

  return (
    <div className="flex flex-col gap-3">
      <button onClick={onClose} className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] self-start">
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="p-3 rounded-lg bg-[var(--color-background)]">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('w-3 h-3 rounded-full shrink-0', STATUS_INDICATOR[agent.status])} />
          <h3 className="font-semibold text-sm">{agent.name}</h3>
        </div>
        <div className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)]">
          <span>Role: {agent.role}</span>
          <span>Status: {STATUS_LABELS[agent.status]}</span>
        </div>
      </div>

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
