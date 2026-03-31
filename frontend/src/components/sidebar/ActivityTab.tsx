import { useRef, useEffect, useState, useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { Plus, UserCheck, RefreshCw, CheckCircle, MessageSquare, Search, UserCog, List, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';
import type { ComponentType } from 'react';

type ViewMode = 'list' | 'timeline';

const ACTION_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  task_created: Plus,
  task_claimed: UserCheck,
  task_updated: RefreshCw,
  task_completed: CheckCircle,
  agent_status_changed: UserCog,
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return '방금 전';
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
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

  useEffect(() => {
    if (isNew) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [isNew]);

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

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return '오늘';
  if (dateOnly.getTime() === yesterday.getTime()) return '어제';
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

interface GroupedActivities {
  dateKey: string;
  dateLabel: string;
  items: { id: number; action: string; agent_name?: string; message: string; created_at: string }[];
}

export function ActivityTab({ projectId }: ActivityTabProps) {
  const { settings } = useSettings();
  const { data: activities = [] } = useActivities(projectId, settings.activityLogCount);
  const prevLatestIdRef = useRef(activities[0]?.id ?? 0);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    const latestId = activities[0]?.id ?? 0;
    if (latestId > prevLatestIdRef.current) {
      const ids = new Set<number>();
      for (const a of activities) {
        if (a.id > prevLatestIdRef.current) ids.add(a.id);
        else break;
      }
      setNewIds(ids);

      const timer = setTimeout(() => setNewIds(new Set()), 600);
      prevLatestIdRef.current = latestId;
      return () => clearTimeout(timer);
    }
    prevLatestIdRef.current = latestId;
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

  const groupedByDate = useMemo<GroupedActivities[]>(() => {
    const groups: Record<string, GroupedActivities> = {};
    for (const act of filteredActivities) {
      const d = new Date(act.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) {
        groups[dateKey] = { dateKey, dateLabel: formatDateHeader(act.created_at), items: [] };
      }
      groups[dateKey].items.push(act);
    }
    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredActivities]);

  return (
    <div className="flex flex-col gap-2">
      {/* View toggle + search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="활동 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
          />
        </div>
        <div className="flex items-center rounded-md border border-[var(--color-border)] overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
            title="목록 뷰"
          >
            <List size={12} />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              'p-1.5 transition-colors',
              viewMode === 'timeline'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
            title="타임라인 뷰"
          >
            <Clock size={12} />
          </button>
        </div>
      </div>

      {/* List view */}
      {viewMode === 'list' && (
        <>
          {filteredActivities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              isNew={newIds.has(activity.id)}
            />
          ))}
        </>
      )}

      {/* Timeline view */}
      {viewMode === 'timeline' && (
        <div className="flex flex-col gap-0">
          {groupedByDate.map((group) => (
            <div key={group.dateKey} className="relative pl-4">
              {/* Vertical line */}
              <div
                className="absolute left-[5px] top-3 bottom-0 w-px bg-[var(--color-border)]"
              />
              {/* Date header with dot */}
              <div className="flex items-center gap-2 mb-2 relative">
                <span className="absolute left-[-13px] w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-card)] z-10" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {group.dateLabel}
                </span>
              </div>
              {/* Activities for this date */}
              <div className="flex flex-col gap-1 mb-3">
                {group.items.map((activity) => {
                  const Icon = ACTION_ICONS[activity.action] || MessageSquare;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 text-xs p-2 rounded-lg bg-[var(--color-background)] relative"
                    >
                      <span className="absolute left-[-13px] top-3 w-1.5 h-1.5 rounded-full bg-[var(--color-muted-foreground)] opacity-50" />
                      <Icon size={12} className="text-[var(--color-muted-foreground)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--color-card-foreground)] leading-relaxed break-words [overflow-wrap:anywhere]">
                          {activity.agent_name && (
                            <span className="font-medium text-[var(--color-primary)]">{activity.agent_name}</span>
                          )}{' '}
                          {activity.message}
                        </p>
                        <p className="text-[var(--color-muted-foreground)] mt-0.5">
                          {formatTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activities.length === 0 && (
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
          아직 활동 내역이 없습니다
        </p>
      )}
      {activities.length > 0 && filteredActivities.length === 0 && searchQuery && (
        <p className="text-xs text-[var(--color-muted-foreground)] text-center py-4">
          검색 결과가 없습니다
        </p>
      )}
    </div>
  );
}
