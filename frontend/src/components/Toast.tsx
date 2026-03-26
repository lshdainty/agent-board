import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
}

let toastIdCounter = 0;
let listeners: Array<(msg: ToastMessage) => void> = [];

export function showToast(text: string) {
  const msg: ToastMessage = { id: ++toastIdCounter, text };
  listeners.forEach((fn) => fn(msg));
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

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-card-foreground)] animate-in slide-in-from-right duration-300 max-w-xs"
        >
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
