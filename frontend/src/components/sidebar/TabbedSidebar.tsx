import { useState, useEffect } from 'react';
import { Users, ListTodo, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectedAgent } from '@/hooks/useSelectedAgent';
import { AgentListTab } from './AgentListTab';
import { AgentDetailPanel } from './AgentDetailPanel';
import { TaskSummaryTab } from './TaskSummaryTab';
import { ActivityTab } from './ActivityTab';
import { SettingsTab } from './SettingsTab';
import type { ComponentType } from 'react';

type TabId = 'agents' | 'tasks' | 'activity' | 'settings';

interface TabConfig {
  id: TabId;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface TabbedSidebarProps {
  projectId: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function TabbedSidebar({ projectId, theme, onToggleTheme }: TabbedSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('agents');
  const { selectedAgentId, setSelectedAgentId } = useSelectedAgent();

  // Auto-switch to agents tab when an agent is selected (e.g. from 3D view)
  useEffect(() => {
    if (selectedAgentId !== null) {
      setActiveTab('agents');
    }
  }, [selectedAgentId]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-card)] rounded-lg border border-[var(--color-border)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {activeTab === 'agents' && (
          selectedAgentId ? (
            <AgentDetailPanel
              agentId={selectedAgentId}
              projectId={projectId}
              onClose={() => setSelectedAgentId(null)}
            />
          ) : (
            <AgentListTab projectId={projectId} />
          )
        )}
        {activeTab === 'tasks' && <TaskSummaryTab projectId={projectId} />}
        {activeTab === 'activity' && <ActivityTab projectId={projectId} />}
        {activeTab === 'settings' && <SettingsTab theme={theme} onToggleTheme={onToggleTheme} />}
      </div>
    </div>
  );
}
