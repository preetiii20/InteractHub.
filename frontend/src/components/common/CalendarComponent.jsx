import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Users, Video } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { authHelpers } from '../../config/auth';
import JitsiMeetingWrapper from './JitsiMeetingWrapper';
import Toast from './Toast';
import notificationVerification from '../../utils/notificationVerification';
import notificationDiagnostics from '../../utils/notificationDiagnostics';
import globalNotificationService from '../../services/GlobalNotificationService';

const CalendarComponent = ({ 
  role = 'employee', 
  eventTypes = {}, 
  canScheduleMeetings = false,
  userList = []
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMeetingTab, setShowMeetingTab] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    type: Object.keys(eventTypes)[0] || 'personal',
    time: '10:00',
    endTime: '11:00'
  });
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [toast, setToast] = useState(null);

  // Load events from backend API and localStorage
  useEffect(() => {
    const loadEvents = async () => {
      const userId = Number(authHelpers.getUserId());
      
      // Load from localStorage as fallback
      const localSaved = localStorage.getItem(`${role}CalendarEvents`);
      const localEvents = localSaved ? JSON.parse(localSaved) : [];
      
      try {
        // Fetch meetings from backend API
        console.log(`📅 Fetching meetings for user ${userId} from backend...`);
        const userEmail = authHelpers.getUserEmail();
        const response = await fetch(`http://localhost:8081/api/admin/meetings/user/${userId}`, {
          headers: {
            'X-User-Email': userEmail || 'user@example.com'
          }
        });
        
        if (response.ok) {
          const backendMeetings = await response.json();
          console.log(`✅ Loaded ${backendMeetings.length} meetings from backend for user ${userId}`);
          
          // Convert backend meetings to calendar events format
          const convertedEvents = backendMeetings.map(meeting => ({
            id: meeting.id,
            date: meeting.meetingDate,
            title: meeting.title,
            description: meeting.description,
            type: 'meeting',
            time: meeting.meetingTime,
            endTime: meeting.meetingEndTime,
            isMeeting: true,
            jitsiLink: meeting.jitsiLink,
            participants: [], // Will be populated if needed
            participantIds: meeting.participantIds || [],
            createdBy: meeting.organizerRole || 'admin',
            organizerId: meeting.organizerId,
            createdAt: meeting.createdAt
          }));
          
          // Merge with local events (local events that aren't in backend)
          const allEvents = [...convertedEvents];
          for (const localEvent of localEvents) {
            if (!allEvents.find(e => e.id === localEvent.id)) {
              allEvents.push(localEvent);
            }
          }
          
          setEvents(allEvents);
          console.log(`📊 Total events loaded: ${allEvents.length} (${convertedEvents.length} from backend, ${localEvents.length} local)`);
          
          // Create notifications for meetings where user is a participant
          const currentUserId = Number(authHelpers.getUserId());
          const notifKey = `notifications_${currentUserId}`;
          const existingNotifs = localStorage.getItem(notifKey);
          const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
          
          // Track which meetings we've already notified about
          const trackedMeetingsKey = `tracked_meetings_${currentUserId}`;
          const trackedMeetings = localStorage.getItem(trackedMeetingsKey);
          const trackedSet = trackedMeetings ? new Set(JSON.parse(trackedMeetings)) : new Set();
          
          // Track deleted meetings to detect when they're removed
          const deletedMeetingsKey = `deleted_meetings_${currentUserId}`;
          const deletedMeetings = localStorage.getItem(deletedMeetingsKey);
          const deletedSet = deletedMeetings ? new Set(JSON.parse(deletedMeetings)) : new Set();
          
          // Check each meeting to see if user is a participant
          let newNotificationsCreated = false;
          for (const meeting of convertedEvents) {
            // Check if this is a new meeting (not already notified)
            const alreadyNotified = trackedSet.has(String(meeting.id));
            
            if (!alreadyNotified && meeting.participantIds && meeting.participantIds.includes(currentUserId)) {
              // Create notification for this meeting
              const notification = {
                id: Date.now() + Math.random(),
                type: 'MEETING_INVITATION',
                title: `Meeting Invitation: ${meeting.title}`,
                message: `You've been invited to "${meeting.title}" on ${meeting.date} at ${meeting.time}. Check your calendar for details.`,
                timestamp: new Date().toISOString(),
                read: false,
                data: {
                  meetingId: meeting.id,
                  meetingTitle: meeting.title,
                  meetingDate: meeting.date,
                  meetingTime: meeting.time,
                  jitsiLink: meeting.jitsiLink
                }
              };
              
              notifs.unshift(notification);
              trackedSet.add(String(meeting.id));
              newNotificationsCreated = true;
              console.log(`🔔 Created notification for meeting: ${meeting.title}`);
            }
          }
          
          // Check for deleted meetings (meetings that were tracked but are no longer in backend)
          const currentBackendMeetingIds = new Set(convertedEvents.map(m => String(m.id)));
          let meetingsToRemove = [];
          let bulkDeletionDetected = false;
          
          for (const trackedId of trackedSet) {
            if (!currentBackendMeetingIds.has(trackedId) && !deletedSet.has(trackedId)) {
              // This meeting was deleted
              console.log(`🗑️ Detected deleted meeting: ${trackedId}`);
              
              // Create cancellation notification
              const cancelNotification = {
                id: Date.now() + Math.random(),
                type: 'MEETING_CANCELLED',
                title: `Meeting Cancelled`,
                message: `A meeting you were invited to has been cancelled by the organizer.`,
                timestamp: new Date().toISOString(),
                read: false,
                data: {
                  meetingId: trackedId,
                  action: 'CANCELLED'
                }
              };
              
              notifs.unshift(cancelNotification);
              deletedSet.add(trackedId);
              newNotificationsCreated = true;
              meetingsToRemove.push(Number(trackedId));
              console.log(`✅ Cancellation notification created for deleted meeting: ${trackedId}`);
            }
          }
          
          // Also check local events that aren't in backend (for bulk deletion detection)
          for (const localEvent of localEvents) {
            if (localEvent.isMeeting && !currentBackendMeetingIds.has(String(localEvent.id)) && !deletedSet.has(String(localEvent.id))) {
              console.log(`🗑️ Detected deleted local meeting: ${localEvent.id}`);
              
              // Create cancellation notification
              const cancelNotification = {
                id: Date.now() + Math.random(),
                type: 'MEETING_CANCELLED',
                title: `Meeting Cancelled`,
                message: `A meeting you were invited to has been cancelled by the organizer.`,
                timestamp: new Date().toISOString(),
                read: false,
                data: {
                  meetingId: localEvent.id,
                  action: 'CANCELLED'
                }
              };
              
              notifs.unshift(cancelNotification);
              deletedSet.add(String(localEvent.id));
              newNotificationsCreated = true;
              meetingsToRemove.push(Number(localEvent.id));
              bulkDeletionDetected = true;
              console.log(`✅ Cancellation notification created for deleted local meeting: ${localEvent.id}`);
            }
          }
          
          // Remove deleted meetings from events state
          if (meetingsToRemove.length > 0) {
            const updatedEvents = allEvents.filter(e => !meetingsToRemove.includes(e.id));
            setEvents(updatedEvents);
            console.log(`🗑️ Removed ${meetingsToRemove.length} deleted meeting(s) from calendar`);
            
            if (bulkDeletionDetected) {
              console.log(`⚠️ Bulk deletion detected - removed multiple meetings`);
            }
          }
          
          // Save notifications, tracked meetings, and deleted meetings
          if (newNotificationsCreated || meetingsToRemove.length > 0) {
            localStorage.setItem(notifKey, JSON.stringify(notifs));
            localStorage.setItem(trackedMeetingsKey, JSON.stringify(Array.from(trackedSet)));
            localStorage.setItem(deletedMeetingsKey, JSON.stringify(Array.from(deletedSet)));
            console.log(`💾 Saved ${notifs.length} notifications to localStorage`);
            
            // Trigger notification update event
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
              detail: { userId: currentUserId }
            }));
          }
        } else {
          console.log('⚠️ Backend not available, using localStorage only');
          setEvents(localEvents);
        }
      } catch (error) {
        console.log('⚠️ Error fetching meetings from backend:', error.message);
        setEvents(localEvents);
      }
    };

    loadEvents();
    // Poll every 2 seconds for real-time notifications and deletions
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, [role]);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem(`${role}CalendarEvents`, JSON.stringify(events));
  }, [events, role]);

  // Load available users - FETCH FROM API IN REAL-TIME
  useEffect(() => {
    if (!canScheduleMeetings) {
      setAvailableUsers([]);
      return;
    }
    
    const currentUserId = Number(authHelpers.getUserId());
    console.log('🔍 Current user ID:', currentUserId);
    
    const fetchUsers = async () => {
      try {
        // Try to fetch from API first
        console.log('🌐 Fetching users from API...');
        const response = await fetch('http://localhost:8081/api/admin/users/all');
        
        if (response.ok) {
          const users = await response.json();
          console.log('✅ API Response received:', users.length, 'users');
          
          if (Array.isArray(users) && users.length > 0) {
            const formatted = users
              .filter(user => Number(user.id || user.userId) !== currentUserId)
              .map(user => ({
                id: Number(user.id || user.userId),
                name: user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.name || user.email || 'Unknown',
                email: user.email || user.emailAddress || ''
              }));
            setAvailableUsers(formatted);
            console.log('✅ Real users loaded from API:', formatted.length);
            console.log('📋 Sample users:', formatted.slice(0, 3));
            return;
          }
        }
        
        throw new Error('API returned empty or invalid data');
      } catch (error) {
        console.log('⚠️ Could not fetch from API:', error.message);
        
        // Try to use userList prop as fallback
        if (userList && Array.isArray(userList) && userList.length > 0) {
          console.log('📋 Using userList prop:', userList.length, 'users');
          const formatted = userList
            .filter(user => Number(user.id || user.userId) !== currentUserId)
            .map(user => ({
              id: Number(user.id || user.userId),
              name: user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.name || user.email || 'Unknown',
              email: user.email || user.emailAddress || ''
            }));
          setAvailableUsers(formatted);
          console.log('✅ Available users from prop:', formatted.length);
          return;
        }
        
        // Last resort: hardcoded test users
        console.log('⚠️ Using hardcoded test users as last resort');
        const testUsers = [
          { id: 1, name: 'Admin User', email: 'admin@example.com' },
          { id: 2, name: 'John Doe', email: 'john@example.com' },
          { id: 3, name: 'Jane Smith', email: 'jane@example.com' },
          { id: 4, name: 'Bob Johnson', email: 'bob@example.com' },
          { id: 5, name: 'Alice Williams', email: 'alice@example.com' },
          { id: 6, name: 'Charlie Brown', email: 'charlie@example.com' },
          { id: 7, name: 'Diana Prince', email: 'diana@example.com' },
          { id: 8, name: 'Eve Davis', email: 'eve@example.com' },
          { id: 20, name: 'Test User 20', email: 'user20@example.com' },
          { id: 21, name: 'Test User 21', email: 'user21@example.com' },
          { id: 22, name: 'Test User 22', email: 'user22@example.com' }
        ];
        
        const filtered = testUsers.filter(u => u.id !== currentUserId);
        setAvailableUsers(filtered);
        console.log('✅ Available users (hardcoded):', filtered.length);
      }
    };
    
    fetchUsers();
    
    // Refresh users every 30 seconds to get real-time updates
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [canScheduleMeetings, userList]);

  // Debug function to test notifications (remove in production)
  useEffect(() => {
    window.testNotificationNow = (targetUserId = null) => {
      const userId = targetUserId || Number(authHelpers.getUserId());
      console.log(`🧪 Testing notification for user ${userId}...`);
      
      const notification = {
        id: Date.now() + Math.random(),
        type: 'MEETING_INVITATION',
        title: 'Meeting Invitation: DEBUG TEST',
        message: `You've been invited to "DEBUG TEST" on 2025-12-22 at 14:00. Check your calendar for details.`,
        timestamp: new Date().toISOString(),
        read: false,
        data: {
          meetingId: 999,
          meetingTitle: 'DEBUG TEST',
          meetingDate: '2025-12-22',
          meetingTime: '14:00',
          jitsiLink: 'https://meet.jit.si/debug'
        }
      };
      
      const notifKey = `notifications_${userId}`;
      const existingNotifs = localStorage.getItem(notifKey);
      const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
      notifs.unshift(notification);
      localStorage.setItem(notifKey, JSON.stringify(notifs));

      window.dispatchEvent(new CustomEvent('notificationsUpdated', {
        detail: { userId: userId }
      }));
      
      console.log(`✅ Debug notification created for user ${userId}`);
      console.log(`📬 Notification:`, notification);
      console.log(`📦 Total notifications for user ${userId}:`, notifs.length);
      
      return notification;
    };
    
    window.checkNotificationState = (userId = null) => {
      const checkUserId = userId || Number(authHelpers.getUserId());
      console.log(`🔍 Checking notification state for user ${checkUserId}...`);
      
      const notifKey = `notifications_${checkUserId}`;
      const stored = localStorage.getItem(notifKey);
      
      if (stored) {
        const notifications = JSON.parse(stored);
        console.log(`📬 User ${checkUserId} has ${notifications.length} notifications:`);
        notifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. ${notif.title} (${notif.type}) - ${notif.read ? 'Read' : 'Unread'}`);
        });
        return notifications;
      } else {
        console.log(`📭 No notifications found for user ${checkUserId}`);
        return [];
      }
    };
    
    // Add verification function
    window.verifyMeetingNotifications = async () => {
      console.log('🔔 Running meeting notification verification...');
      const results = await notificationVerification.runCompleteVerification();
      
      if (Object.values(results).every(r => r === true)) {
        console.log('🎉 All notification tests PASSED! System is working correctly.');
      } else {
        console.log('⚠️ Some notification tests FAILED. Check the logs above for details.');
      }
      
      return results;
    };

    // Add diagnostic function
    window.diagnoseMeetingNotifications = async () => {
      console.log('🔍 Running complete notification diagnostics...');
      const results = await notificationDiagnostics.runCompleteDiagnostics();
      return results;
    };

    // Add notification flow check
    window.checkNotificationFlow = async () => {
      console.log('📊 Checking notification flow...');
      const result = await notificationDiagnostics.checkNotificationFlow();
      return result;
    };

    // Add function to verify notifications for all participants
    window.verifyParticipantNotifications = (meetingId = null) => {
      console.log('🔍 Verifying participant notifications...');
      const currentUserId = Number(authHelpers.getUserId());
      
      // Get all events to find the meeting
      const meeting = events.find(e => !meetingId || e.id === meetingId);
      
      if (!meeting || !meeting.participantIds || meeting.participantIds.length === 0) {
        console.log('❌ No meeting found or no participants');
        return;
      }
      
      console.log(`📋 Meeting: ${meeting.title}`);
      console.log(`👥 Participants: ${meeting.participantIds.length}`);
      
      for (const participantId of meeting.participantIds) {
        const numId = Number(participantId);
        const notifKey = `notifications_${numId}`;
        const stored = localStorage.getItem(notifKey);
        
        if (stored) {
          const notifications = JSON.parse(stored);
          const meetingNotif = notifications.find(n => n.data?.meetingId === meeting.id);
          
          if (meetingNotif) {
            console.log(`✅ User ${numId}: Has notification for this meeting`);
            console.log(`   Title: ${meetingNotif.title}`);
            console.log(`   Read: ${meetingNotif.read}`);
          } else {
            console.log(`❌ User ${numId}: NO notification for this meeting`);
            console.log(`   Total notifications: ${notifications.length}`);
          }
        } else {
          console.log(`❌ User ${numId}: No notifications at all`);
        }
      }
    };
    
    console.log('🔍 Debug functions loaded:');
    console.log('  checkNotificationState() - checks current user notifications');
    console.log('  checkNotificationState(2) - checks user 2 notifications');
    console.log('  testNotificationNow() - sends test notification to current user');
    console.log('  testNotificationNow(2) - sends test notification to user 2');
    console.log('  verifyMeetingNotifications() - runs complete system verification');
    console.log('  diagnoseMeetingNotifications() - runs complete diagnostics');
    console.log('  checkNotificationFlow() - checks end-to-end notification flow');
    console.log('  verifyParticipantNotifications() - verifies notifications for all participants of a meeting');
  }, []);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handleAddEvent = (day) => {
    setSelectedDate(day);
    setFormData({ 
      title: '', 
      description: '', 
      type: Object.keys(eventTypes)[0] || 'personal',
      time: '10:00',
      endTime: '11:00'
    });
    setSelectedParticipants([]);
    setShowMeetingTab(false);
    setShowModal(true);
    
    // Log available users when modal opens
    console.log('📝 Modal opened. Available users:', availableUsers.length);
    if (availableUsers.length === 0 && canScheduleMeetings) {
      console.log('⚠️ No users available! Attempting to fetch...');
      // Try to fetch users if none available
      const fetchUsers = async () => {
        try {
          const response = await fetch('http://localhost:8081/api/admin/users/all');
          if (response.ok) {
            const users = await response.json();
            if (Array.isArray(users) && users.length > 0) {
              const currentUserId = Number(authHelpers.getUserId());
              const formatted = users
                .filter(user => Number(user.id || user.userId) !== currentUserId)
                .map(user => ({
                  id: Number(user.id || user.userId),
                  name: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.name || user.email || 'Unknown',
                  email: user.email || user.emailAddress || ''
                }));
              setAvailableUsers(formatted);
              console.log('✅ Users fetched on modal open:', formatted.length);
            }
          }
        } catch (error) {
          console.log('❌ Could not fetch users:', error.message);
        }
      };
      fetchUsers();
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      setToast({
        type: 'warning',
        message: '⚠️ Please enter a title for the event'
      });
      return;
    }

    console.log('🔵 Saving event:', formData.title, showMeetingTab ? '(Meeting)' : '(Event)');

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    const currentUserId = Number(authHelpers.getUserId());
    
    if (showMeetingTab && selectedParticipants.length > 0) {
      // This is a meeting with participants - save to backend
      try {
        const meetingData = {
          title: formData.title,
          description: formData.description,
          meetingDate: dateStr,
          meetingTime: formData.time,
          meetingEndTime: formData.endTime,
          jitsiLink: `https://meet.jit.si/${uuidv4().substring(0, 8)}`,
          organizerId: currentUserId,
          organizerRole: role,
          participantIds: selectedParticipants
        };

        console.log('💾 Saving meeting to backend:', meetingData);
        console.log('📤 Sending to: http://localhost:8081/api/admin/meetings/with-notifications');
        
        const response = await fetch('http://localhost:8081/api/admin/meetings/with-notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(meetingData)
        });

        console.log(`📥 Backend response status: ${response.status}`);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Meeting saved to backend successfully:', result);
          
          // Convert backend meeting to calendar event format
          const backendMeeting = result.meeting || result;
          console.log('📋 Backend meeting object:', backendMeeting);
          const newEvent = {
            id: backendMeeting.id,
            date: backendMeeting.meetingDate,
            title: backendMeeting.title,
            description: backendMeeting.description,
            type: 'meeting',
            time: backendMeeting.meetingTime,
            endTime: backendMeeting.meetingEndTime,
            isMeeting: true,
            jitsiLink: backendMeeting.jitsiLink,
            participants: selectedParticipants.map(id => {
              const user = availableUsers.find(u => u.id === id);
              return user ? user.name : `User ${id}`;
            }),
            participantIds: backendMeeting.participantIds,
            createdBy: role,
            organizerId: backendMeeting.organizerId,
            createdAt: backendMeeting.createdAt
          };

          // Add to local state
          setEvents(prevEvents => [...prevEvents, newEvent]);
          
          // Send notifications to participants via localStorage (simple approach)
          console.log('📬 Starting notification process for', selectedParticipants.length, 'participants');
          
          // Also notify the organizer
          const organizerNotifKey = `notifications_${currentUserId}`;
          const organizerNotification = {
            id: Date.now() + Math.random(),
            type: 'MEETING_CREATED',
            title: `Meeting Created: ${formData.title}`,
            message: `You have created a meeting "${formData.title}" on ${dateStr} at ${formData.time} with ${selectedParticipants.length} participant(s).`,
            timestamp: new Date().toISOString(),
            read: false,
            data: {
              meetingId: backendMeeting.id,
              meetingTitle: formData.title,
              meetingDate: dateStr,
              meetingTime: formData.time,
              jitsiLink: backendMeeting.jitsiLink
            }
          };
          
          const organizerExistingNotifs = localStorage.getItem(organizerNotifKey);
          const organizerNotifs = organizerExistingNotifs ? JSON.parse(organizerExistingNotifs) : [];
          organizerNotifs.unshift(organizerNotification);
          localStorage.setItem(organizerNotifKey, JSON.stringify(organizerNotifs));
          
          window.dispatchEvent(new CustomEvent('notificationsUpdated', {
            detail: { userId: currentUserId }
          }));

          // Broadcast popup notification for organizer
          globalNotificationService.broadcast({
            type: 'meeting-scheduled',
            title: `Meeting Scheduled: ${formData.title}`,
            message: `You have scheduled a meeting on ${dateStr} at ${formData.time}`,
            details: `${selectedParticipants.length} participant(s) invited`,
            data: {
              meetingId: backendMeeting.id,
              meetingTitle: formData.title,
              meetingDate: dateStr,
              meetingTime: formData.time,
              jitsiLink: backendMeeting.jitsiLink
            }
          }, currentUserId);
          
          console.log(`✅ Notification created for organizer (You)`);
          console.log(`   Storage key: ${organizerNotifKey}`);
          console.log(`   Total notifications: ${organizerNotifs.length}`);
          
          // Notify participants
          for (const participantId of selectedParticipants) {
            const numId = Number(participantId);
            const user = availableUsers.find(u => u.id === numId);
            
            console.log(`📬 Processing notification for participant ${numId} (${user?.name || 'Unknown'})`);
            
            const notifKey = `notifications_${numId}`;
            const notification = {
              id: Date.now() + Math.random(),
              type: 'MEETING_INVITATION',
              title: `Meeting Invitation: ${formData.title}`,
              message: `You've been invited to "${formData.title}" on ${dateStr} at ${formData.time}. Check your calendar for details.`,
              timestamp: new Date().toISOString(),
              read: false,
              data: {
                meetingId: backendMeeting.id,
                meetingTitle: formData.title,
                meetingDate: dateStr,
                meetingTime: formData.time,
                jitsiLink: backendMeeting.jitsiLink
              }
            };
            
            const existingNotifs = localStorage.getItem(notifKey);
            const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
            notifs.unshift(notification);
            localStorage.setItem(notifKey, JSON.stringify(notifs));

            // Trigger notification update event
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
              detail: { userId: numId }
            }));

            console.log(`✅ Notification saved for ${user?.name || `User ${numId}`}`);
            console.log(`   Storage key: ${notifKey}`);
            console.log(`   Participant will receive popup via WebSocket from backend`);
          }
          
          // Show success toast
          const participantNames = selectedParticipants.map(id => {
            const user = availableUsers.find(u => u.id === id);
            return user ? user.name : `User ${id}`;
          }).join(', ');
          
          setToast({
            type: 'success',
            message: `✅ Meeting Scheduled Successfully!\n\nMeeting: ${formData.title}\nDate: ${dateStr}\nTime: ${formData.time} - ${formData.endTime}\n\nParticipants (${selectedParticipants.length}):\n${participantNames}\n\n✓ All participants notified\n✓ Added to everyone's calendar`
          });
        } else {
          throw new Error(`Backend responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error saving meeting to backend:', error);
        setToast({
          type: 'error',
          message: `❌ Failed to save meeting to backend\n\nError: ${error.message}\n\nThe meeting will only be saved locally.`
        });
        
        // Fallback to local storage
        const meetingId = Date.now() + Math.random();
        const newEvent = {
          id: meetingId,
          date: dateStr,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          time: formData.time,
          endTime: formData.endTime,
          isMeeting: showMeetingTab,
          jitsiLink: showMeetingTab ? `https://meet.jit.si/${uuidv4().substring(0, 8)}` : null,
          participants: showMeetingTab ? selectedParticipants.map(id => {
            const user = availableUsers.find(u => u.id === id);
            return user ? user.name : `User ${id}`;
          }) : [],
          participantIds: selectedParticipants,
          createdBy: role,
          createdAt: new Date().toISOString()
        };

        setEvents([...events, newEvent]);
        
        // Still send notifications to participants even if backend failed
        if (showMeetingTab && selectedParticipants.length > 0) {
          console.log('📬 Creating notifications for participants (backend failed, using local fallback)');
          
          // Notify organizer
          const organizerNotifKey = `notifications_${currentUserId}`;
          const organizerNotification = {
            id: Date.now() + Math.random(),
            type: 'MEETING_CREATED',
            title: `Meeting Created: ${formData.title}`,
            message: `You have created a meeting "${formData.title}" on ${dateStr} at ${formData.time} with ${selectedParticipants.length} participant(s).`,
            timestamp: new Date().toISOString(),
            read: false,
            data: {
              meetingId: meetingId,
              meetingTitle: formData.title,
              meetingDate: dateStr,
              meetingTime: formData.time,
              jitsiLink: newEvent.jitsiLink
            }
          };
          
          const organizerExistingNotifs = localStorage.getItem(organizerNotifKey);
          const organizerNotifs = organizerExistingNotifs ? JSON.parse(organizerExistingNotifs) : [];
          organizerNotifs.unshift(organizerNotification);
          localStorage.setItem(organizerNotifKey, JSON.stringify(organizerNotifs));
          
          window.dispatchEvent(new CustomEvent('notificationsUpdated', {
            detail: { userId: currentUserId }
          }));

          // Broadcast popup notification for organizer (fallback)
          globalNotificationService.broadcast({
            type: 'meeting-scheduled',
            title: `Meeting Scheduled: ${formData.title}`,
            message: `You have scheduled a meeting on ${dateStr} at ${formData.time}`,
            details: `${selectedParticipants.length} participant(s) invited`,
            data: {
              meetingId: meetingId,
              meetingTitle: formData.title,
              meetingDate: dateStr,
              meetingTime: formData.time,
              jitsiLink: newEvent.jitsiLink
            }
          }, currentUserId);
          
          console.log(`✅ Notification created for organizer (fallback)`);
          
          // Notify participants
          for (const participantId of selectedParticipants) {
            const numId = Number(participantId);
            const user = availableUsers.find(u => u.id === numId);
            
            const notifKey = `notifications_${numId}`;
            const notification = {
              id: Date.now() + Math.random(),
              type: 'MEETING_INVITATION',
              title: `Meeting Invitation: ${formData.title}`,
              message: `You've been invited to "${formData.title}" on ${dateStr} at ${formData.time}. Check your calendar for details.`,
              timestamp: new Date().toISOString(),
              read: false,
              data: {
                meetingId: meetingId,
                meetingTitle: formData.title,
                meetingDate: dateStr,
                meetingTime: formData.time,
                jitsiLink: newEvent.jitsiLink
              }
            };
            
            const existingNotifs = localStorage.getItem(notifKey);
            const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
            notifs.unshift(notification);
            localStorage.setItem(notifKey, JSON.stringify(notifs));

            // Trigger notification update event
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
              detail: { userId: numId }
            }));

            // Trigger notification update event
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
              detail: { userId: numId }
            }));

            console.log(`✅ Notification saved for ${user?.name || `User ${numId}`} (fallback)`);
            console.log(`   Participant will receive popup via WebSocket from backend`);
          }
        }
      }
    } else {
      // Regular event or meeting without participants - save locally
      const newEvent = {
        id: Date.now() + Math.random(),
        date: dateStr,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        time: formData.time,
        endTime: formData.endTime,
        isMeeting: showMeetingTab,
        jitsiLink: showMeetingTab ? `https://meet.jit.si/${uuidv4().substring(0, 8)}` : null,
        participants: [],
        participantIds: [],
        createdBy: role,
        createdAt: new Date().toISOString()
      };

      setEvents([...events, newEvent]);
      console.log('📝 Event saved locally');
    }

    setShowModal(false);
    setFormData({ 
      title: '', 
      description: '', 
      type: Object.keys(eventTypes)[0] || 'personal',
      time: '10:00',
      endTime: '11:00'
    });
    setSelectedParticipants([]);
    setSearchTerm('');
  };

  const handleDeleteEvent = async (id) => {
    const eventToDelete = events.find(e => e.id === id);
    const currentUserId = Number(authHelpers.getUserId());
    
    if (eventToDelete && eventToDelete.isMeeting && eventToDelete.organizerId) {
      // Check if current user is the organizer
      if (eventToDelete.organizerId !== currentUserId) {
        setToast({
          type: 'error',
          message: '❌ Only the meeting organizer can delete this meeting'
        });
        return;
      }
      
      // This is a backend meeting, delete from backend and notify participants
      try {
        const userEmail = authHelpers.getUserEmail();
        console.log(`🗑️ Attempting to delete meeting ${id} from backend...`);
        const response = await fetch(`http://localhost:8081/api/admin/meetings/${id}`, {
          method: 'DELETE',
          headers: {
            'X-User-Email': userEmail || 'user@example.com'
          }
        });
        
        if (response.status === 404) {
          console.log(`⚠️ Meeting ${id} not found on backend (404). Deleting locally only.`);
          setToast({
            type: 'info',
            message: `✅ Meeting deleted from your calendar\n\n(Note: Meeting was not found on server, but has been removed locally)`
          });
          // Remove from local state
          setEvents(events.filter(e => e.id !== id));
          return;
        }
        
        if (response.status === 403) {
          console.log(`⚠️ Permission denied: User is not the meeting organizer`);
          setToast({
            type: 'error',
            message: `❌ Permission Denied\n\nOnly the meeting organizer can delete this meeting.\n\nOrganizer: ${eventToDelete.createdBy || 'Unknown'}`
          });
          return;
        }
        
        if (response.ok) {
          console.log('✅ Meeting deleted from backend');
          
          // Send deletion notifications to all participants
          if (eventToDelete.participantIds && eventToDelete.participantIds.length > 0) {
            console.log('📬 Sending deletion notifications to participants...');
            
            // Notify organizer
            const organizerNotifKey = `notifications_${currentUserId}`;
            const organizerNotification = {
              id: Date.now() + Math.random(),
              type: 'MEETING_DELETED',
              title: `Meeting Deleted: ${eventToDelete.title}`,
              message: `You have deleted the meeting "${eventToDelete.title}" scheduled for ${eventToDelete.date} at ${eventToDelete.time}. All participants have been notified.`,
              timestamp: new Date().toISOString(),
              read: false,
              data: {
                meetingId: eventToDelete.id,
                meetingTitle: eventToDelete.title,
                meetingDate: eventToDelete.date,
                meetingTime: eventToDelete.time,
                action: 'DELETED'
              }
            };
            
            const organizerExistingNotifs = localStorage.getItem(organizerNotifKey);
            const organizerNotifs = organizerExistingNotifs ? JSON.parse(organizerExistingNotifs) : [];
            organizerNotifs.unshift(organizerNotification);
            localStorage.setItem(organizerNotifKey, JSON.stringify(organizerNotifs));
            
            window.dispatchEvent(new CustomEvent('notificationsUpdated', {
              detail: { userId: currentUserId }
            }));

            // Broadcast popup notification for organizer
            globalNotificationService.broadcast({
              type: 'meeting-cancelled',
              title: `Meeting Deleted: ${eventToDelete.title}`,
              message: `You have deleted the meeting "${eventToDelete.title}" scheduled for ${eventToDelete.date}`,
              details: 'All participants have been notified',
              data: {
                meetingId: eventToDelete.id,
                meetingTitle: eventToDelete.title,
                meetingDate: eventToDelete.date,
                meetingTime: eventToDelete.time,
                action: 'DELETED'
              }
            }, currentUserId);
            
            console.log(`✅ Deletion notification created for organizer`);
            
            // Notify participants
            for (const participantId of eventToDelete.participantIds) {
              const numId = Number(participantId);
              const user = availableUsers.find(u => u.id === numId);
              
              const notifKey = `notifications_${numId}`;
              const notification = {
                id: Date.now() + Math.random(),
                type: 'MEETING_CANCELLED',
                title: `Meeting Cancelled: ${eventToDelete.title}`,
                message: `The meeting "${eventToDelete.title}" scheduled for ${eventToDelete.date} at ${eventToDelete.time} has been cancelled by the organizer.`,
                timestamp: new Date().toISOString(),
                read: false,
                data: {
                  meetingId: eventToDelete.id,
                  meetingTitle: eventToDelete.title,
                  meetingDate: eventToDelete.date,
                  meetingTime: eventToDelete.time,
                  action: 'CANCELLED'
                }
              };
              
              const existingNotifs = localStorage.getItem(notifKey);
              const notifs = existingNotifs ? JSON.parse(existingNotifs) : [];
              notifs.unshift(notification);
              localStorage.setItem(notifKey, JSON.stringify(notifs));
              
              // Track this meeting as deleted so polling detects it
              const deletedMeetingsKey = `deleted_meetings_${numId}`;
              const deletedMeetings = localStorage.getItem(deletedMeetingsKey);
              const deletedSet = deletedMeetings ? new Set(JSON.parse(deletedMeetings)) : new Set();
              deletedSet.add(String(eventToDelete.id));
              localStorage.setItem(deletedMeetingsKey, JSON.stringify(Array.from(deletedSet)));

              // Trigger notification update event
              window.dispatchEvent(new CustomEvent('notificationsUpdated', {
                detail: { userId: numId }
              }));

              console.log(`✅ Cancellation notification saved for ${user?.name || `User ${numId}`}`);
              console.log(`   Participant will receive popup via WebSocket from backend`);
            }
            
            setToast({
              type: 'success',
              message: `✅ Meeting Deleted Successfully!\n\nMeeting: ${eventToDelete.title}\nDate: ${eventToDelete.date}\nTime: ${eventToDelete.time}\n\n✓ All participants notified\n✓ Removed from everyone's calendar`
            });
          }
        } else {
          console.log(`⚠️ Backend error deleting meeting: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.log('Error details:', errorText);
          
          setToast({
            type: 'warning',
            message: `⚠️ Could not delete from server (${response.status})\n\nMeeting deleted locally only`
          });
          // Remove from local state anyway
          setEvents(events.filter(e => e.id !== id));
        }
      } catch (error) {
        console.error('❌ Error deleting meeting:', error.message);
        setToast({
          type: 'error',
          message: `❌ Error deleting meeting: ${error.message}`
        });
      }
    }
    
    // Always remove from local state
    setEvents(events.filter(e => e.id !== id));
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
          <p className="text-gray-600 mt-1">Manage your events and schedule meetings</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={previousMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-blue-600" />
            </motion.button>

            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-blue-600" />
            </motion.button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day && new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <motion.div
                  key={idx}
                  whileHover={day ? { scale: 1.05 } : {}}
                  onClick={() => day && handleAddEvent(day)}
                  className={`min-h-24 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                    day
                      ? isToday
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, i) => (
                          <motion.div
                            key={`${event.id}-${i}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEvent(event);
                            }}
                            className={`text-xs px-2 py-1 rounded truncate cursor-pointer hover:shadow-md ${eventTypes[event.type]?.bg || 'bg-gray-100'} ${eventTypes[event.type]?.text || 'text-gray-700'}`}
                          >
                            {event.title}
                          </motion.div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Today's Events
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getEventsForDate(new Date().getDate()).length > 0 ? (
                getEventsForDate(new Date().getDate()).map((event, idx) => (
                  <div key={`${event.id}-${idx}-${event.title}`} className={`p-3 rounded-lg border-l-4 ${eventTypes[event.type]?.bg || 'bg-gray-100'}`}>
                    <p className="font-semibold text-sm">{event.title}</p>
                    {event.time && <p className="text-xs text-gray-600 mt-1">⏰ {event.time}</p>}
                    {event.isMeeting && (
                      <motion.button
                        onClick={() => {
                          setActiveMeeting({
                            link: event.jitsiLink,
                            title: event.title,
                            participants: event.participants
                          });
                        }}
                        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Join Meeting
                      </motion.button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No events today</p>
              )}
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedDate(new Date().getDate());
              handleAddEvent(new Date().getDate());
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Event Today
          </motion.button>
        </div>
      </motion.div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Add Event</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            {canScheduleMeetings && (
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                  onClick={() => setShowMeetingTab(false)}
                  className={`px-4 py-2 font-semibold ${!showMeetingTab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                >
                  Event
                </button>
                <button
                  onClick={() => setShowMeetingTab(true)}
                  className={`px-4 py-2 font-semibold flex items-center gap-2 ${showMeetingTab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600'}`}
                >
                  <Video className="w-4 h-4" />
                  Meeting {showMeetingTab && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">ACTIVE</span>}
                </button>
              </div>
            )}

            {/* Meeting Mode Indicator */}
            {showMeetingTab && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Video className="w-4 h-4" />
                  <span className="font-semibold">Meeting Mode Active</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Select participants below to invite them to this meeting. 
                  {selectedParticipants.length > 0 ? (
                    <span className="font-semibold text-green-700"> {selectedParticipants.length} participant(s) selected ✓</span>
                  ) : (
                    <span className="font-semibold text-orange-600"> No participants selected yet!</span>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(eventTypes).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {showMeetingTab && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants
                  </label>

                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <label key={user.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(user.id)}
                            onChange={(e) => {
                              console.log(`📋 Participant ${user.name} (ID: ${user.id}) ${e.target.checked ? 'selected' : 'deselected'}`);
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, user.id]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(id => id !== user.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">{user.name}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 p-2 text-center">No users found</p>
                    )}
                  </div>

                  {selectedParticipants.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <p className="text-xs font-semibold text-blue-700 mb-2">
                        Selected: {selectedParticipants.length}
                      </p>
                      <div className="text-xs text-blue-600 space-y-1">
                        {selectedParticipants.map((id) => {
                          const user = availableUsers.find(u => u.id === id);
                          return user ? (
                            <div key={id}>• {user.name}</div>
                          ) : null;
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add notes"
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEvent}
                  className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {viewingEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">{viewingEvent.title}</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewingEvent(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600"><span className="font-semibold">Date:</span> {viewingEvent.date}</p>
              {viewingEvent.time && (
                <p className="text-sm text-gray-600"><span className="font-semibold">Time:</span> {viewingEvent.time} - {viewingEvent.endTime}</p>
              )}
              {viewingEvent.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{viewingEvent.description}</p>
                </div>
              )}
              {viewingEvent.participants && viewingEvent.participants.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Participants</p>
                  <div className="space-y-1">
                    {viewingEvent.participants.map((p, i) => (
                      <p key={i} className="text-xs text-gray-600">• {p}</p>
                    ))}
                  </div>
                </div>
              )}
              {viewingEvent.isMeeting && viewingEvent.jitsiLink && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveMeeting({
                      link: viewingEvent.jitsiLink,
                      title: viewingEvent.title,
                      participants: viewingEvent.participants
                    });
                    setViewingEvent(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Join Meeting
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleDeleteEvent(viewingEvent.id);
                  setViewingEvent(null);
                }}
                className="w-full py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeMeeting && (
        <div className="fixed inset-0 z-50">
          <JitsiMeetingWrapper
            meetingLink={activeMeeting.link}
            meetingTitle={activeMeeting.title}
            participants={activeMeeting.participants}
            onClose={() => setActiveMeeting(null)}
          />
        </div>
      )}

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={8000}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarComponent;
