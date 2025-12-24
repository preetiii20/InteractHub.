// Enhanced Notification Service
class NotificationService {
  constructor() {
    this.listeners = new Map(); // userId -> Set of callback functions
    this.debugMode = true;
  }

  log(message, ...args) {
    if (this.debugMode) {
      console.log(`[NotificationService] ${message}`, ...args);
    }
  }

  // Subscribe to notifications for a specific user
  subscribe(userId, callback) {
    const numericUserId = Number(userId);
    if (!this.listeners.has(numericUserId)) {
      this.listeners.set(numericUserId, new Set());
    }
    this.listeners.get(numericUserId).add(callback);
    this.log(`Subscribed callback for user ${numericUserId}`);
    
    // Return unsubscribe function
    return () => {
      const userListeners = this.listeners.get(numericUserId);
      if (userListeners) {
        userListeners.delete(callback);
        if (userListeners.size === 0) {
          this.listeners.delete(numericUserId);
        }
      }
      this.log(`Unsubscribed callback for user ${numericUserId}`);
    };
  }

  // Send notification to a user
  sendNotification(userId, notification) {
    const numericUserId = Number(userId);
    this.log(`Sending notification to user ${numericUserId}:`, notification);

    try {
      // Store in localStorage
      const notifKey = `notifications_${numericUserId}`;
      const existingNotifs = localStorage.getItem(notifKey);
      const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
      
      // Add unique ID if not present
      if (!notification.id) {
        notification.id = Date.now() + Math.random();
      }
      
      // Add timestamp if not present
      if (!notification.timestamp) {
        notification.timestamp = new Date().toISOString();
      }
      
      notifs.unshift(notification);
      localStorage.setItem(notifKey, JSON.stringify(notifs));
      this.log(`Stored notification in localStorage for user ${numericUserId}`);

      // Notify all subscribers for this user
      const userListeners = this.listeners.get(numericUserId);
      if (userListeners && userListeners.size > 0) {
        this.log(`Notifying ${userListeners.size} subscribers for user ${numericUserId}`);
        userListeners.forEach(callback => {
          try {
            callback(notification, notifs);
          } catch (error) {
            console.error('Error in notification callback:', error);
          }
        });
      } else {
        this.log(`No active subscribers for user ${numericUserId}`);
      }

      // Dispatch custom event as fallback
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { 
          userId: numericUserId, 
          notification,
          allNotifications: notifs
        }
      }));
      this.log(`Dispatched notificationsUpdated event for user ${numericUserId}`);

      // Dispatch storage event for cross-tab communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: notifKey,
        newValue: JSON.stringify(notifs),
        oldValue: existingNotifs,
        storageArea: localStorage
      }));
      this.log(`Dispatched storage event for user ${numericUserId}`);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Send meeting invitation notification
  sendMeetingInvitation(participantId, meetingData) {
    const notification = {
      type: 'MEETING_INVITATION',
      title: `Meeting Invitation: ${meetingData.title}`,
      message: `You've been invited to "${meetingData.title}" on ${meetingData.date} at ${meetingData.time}. Check your calendar for details.`,
      read: false,
      data: {
        meetingId: meetingData.id,
        meetingTitle: meetingData.title,
        meetingDate: meetingData.date,
        meetingTime: meetingData.time,
        jitsiLink: meetingData.jitsiLink
      }
    };

    return this.sendNotification(participantId, notification);
  }

  // Get notifications for a user
  getNotifications(userId) {
    const numericUserId = Number(userId);
    const notifKey = `notifications_${numericUserId}`;
    
    try {
      const stored = localStorage.getItem(notifKey);
      if (stored) {
        const notifications = JSON.parse(stored);
        this.log(`Retrieved ${notifications.length} notifications for user ${numericUserId}`);
        return notifications;
      }
    } catch (error) {
      console.error('Error getting notifications:', error);
    }
    
    return [];
  }

  // Mark notification as read
  markAsRead(userId, notificationId) {
    const numericUserId = Number(userId);
    const notifKey = `notifications_${numericUserId}`;
    
    try {
      const stored = localStorage.getItem(notifKey);
      if (stored) {
        const notifications = JSON.parse(stored);
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
          localStorage.setItem(notifKey, JSON.stringify(notifications));
          
          // Notify subscribers
          const userListeners = this.listeners.get(numericUserId);
          if (userListeners) {
            userListeners.forEach(callback => {
              try {
                callback(notification, notifications);
              } catch (error) {
                console.error('Error in notification callback:', error);
              }
            });
          }
          
          this.log(`Marked notification ${notificationId} as read for user ${numericUserId}`);
          return true;
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    return false;
  }

  // Clear all notifications for a user
  clearNotifications(userId) {
    const numericUserId = Number(userId);
    const notifKey = `notifications_${numericUserId}`;
    localStorage.removeItem(notifKey);
    
    // Notify subscribers
    const userListeners = this.listeners.get(numericUserId);
    if (userListeners) {
      userListeners.forEach(callback => {
        try {
          callback(null, []);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }
    
    this.log(`Cleared all notifications for user ${numericUserId}`);
  }

  // Get unread count for a user
  getUnreadCount(userId) {
    const notifications = this.getNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  // Test function
  test(userId = 2) {
    this.log('Running notification service test...');
    
    const testNotification = {
      type: 'MEETING_INVITATION',
      title: 'Test Meeting Notification',
      message: 'This is a test notification from NotificationService',
      read: false,
      data: {
        meetingId: 999,
        meetingTitle: 'Test Meeting',
        meetingDate: '2025-12-22',
        meetingTime: '10:00'
      }
    };
    
    const success = this.sendNotification(userId, testNotification);
    this.log(`Test notification sent: ${success ? 'SUCCESS' : 'FAILED'}`);
    
    const notifications = this.getNotifications(userId);
    this.log(`Retrieved ${notifications.length} notifications after test`);
    
    return success;
  }

  // Update browser tab title with unread count (for compatibility)
  updateTabTitle(unreadCount) {
    try {
      const baseTitle = document.title.split(' (')[0]; // Remove existing count
      if (unreadCount > 0) {
        document.title = `${baseTitle} (${unreadCount})`;
      } else {
        document.title = baseTitle;
      }
      this.log(`Updated tab title with unread count: ${unreadCount}`);
    } catch (error) {
      console.error('Error updating tab title:', error);
    }
  }

  // Show browser notification for announcements (for compatibility)
  showAnnouncementNotification(title, content, onClick = null) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: content,
          icon: '/favicon.ico',
          tag: 'announcement'
        });
        
        if (onClick) {
          notification.onclick = onClick;
        }
        
        this.log(`Showed browser notification: ${title}`);
      } else {
        this.log('Browser notifications not available or not permitted');
      }
    } catch (error) {
      console.error('Error showing announcement notification:', error);
    }
  }

  // Show browser notification for polls (for compatibility)
  showPollNotification(question, onClick = null) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('New Poll', {
          body: question,
          icon: '/favicon.ico',
          tag: 'poll'
        });
        
        if (onClick) {
          notification.onclick = onClick;
        }
        
        this.log(`Showed poll notification: ${question}`);
      } else {
        this.log('Browser notifications not available or not permitted');
      }
    } catch (error) {
      console.error('Error showing poll notification:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Make it available globally for debugging
window.notificationService = notificationService;

// Add simple test commands to window
window.testMeetingNotifications = {
  send: (userId = 2, title = 'Test Meeting') => {
    console.log(`🧪 Sending test meeting notification to user ${userId}...`);
    const success = notificationService.sendMeetingInvitation(userId, {
      id: Date.now(),
      title: title,
      date: '2025-12-22',
      time: '14:00',
      jitsiLink: 'https://meet.jit.si/test'
    });
    
    if (success) {
      console.log(`✅ Test notification sent to user ${userId}`);
      console.log('👀 Check the bell icon for the notification!');
    } else {
      console.log(`❌ Failed to send notification to user ${userId}`);
    }
    return success;
  },
  
  check: (userId = 2) => {
    const notifications = notificationService.getNotifications(userId);
    console.log(`📬 User ${userId} has ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.read ? 'Read' : 'Unread'}`);
    });
    return notifications;
  },
  
  clear: (userId = 2) => {
    notificationService.clearNotifications(userId);
    console.log(`🗑️ Cleared notifications for user ${userId}`);
  }
};

console.log('🧪 Meeting notification testing available:');
console.log('  testMeetingNotifications.send(2) - Send test to user 2');
console.log('  testMeetingNotifications.check(2) - Check user 2 notifications');
console.log('  testMeetingNotifications.clear(2) - Clear user 2 notifications');

export default notificationService;