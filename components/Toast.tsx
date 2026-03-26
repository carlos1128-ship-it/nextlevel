import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { XIcon } from './icons';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);
const GLOBAL_FEEDBACK_EVENT = 'nextlevel:error-feedback';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => {
      if (prev.some(toast => toast.message === message && toast.type === type)) {
        return prev;
      }
      return [...prev, { id, message, type }];
    });
    setTimeout(() => removeToast(id), 3500);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleGlobalFeedback = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; type?: Toast['type'] }>).detail;
      if (!detail?.message) return;
      addToast(detail.message, detail.type || 'error');
    };

    window.addEventListener(GLOBAL_FEEDBACK_EVENT, handleGlobalFeedback);
    return () => {
      window.removeEventListener(GLOBAL_FEEDBACK_EVENT, handleGlobalFeedback);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl border glass shadow-2xl fade-in ${
              toast.type === 'success' ? 'border-[#B6FF00]/30 text-zinc-900 dark:text-zinc-100' : 
              toast.type === 'error' ? 'border-red-500/30 text-zinc-900 dark:text-zinc-100' : 'border-blue-500/30 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-[#B6FF00] shadow-[0_0_8px_#B6FF00]' : 
              toast.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-blue-500 shadow-[0_0_8px_blue]'
            }`} />
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 hover:opacity-70 transition-opacity">
              <XIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
