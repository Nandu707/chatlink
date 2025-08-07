import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Notification } from '@/types';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const userNotifications = getUserNotifications(user.id);
    setNotifications(userNotifications);
  };

  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications periodically
    const intervalId = setInterval(loadNotifications, 5000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    markAllNotificationsAsRead(user.id);
    loadNotifications();
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    loadNotifications();
  };

  const value = {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    refreshNotifications: loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};