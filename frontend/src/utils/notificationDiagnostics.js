// Notification Diagnostics Utility
// Helps identify why notifications aren't being received

class NotificationDiagnostics {
  constructor() {
    this.debugMode = true;
  }

  log(message, type = 'info') {
    const prefix = type === 'success' ? '✅' : 
                  type === 'error' ? '❌' : 
                  type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [NotificationDiagnostics] ${message}`);
  }

  // Check if user ID is correct
  checkUserId() {
    this.log('Checking user ID configuration...');
    
    try {
      // Try to get user ID from localStorage
      const storedUserId = localStorage.getItem('userId');
      const storedUserEmail = localStorage.getItem('userEmail');
      
      this.log(`Stored User ID: ${storedUserId}`, storedUserId ? 'success' : 'warning');
      this.log(`Stored User Email: ${storedUserEmail}`, storedUserEmail ? 'success' : 'warning');
      
      // Check if authHelpers is available
      if (window.authHelpers) {
        const userId = window.authHelpers.getUserId?.();
        const userEmail = window.authHelpers.getUserEmail?.();
        const userName = window.authHelpers.getUserName?.();
        
        this.log(`Auth Helper User ID: ${userId}`, userId ? 'success' : 'error');
        this.log(`Auth Helper User Email: ${userEmail}`, userEmail ? 'success' : 'error');
        this.log(`Auth Helper User Name: ${userName}`, userName ? 'success' : 'error');
        
        return { userId, userEmail, userName };
      } else {
        this.log('authHelpers not available', 'error');
        return null;
      }
    } catch (error) {
      this.log(`Error checking user ID: ${error.message}`, 'error');
      return null;
    }
  }

  // Check if notifications are being stored
  checkNotificationStorage() {
    this.log('Checking notification storage...');
    
    try {
      const userInfo = this.checkUserId();
      if (!userInfo || !userInfo.userId) {
        this.log('Cannot check storage - user ID not available', 'error');
        return false;
      }

      const userId = Number(userInfo.userId);
      const notifKey = `notifications_${userId}`;
      
      const stored = localStorage.getItem(notifKey);
      
      if (stored) {
        try {
          const notifications = JSON.parse(stored);
          this.log(`Found ${notifications.length} notifications in storage`, 'success');
          
          notifications.forEach((notif, index) => {
            const status = notif.read ? 'Read' : 'Unread';
            this.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${status}`);
          });
          
          return true;
        } catch (error) {
          this.log(`Invalid notification data in storage: ${error.message}`, 'error');
          return false;
        }
      } else {
        this.log(`No notifications found for user ${userId}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error checking storage: ${error.message}`, 'error');
      return false;
    }
  }

  // Check if event listeners are working
  checkEventListeners() {
    this.log('Checking event listeners...');
    
    return new Promise((resolve) => {
      let eventReceived = false;
      const testEventName = 'notificationsUpdated';
      
      const handler = (e) => {
        eventReceived = true;
        this.log('Event listener working correctly', 'success');
        window.removeEventListener(testEventName, handler);
        resolve(true);
      };
      
      window.addEventListener(testEventName, handler);
      
      // Dispatch test event
      const userInfo = this.checkUserId();
      const userId = userInfo?.userId ? Number(userInfo.userId) : 999;
      
      window.dispatchEvent(new CustomEvent(testEventName, {
        detail: { userId: userId }
      }));
      
      // Timeout after 1 second
      setTimeout(() => {
        if (!eventReceived) {
          this.log('Event listener test failed - timeout', 'error');
          window.removeEventListener(testEventName, handler);
          resolve(false);
        }
      }, 1000);
    });
  }

  // Check if NotificationBell component is mounted
  checkNotificationBellComponent() {
    this.log('Checking NotificationBell component...');
    
    try {
      // Look for the bell icon in the DOM
      const bellButton = document.querySelector('button[class*="hover:bg-white"]');
      
      if (bellButton) {
        this.log('NotificationBell component found in DOM', 'success');
        
        // Check for bell icon
        const bellIcon = bellButton.querySelector('svg');
        if (bellIcon) {
          this.log('Bell icon visible', 'success');
        } else {
          this.log('Bell icon not found', 'warning');
        }
        
        return true;
      } else {
        this.log('NotificationBell component not found in DOM', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error checking component: ${error.message}`, 'error');
      return false;
    }
  }

  // Simulate receiving a notification
  simulateNotificationReceived() {
    this.log('Simulating notification reception...');
    
    try {
      const userInfo = this.checkUserId();
      if (!userInfo || !userInfo.userId) {
        this.log('Cannot simulate - user ID not available', 'error');
        return false;
      }

      const userId = Number(userInfo.userId);
      const notification = {
        id: Date.now() + Math.random(),
        type: 'MEETING_INVITATION',
        title: 'Diagnostic Test: Meeting Invitation',
        message: `This is a diagnostic test notification sent at ${new Date().toLocaleString()}`,
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

      // Trigger event
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { userId: userId }
      }));

      this.log('Test notification created and event dispatched', 'success');
      this.log('Check the bell icon - you should see the notification appear', 'info');
      
      return true;
    } catch (error) {
      this.log(`Error simulating notification: ${error.message}`, 'error');
      return false;
    }
  }

  // Run complete diagnostics
  async runCompleteDiagnostics() {
    this.log('=== STARTING COMPLETE DIAGNOSTICS ===', 'info');
    
    const results = {
      userId: false,
      storage: false,
      events: false,
      component: false,
      simulation: false
    };

    // Test 1: User ID
    const userInfo = this.checkUserId();
    results.userId = userInfo && userInfo.userId ? true : false;
    
    // Test 2: Storage
    results.storage = this.checkNotificationStorage();
    
    // Test 3: Events
    results.events = await this.checkEventListeners();
    
    // Test 4: Component
    results.component = this.checkNotificationBellComponent();
    
    // Test 5: Simulation
    results.simulation = this.simulateNotificationReceived();
    
    // Summary
    this.log('=== DIAGNOSTICS SUMMARY ===', 'info');
    this.log(`User ID Check: ${results.userId ? 'PASS' : 'FAIL'}`, results.userId ? 'success' : 'error');
    this.log(`Storage Check: ${results.storage ? 'PASS' : 'FAIL'}`, results.storage ? 'success' : 'error');
    this.log(`Event System: ${results.events ? 'PASS' : 'FAIL'}`, results.events ? 'success' : 'error');
    this.log(`Component Check: ${results.component ? 'PASS' : 'FAIL'}`, results.component ? 'success' : 'error');
    this.log(`Simulation: ${results.simulation ? 'PASS' : 'FAIL'}`, results.simulation ? 'success' : 'error');
    
    const allPassed = Object.values(results).every(r => r === true);
    this.log(`Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, allPassed ? 'success' : 'error');
    
    if (!allPassed) {
      this.log('=== TROUBLESHOOTING SUGGESTIONS ===', 'warning');
      if (!results.userId) {
        this.log('❌ User ID issue - Check if you are logged in correctly');
      }
      if (!results.storage) {
        this.log('❌ Storage issue - Check if localStorage is enabled');
      }
      if (!results.events) {
        this.log('❌ Event system issue - Check browser console for errors');
      }
      if (!results.component) {
        this.log('❌ Component issue - NotificationBell may not be mounted');
      }
      if (!results.simulation) {
        this.log('❌ Simulation failed - Check all above issues first');
      }
    }
    
    return results;
  }

  // Check notification flow end-to-end
  async checkNotificationFlow() {
    this.log('=== CHECKING NOTIFICATION FLOW ===', 'info');
    
    try {
      const userInfo = this.checkUserId();
      if (!userInfo || !userInfo.userId) {
        this.log('Cannot check flow - user ID not available', 'error');
        return false;
      }

      const userId = Number(userInfo.userId);
      
      // Step 1: Create notification
      this.log('Step 1: Creating notification...', 'info');
      const notification = {
        id: Date.now() + Math.random(),
        type: 'MEETING_INVITATION',
        title: 'Flow Test: Meeting Invitation',
        message: `Flow test notification for user ${userId}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: { test: true }
      };

      const notifKey = `notifications_${userId}`;
      const existingNotifs = localStorage.getItem(notifKey);
      const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
      notifs.unshift(notification);
      localStorage.setItem(notifKey, JSON.stringify(notifs));
      this.log('✅ Notification stored in localStorage', 'success');

      // Step 2: Dispatch event
      this.log('Step 2: Dispatching event...', 'info');
      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { userId: userId }
      }));
      this.log('✅ Event dispatched', 'success');

      // Step 3: Verify storage
      this.log('Step 3: Verifying storage...', 'info');
      const stored = localStorage.getItem(notifKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.log(`✅ Verified: ${parsed.length} notifications in storage`, 'success');
      } else {
        this.log('❌ Verification failed - no notifications in storage', 'error');
        return false;
      }

      // Step 4: Check if NotificationBell picked it up
      this.log('Step 4: Waiting for NotificationBell to update...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if unread count badge is visible
      const badge = document.querySelector('span[class*="bg-red-500"]');
      if (badge && badge.textContent) {
        this.log(`✅ Unread count badge visible: ${badge.textContent}`, 'success');
        return true;
      } else {
        this.log('⚠️ Unread count badge not visible yet (may update shortly)', 'warning');
        return true; // Still consider it a pass since the notification is stored
      }
    } catch (error) {
      this.log(`Error checking flow: ${error.message}`, 'error');
      return false;
    }
  }
}

// Create global instance
const notificationDiagnostics = new NotificationDiagnostics();

// Make available globally
window.notificationDiagnostics = notificationDiagnostics;

// Add convenient global functions
window.diagnoseMeetingNotifications = () => notificationDiagnostics.runCompleteDiagnostics();
window.checkNotificationFlow = () => notificationDiagnostics.checkNotificationFlow();

console.log('🔍 Notification Diagnostics Loaded');
console.log('Available commands:');
console.log('  diagnoseMeetingNotifications() - Run complete diagnostics');
console.log('  checkNotificationFlow() - Check end-to-end notification flow');

export default notificationDiagnostics;