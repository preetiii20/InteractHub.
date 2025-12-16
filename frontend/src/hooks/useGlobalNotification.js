import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import globalNotificationService from '../services/GlobalNotificationService';

/**
 * Hook to listen for global notifications and display them
 * @param {string} componentId - Unique ID for this component
 * @returns {object} Notification utilities
 */
export const useGlobalNotification = (componentId = 'default') => {
  const { addNotification } = useNotification();

  useEffect(() => {
    // Subscribe to global notifications
    const unsubscribe = globalNotificationService.subscribe(
      `component-${componentId}`,
      (notification) => {
        console.log('🔔 Received global notification in component:', componentId, notification);
        addNotification(notification);
      }
    );

    // Get any queued notifications
    const queuedNotifications = globalNotificationService.getQueuedNotifications();
    queuedNotifications.forEach(notif => {
      addNotification(notif);
    });

    return unsubscribe;
  }, [componentId, addNotification]);

  return {
    broadcast: (notification) => globalNotificationService.broadcast(notification),
    getListenerCount: () => globalNotificationService.getListenerCount()
  };
};

export default useGlobalNotification;
