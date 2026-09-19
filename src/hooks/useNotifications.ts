import { useCallback, useEffect, useRef, useState } from 'react';
import type { NotificationItem } from '../types';

type NotificationType = NotificationItem['type'];

const DEFAULT_DURATION_MS = 4000;

export function useNotifications(durationMs = DEFAULT_DURATION_MS) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissNotification = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'success') => {
      const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setNotifications((current) => [...current, { id, message, type }]);

      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setNotifications((current) => current.filter((notification) => notification.id !== id));
      }, durationMs);

      timersRef.current.set(id, timer);
    },
    [durationMs],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return { notifications, addNotification, dismissNotification };
}
