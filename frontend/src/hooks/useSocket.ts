import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/components/Toast';

export function useSocket(projectId: number) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Dashboard connected');
      setIsConnected(true);
      socket.emit('join_project', projectId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    const taskEvents = ['task:created', 'task:updated', 'task:claimed', 'task:completed'];
    const agentEvents = ['agent:registered', 'agent:status_changed'];

    taskEvents.forEach((event) => {
      socket.on(event, (data?: { title?: string }) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['activities'] });

        const title = data?.title || 'Unknown';
        if (event === 'task:created') {
          showToast(`새 태스크: ${title}`);
        } else if (event === 'task:updated' || event === 'task:claimed' || event === 'task:completed') {
          showToast(`태스크 업데이트: ${title}`);
        }
      });
    });

    agentEvents.forEach((event) => {
      socket.on(event, (data?: { agent?: string; name?: string; status?: string }) => {
        queryClient.invalidateQueries({ queryKey: ['agents'] });

        if (event === 'agent:status_changed') {
          const agentName = data?.agent || data?.name || 'Agent';
          const status = data?.status || 'unknown';
          showToast(`${agentName} → ${status}`);
        }
      });
    });

    socket.on('activity:logged', () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, queryClient]);

  return { socketRef, isConnected };
}
