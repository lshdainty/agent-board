import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

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
      socket.on(event, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['activities'] });
      });
    });

    agentEvents.forEach((event) => {
      socket.on(event, () => {
        queryClient.invalidateQueries({ queryKey: ['agents'] });
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
