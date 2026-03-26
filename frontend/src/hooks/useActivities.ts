import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ActivityLog, ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useActivities(projectId: number, limit: number = 50) {
  return useQuery({
    queryKey: ['activities', projectId, limit],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<ActivityLog[]>>('/activities', {
        params: { project_id: projectId, limit },
      });
      return resp.data.data;
    },
  });
}
