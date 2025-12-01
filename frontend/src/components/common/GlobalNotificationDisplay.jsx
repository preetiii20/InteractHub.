import React, { useEffect, useState, useCallback } from 'react';
import persistentWebSocketService from '../../services/PersistentWebSocketService';
import { authHelpers } from '../../config/auth';

/**
 * Global Notification Display
 * Shows notifications anywhere on the website
 * Displays toast notifications for all incoming messages
 */
const GlobalNotificationDisplay = () => {
  const [notifications, setNotifications] = useState([]);
  const selfIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName();

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((payload) => {
    console.log('🌍 Global notification received:', payload);

    // Show notification for NEW_GROUP
    if (payload.type === 'NEW_GROUP' && payload.members && Array.isArray(payload.members)) {
      const isMember = payload.members.some(m => 
        m.toLowerCase() === selfIdentifier.toLowerCase()
      );
      if (isMember) {
        addNotification({
          id: `group-${payload.groupId}-${Date.now()}`,
          type: 'group',
          title: 'New Group',
          message: `Added to group: ${payload.groupName}`,
          icon: '👥',
          color: 'bg-blue-500'
        });
      }
    }

    // Show notification for GROUP_LEFT
    if (payload.type === 'GROUP_LEFT') {
      addNotification({
        id: `left-${payload.groupId}-${Date.now()}`,
        type: 'group',
        title: 'Left Group',
        message: `You left the group`,
        icon: '👋',
        color: 'bg-orange-500'
      });
    }

    // Show notification for GROUP_DELETED
    if (payload.type === 'GROUP_DELETED') {
      addNotification({
        id: `deleted-${payload.groupId}-${Date.now()}`,
        type: 'group',
        title: 'Group Deleted',
        message: `Group "${payload.groupName}" has been deleted`,
        icon: '🗑️',
        color: 'bg-red-500'
      });
    }

    // Show notification for incoming calls
    if (payload.type === 'incoming_call') {
      addNotification({
        id: `call-${payload.roomId}-${Date.now()}`,
        type: 'call',
        title: 'Incoming Call',
        message: `${payload.fromUser} is calling...`,
        icon: '📞',
        color: 'bg-green-500'
      });
    }
  }, [selfIdentifier]);

  // Add notification to display
  const addNotification = (notification) => {
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = persistentWebSocketService.subscribe(
      'GlobalNotificationDisplay',
      handleWebSocketMessage
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleWebSocketMessage]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${notification.color} text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in pointer-events-auto flex items-center gap-3 max-w-sm`}
        >
          <span className="text-2xl">{notification.icon}</span>
          <div>
            <h3 className="font-bold text-sm">{notification.title}</h3>
            <p className="text-xs opacity-90">{notification.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalNotificationDisplay;
