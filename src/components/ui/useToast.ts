'use client';

import { useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastConfig = {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastConfig & { id: number }>>([]);

  const showToast = (config: ToastConfig) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...config, id }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (
      title: string,
      message?: string,
      duration?: number,
      action?: { label: string; onClick: () => void }
    ) => showToast({ title, message, type: 'success', duration, action }),
    error: (
      title: string,
      message?: string,
      duration?: number,
      action?: { label: string; onClick: () => void }
    ) => showToast({ title, message, type: 'error', duration, action }),
    info: (
      title: string,
      message?: string,
      duration?: number,
      action?: { label: string; onClick: () => void }
    ) => showToast({ title, message, type: 'info', duration, action }),
    warning: (
      title: string,
      message?: string,
      duration?: number,
      action?: { label: string; onClick: () => void }
    ) => showToast({ title, message, type: 'warning', duration, action }),
  };
};
