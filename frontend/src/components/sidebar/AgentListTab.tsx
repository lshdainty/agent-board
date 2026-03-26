import { useRef, useEffect, useState } from 'react';
import { useAgents } from '@/hooks/useAgents';
import { useSelectedAgent } from '@/hooks/useSelectedAgent';
import { cn } from '@/lib/utils';
import { Plus, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { CreateAgentDialog } from './CreateAgentDialog';
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

function SkeletonAgentRow() {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-background)] animate-pulse">
      <div className="w-2 h-2 rounded-full bg-[var(--color-muted)]" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="h-4 w-24 bg-[var(--color-muted)] rounded" />
        <div className="h-3 w-16 bg-[var(--color-muted)] rounded" />
      </div>
    </div>
  );
}

export function AgentListTab({ projectId }: AgentListTabProps) {
  const { data: agents = [], isLoading, isError, refetch } = useAgents(projectId);
  const { selectedAgentId, toggleSelectedAgent } = useSelectedAgent();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-9 w-full bg-[var(--color-muted)] rounded-md animate-pulse" />
        <div className="space-y-1">
          <div className="h-3 w-20 bg-[var(--color-muted)] rounded animate-pulse mb-1.5 ml-1" />
          <SkeletonAgentRow />
          <SkeletonAgentRow />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-12 bg-[var(--color-muted)] rounded animate-pulse mb-1.5 ml-1" />
          <SkeletonAgentRow />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-[var(--color-muted-foreground)]">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-xs font-medium">Failed to load agents</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  const grouped = STATUS_ORDER.reduce<Record<AgentStatus, Agent[]>>(
    (acc, status) => {
      acc[status] = agents.filter((a) => a.status === status);
      return acc;
    },
    { working: [], idle: [], offline: [] },
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Add Agent button */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="flex items-center justify-center gap-1 w-full px-3 py-2 text-xs font-medium rounded-md border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors"
      >
        <Plus size={14} />
        Add Agent
      </button>

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
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-[var(--color-muted-foreground)]">
          <Users size={28} className="opacity-40" />
          <p className="text-xs text-center">
            No agents registered yet
          </p>
        </div>
      )}

      {showCreateDialog && (
        <CreateAgentDialog
          projectId={projectId}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}
