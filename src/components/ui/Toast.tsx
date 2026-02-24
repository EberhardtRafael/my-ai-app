'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  title?: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const Toast = ({ title, message, type = 'info', duration = 3000, onClose, action }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slide down animation
    setTimeout(() => setIsVisible(true), 10);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for slide up animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-gray-50',
  };

  const titleColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-gray-800',
  };

  const messageColors = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-gray-700',
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        typeStyles[type]
      } ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${titleColors[type]}`}>{title}</h4>
          {message && <p className={`text-sm mt-1 font-light ${messageColors[type]}`}>{message}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={`text-sm px-3 py-1 rounded cursor-pointer hover:brightness-75 transition-all ${titleColors[type]}`}
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-800 transition-colors text-xl leading-none cursor-pointer"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
