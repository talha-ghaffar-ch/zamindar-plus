import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type ToastMessage = {
  id: number;
  message: string;
};

type ToastViewportProps = {
  toasts: ToastMessage[];
  onClose: (id: number) => void;
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: (id: number) => void;
}) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 3700);
    const closeTimer = window.setTimeout(() => onClose(toast.id), 4000);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(closeTimer);
    };
  }, [onClose, toast.id]);

  function closeToast() {
    setIsLeaving(true);
    window.setTimeout(() => onClose(toast.id), 180);
  }

  return (
    <article className={isLeaving ? 'toast-message toast-leaving' : 'toast-message'}>
      <span>{toast.message}</span>
      <button aria-label="Close Notification" type="button" onClick={closeToast}>
        <X size={15} aria-hidden="true" />
      </button>
    </article>
  );
}

export function ToastViewport({ toasts, onClose }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
