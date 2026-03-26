export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AgentStatus = 'idle' | 'working' | 'offline';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: number | null;
  created_by_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  created_by_name?: string;
}

export interface Agent {
  id: number;
  project_id: number;
  name: string;
  role: string;
  status: AgentStatus;
  last_seen_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  project_id: number;
  task_id: number | null;
  agent_id: number | null;
  action: string;
  message: string;
  created_at: string;
  agent_name?: string;
  task_title?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
}

// Agent appearance (deterministic by ID)
export type HairStyle = 'short' | 'long' | 'buzz' | 'hat' | 'ponytail' | 'mohawk' | 'afro';

export interface AgentAppearance {
  shirtColor: string;
  pantsColor: string;
  hairStyle: HairStyle;
  hairColor: string;
}

// Agent position in 3D office
export type AgentZone = 'desk' | 'meeting' | 'coffee' | 'bookshelf';

export type AgentAnimation = 'walking' | 'sitting_typing' | 'sitting_idle' | 'standing_idle';

export interface AgentPosition {
  targetPosition: [number, number, number];
  previousPosition: [number, number, number];
  zone: AgentZone;
  deskIndex?: number;
  animation: AgentAnimation;
}
