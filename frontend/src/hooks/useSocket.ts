import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/components/Toast';

export function useSocket(projectId: number) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const prevProjectIdRef = useRef<number | null>(null);

  // Create socket connection once
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
      prevProjectIdRef.current = projectId;
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
          showToast(`새 태스크: ${title}`, 'info');
        } else if (event === 'task:completed') {
          showToast(`태스크 '${title}'이 완료되었습니다`, 'success');
        } else if (event === 'task:updated' || event === 'task:claimed') {
          showToast(`태스크 업데이트: ${title}`, 'info');
        }
      });
    });

    agentEvents.forEach((event) => {
      socket.on(event, (data?: { agent?: string; name?: string; status?: string }) => {
        queryClient.invalidateQueries({ queryKey: ['agents'] });

        if (event === 'agent:status_changed') {
          const agentName = data?.agent || data?.name || 'Agent';
          const status = data?.status || 'unknown';
          const statusLabel = status === 'working' ? '작업을 시작했습니다' : status === 'idle' ? '대기 상태입니다' : '오프라인입니다';
          showToast(`${agentName}가 ${statusLabel}`, 'warning');
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
  }, [queryClient]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch rooms when projectId changes (without reconnecting)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    const prevId = prevProjectIdRef.current;
    if (prevId !== null && prevId !== projectId) {
      socket.emit('leave_project', prevId);
      socket.emit('join_project', projectId);
    }
    prevProjectIdRef.current = projectId;
  }, [projectId]);

  return { socketRef, isConnected };
}
