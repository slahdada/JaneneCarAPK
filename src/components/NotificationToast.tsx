import React from 'react';
import { NotificationItem } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-5 sm:max-w-md"
    >
      {notifications.map((n) => {
        const getStyles = () => {
          switch (n.type) {
            case 'success':
              return {
                bg: 'bg-emerald-600 text-white',
                icon: CheckCircle2,
              };
            case 'error':
              return {
                bg: 'bg-rose-600 text-white',
                icon: AlertCircle,
              };
            case 'warning':
              return {
                bg: 'bg-amber-600 text-white',
                icon: AlertTriangle,
              };
            default:
              return {
                bg: 'bg-blue-600 text-white',
                icon: Info,
              };
          }
        };

        const { bg, icon: Icon } = getStyles();

        return (
          <div
            key={n.id}
            id={`notification-${n.id}`}
            role={n.type === 'error' ? 'alert' : 'status'}
            aria-live={n.type === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200 ${bg}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">{n.message}</p>
            </div>
            <button
              onClick={() => onDismiss(n.id)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
