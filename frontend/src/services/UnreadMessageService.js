/**
 * Unread Message Service
 * Handles unread message tracking for both individual and group chats
 * Also handles notifications for scheduled meeting links sent in chat
 */

import globalNotificationService from './GlobalNotificationService';

class UnreadMessageService {
  constructor() {
    this.unreadCounts = new Map(); // channelId -> count
    this.listeners = new Map(); // listenerId -> callback
    this.debugMode = true;
  }

  log(message, ...args) {
    if (this.debugMode) {
      console.log(`[UnreadMessageService] ${message}`, ...args);
    }
  }

  /**
   * Subscribe to unread message updates
   * @param {string} listenerId - Unique listener ID
   * @param {function} callback - Callback function (unreadCounts: Map)
   * @returns {function} Unsubscribe function
   */
  subscribe(listenerId, callback) {
    this.log(`Subscribed listener: ${listenerId}`);
    this.listeners.set(listenerId, callback);

    return () => {
      this.log(`Unsubscribed listener: ${listenerId}`);
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Notify all listeners of unread count changes
   */
  notifyListeners() {
    this.listeners.forEach((callback, listenerId) => {
      try {
        callback(new Map(this.unreadCounts));
      } catch (error) {
        console.error(`Error in listener callback (${listenerId}):`, error);
      }
    });
  }

  /**
   * Increment unread count for a channel
   * @param {string} channelId - Channel ID (DM_... or GROUP_...)
   * @param {object} messageData - Message data for notification
   * @param {string} currentUserId - Current user ID (to avoid counting own messages)
   */
  incrementUnread(channelId, messageData, currentUserId) {
    if (!channelId) {
      this.log('❌ No channelId provided');
      return;
    }

    // Don't count own messages
    if (messageData?.senderName === currentUserId) {
      this.log(`⏭️ Skipping own message in ${channelId}`);
      return;
    }

    const currentCount = this.unreadCounts.get(channelId) || 0;
    const newCount = currentCount + 1;
    this.unreadCounts.set(channelId, newCount);

    this.log(`📬 Unread count updated for ${channelId}: ${currentCount} → ${newCount}`);

    // Notify listeners
    this.notifyListeners();

    // Send popup notification if enabled
    this.sendUnreadNotification(channelId, messageData, newCount);
  }

  /**
   * Send popup notification for unread message
   * @param {string} channelId - Channel ID
   * @param {object} messageData - Message data
   * @param {number} unreadCount - Total unread count for this channel
   */
  sendUnreadNotification(channelId, messageData, unreadCount) {
    try {
      const isDm = channelId.startsWith('DM_');
      const isGroup = channelId.startsWith('GROUP_');
      const isMeetingLink = this.isMeetingLink(messageData?.content);

      let title = '';
      let message = '';
      let notificationType = 'chat-message';

      if (isMeetingLink) {
        // Meeting link notification
        title = `📅 Meeting Link Shared`;
        message = `${messageData?.senderName || 'Someone'} shared a meeting link`;
        notificationType = 'meeting-link';
      } else if (isDm) {
        // Individual chat notification
        title = `💬 New Message from ${messageData?.senderName || 'User'}`;
        message = messageData?.content?.substring(0, 50) || 'New message';
        notificationType = 'dm-message';
      } else if (isGroup) {
        // Group chat notification
        const groupName = channelId.replace(/^GROUP_/, '').split('|')[0] || 'Group';
        title = `👥 ${groupName}: ${messageData?.senderName || 'Someone'}`;
        message = messageData?.content?.substring(0, 50) || 'New message';
        notificationType = 'group-message';
      }

      // Broadcast popup notification
      globalNotificationService.broadcast({
        type: notificationType,
        title,
        message,
        details: `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
        data: {
          channelId,
          messageId: messageData?.id,
          senderName: messageData?.senderName,
          content: messageData?.content,
          isMeetingLink,
          unreadCount
        }
      });

      this.log(`📢 Notification sent for ${channelId}: ${title}`);
    } catch (error) {
      console.error('Error sending unread notification:', error);
    }
  }

  /**
   * Check if message contains a meeting link
   * @param {string} content - Message content
   * @returns {boolean}
   */
  isMeetingLink(content) {
    if (!content) return false;
    // Check for meeting links and also for "Schedule Call" or "scheduled call" patterns
    return /meet\.jit\.si|zoom\.us|teams\.microsoft\.com|meet\.google\.com|jitsi|schedule.*call|scheduled.*call|meeting.*link/i.test(content);
  }

  /**
   * Clear unread count for a channel
   * @param {string} channelId - Channel ID
   */
  clearUnread(channelId) {
    if (this.unreadCounts.has(channelId)) {
      this.log(`🗑️ Cleared unread count for ${channelId}`);
      this.unreadCounts.delete(channelId);
      this.notifyListeners();
    }
  }

  /**
   * Get unread count for a channel
   * @param {string} channelId - Channel ID
   * @returns {number}
   */
  getUnreadCount(channelId) {
    return this.unreadCounts.get(channelId) || 0;
  }

  /**
   * Get total unread count across all channels
   * @returns {number}
   */
  getTotalUnread() {
    let total = 0;
    this.unreadCounts.forEach(count => {
      total += count;
    });
    return total;
  }

  /**
   * Get all unread counts
   * @returns {Map}
   */
  getAllUnreadCounts() {
    return new Map(this.unreadCounts);
  }

  /**
   * Clear all unread counts
   */
  clearAllUnread() {
    this.log('🗑️ Cleared all unread counts');
    this.unreadCounts.clear();
    this.notifyListeners();
  }

  /**
   * Load unread counts from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('chat_unread_counts');
      if (stored) {
        const counts = JSON.parse(stored);
        this.unreadCounts = new Map(Object.entries(counts));
        this.log(`📂 Loaded ${this.unreadCounts.size} unread counts from storage`);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading unread counts from storage:', error);
    }
  }

  /**
   * Save unread counts to localStorage
   */
  saveToStorage() {
    try {
      const obj = Object.fromEntries(this.unreadCounts);
      localStorage.setItem('chat_unread_counts', JSON.stringify(obj));
      this.log('💾 Saved unread counts to storage');
    } catch (error) {
      console.error('Error saving unread counts to storage:', error);
    }
  }

  /**
   * Test function
   */
  test(channelId = 'DM_test@example.com|user@example.com') {
    this.log('Running test...');
    
    const testMessage = {
      id: Date.now(),
      senderName: 'test@example.com',
      content: 'Test message',
      sentAt: new Date().toISOString()
    };

    this.incrementUnread(channelId, testMessage, 'current@example.com');
    
    const count = this.getUnreadCount(channelId);
    this.log(`Test complete. Unread count: ${count}`);
    
    return count;
  }
}

// Singleton instance
const unreadMessageService = new UnreadMessageService();

// Make available globally for debugging
window.unreadMessageService = unreadMessageService;

// Add test commands
window.testUnreadMessages = {
  increment: (channelId = 'DM_test@example.com|user@example.com') => {
    console.log(`📬 Incrementing unread for ${channelId}`);
    unreadMessageService.incrementUnread(channelId, {
      id: Date.now(),
      senderName: 'test@example.com',
      content: 'Test message'
    }, 'current@example.com');
    console.log(`✅ Unread count: ${unreadMessageService.getUnreadCount(channelId)}`);
  },

  clear: (channelId) => {
    console.log(`🗑️ Clearing unread for ${channelId}`);
    unreadMessageService.clearUnread(channelId);
  },

  clearAll: () => {
    console.log('🗑️ Clearing all unread');
    unreadMessageService.clearAllUnread();
  },

  getAll: () => {
    const counts = unreadMessageService.getAllUnreadCounts();
    console.log('📊 All unread counts:');
    counts.forEach((count, channelId) => {
      console.log(`  ${channelId}: ${count}`);
    });
    return counts;
  },

  getTotal: () => {
    const total = unreadMessageService.getTotalUnread();
    console.log(`📊 Total unread: ${total}`);
    return total;
  }
};

console.log('✅ Unread Message Service loaded');
console.log('   Use: unreadMessageService.incrementUnread(channelId, messageData, currentUserId)');
console.log('   Test: testUnreadMessages.increment()');

export default unreadMessageService;
