import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'info' | 'success' | 'warning';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

let toastIdCounter = 0;
let listeners: Array<(msg: ToastMessage) => void> = [];

function playBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gain.gain.value = 0.1;
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio not available
  }
}

export function showToast(text: string, type: ToastType = 'info') {
  const msg: ToastMessage = { id: ++toastIdCounter, text, type };
  listeners.forEach((fn) => fn(msg));
  playBeep();
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== msg.id));
    }, 3000);
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const typeStyles: Record<ToastType, string> = {
    info: 'border-[var(--color-border)]',
    success: 'border-green-500/30',
    warning: 'border-amber-500/30',
  };

  const dotColors: Record<ToastType, string> = {
    info: 'bg-blue-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
  };

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border bg-[var(--color-card)] text-sm text-[var(--color-card-foreground)] animate-in slide-in-from-right duration-300 max-w-xs',
            typeStyles[toast.type],
          )}
        >
          <span className={cn('w-2 h-2 rounded-full shrink-0', dotColors[toast.type])} />
          <span className="flex-1">{toast.text}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 p-0.5 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
