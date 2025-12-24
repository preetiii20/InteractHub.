// Notification System Verification Utility
// This utility helps verify that the notification system is working correctly

class NotificationVerification {
  constructor() {
    this.debugMode = true;
  }

  log(message, type = 'info') {
    if (this.debugMode) {
      const prefix = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} [NotificationVerification] ${message}`);
    }
  }

  // Verify notification storage works
  verifyStorage() {
    this.log('Testing localStorage functionality...');
    
    try {
      const testKey = 'notification_test_' + Date.now();
      const testData = { test: true, timestamp: new Date().toISOString() };
      
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = localStorage.getItem(testKey);
      const parsed = JSON.parse(retrieved);
      localStorage.removeItem(testKey);
      
      if (parsed.test === true) {
        this.log('localStorage test passed', 'success');
        return true;
      } else {
        this.log('localStorage test failed - data mismatch', 'error');
        return false;
      }
    } catch (error) {
      this.log(`localStorage test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Verify event system works
  verifyEventSystem() {
    this.log('Testing event system...');
    
    return new Promise((resolve) => {
      let eventReceived = false;
      const testEventName = 'notificationTest_' + Date.now();
      
      const handler = (e) => {
        if (e.detail && e.detail.test === true) {
          eventReceived = true;
          this.log('Event system test passed', 'success');
        }
        window.removeEventListener(testEventName, handler);
        resolve(eventReceived);
      };
      
      window.addEventListener(testEventName, handler);
      
      // Dispatch test event
      window.dispatchEvent(new CustomEvent(testEventName, {
        detail: { test: true }
      }));
      
      // Timeout after 1 second
      setTimeout(() => {
        if (!eventReceived) {
          this.log('Event system test failed - timeout', 'error');
          window.removeEventListener(testEventName, handler);
          resolve(false);
        }
      }, 1000);
    });
  }

  // Send a test notification to a user
  sendTestNotification(userId, title = 'Test Notification') {
    this.log(`Sending test notification to user ${userId}...`);
    
    try {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'MEETING_INVITATION',
        title: title,
        message: `This is a test notification sent at ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: {
          test: true,
          userId: userId
        }
      };

      const notifKey = `notifications_${userId}`;
      const existingNotifs = localStorage.getItem(notifKey);
      const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
      notifs.unshift(notification);
      localStorage.setItem(notifKey, JSON.stringify(notifs));

      // Trigger notification update event
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { userId: Number(userId) }
      }));

      this.log(`Test notification sent to user ${userId}`, 'success');
      return notification;
    } catch (error) {
      this.log(`Failed to send test notification: ${error.message}`, 'error');
      return null;
    }
  }

  // Check notifications for a user
  checkNotifications(userId) {
    this.log(`Checking notifications for user ${userId}...`);
    
    try {
      const notifKey = `notifications_${userId}`;
      const stored = localStorage.getItem(notifKey);
      
      if (stored) {
        const notifications = JSON.parse(stored);
        const unreadCount = notifications.filter(n => !n.read).length;
        
        this.log(`User ${userId} has ${notifications.length} notifications (${unreadCount} unread)`, 'success');
        
        // Log recent notifications
        notifications.slice(0, 3).forEach((notif, index) => {
          const status = notif.read ? 'Read' : 'Unread';
          this.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${status}`);
        });
        
        return notifications;
      } else {
        this.log(`No notifications found for user ${userId}`, 'warning');
        return [];
      }
    } catch (error) {
      this.log(`Error checking notifications: ${error.message}`, 'error');
      return [];
    }
  }

  // Simulate meeting invitation flow
  simulateMeetingInvitation(organizerId, participantIds, meetingTitle = 'Test Meeting') {
    this.log(`Simulating meeting invitation from user ${organizerId} to ${participantIds.length} participants...`);
    
    const meetingId = Date.now();
    const meetingDate = new Date().toLocaleDateString();
    const meetingTime = new Date().toLocaleTimeString();
    
    const results = [];
    
    participantIds.forEach(participantId => {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'MEETING_INVITATION',
        title: `Meeting Invitation: ${meetingTitle}`,
        message: `You've been invited to "${meetingTitle}" on ${meetingDate} at ${meetingTime}. Check your calendar for details.`,
        timestamp: new Date().toISOString(),
        read: false,
        data: {
          meetingId: meetingId,
          meetingTitle: meetingTitle,
          meetingDate: meetingDate,
          meetingTime: meetingTime,
          organizerId: organizerId,
          jitsiLink: `https://meet.jit.si/test-${meetingId}`
        }
      };

      try {
        const notifKey = `notifications_${participantId}`;
        const existingNotifs = localStorage.getItem(notifKey);
        const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
        notifs.unshift(notification);
        localStorage.setItem(notifKey, JSON.stringify(notifs));

        // Trigger notification update event
        window.dispatchEvent(new CustomEvent('notificationsUpdated', {
          detail: { userId: Number(participantId) }
        }));

        this.log(`Meeting invitation sent to user ${participantId}`, 'success');
        results.push({ participantId, success: true, notification });
      } catch (error) {
        this.log(`Failed to send invitation to user ${participantId}: ${error.message}`, 'error');
        results.push({ participantId, success: false, error: error.message });
      }
    });
    
    return results;
  }

  // Run complete verification
  async runCompleteVerification() {
    this.log('Starting complete notification system verification...', 'info');
    
    const results = {
      storage: false,
      events: false,
      testNotification: false,
      meetingSimulation: false
    };
    
    // Test 1: Storage
    results.storage = this.verifyStorage();
    
    // Test 2: Events
    results.events = await this.verifyEventSystem();
    
    // Test 3: Test notification
    const testNotif = this.sendTestNotification(999, 'Verification Test');
    results.testNotification = testNotif !== null;
    
    // Test 4: Meeting simulation
    const meetingResults = this.simulateMeetingInvitation(1, [2, 3], 'Verification Meeting');
    results.meetingSimulation = meetingResults.every(r => r.success);
    
    // Summary
    const allPassed = Object.values(results).every(r => r === true);
    
    this.log('=== VERIFICATION RESULTS ===', allPassed ? 'success' : 'warning');
    this.log(`Storage Test: ${results.storage ? 'PASS' : 'FAIL'}`, results.storage ? 'success' : 'error');
    this.log(`Event Test: ${results.events ? 'PASS' : 'FAIL'}`, results.events ? 'success' : 'error');
    this.log(`Test Notification: ${results.testNotification ? 'PASS' : 'FAIL'}`, results.testNotification ? 'success' : 'error');
    this.log(`Meeting Simulation: ${results.meetingSimulation ? 'PASS' : 'FAIL'}`, results.meetingSimulation ? 'success' : 'error');
    this.log(`Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, allPassed ? 'success' : 'error');
    
    return results;
  }

  // Clear test data
  clearTestData() {
    this.log('Clearing test notification data...');
    
    const testUsers = [999, 2, 3]; // Include test users
    let cleared = 0;
    
    testUsers.forEach(userId => {
      const notifKey = `notifications_${userId}`;
      const stored = localStorage.getItem(notifKey);
      
      if (stored) {
        try {
          const notifications = JSON.parse(stored);
          // Only remove test notifications
          const filtered = notifications.filter(n => !n.data?.test);
          
          if (filtered.length !== notifications.length) {
            localStorage.setItem(notifKey, JSON.stringify(filtered));
            cleared++;
            
            // Trigger update event
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
              detail: { userId: userId }
            }));
          }
        } catch (error) {
          this.log(`Error processing notifications for user ${userId}: ${error.message}`, 'error');
        }
      }
    });
    
    this.log(`Cleared test data for ${cleared} users`, 'success');
  }
}

// Create global instance
const notificationVerification = new NotificationVerification();

// Make available globally for console testing
window.notificationVerification = notificationVerification;

// Add convenient global functions
window.verifyNotifications = () => notificationVerification.runCompleteVerification();
window.testNotificationFor = (userId) => notificationVerification.sendTestNotification(userId);
window.checkNotificationsFor = (userId) => notificationVerification.checkNotifications(userId);
window.simulateMeeting = (organizerId, participantIds, title) => 
  notificationVerification.simulateMeetingInvitation(organizerId, participantIds, title);

console.log('🔔 Notification Verification Utility Loaded');
console.log('Available commands:');
console.log('  verifyNotifications() - Run complete verification');
console.log('  testNotificationFor(userId) - Send test notification');
console.log('  checkNotificationsFor(userId) - Check user notifications');
console.log('  simulateMeeting(organizerId, [participantIds], title) - Simulate meeting');

export default notificationVerification;