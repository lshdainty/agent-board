import { useEffect, useRef, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TabbedSidebar } from '@/components/sidebar/TabbedSidebar';
import { OfficeView } from '@/components/office/OfficeView';
import { useSocket } from '@/hooks/useSocket';
import { useSelectedAgent } from '@/hooks/useSelectedAgent';
import { SelectedAgentProvider } from '@/hooks/useSelectedAgent';
import { SettingsProvider } from '@/hooks/useSettings';
import { ToastContainer } from '@/components/Toast';
import { LayoutDashboard, Building2, ChevronDown, Sun, Moon, Plus, Settings, X, Trash2, PanelRight } from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
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

function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const resp = await axios.post<ApiResponse<Project>>('/api/projects', payload);
      return resp.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: { name?: string; description?: string | null } }) => {
      const resp = await axios.patch<ApiResponse<Project>>(`/api/projects/${projectId}`, data);
      return resp.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: number) => {
      await axios.delete(`/api/projects/${projectId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
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

// ---- Keyboard Shortcut Help Modal ----
const SHORTCUT_ITEMS = [
  { key: '1', desc: 'Agents 탭' },
  { key: '2', desc: 'Tasks 탭' },
  { key: '3', desc: 'Activity 탭' },
  { key: '4', desc: 'Settings 탭' },
  { key: 'O', desc: 'Office 뷰' },
  { key: 'B', desc: 'Board 뷰' },
  { key: 'T', desc: '테마 토글' },
  { key: 'Esc', desc: '에이전트 선택 해제' },
  { key: '?', desc: '이 도움말 표시' },
];

function ShortcutHelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full max-w-xs rounded-xl border border-[var(--color-border)]',
          'bg-[var(--color-card)] shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-card-foreground)]">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {SHORTCUT_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-muted-foreground)]">{item.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[var(--color-muted)] text-[var(--color-foreground)] font-mono text-[11px] border border-[var(--color-border)]">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---- Project Create Dialog ----
function CreateProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const createProject = useCreateProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: (project) => { onCreated(project.id); onClose(); } },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-xl border border-[var(--color-border)]',
          'bg-[var(--color-card)] shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-card-foreground)]">New Project</h2>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createProject.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createProject.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ---- Project Edit Dialog ----
function EditProjectDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data: { name?: string; description?: string | null } = {};
    if (name.trim() !== project.name) data.name = name.trim();
    if (description.trim() !== (project.description || '')) data.description = description.trim() || null;
    if (Object.keys(data).length > 0) {
      updateProject.mutate({ projectId: project.id, data }, { onSuccess: () => onClose() });
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteProject.mutate(project.id, {
      onSuccess: () => { onDeleted(); onClose(); },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-xl border border-[var(--color-border)]',
          'bg-[var(--color-card)] shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-card-foreground)]">Edit Project</h2>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow resize-none"
            />
          </div>

          {confirmDelete && (
            <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
              This will permanently delete the project and all its data. Click Delete again to confirm.
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className={cn(
                'flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors',
                confirmDelete
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'text-red-400 hover:bg-red-500/10',
              )}
            >
              <Trash2 size={14} />
              {deleteProject.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || updateProject.isPending}
                className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProject.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// ---- Mobile Sidebar Sheet ----
function MobileSidebarSheet({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-[var(--color-card)] border-t border-[var(--color-border)] rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-muted-foreground)] opacity-40" />
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Dashboard() {
  const { data: projects } = useProjects();
  const [projectId, setProjectId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedProjectId');
    const num = Number(saved);
    return !isNaN(num) && num > 0 ? num : 1;
  });
  const [activeView, setActiveView] = useState<ViewMode>('office');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<string>('agents');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket(projectId);
  const { setSelectedAgentId } = useSelectedAgent();

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Persist projectId to localStorage
  useEffect(() => {
    localStorage.setItem('selectedProjectId', String(projectId));
  }, [projectId]);

  // Auto-select first project when projects load (only if saved project doesn't exist)
  useEffect(() => {
    if (projects && projects.length > 0) {
      const exists = projects.some((p) => p.id === projectId);
      if (!exists) {
        setProjectId(projects[0].id);
      }
    }
  }, [projects, projectId]);

  // Global keyboard shortcuts
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Skip if any modal is open
      if (showCreateProject || showEditProject || showShortcutHelp) return;

      switch (e.key) {
        case '1':
          setSidebarTab('agents');
          break;
        case '2':
          setSidebarTab('tasks');
          break;
        case '3':
          setSidebarTab('activity');
          break;
        case '4':
          setSidebarTab('settings');
          break;
        case 'o':
        case 'O':
          setActiveView('office');
          break;
        case 'b':
        case 'B':
          setActiveView('kanban');
          break;
        case 't':
        case 'T':
          toggleTheme();
          break;
        case 'Escape':
          setSelectedAgentId(null);
          break;
        case '?':
          e.preventDefault();
          setShowShortcutHelp((prev) => !prev);
          break;
      }
    },
    [showCreateProject, showEditProject, showShortcutHelp, toggleTheme, setSelectedAgentId],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-3 md:px-6 py-3 flex items-center justify-between bg-[var(--color-card)] transition-colors duration-300">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <LayoutDashboard size={20} className="text-[var(--color-primary)]" />
            <h1 className="text-lg font-bold hidden sm:block">Agent Dashboard</h1>
          </div>

          {/* View mode tabs */}
          <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden shrink-0">
            <button
              onClick={() => setActiveView('office')}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'office'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Building2 size={14} />
              <span className="hidden sm:inline">Office</span>
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === 'kanban'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>

          {/* Project selector */}
          <div className="relative flex items-center gap-1 min-w-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors min-w-0"
            >
              <span className="truncate max-w-[80px] md:max-w-none">{currentProject?.name || 'Select Project'}</span>
              <ChevronDown size={14} className="shrink-0" />
            </button>
            {currentProject && (
              <button
                onClick={() => setShowEditProject(true)}
                className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors hidden sm:flex"
                title="Project settings"
              >
                <Settings size={14} />
              </button>
            )}
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
                {/* New Project item at bottom */}
                <div className="border-t border-[var(--color-border)]">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowCreateProject(true);
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-bg)] transition-colors"
                  >
                    <Plus size={14} />
                    New Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] md:hidden"
            title="Open sidebar"
          >
            <PanelRight size={16} />
          </button>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {/* Shortcut help */}
          <button
            onClick={() => setShowShortcutHelp(true)}
            className="p-1.5 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs font-mono hidden sm:block"
            title="Keyboard shortcuts"
          >
            ?
          </button>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="hidden sm:inline">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 p-4 overflow-hidden min-h-0">
        <div className="overflow-hidden h-full relative">
          {activeView === 'kanban' ? (
            <KanbanBoard projectId={projectId} />
          ) : (
            <OfficeView projectId={projectId} theme={theme} />
          )}
        </div>
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col overflow-hidden">
          <TabbedSidebar
            projectId={projectId}
            theme={theme}
            onToggleTheme={toggleTheme}
            externalTab={sidebarTab}
            onTabChange={setSidebarTab}
          />
        </aside>
      </div>

      {/* Mobile sidebar sheet */}
      <MobileSidebarSheet isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)}>
        <TabbedSidebar
          projectId={projectId}
          theme={theme}
          onToggleTheme={toggleTheme}
          externalTab={sidebarTab}
          onTabChange={setSidebarTab}
        />
      </MobileSidebarSheet>

      {/* Toast container */}
      <ToastContainer />

      {/* Project dialogs */}
      {showCreateProject && (
        <CreateProjectDialog
          onClose={() => setShowCreateProject(false)}
          onCreated={(id) => setProjectId(id)}
        />
      )}
      {showEditProject && currentProject && (
        <EditProjectDialog
          project={currentProject}
          onClose={() => setShowEditProject(false)}
          onDeleted={() => {
            // After deletion, select first available project
            if (projects && projects.length > 1) {
              const remaining = projects.filter((p) => p.id !== currentProject.id);
              if (remaining.length > 0) setProjectId(remaining[0].id);
            }
          }}
        />
      )}

      {/* Shortcut help modal */}
      {showShortcutHelp && <ShortcutHelpModal onClose={() => setShowShortcutHelp(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <SelectedAgentProvider>
          <Dashboard />
        </SelectedAgentProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
