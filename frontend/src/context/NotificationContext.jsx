import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import globalNotificationService from '../services/GlobalNotificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    console.log('🔔 Removing notification:', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };

    console.log('🔔 Adding global notification to state:', newNotification);
    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after 8 seconds (unless it's persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, 8000);
    }

    return id;
  }, [removeNotification]);

  // Subscribe to global notifications on mount
  useEffect(() => {
    console.log('🔔 NotificationProvider subscribing to global notifications');
    const unsubscribe = globalNotificationService.subscribe('notification-context', (notification) => {
      console.log('🔔 NotificationContext received global notification:', notification);
      addNotification(notification);
    });

    return unsubscribe;
  }, [addNotification]);

  const clearAll = useCallback(() => {
    console.log('🔔 Clearing all notifications');
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
