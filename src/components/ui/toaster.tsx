// components/ui/toaster.tsx
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '@/lib/store';

export function Toaster() {
  const { notifications, removeNotification } = useUIStore();

  // 自動的に通知を削除する
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(notifications[0].id);
      }, 4000); // 4秒後に消える

      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between max-w-md animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
          }`}
        >
          <span>{notification.message}</span>
          <button
            title="閉じる"
            onClick={() => removeNotification(notification.id)}
            className="ml-4 hover:bg-white/20 rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
