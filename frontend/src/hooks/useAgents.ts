import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Agent, ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useAgents(projectId: number) {
  return useQuery({
    queryKey: ['agents', projectId],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<Agent[]>>('/agents', {
        params: { project_id: projectId },
      });
      return resp.data.data;
    },
  });
}

export interface CreateAgentPayload {
  project_id: number;
  name: string;
  role: string;
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAgentPayload) => {
      const resp = await api.post<ApiResponse<Agent>>('/agents', payload);
      return resp.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export interface UpdateAgentPayload {
  name?: string;
  role?: string;
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, data }: { agentId: number; data: UpdateAgentPayload }) => {
      const resp = await api.patch<ApiResponse<Agent>>(`/agents/${agentId}`, data);
      return resp.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentId: number) => {
      await api.delete(`/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
