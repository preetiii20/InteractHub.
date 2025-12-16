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
   * Broadcast notification to all listeners
   * @param {object} notification - Notification object
   */
  broadcast(notification) {
    console.log('📢 Broadcasting global notification:', notification);
    console.log('📢 Total listeners:', this.listeners.size);

    // Add to queue for late subscribers
    this.notificationQueue.push(notification);
    if (this.notificationQueue.length > 50) {
      this.notificationQueue.shift(); // Keep only last 50
    }

    // Notify all listeners
    if (this.listeners.size === 0) {
      console.warn('⚠️ No listeners registered! Notification will not be delivered.');
    }

    this.listeners.forEach((callback, listenerId) => {
      try {
        console.log(`📢 Notifying listener: ${listenerId}`);
        callback(notification);
      } catch (error) {
        console.error(`❌ Error in listener callback (${listenerId}):`, error);
      }
    });
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
