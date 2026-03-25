import { useActivities } from '@/hooks/useActivities';
import { formatDistanceToNow } from 'date-fns';
import { Plus, UserCheck, RefreshCw, CheckCircle, MessageSquare } from 'lucide-react';
import type { ComponentType } from 'react';

const ACTION_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  task_created: Plus,
  task_claimed: UserCheck,
  task_updated: RefreshCw,
  task_completed: CheckCircle,
};

interface ActivityTabProps {
  projectId: number;
}

export function ActivityTab({ projectId }: ActivityTabProps) {
  const { data: activities = [] } = useActivities(projectId);

  return (
    <div className="flex flex-col gap-2">
      {activities.map((activity) => {
        const Icon = ACTION_ICONS[activity.action] || MessageSquare;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-2 text-xs p-2 rounded-lg bg-[var(--color-background)]"
          >
            <Icon size={14} className="text-[var(--color-muted-foreground)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-[var(--color-card-foreground)] leading-relaxed break-words [overflow-wrap:anywhere]">
                {activity.agent_name && (
                  <span className="font-medium text-[var(--color-primary)]">
                    {activity.agent_name}
                  </span>
                )}{' '}
                {activity.message}
              </p>
              <p className="text-[var(--color-muted-foreground)] mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
      {activities.length === 0 && (
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
          No activity yet
        </p>
      )}
    </div>
  );
}
