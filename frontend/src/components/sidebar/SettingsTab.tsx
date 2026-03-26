import { useState, useEffect } from 'react';
import { Sun, Moon, Layers, List, Tag } from 'lucide-react';

interface SettingsTabProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function useSetting<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export function SettingsTab({ theme, onToggleTheme }: SettingsTabProps) {
  const [shadows, setShadows] = useSetting('settings:shadows', true);
  const [activityLogCount, setActivityLogCount] = useSetting('settings:activityLogCount', 25);
  const [showAgentLabels, setShowAgentLabels] = useSetting('settings:showAgentLabels', true);

  return (
    <div className="flex flex-col gap-5">
      {/* Theme */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          Display Settings
        </h4>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-3 w-full p-3 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-bg)] transition-colors text-sm"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span className="text-[var(--color-card-foreground)]">
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </span>
        </button>
      </div>

      {/* 3D Quality: Shadows */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          3D Quality
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center gap-3">
            <Layers size={16} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-card-foreground)]">Shadows</span>
          </div>
          <button
            onClick={() => setShadows(!shadows)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              shadows ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                shadows ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Activity log count */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          Activity Log
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center gap-3">
            <List size={16} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-card-foreground)]">Display count</span>
          </div>
          <select
            value={activityLogCount}
            onChange={(e) => setActivityLogCount(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Agent name labels */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2 px-1">
          Agent Display
        </h4>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background)]">
          <div className="flex items-center gap-3">
            <Tag size={16} className="text-[var(--color-muted-foreground)]" />
            <span className="text-sm text-[var(--color-card-foreground)]">Name labels</span>
          </div>
          <button
            onClick={() => setShowAgentLabels(!showAgentLabels)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              showAgentLabels ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                showAgentLabels ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
