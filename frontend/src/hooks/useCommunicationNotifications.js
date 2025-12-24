import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import globalNotificationService from '../services/GlobalNotificationService';
import apiConfig from '../config/api';
import { authHelpers } from '../config/auth';

/**
 * Hook to listen for announcements, polls, and live chat notifications
 * Broadcasts them globally across the application
 */
export const useCommunicationNotifications = (userEmail, userName) => {
  const stompRef = useRef(null);
  const userId = authHelpers.getUserId(); // Get numeric user ID

  useEffect(() => {
    if (!userEmail || !userName) return;

    console.log('🔔 Setting up communication notifications for:', userName);

    // Create WebSocket connections
    const chatSocket = new SockJS(apiConfig.websocketUrl);
    const adminSocket = new SockJS(apiConfig.adminWebsocketUrl);
    
    const chatClient = new Client({ 
      webSocketFactory: () => chatSocket, 
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ Chat WebSocket connected for notifications');
        setupChatSubscriptions(chatClient, userEmail, userName, userId);
      },
      onDisconnect: () => {
        console.log('❌ Chat WebSocket disconnected');
      }
    });

    const adminClient = new Client({ 
      webSocketFactory: () => adminSocket, 
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ Admin WebSocket connected for notifications');
        setupAdminSubscriptions(adminClient, userEmail, userName, userId);
      },
      onDisconnect: () => {
        console.log('❌ Admin WebSocket disconnected');
      }
    });

    chatClient.activate();
    adminClient.activate();
    stompRef.current = { chat: chatClient, admin: adminClient };

    return () => {
      console.log('🔔 Cleaning up communication notifications');
      chatClient.deactivate();
      adminClient.deactivate();
    };
  }, [userEmail, userName, userId]);

  return stompRef;
};

/**
 * Helper function to extract username from email or ID
 * Tries multiple strategies to get a readable username
 */
function extractUsernameFromEmail(emailOrName) {
  if (!emailOrName) return '';
  
  const str = String(emailOrName).trim();
  
  // If it's a number (user ID), return empty to use fallback
  if (!isNaN(str)) {
    return '';
  }
  
  // If it contains @, it's an email - extract the part before @
  if (str.includes('@')) {
    const username = str.split('@')[0];
    // Capitalize first letter for better display
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  // Otherwise it's already a username - capitalize first letter
  if (str.length > 0) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  return '';
}

/**
 * Setup chat service subscriptions for announcements, polls, and messages
 */
function setupChatSubscriptions(client, userEmail, userName, userId) {
  // Track sent notifications to avoid duplicates
  const sentNotifications = new Set();

  // Subscribe to new announcements
  client.subscribe('/topic/announcements.new', (msg) => {
    try {
      const announcement = JSON.parse(msg.body || '{}');
      const audience = (announcement.targetAudience || '').toUpperCase();
      const notifKey = `announcement-${announcement.id}`;
      
      // Check if this user should see this announcement and avoid duplicates
      if (['ALL', 'MANAGER', 'HR', 'EMPLOYEE', 'ADMIN'].includes(audience) && !sentNotifications.has(notifKey)) {
        sentNotifications.add(notifKey);
        globalNotificationService.broadcast({
          type: 'announcement',
          title: announcement.title || 'New Announcement',
          message: announcement.content?.substring(0, 100) + (announcement.content?.length > 100 ? '...' : '') || 'New announcement posted',
          details: `By ${userName}`,
          userName: userName,
          data: announcement
        }, userId);
        console.log('📢 Announcement notification broadcasted:', announcement.title);
      }
    } catch (error) {
      console.error('❌ Error processing announcement notification:', error);
    }
  });

  // Subscribe to new polls
  client.subscribe('/topic/polls.new', (msg) => {
    try {
      const poll = JSON.parse(msg.body || '{}');
      const audience = (poll.targetAudience || '').toUpperCase();
      const notifKey = `poll-${poll.id}`;
      
      // Check if this user should see this poll and avoid duplicates
      if (['ALL', 'MANAGER', 'HR', 'EMPLOYEE', 'ADMIN'].includes(audience) && !sentNotifications.has(notifKey)) {
        sentNotifications.add(notifKey);
        globalNotificationService.broadcast({
          type: 'poll',
          title: 'New Poll',
          message: poll.question || 'New poll created',
          details: `By ${userName}`,
          userName: userName,
          data: poll
        }, userId);
        console.log('📊 Poll notification broadcasted:', poll.question);
      }
    } catch (error) {
      console.error('❌ Error processing poll notification:', error);
    }
  });

  // Subscribe to new direct messages
  client.subscribe(`/user/${userEmail.toLowerCase()}/queue/notify`, (msg) => {
    try {
      const notification = JSON.parse(msg.body || '{}');
      
      if (notification.type === 'dm' || notification.type === 'group_message') {
        // Try to get full name (first and last name) from various fields
        let senderUsername = notification.fullName ||
                            (notification.firstName && notification.lastName ? 
                              `${notification.firstName} ${notification.lastName}` : null) ||
                            notification.fromName || 
                            notification.senderName ||
                            extractUsernameFromEmail(notification.fromEmail) ||
                            extractUsernameFromEmail(notification.from);
        
        // If still empty, use a generic name
        if (!senderUsername) {
          senderUsername = 'Someone';
        }
        
        globalNotificationService.broadcast({
          type: 'live-chat',
          title: `Message from ${senderUsername}`,
          message: notification.preview || 'New message',
          details: 'Click to view',
          userName: senderUsername,
          data: notification
        }, userId);
        console.log('💬 Live chat notification broadcasted from:', senderUsername);
      }
    } catch (error) {
      console.error('❌ Error processing live chat notification:', error);
    }
  });

  // Subscribe to topic-based notifications (fallback)
  client.subscribe(`/topic/user-notifications.${userEmail.toLowerCase()}`, (msg) => {
    try {
      const notification = JSON.parse(msg.body || '{}');
      
      if (notification.type === 'dm' || notification.type === 'group_message') {
        // Try to get full name (first and last name) from various fields
        let senderUsername = notification.fullName ||
                            (notification.firstName && notification.lastName ? 
                              `${notification.firstName} ${notification.lastName}` : null) ||
                            notification.fromName || 
                            notification.senderName ||
                            extractUsernameFromEmail(notification.fromEmail) ||
                            extractUsernameFromEmail(notification.from);
        
        // If still empty, use a generic name
        if (!senderUsername) {
          senderUsername = 'Someone';
        }
        
        globalNotificationService.broadcast({
          type: 'live-chat',
          title: `Message from ${senderUsername}`,
          message: notification.preview || 'New message',
          details: 'Click to view',
          userName: senderUsername,
          data: notification
        }, userId);
        console.log('💬 Live chat notification broadcasted (topic) from:', senderUsername);
      }
    } catch (error) {
      console.error('❌ Error processing topic notification:', error);
    }
  });
}

/**
 * Setup admin service subscriptions for deletions and updates
 */
function setupAdminSubscriptions(client, userEmail, userName, userId) {
  // Subscribe to announcement deletions
  client.subscribe('/topic/announcements.deleted', (msg) => {
    try {
      const deletion = JSON.parse(msg.body || '{}');
      globalNotificationService.broadcast({
        type: 'warning',
        title: 'Announcement Removed',
        message: 'An announcement has been deleted',
        details: 'The announcement is no longer available',
        data: deletion
      }, userId);
      console.log('⚠️ Announcement deletion notification broadcasted');
    } catch (error) {
      console.error('❌ Error processing deletion notification:', error);
    }
  });

  // Subscribe to poll deletions
  client.subscribe('/topic/polls.deleted', (msg) => {
    try {
      const deletion = JSON.parse(msg.body || '{}');
      globalNotificationService.broadcast({
        type: 'warning',
        title: 'Poll Removed',
        message: 'A poll has been deleted',
        details: 'The poll is no longer available',
        data: deletion
      }, userId);
      console.log('⚠️ Poll deletion notification broadcasted');
    } catch (error) {
      console.error('❌ Error processing poll deletion notification:', error);
    }
  });

  // Subscribe to task assignments
  client.subscribe(`/user/${userEmail.toLowerCase()}/queue/task-assigned`, (msg) => {
    try {
      const taskNotification = JSON.parse(msg.body || '{}');
      
      // Get assigner name
      let assignerName = taskNotification.assignerName ||
                        (taskNotification.assignerFirstName && taskNotification.assignerLastName ?
                          `${taskNotification.assignerFirstName} ${taskNotification.assignerLastName}` : null) ||
                        extractUsernameFromEmail(taskNotification.assignerEmail) ||
                        'Manager';
      
      globalNotificationService.broadcast({
        type: 'task-assignment',
        title: 'Task Assigned to You',
        message: taskNotification.taskTitle || 'New task assigned',
        details: `By ${assignerName}`,
        userName: assignerName,
        data: taskNotification
      }, userId);
      console.log('📋 Task assignment notification broadcasted:', taskNotification.taskTitle);
    } catch (error) {
      console.error('❌ Error processing task assignment notification:', error);
    }
  });

  // Subscribe to topic-based task assignments (fallback)
  client.subscribe(`/topic/task-assignments.${userEmail.toLowerCase()}`, (msg) => {
    try {
      const taskNotification = JSON.parse(msg.body || '{}');
      
      // Get assigner name
      let assignerName = taskNotification.assignerName ||
                        (taskNotification.assignerFirstName && taskNotification.assignerLastName ?
                          `${taskNotification.assignerFirstName} ${taskNotification.assignerLastName}` : null) ||
                        extractUsernameFromEmail(taskNotification.assignerEmail) ||
                        'Manager';
      
      globalNotificationService.broadcast({
        type: 'task-assignment',
        title: 'Task Assigned to You',
        message: taskNotification.taskTitle || 'New task assigned',
        details: `By ${assignerName}`,
        userName: assignerName,
        data: taskNotification
      }, userId);
      console.log('📋 Task assignment notification broadcasted (topic):', taskNotification.taskTitle);
    } catch (error) {
      console.error('❌ Error processing task assignment topic notification:', error);
    }
  });

  // Subscribe to meeting scheduled notifications
  client.subscribe('/topic/meetings.scheduled', (msg) => {
    try {
      const meetingNotification = JSON.parse(msg.body || '{}');
      
      // Get organizer name
      let organizerName = meetingNotification.organizerName ||
                         (meetingNotification.organizerFirstName && meetingNotification.organizerLastName ?
                           `${meetingNotification.organizerFirstName} ${meetingNotification.organizerLastName}` : null) ||
                         extractUsernameFromEmail(meetingNotification.organizerEmail) ||
                         'Organizer';
      
      globalNotificationService.broadcast({
        type: 'meeting-scheduled',
        title: `Meeting Scheduled: ${meetingNotification.title || 'New Meeting'}`,
        message: `You've been invited to "${meetingNotification.title || 'a meeting'}" on ${meetingNotification.meetingDate} at ${meetingNotification.meetingTime}`,
        details: `By ${organizerName}`,
        userName: organizerName,
        data: meetingNotification
      }, userId);
      console.log('📅 Meeting scheduled notification broadcasted:', meetingNotification.title);
    } catch (error) {
      console.error('❌ Error processing meeting scheduled notification:', error);
    }
  });

  // Subscribe to meeting cancelled notifications
  client.subscribe('/topic/meetings.cancelled', (msg) => {
    try {
      const meetingNotification = JSON.parse(msg.body || '{}');
      
      globalNotificationService.broadcast({
        type: 'meeting-cancelled',
        title: `Meeting Cancelled: ${meetingNotification.title || 'Meeting'}`,
        message: `The meeting "${meetingNotification.title || 'a meeting'}" scheduled for ${meetingNotification.meetingDate} at ${meetingNotification.meetingTime} has been cancelled`,
        details: 'Check your calendar for updates',
        data: meetingNotification
      }, userId);
      console.log('❌ Meeting cancelled notification broadcasted:', meetingNotification.title);
    } catch (error) {
      console.error('❌ Error processing meeting cancelled notification:', error);
    }
  });

  // Subscribe to user-specific meeting notifications (queue-based)
  client.subscribe(`/user/${userEmail.toLowerCase()}/queue/meetings`, (msg) => {
    try {
      const meetingNotification = JSON.parse(msg.body || '{}');
      console.log('📬 Received meeting notification on queue:', meetingNotification);
      console.log('📬 Notification type:', meetingNotification.type);
      
      if (meetingNotification.type === 'MEETING_SCHEDULED' || meetingNotification.type === 'MEETING_INVITATION') {
        let organizerName = meetingNotification.organizerName ||
                           (meetingNotification.organizerFirstName && meetingNotification.organizerLastName ?
                             `${meetingNotification.organizerFirstName} ${meetingNotification.organizerLastName}` : null) ||
                           extractUsernameFromEmail(meetingNotification.organizerEmail) ||
                           'Organizer';
        
        console.log('📅 Broadcasting meeting invitation popup:', meetingNotification.title);
        const broadcastResult = globalNotificationService.broadcast({
          type: 'meeting-scheduled',
          title: `Meeting Invitation: ${meetingNotification.title || 'New Meeting'}`,
          message: `You've been invited to "${meetingNotification.title || 'a meeting'}" on ${meetingNotification.meetingDate} at ${meetingNotification.meetingTime}`,
          details: `By ${organizerName}`,
          userName: organizerName,
          data: meetingNotification
        }, userId);
        console.log('✅ Meeting invitation notification broadcasted (queue):', meetingNotification.title);
        console.log('📢 Broadcast result:', broadcastResult);
      } else if (meetingNotification.type === 'MEETING_CANCELLED') {
        console.log('❌ Broadcasting meeting cancellation popup:', meetingNotification.title);
        console.log('❌ Cancellation notification details:', meetingNotification);
        const broadcastResult = globalNotificationService.broadcast({
          type: 'meeting-cancelled',
          title: `Meeting Cancelled: ${meetingNotification.title || 'Meeting'}`,
          message: `The meeting "${meetingNotification.title || 'a meeting'}" has been cancelled`,
          details: 'Check your calendar for updates',
          data: meetingNotification
        }, userId);
        console.log('✅ Meeting cancellation notification broadcasted (queue):', meetingNotification.title);
        console.log('📢 Broadcast result:', broadcastResult);
      } else {
        console.log('⚠️ Unknown meeting notification type:', meetingNotification.type);
      }
    } catch (error) {
      console.error('❌ Error processing queue meeting notification:', error);
      console.error('❌ Error details:', error.message);
    }
  }, (error) => {
    console.error('❌ Error subscribing to meeting queue:', error);
  });
  
  console.log(`✅ Subscribed to meeting queue: /user/${userEmail.toLowerCase()}/queue/meetings`);
  
  // Add a small delay and then check if we need to request pending notifications
  // This helps catch notifications that might have been sent while WebSocket was connecting
  setTimeout(() => {
    console.log('🔄 Checking for pending meeting notifications after WebSocket connection...');
    try {
      // Request any pending notifications from the server
      // This is a fallback mechanism to catch notifications sent during connection
      fetch(`http://localhost:8081/api/admin/meetings/pending-notifications`, {
        headers: {
          'X-User-Email': userEmail.toLowerCase()
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(pendingNotifications => {
        if (pendingNotifications && Array.isArray(pendingNotifications)) {
          console.log(`📬 Received ${pendingNotifications.length} pending notifications`);
          for (const notif of pendingNotifications) {
            console.log('📬 Processing pending notification:', notif);
            // Process each pending notification
            if (notif.type === 'MEETING_INVITATION' || notif.type === 'MEETING_SCHEDULED') {
              globalNotificationService.broadcast({
                type: 'meeting-scheduled',
                title: `Meeting Invitation: ${notif.title || 'New Meeting'}`,
                message: `You've been invited to "${notif.title || 'a meeting'}" on ${notif.meetingDate} at ${notif.meetingTime}`,
                details: 'Check your calendar for details',
                data: notif
              }, userId);
            } else if (notif.type === 'MEETING_CANCELLED') {
              globalNotificationService.broadcast({
                type: 'meeting-cancelled',
                title: `Meeting Cancelled: ${notif.title || 'Meeting'}`,
                message: `The meeting "${notif.title || 'a meeting'}" has been cancelled`,
                details: 'Check your calendar for updates',
                data: notif
              }, userId);
            }
          }
        }
      })
      .catch(error => {
        console.log('ℹ️ Pending notifications endpoint not available (this is OK):', error.message);
      });
    } catch (error) {
      console.log('ℹ️ Could not check for pending notifications:', error.message);
    }
  }, 3000); // Check after 3 seconds to give server time to queue notifications
}
