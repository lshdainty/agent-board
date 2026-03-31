import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ActivityLog, ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export function useAgentHistory(agentId: number, limit: number = 50) {
  return useQuery({
    queryKey: ['agent-history', agentId, limit],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<ActivityLog[]>>('/metrics/agent-history', {
        params: { agent_id: agentId, limit },
      });
      return resp.data.data;
    },
    enabled: agentId > 0,
  });
}
