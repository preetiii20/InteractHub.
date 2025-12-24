// Notification Debug Utility
export const notificationDebug = {
  // Test if localStorage notifications work
  testNotificationStorage: (userId, testNotification = null) => {
    const numericUserId = Number(userId);
    console.log(`🧪 Testing notification storage for user ${numericUserId}`);
    
    const testNotif = testNotification || {
      id: Date.now() + Math.random(),
      type: 'MEETING_INVITATION',
      title: 'Test Meeting Notification',
      message: 'This is a test notification to verify the system works',
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        meetingId: 999,
        meetingTitle: 'Test Meeting',
        meetingDate: '2025-12-22',
        meetingTime: '10:00'
      }
    };
    
    // Store notification
    const notifKey = `notifications_${numericUserId}`;
    const existing = localStorage.getItem(notifKey);
    const notifs = existing ? JSON.parse(existing) : [];
    notifs.unshift(testNotif);
    localStorage.setItem(notifKey, JSON.stringify(notifs));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { userId: numericUserId }
    }));
    
    console.log(`✅ Test notification stored for user ${numericUserId}`);
    console.log('📬 Notification:', testNotif);
    
    return testNotif;
  },
  
  // Check notifications for a user
  checkNotifications: (userId) => {
    const numericUserId = Number(userId);
    const notifKey = `notifications_${numericUserId}`;
    const notifications = localStorage.getItem(notifKey);
    
    if (notifications) {
      const parsed = JSON.parse(notifications);
      console.log(`📬 User ${numericUserId} has ${parsed.length} notifications:`);
      parsed.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.read ? 'Read' : 'Unread'}`);
      });
      return parsed;
    } else {
      console.log(`📭 No notifications found for user ${numericUserId}`);
      return [];
    }
  },
  
  // Clear notifications for a user
  clearNotifications: (userId) => {
    const numericUserId = Number(userId);
    const notifKey = `notifications_${numericUserId}`;
    localStorage.removeItem(notifKey);
    console.log(`🗑️ Cleared notifications for user ${numericUserId}`);
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { userId: numericUserId }
    }));
  },
  
  // Send a meeting notification manually
  sendMeetingNotification: (participantId, meetingData) => {
    const numId = Number(participantId);
    console.log(`📬 Sending meeting notification to user ${numId}`);
    
    const notification = {
      id: Date.now() + Math.random(),
      type: 'MEETING_INVITATION',
      title: `Meeting Invitation: ${meetingData.title}`,
      message: `You've been invited to "${meetingData.title}" on ${meetingData.date} at ${meetingData.time}. Check your calendar for details.`,
      timestamp: new Date().toISOString(),
      read: false,
      data: {
        meetingId: meetingData.id || Date.now(),
        meetingTitle: meetingData.title,
        meetingDate: meetingData.date,
        meetingTime: meetingData.time,
        jitsiLink: meetingData.jitsiLink || 'https://meet.jit.si/test'
      }
    };
    
    const notifKey = `notifications_${numId}`;
    const existingNotifs = localStorage.getItem(notifKey);
    const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
    notifs.unshift(notification);
    localStorage.setItem(notifKey, JSON.stringify(notifs));

    // Trigger notification update event
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { userId: numId }
    }));
    
    console.log(`✅ Meeting notification sent to user ${numId}`);
    return notification;
  },
  
  // Test the complete notification flow
  testCompleteFlow: async (organizerId, participantIds, meetingTitle = 'Debug Test Meeting') => {
    console.log('🚀 Testing complete notification flow...');
    console.log(`👤 Organizer: ${organizerId}`);
    console.log(`👥 Participants: ${participantIds.join(', ')}`);
    
    const meetingData = {
      title: meetingTitle,
      description: 'Debug test meeting',
      meetingDate: '2025-12-22',
      meetingTime: '14:00',
      meetingEndTime: '15:00',
      jitsiLink: `https://meet.jit.si/debug-${Date.now()}`,
      organizerId: Number(organizerId),
      organizerRole: 'admin',
      participantIds: participantIds.map(id => Number(id))
    };
    
    try {
      // Create meeting via API
      console.log('📝 Creating meeting via API...');
      const response = await fetch('http://localhost:8081/api/admin/meetings/with-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Meeting created:', result.meeting.id);
        
        // Send notifications to participants
        console.log('📬 Sending notifications to participants...');
        for (const participantId of participantIds) {
          this.sendMeetingNotification(participantId, {
            id: result.meeting.id,
            title: meetingTitle,
            date: meetingData.meetingDate,
            time: meetingData.meetingTime,
            jitsiLink: result.meeting.jitsiLink
          });
        }
        
        console.log('🎉 Complete flow test successful!');
        return result;
      } else {
        console.error('❌ Failed to create meeting:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error in complete flow test:', error);
      return null;
    }
  }
};

// Make it available globally for debugging
window.notificationDebug = notificationDebug;

export default notificationDebug;