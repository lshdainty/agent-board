import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TabbedSidebar } from '@/components/sidebar/TabbedSidebar';
import { OfficeView } from '@/components/office/OfficeView';
import { useSocket } from '@/hooks/useSocket';
import { SelectedAgentProvider } from '@/hooks/useSelectedAgent';
import { LayoutDashboard, Building2, ChevronDown, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import type { ApiResponse } from '@/types';

interface Project {
  id: number;
  name: string;
  description: string | null;
}

type ViewMode = 'kanban' | 'office';
type Theme = 'light' | 'dark';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const resp = await axios.get<ApiResponse<Project[]>>('/api/projects');
      return resp.data.data;
    },
  });
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}

function Dashboard() {
  const { data: projects } = useProjects();
  const [projectId, setProjectId] = useState<number>(1);
  const [activeView, setActiveView] = useState<ViewMode>('office');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  useSocket(projectId);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects && projects.length > 0) {
      const exists = projects.some((p) => p.id === projectId);
      if (!exists) {
        setProjectId(projects[0].id);
      }
    }
  }, [projects, projectId]);

  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between bg-[var(--color-card)] transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-[var(--color-primary)]" />
            <h1 className="text-lg font-bold">Agent Dashboard</h1>
          </div>

          {/* View mode tabs */}
          <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
            <button
              onClick={() => setActiveView('office')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'office'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Building2 size={14} />
              Office
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'kanban'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <LayoutDashboard size={14} />
              Board
            </button>
          </div>

          {/* Project selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
            >
              {currentProject?.name || 'Select Project'}
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && projects && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg z-50">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProjectId(p.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors ${
                      p.id === projectId ? 'text-[var(--color-primary)] font-medium' : ''
                    }`}
                  >
                    <div>{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-[var(--color-muted-foreground)] truncate">{p.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Connected
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[1fr_300px] gap-4 p-4 overflow-hidden min-h-0">
        <div className="overflow-hidden h-full relative">
          {activeView === 'kanban' ? (
            <KanbanBoard projectId={projectId} />
          ) : (
            <OfficeView projectId={projectId} theme={theme} />
          )}
        </div>
        <aside className="flex flex-col overflow-hidden">
          <TabbedSidebar projectId={projectId} theme={theme} onToggleTheme={toggleTheme} />
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SelectedAgentProvider>
        <Dashboard />
      </SelectedAgentProvider>
    </QueryClientProvider>
  );
}
