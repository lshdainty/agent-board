import { Sun, Moon } from 'lucide-react';

interface SettingsTabProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function SettingsTab({ theme, onToggleTheme }: SettingsTabProps) {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
