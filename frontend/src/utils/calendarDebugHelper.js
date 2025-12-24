// Debug helper for calendar system
export const calendarDebugHelper = {
  // Get all calendar-related localStorage keys
  getAllCalendarKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('Calendar') || key.includes('shared') || key.includes('notification'))) {
        keys.push(key);
      }
    }
    return keys;
  },

  // Get all calendar data
  getAllCalendarData() {
    const data = {};
    this.getAllCalendarKeys().forEach(key => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    });
    return data;
  },

  // Get shared events for a specific user
  getSharedEventsForUser(userId) {
    const key = `sharedCalendarEvents_${userId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  // Get notifications for a specific user
  getNotificationsForUser(userId) {
    const key = `notifications_${userId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  // Get local events for a role
  getLocalEventsForRole(role) {
    const key = `${role}CalendarEvents`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },

  // Print debug info to console
  printDebugInfo(userId, role) {
    console.log('=== CALENDAR DEBUG INFO ===');
    console.log(`User ID: ${userId}, Role: ${role}`);
    console.log('');
    
    console.log('Local Events:');
    const localEvents = this.getLocalEventsForRole(role);
    console.log(`  Count: ${localEvents.length}`);
    if (localEvents.length > 0) {
      localEvents.forEach(e => {
        console.log(`  - ${e.title} (${e.date}) [${e.isMeeting ? 'MEETING' : 'EVENT'}]`);
      });
    }
    console.log('');

    console.log('Shared Events (for this user):');
    const sharedEvents = this.getSharedEventsForUser(userId);
    console.log(`  Count: ${sharedEvents.length}`);
    if (sharedEvents.length > 0) {
      sharedEvents.forEach(e => {
        console.log(`  - ${e.title} (${e.date}) [${e.isMeeting ? 'MEETING' : 'EVENT'}]`);
      });
    }
    console.log('');

    console.log('Notifications (for this user):');
    const notifs = this.getNotificationsForUser(userId);
    console.log(`  Count: ${notifs.length}`);
    if (notifs.length > 0) {
      notifs.forEach(n => {
        console.log(`  - ${n.title} (${n.type})`);
      });
    }
    console.log('');

    console.log('All Calendar Keys:');
    const allKeys = this.getAllCalendarKeys();
    allKeys.forEach(key => {
      const data = localStorage.getItem(key);
      const parsed = JSON.parse(data);
      console.log(`  ${key}: ${Array.isArray(parsed) ? parsed.length + ' items' : 'object'}`);
    });
    console.log('========================');
  }
};
