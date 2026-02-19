import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: Toast) => {
    console.log(`[Toast ${variant}] ${title}${description ? ': ' + description : ''}`);
    // For now, just log to console
    // In a real implementation, you'd add this to state and render it
  };

  return { toast, toasts };
}
