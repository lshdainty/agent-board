import { useRef, useEffect, useState } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { useSelectedAgent } from '@/hooks/useSelectedAgent';
import { cn } from '@/lib/utils';
import type { Agent, AgentStatus } from '@/types';

const STATUS_ORDER: AgentStatus[] = ['working', 'idle', 'offline'];

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: 'Idle',
  working: 'Working',
  offline: 'Offline',
};

interface AgentListTabProps {
  projectId: number;
}

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === 'working') {
    return (
      <span className="relative w-2 h-2 shrink-0">
        <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
        <span className="relative block w-2 h-2 rounded-full bg-amber-400" />
      </span>
    );
  }
  if (status === 'idle') {
    return <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />;
  }
  return <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />;
}

function AgentRow({ agent, isSelected, onToggle }: { agent: Agent; isSelected: boolean; onToggle: () => void }) {
  const [highlight, setHighlight] = useState(false);
  const prevStatusRef = useRef<AgentStatus>(agent.status);

  // Flash highlight on status change
  useEffect(() => {
    if (prevStatusRef.current !== agent.status) {
      prevStatusRef.current = agent.status;
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [agent.status]);

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 text-sm p-2 rounded-lg bg-[var(--color-background)] text-left w-full transition-all duration-300 hover:bg-[var(--color-bg)]',
        isSelected && 'border border-[var(--color-primary)]',
        !isSelected && 'border border-transparent',
        highlight && 'ring-2 ring-amber-400/50 bg-amber-50/10',
      )}
    >
      <StatusDot status={agent.status} />
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{agent.name}</span>
        <span className="text-[10px] text-[var(--color-muted-foreground)]">{agent.role}</span>
      </div>
      {agent.status === 'working' && (
        <span className="text-[9px] text-amber-500 font-medium uppercase tracking-wide">
          active
        </span>
      )}
    </button>
  );
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
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgentId === agent.id}
                  onToggle={() => toggleSelectedAgent(agent.id)}
                />
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
