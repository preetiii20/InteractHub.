// Simple notification test that can be run from console
window.testNotification = function(userId = 2, title = 'Test Meeting') {
  console.log(`🧪 Testing notification for user ${userId}...`);
  
  try {
    // Create test notification
    const notification = {
      id: Date.now() + Math.random(),
      type: 'MEETING_INVITATION',
      title: `Meeting Invitation: ${title}`,
      message: `You've been invited to "${title}" on 2025-12-22 at 14:00. Check your calendar for details.`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        meetingId: Date.now(),
        meetingTitle: title,
        meetingDate: '2025-12-22',
        meetingTime: '14:00',
        jitsiLink: 'https://meet.jit.si/test'
      }
    };
    
    // Store in localStorage
    const notifKey = `notifications_${userId}`;
    const existingNotifs = localStorage.getItem(notifKey);
    const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
    notifs.unshift(notification);
    localStorage.setItem(notifKey, JSON.stringify(notifs));
    
    console.log(`📬 Notification stored for user ${userId}`);
    
    // Dispatch events
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { userId: Number(userId) }
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: notifKey,
      newValue: JSON.stringify(notifs),
      oldValue: existingNotifs,
      storageArea: localStorage
    }));
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('forceNotificationRefresh', {
        detail: { userId: Number(userId) }
      }));
    }, 100);
    
    console.log(`✅ Test notification sent to user ${userId}`);
    console.log('👀 Check the bell icon for the notification!');
    
    return true;
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    return false;
  }
};

window.checkNotifications = function(userId = 2) {
  const notifKey = `notifications_${userId}`;
  const stored = localStorage.getItem(notifKey);
  
  if (stored) {
    const notifications = JSON.parse(stored);
    console.log(`📬 User ${userId} has ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.read ? 'Read' : 'Unread'}`);
    });
    return notifications;
  } else {
    console.log(`📭 No notifications found for user ${userId}`);
    return [];
  }
};

window.clearNotifications = function(userId = 2) {
  const notifKey = `notifications_${userId}`;
  localStorage.removeItem(notifKey);
  console.log(`🗑️ Cleared notifications for user ${userId}`);
  
  // Trigger refresh
  window.dispatchEvent(new CustomEvent('forceNotificationRefresh', {
    detail: { userId: Number(userId) }
  }));
};

console.log('🧪 Simple notification test loaded!');
console.log('Commands:');
console.log('  testNotification(2) - Send test to user 2');
console.log('  checkNotifications(2) - Check user 2 notifications');
console.log('  clearNotifications(2) - Clear user 2 notifications');

export default { testNotification: window.testNotification, checkNotifications: window.checkNotifications, clearNotifications: window.clearNotifications };