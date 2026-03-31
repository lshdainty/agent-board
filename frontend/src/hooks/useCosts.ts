import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

interface AgentCost {
  agent_id: number;
  name: string;
  activities: number;
  estimated_cost: number;
}

interface DayCost {
  date: string;
  activities: number;
  cost: number;
}

export interface CostData {
  total_activities: number;
  estimated_cost_usd: number;
  by_agent: AgentCost[];
  by_day: DayCost[];
}

export function useCosts(projectId: number) {
  return useQuery({
    queryKey: ['costs', projectId],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<CostData>>('/metrics/costs', {
        params: { project_id: projectId },
      });
      return resp.data.data;
    },
    refetchInterval: 30000,
  });
}
