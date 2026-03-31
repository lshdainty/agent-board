import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ApiResponse } from '@/types';

const api = axios.create({ baseURL: '/api' });

export interface SecurityAgent {
  agent_id: number;
  name: string;
  trust_score: number;
  total_actions: number;
  error_actions: number;
  last_error: string | null;
  avg_actions_per_hour: number;
  anomaly_detected: boolean;
}

export interface SecurityError {
  agent_id: number;
  agent_name: string;
  action: string;
  message: string;
  created_at: string;
}

export interface SecurityMetrics {
  agents: SecurityAgent[];
  recent_errors: SecurityError[];
  api_calls_24h: number;
  failed_calls_24h: number;
}

export function useSecurityMetrics(projectId: number) {
  return useQuery({
    queryKey: ['security-metrics', projectId],
    queryFn: async () => {
      const resp = await api.get<ApiResponse<SecurityMetrics>>('/metrics/security', {
        params: { project_id: projectId },
      });
      return resp.data.data;
    },
    refetchInterval: 30000,
  });
}
