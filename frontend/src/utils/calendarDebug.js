/**
 * Calendar & Notification Debug Helper
 * Use these functions in browser console to test the meeting scheduling system
 */

export const calendarDebug = {
  // Check what's stored in localStorage for a specific user
  checkUserCalendar: (userId) => {
    const localKey = `employeeCalendarEvents`; // or adminCalendarEvents, etc
    const sharedKey = `sharedCalendarEvents_${userId}`;
    
    const local = localStorage.getItem(localKey);
    const shared = localStorage.getItem(sharedKey);
    
    console.log(`\n📅 Calendar Data for User ${userId}:`);
    console.log(`Local (${localKey}):`, local ? JSON.parse(local) : 'EMPTY');
    console.log(`Shared (${sharedKey}):`, shared ? JSON.parse(shared) : 'EMPTY');
  },

  // Check notifications for a specific user
  checkUserNotifications: (userId) => {
    const notifKey = `notifications_${userId}`;
    const notifs = localStorage.getItem(notifKey);
    
    console.log(`\n🔔 Notifications for User ${userId}:`);
    console.log(`Key: ${notifKey}`);
    console.log(`Data:`, notifs ? JSON.parse(notifs) : 'EMPTY');
  },

  // Clear all calendar and notification data
  clearAllData: () => {
    const keys = Object.keys(localStorage);
    const calendarKeys = keys.filter(k => 
      k.includes('CalendarEvents') || 
      k.includes('sharedCalendarEvents') || 
      k.includes('notifications')
    );
    
    console.log(`\n🗑️ Clearing ${calendarKeys.length} calendar/notification keys:`);
    calendarKeys.forEach(key => {
      console.log(`  - ${key}`);
      localStorage.removeItem(key);
    });
  },

  // Simulate a meeting being scheduled
  simulateMeeting: (organizerId, participantIds, title = 'Test Meeting') => {
    const dateStr = new Date().toISOString().split('T')[0];
    const meeting = {
      id: Date.now() + Math.random(),
      date: dateStr,
      title: title,
      description: 'Test meeting',
      time: '14:00',
      endTime: '15:00',
      jitsiLink: `https://meet.jit.si/test-${Date.now()}`,
      isMeeting: true,
      type: 'meeting',
      participants: participantIds.map(id => `User ${id}`),
      participantIds: participantIds,
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };

    console.log(`\n📅 Simulating meeting creation:`);
    console.log(`Organizer: ${organizerId}`);
    console.log(`Participants: ${participantIds.join(', ')}`);
    console.log(`Meeting:`, meeting);

    // Save to each participant's shared calendar
    for (const participantId of participantIds) {
      const sharedKey = `sharedCalendarEvents_${participantId}`;
      const existing = localStorage.getItem(sharedKey);
      const events = existing ? JSON.parse(existing) : [];
      events.push(meeting);
      localStorage.setItem(sharedKey, JSON.stringify(events));
      console.log(`✅ Saved to ${sharedKey}`);
    }

    // Create notifications
    for (const participantId of participantIds) {
      const notifKey = `notifications_${participantId}`;
      const notification = {
        id: Date.now() + Math.random(),
        type: 'MEETING_INVITATION',
        title: `Meeting Invitation: ${title}`,
        message: `You've been invited to "${title}" on ${dateStr} at 14:00`,
        timestamp: new Date().toISOString(),
        read: false,
        data: { meetingTitle: title, meetingDate: dateStr }
      };
      
      const existing = localStorage.getItem(notifKey);
      const notifs = existing ? JSON.parse(existing) : [];
      notifs.unshift(notification);
      localStorage.setItem(notifKey, JSON.stringify(notifs));
      console.log(`✅ Notification saved to ${notifKey}`);
    }
  },

  // Show all localStorage keys related to calendar/notifications
  showAllKeys: () => {
    const keys = Object.keys(localStorage);
    const relevant = keys.filter(k => 
      k.includes('CalendarEvents') || 
      k.includes('sharedCalendarEvents') || 
      k.includes('notifications')
    );
    
    console.log(`\n📦 All Calendar/Notification Keys (${relevant.length}):`);
    relevant.forEach(key => {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : null;
      console.log(`${key}: ${parsed ? parsed.length || 'object' : 'EMPTY'}`);
    });
  }
};

// Export for use in console
window.calendarDebug = calendarDebug;
