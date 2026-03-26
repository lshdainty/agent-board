import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Task, TaskStatus, TaskPriority, ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useTasks(projectId: number) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<Task[]>>('/tasks', {
        params: { project_id: projectId, limit: 500 },
      });
      return resp.data.data;
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      const resp = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}`, { status });
      return resp.data.data;
    },
    onMutate: async ({ taskId, status }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot all task queries for rollback
      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: ['tasks'] });

      // Optimistically update every matching query
      queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback to the previous state
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export interface CreateTaskPayload {
  project_id: number;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: number | null;
  status?: TaskStatus;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const resp = await api.post<ApiResponse<Task>>('/tasks', payload);
      return resp.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  assignee_id?: number | null;
  status?: TaskStatus;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: UpdateTaskPayload }) => {
      const resp = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}`, data);
      return resp.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
