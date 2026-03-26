import { useRef, useEffect, useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { Plus, UserCheck, RefreshCw, CheckCircle, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';

const ACTION_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  task_created: Plus,
  task_claimed: UserCheck,
  task_updated: RefreshCw,
  task_completed: CheckCircle,
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ActivityTabProps {
  projectId: number;
}

function ActivityRow({ activity, isNew }: {
  activity: { id: number; action: string; agent_name?: string; message: string; created_at: string };
  isNew: boolean;
}) {
  const [visible, setVisible] = useState(!isNew);
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(activity.created_at));
  const ref = useRef<HTMLDivElement>(null);

  // Slide-in animation for new items
  useEffect(() => {
    if (isNew) {
      // Trigger animation on next frame
      requestAnimationFrame(() => setVisible(true));
    }
  }, [isNew]);

  // Update relative time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(activity.created_at));
    }, 30000);
    return () => clearInterval(interval);
  }, [activity.created_at]);

  const Icon = ACTION_ICONS[activity.action] || MessageSquare;

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start gap-2 text-xs p-2 rounded-lg bg-[var(--color-background)] transition-all duration-500 ease-out',
        isNew && !visible && 'opacity-0 translate-y-2 max-h-0 overflow-hidden',
        isNew && visible && 'opacity-100 translate-y-0 max-h-40',
        !isNew && 'opacity-100',
      )}
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
          {relativeTime}
        </p>
      </div>
    </div>
  );
}

export function ActivityTab({ projectId }: ActivityTabProps) {
  const { data: activities = [] } = useActivities(projectId);
  const prevCountRef = useRef(activities.length);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Track newly added activities
  useEffect(() => {
    if (activities.length > prevCountRef.current) {
      const newCount = activities.length - prevCountRef.current;
      const ids = new Set<number>();
      for (let i = 0; i < newCount; i++) {
        ids.add(activities[i].id);
      }
      setNewIds(ids);

      // Clear "new" status after animation
      const timer = setTimeout(() => setNewIds(new Set()), 600);
      prevCountRef.current = activities.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = activities.length;
  }, [activities]);

  const filteredActivities = searchQuery
    ? activities.filter((a) => {
        const q = searchQuery.toLowerCase();
        return (
          a.message.toLowerCase().includes(q) ||
          (a.agent_name && a.agent_name.toLowerCase().includes(q))
        );
      })
    : activities;

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <input
          type="text"
          placeholder="Search activity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
        />
      </div>

      {filteredActivities.map((activity) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          isNew={newIds.has(activity.id)}
        />
      ))}
      {activities.length === 0 && (
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
          No activity yet
        </p>
      )}
      {activities.length > 0 && filteredActivities.length === 0 && searchQuery && (
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
          No matching activity
        </p>
      )}
    </div>
  );
}
