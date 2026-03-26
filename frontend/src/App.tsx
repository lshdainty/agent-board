import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TabbedSidebar } from '@/components/sidebar/TabbedSidebar';
import { OfficeView } from '@/components/office/OfficeView';
import { useSocket } from '@/hooks/useSocket';
import { SelectedAgentProvider } from '@/hooks/useSelectedAgent';
import { LayoutDashboard, Building2, ChevronDown, Sun, Moon, Plus, Settings, X, Trash2 } from 'lucide-react';
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

function Dashboard() {
  const { data: projects } = useProjects();
  const [projectId, setProjectId] = useState<number>(1);
  const [activeView, setActiveView] = useState<ViewMode>('office');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket(projectId);

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
          <div className="relative flex items-center gap-1" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
            >
              {currentProject?.name || 'Select Project'}
              <ChevronDown size={14} />
            </button>
            {currentProject && (
              <button
                onClick={() => setShowEditProject(true)}
                className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
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
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
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
