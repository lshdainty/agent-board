import { useAgents } from '@/hooks/useAgents';
import { useSelectedAgent } from '@/hooks/useSelectedAgent';
import { cn } from '@/lib/utils';
import type { Agent, AgentStatus } from '@/types';

const STATUS_ORDER: AgentStatus[] = ['working', 'idle', 'offline'];

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

interface AgentListTabProps {
  projectId: number;
}

export function AgentListTab({ projectId }: AgentListTabProps) {
  const { data: agents = [] } = useAgents(projectId);
  const { selectedAgentId, toggleSelectedAgent } = useSelectedAgent();

  const grouped = STATUS_ORDER.reduce<Record<AgentStatus, Agent[]>>(
    (acc, status) => {
      acc[status] = agents.filter((a) => a.status === status);
      return acc;
    },
    { working: [], idle: [], offline: [] },
  );

  return (
    <div className="flex flex-col gap-3">
      {STATUS_ORDER.map((status) => {
        const group = grouped[status];
        if (group.length === 0) return null;
        return (
          <div key={status}>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1.5 px-1">
              {STATUS_LABELS[status]} ({group.length})
            </h4>
            <div className="flex flex-col gap-1">
              {group.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => toggleSelectedAgent(agent.id)}
                  className={cn(
                    'flex items-center gap-2 text-sm p-2 rounded-lg bg-[var(--color-background)] text-left w-full transition-colors hover:bg-[var(--color-bg)]',
                    selectedAgentId === agent.id && 'border border-[var(--color-primary)]',
                    selectedAgentId !== agent.id && 'border border-transparent',
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_INDICATOR[agent.status])} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{agent.name}</span>
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">{agent.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {agents.length === 0 && (
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
          No agents registered yet
        </p>
      )}
    </div>
  );
}
