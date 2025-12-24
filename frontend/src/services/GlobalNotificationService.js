/**
 * Global Notification Service
 * Handles announcements, polls, and live chat messages
 * Broadcasts notifications across the entire application
 */

class GlobalNotificationService {
  constructor() {
    this.listeners = new Map();
    this.notificationQueue = [];
  }

  /**
   * Subscribe to global notifications
   * @param {string} listenerId - Unique listener ID
   * @param {function} callback - Callback function to receive notifications
   * @returns {function} Unsubscribe function
   */
  subscribe(listenerId, callback) {
    console.log('🔔 Registering global notification listener:', listenerId);
    this.listeners.set(listenerId, callback);

    // Return unsubscribe function
    return () => {
      console.log('🔔 Unregistering global notification listener:', listenerId);
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Broadcast notification to all listeners and save to localStorage
   * @param {object} notification - Notification object
   * @param {number} userId - User ID for localStorage key
   */
  broadcast(notification, userId) {
    console.log('📢 Broadcasting global notification:', notification);
    console.log('📢 Total listeners:', this.listeners.size);
    console.log('📢 Listener IDs:', Array.from(this.listeners.keys()));

    // Add to queue for late subscribers
    this.notificationQueue.push(notification);
    if (this.notificationQueue.length > 50) {
      this.notificationQueue.shift(); // Keep only last 50
    }

    // Notify all listeners FIRST (before saving to localStorage)
    if (this.listeners.size === 0) {
      console.warn('⚠️ No listeners registered! Notification will not be delivered to popups.');
    }

    this.listeners.forEach((callback, listenerId) => {
      try {
        console.log(`📢 Notifying listener: ${listenerId}`);
        callback(notification);
      } catch (error) {
        console.error(`❌ Error in listener callback (${listenerId}):`, error);
      }
    });

    // Save to localStorage AFTER notifying listeners
    if (userId) {
      this.saveToLocalStorage(notification, userId);
    }
  }

  /**
   * Save notification to localStorage for bell icon
   * @param {object} notification - Notification object
   * @param {number} userId - User ID
   */
  saveToLocalStorage(notification, userId) {
    try {
      const storageKey = `notifications_${userId}`;
      const existing = localStorage.getItem(storageKey);
      let notifications = existing ? JSON.parse(existing) : [];

      // Create notification object for bell
      const bellNotification = {
        id: `notif-${Date.now()}-${Math.random()}`,
        type: this.mapNotificationType(notification.type),
        title: notification.title || 'New Notification',
        message: notification.message || '',
        timestamp: new Date().toISOString(),
        read: false,
        data: notification.data
      };

      // Add to beginning (most recent first)
      notifications.unshift(bellNotification);

      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
      }

      localStorage.setItem(storageKey, JSON.stringify(notifications));
      console.log('💾 Notification saved to localStorage:', bellNotification.id);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { userId, notification: bellNotification }
      }));
    } catch (error) {
      console.error('❌ Error saving notification to localStorage:', error);
    }
  }

  /**
   * Map notification type to bell notification type
   * @param {string} type - Notification type from global service
   * @returns {string} Bell notification type
   */
  mapNotificationType(type) {
    const typeMap = {
      'announcement': 'ANNOUNCEMENT',
      'poll': 'POLL',
      'live-chat': 'CHAT',
      'warning': 'ANNOUNCEMENT',
      'error': 'ANNOUNCEMENT',
      'success': 'ANNOUNCEMENT',
      'meeting-scheduled': 'MEETING_SCHEDULED',
      'meeting-cancelled': 'MEETING_CANCELLED',
      'meeting-invitation': 'MEETING_INVITATION',
      'task-assignment': 'TASK_ASSIGNMENT'
    };
    return typeMap[type] || 'ANNOUNCEMENT';
  }

  /**
   * Get queued notifications for late subscribers
   * @returns {array} Array of queued notifications
   */
  getQueuedNotifications() {
    return [...this.notificationQueue];
  }

  /**
   * Clear notification queue
   */
  clearQueue() {
    this.notificationQueue = [];
  }

  /**
   * Get listener count
   * @returns {number} Number of active listeners
   */
  getListenerCount() {
    return this.listeners.size;
  }
}

// Singleton instance
const globalNotificationService = new GlobalNotificationService();

export default globalNotificationService;
