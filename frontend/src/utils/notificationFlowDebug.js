/**
 * Notification Flow Debugging Utility
 * Helps trace where notifications are getting lost in the system
 */

import globalNotificationService from '../services/GlobalNotificationService';
import notificationService from '../services/NotificationService';

const notificationFlowDebug = {
  /**
   * Test the complete notification flow
   */
  testCompleteFlow: async (userId = 2) => {
    console.log('🧪 Starting complete notification flow test...');
    console.log('═'.repeat(60));
    
    const testNotification = {
      type: 'meeting-scheduled',
      title: 'Test Meeting: Flow Debug',
      message: 'This is a test notification to verify the complete flow',
      details: '1 participant invited',
      data: {
        meetingId: 999,
        meetingTitle: 'Test Meeting',
        meetingDate: '2025-12-25',
        meetingTime: '10:00',
        jitsiLink: 'https://meet.jit.si/test'
      }
    };

    console.log('\n📋 Test Notification Object:');
    console.log(testNotification);

    console.log('\n📊 System State Before Broadcast:');
    console.log(`  - Global listeners: ${globalNotificationService.getListenerCount()}`);
    console.log(`  - Listener IDs: ${Array.from(globalNotificationService.listeners.keys()).join(', ')}`);
    console.log(`  - Queued notifications: ${globalNotificationService.getQueuedNotifications().length}`);

    console.log('\n📢 Broadcasting notification...');
    globalNotificationService.broadcast(testNotification, userId);

    console.log('\n📊 System State After Broadcast:');
    console.log(`  - Global listeners: ${globalNotificationService.getListenerCount()}`);
    console.log(`  - Queued notifications: ${globalNotificationService.getQueuedNotifications().length}`);

    console.log('\n💾 Checking localStorage:');
    const storageKey = `notifications_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const notifications = JSON.parse(stored);
      console.log(`  ✅ Found ${notifications.length} notifications in localStorage`);
      console.log(`  - Latest: ${notifications[0]?.title}`);
    } else {
      console.log(`  ❌ No notifications found in localStorage for key: ${storageKey}`);
    }

    console.log('\n🔔 Checking NotificationService:');
    const serviceNotifications = notificationService.getNotifications(userId);
    console.log(`  - NotificationService has ${serviceNotifications.length} notifications`);

    console.log('\n═'.repeat(60));
    console.log('✅ Test complete. Check above for any ❌ marks.');
  },

  /**
   * Check if listeners are properly registered
   */
  checkListeners: () => {
    console.log('🔍 Checking Global Notification Listeners:');
    console.log('═'.repeat(60));
    
    const listenerCount = globalNotificationService.getListenerCount();
    console.log(`Total listeners: ${listenerCount}`);
    
    if (listenerCount === 0) {
      console.warn('⚠️ WARNING: No listeners registered!');
      console.warn('   This means notifications will not be delivered to popups.');
      console.warn('   Make sure NotificationProvider is mounted in App.js');
    } else {
      console.log('✅ Listeners registered:');
      globalNotificationService.listeners.forEach((callback, listenerId) => {
        console.log(`   - ${listenerId}`);
      });
    }
    
    console.log('═'.repeat(60));
  },

  /**
   * Simulate the complete meeting scheduling flow
   */
  simulateMeetingSchedule: async (userId = 2) => {
    console.log('🎬 Simulating Meeting Schedule Flow:');
    console.log('═'.repeat(60));

    // Step 1: Check listeners
    console.log('\n1️⃣ Checking listeners...');
    const listenerCount = globalNotificationService.getListenerCount();
    console.log(`   Listeners: ${listenerCount}`);
    if (listenerCount === 0) {
      console.error('   ❌ ERROR: No listeners! Notifications will not display.');
      return;
    }

    // Step 2: Create notification
    console.log('\n2️⃣ Creating meeting scheduled notification...');
    const notification = {
      type: 'meeting-scheduled',
      title: 'Meeting Scheduled: Team Sync',
      message: 'You have scheduled a meeting on 2025-12-25 at 10:00',
      details: '2 participant(s) invited',
      data: {
        meetingId: 123,
        meetingTitle: 'Team Sync',
        meetingDate: '2025-12-25',
        meetingTime: '10:00',
        jitsiLink: 'https://meet.jit.si/abc123'
      }
    };
    console.log('   ✅ Notification created');

    // Step 3: Broadcast
    console.log('\n3️⃣ Broadcasting notification...');
    globalNotificationService.broadcast(notification, userId);
    console.log('   ✅ Broadcast called');

    // Step 4: Check localStorage
    console.log('\n4️⃣ Checking localStorage...');
    const storageKey = `notifications_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const notifications = JSON.parse(stored);
      console.log(`   ✅ Found in localStorage: ${notifications.length} notifications`);
      console.log(`   - Latest: "${notifications[0]?.title}"`);
    } else {
      console.error(`   ❌ NOT found in localStorage (key: ${storageKey})`);
    }

    // Step 5: Check bell icon
    console.log('\n5️⃣ Checking bell icon notifications...');
    const bellNotifications = notificationService.getNotifications(userId);
    console.log(`   - Bell icon has: ${bellNotifications.length} notifications`);

    console.log('\n═'.repeat(60));
    console.log('✅ Simulation complete');
  },

  /**
   * Trace a notification through the system
   */
  traceNotification: (userId = 2) => {
    console.log('🔎 Tracing Notification Through System:');
    console.log('═'.repeat(60));

    console.log('\n1. GlobalNotificationService:');
    console.log(`   - Listeners: ${globalNotificationService.getListenerCount()}`);
    console.log(`   - Queued: ${globalNotificationService.getQueuedNotifications().length}`);

    console.log('\n2. NotificationService (Bell Icon):');
    const bellNotifs = notificationService.getNotifications(userId);
    console.log(`   - Notifications: ${bellNotifs.length}`);
    if (bellNotifs.length > 0) {
      console.log(`   - Latest: "${bellNotifs[0]?.title}"`);
    }

    console.log('\n3. localStorage:');
    const storageKey = `notifications_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const notifs = JSON.parse(stored);
      console.log(`   - Key: ${storageKey}`);
      console.log(`   - Count: ${notifs.length}`);
      if (notifs.length > 0) {
        console.log(`   - Latest: "${notifs[0]?.title}"`);
      }
    } else {
      console.log(`   - Key: ${storageKey} (NOT FOUND)`);
    }

    console.log('\n4. NotificationContext (Popup):');
    console.log('   - Check React DevTools to see notifications state');
    console.log('   - Or check GlobalNotificationCenter component');

    console.log('\n═'.repeat(60));
  },

  /**
   * Test listener subscription
   */
  testListenerSubscription: () => {
    console.log('🧪 Testing Listener Subscription:');
    console.log('═'.repeat(60));

    console.log('\nBefore subscription:');
    console.log(`  Listeners: ${globalNotificationService.getListenerCount()}`);

    console.log('\nSubscribing test listener...');
    let callCount = 0;
    const unsubscribe = globalNotificationService.subscribe('test-listener', (notification) => {
      callCount++;
      console.log(`  📢 Listener called (count: ${callCount})`);
      console.log(`     Notification: ${notification.title}`);
    });

    console.log(`After subscription:`);
    console.log(`  Listeners: ${globalNotificationService.getListenerCount()}`);

    console.log('\nBroadcasting test notification...');
    globalNotificationService.broadcast({
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test'
    }, 2);

    console.log(`\nListener was called ${callCount} time(s)`);
    if (callCount === 0) {
      console.error('❌ ERROR: Listener was not called!');
    } else {
      console.log('✅ Listener subscription working');
    }

    console.log('\nUnsubscribing...');
    unsubscribe();
    console.log(`After unsubscribe: ${globalNotificationService.getListenerCount()} listeners`);

    console.log('═'.repeat(60));
  },

  /**
   * Full diagnostic report
   */
  fullDiagnostic: (userId = 2) => {
    console.log('\n\n');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '🔍 NOTIFICATION SYSTEM DIAGNOSTIC' + ' '.repeat(10) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');

    console.log('\n📋 SYSTEM CONFIGURATION:');
    console.log(`  - Current User ID: ${userId}`);
    console.log(`  - Storage Key: notifications_${userId}`);

    console.log('\n🔔 GLOBAL NOTIFICATION SERVICE:');
    console.log(`  - Listeners: ${globalNotificationService.getListenerCount()}`);
    console.log(`  - Queued Notifications: ${globalNotificationService.getQueuedNotifications().length}`);
    if (globalNotificationService.getListenerCount() === 0) {
      console.error('  ❌ WARNING: No listeners registered!');
    }

    console.log('\n📬 NOTIFICATION SERVICE (BELL ICON):');
    const bellNotifs = notificationService.getNotifications(userId);
    console.log(`  - Total Notifications: ${bellNotifs.length}`);
    console.log(`  - Unread Count: ${notificationService.getUnreadCount(userId)}`);
    if (bellNotifs.length > 0) {
      console.log(`  - Latest: "${bellNotifs[0]?.title}"`);
    }

    console.log('\n💾 LOCAL STORAGE:');
    const storageKey = `notifications_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const notifs = JSON.parse(stored);
      console.log(`  - Key: ${storageKey}`);
      console.log(`  - Count: ${notifs.length}`);
      if (notifs.length > 0) {
        console.log(`  - Latest: "${notifs[0]?.title}"`);
        console.log(`  - Type: ${notifs[0]?.type}`);
      }
    } else {
      console.log(`  - Key: ${storageKey} (EMPTY)`);
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('  1. Run: notificationFlowDebug.testCompleteFlow()');
    console.log('  2. Check browser console for any ❌ marks');
    console.log('  3. If no listeners, check if NotificationProvider is in App.js');
    console.log('  4. If no popup, check if GlobalNotificationCenter is rendered');

    console.log('\n' + '═'.repeat(60) + '\n');
  }
};

// Make available globally
window.notificationFlowDebug = notificationFlowDebug;

console.log('✅ Notification Flow Debug utility loaded');
console.log('   Use: notificationFlowDebug.fullDiagnostic()');

export default notificationFlowDebug;
