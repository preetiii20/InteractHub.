// Simple notification testing utilities
import notificationService from '../services/NotificationService';

// Test functions that can be called from browser console
window.testNotifications = {
  // Send a test meeting notification
  sendTest: (userId = 2) => {
    console.log(`🧪 Sending test notification to user ${userId}...`);
    const success = notificationService.sendMeetingInvitation(userId, {
      id: Date.now(),
      title: 'Console Test Meeting',
      date: '2025-12-22',
      time: '14:00',
      jitsiLink: 'https://meet.jit.si/console-test'
    });
    
    if (success) {
      console.log(`✅ Test notification sent to user ${userId}`);
      console.log('👀 Check the bell icon for the notification!');
    } else {
      console.log(`❌ Failed to send notification to user ${userId}`);
    }
    return success;
  },

  // Check notifications for a user
  check: (userId = 2) => {
    const notifications = notificationService.getNotifications(userId);
    console.log(`📬 User ${userId} has ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.read ? 'Read' : 'Unread'}`);
    });
    return notifications;
  },

  // Clear notifications for a user
  clear: (userId = 2) => {
    notificationService.clearNotifications(userId);
    console.log(`🗑️ Cleared notifications for user ${userId}`);
  },

  // Get unread count
  unread: (userId = 2) => {
    const count = notificationService.getUnreadCount(userId);
    console.log(`📊 User ${userId} has ${count} unread notifications`);
    return count;
  },

  // Test the service
  testService: () => {
    return notificationService.test(2);
  },

  // Help
  help: () => {
    console.log(`
🧪 Notification Testing Commands:

testNotifications.sendTest(userId)  - Send test notification to user
testNotifications.check(userId)     - Check notifications for user  
testNotifications.clear(userId)     - Clear notifications for user
testNotifications.unread(userId)    - Get unread count for user
testNotifications.testService()     - Test the notification service
testNotifications.help()            - Show this help

Examples:
  testNotifications.sendTest(2)     // Send test to user 2
  testNotifications.check(2)        // Check user 2's notifications
  testNotifications.clear(2)        // Clear user 2's notifications
    `);
  }
};

// Show help on load
console.log('🧪 Notification testing utilities loaded! Type testNotifications.help() for commands.');

export default window.testNotifications;