import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Task, TaskStatus, ApiResponse } from '@/types';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
