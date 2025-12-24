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
    console.log('🔔 addNotification called with:', notification);
    
    if (!notification) {
      console.warn('🔔 addNotification received null/undefined notification');
      return;
    }

    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };

    console.log('🔔 Adding global notification to state:', newNotification);
    console.log('🔔 Current notifications count before add:', notifications.length);
    
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      console.log('🔔 Updated notifications count:', updated.length);
      return updated;
    });

    // Auto-dismiss after 8 seconds (unless it's persistent or meeting-cancelled)
    const shouldAutoDismiss = !notification.persistent && notification.type !== 'meeting-cancelled';
    if (shouldAutoDismiss) {
      const timeoutId = setTimeout(() => {
        console.log('🔔 Auto-dismissing notification:', id);
        removeNotification(id);
      }, 8000);
      return () => clearTimeout(timeoutId);
    }

    return id;
  }, [removeNotification, notifications.length]);

  // Subscribe to global notifications on mount
  useEffect(() => {
    console.log('🔔 NotificationProvider subscribing to global notifications');
    console.log('🔔 Current listener count:', globalNotificationService.getListenerCount());
    
    const unsubscribe = globalNotificationService.subscribe('notification-context', (notification) => {
      console.log('🔔 NotificationContext received global notification:', notification);
      console.log('🔔 Notification type:', notification.type);
      console.log('🔔 Notification title:', notification.title);
      addNotification(notification);
    });

    console.log('🔔 Subscription complete. Listener count:', globalNotificationService.getListenerCount());
    
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
