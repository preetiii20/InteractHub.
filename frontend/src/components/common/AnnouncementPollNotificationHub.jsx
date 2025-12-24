import React, { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiConfig from '../../config/api';
import notificationService from '../../services/NotificationService';
import globalNotificationService from '../../services/GlobalNotificationService';

/**
 * AnnouncementPollNotificationHub
 * Handles real-time notifications for announcements and polls
 * Creates a dedicated WebSocket connection for announcements and polls
 */
const AnnouncementPollNotificationHub = ({ onAnnouncementReceived, onPollReceived }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  // Add notification to toast list
  const addNotification = useCallback((notification) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotif = {
      id,
      ...notification,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotif]);
    setUnreadCount(prev => prev + 1);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }, 6000);

    return id;
  }, []);

  // Handle announcement received
  const handleAnnouncementReceived = useCallback((announcement) => {
    console.log('📢 Announcement received:', announcement);

    // Show browser notification
    notificationService.showAnnouncementNotification(
      announcement.title || 'New Announcement',
      announcement.content,
      () => {
        window.focus();
        onAnnouncementReceived?.(announcement);
      }
    );

    // Add toast notification
    addNotification({
      type: 'announcement',
      icon: '📢',
      title: announcement.title || 'New Announcement',
      content: announcement.content?.substring(0, 100),
      color: 'from-blue-500 to-blue-600',
    });

    // Broadcast to global notification service
    globalNotificationService.broadcast({
      type: 'announcement',
      title: announcement.title || 'New Announcement',
      message: announcement.content || '',
      details: announcement.author || 'System'
    });
  }, [addNotification, onAnnouncementReceived]);

  // Handle poll received
  const handlePollReceived = useCallback((poll) => {
    console.log('📊 Poll received:', poll);

    // Show browser notification
    notificationService.showPollNotification(
      poll.question,
      () => {
        window.focus();
        onPollReceived?.(poll);
      }
    );

    // Add toast notification
    addNotification({
      type: 'poll',
      icon: '📊',
      title: 'New Poll',
      content: poll.question?.substring(0, 100),
      color: 'from-emerald-500 to-emerald-600',
    });

    // Broadcast to global notification service
    globalNotificationService.broadcast({
      type: 'poll',
      title: 'New Poll',
      message: poll.question || '',
      details: poll.createdBy || 'System'
    });
  }, [addNotification, onPollReceived]);

  // Fallback: Poll for announcements and polls via REST API
  useEffect(() => {
    console.log('📡 AnnouncementPollNotificationHub starting polling for announcements and polls');
    
    const lastAnnouncementId = { current: 0 };
    const lastPollId = { current: 0 };

    const pollAnnouncements = async () => {
      try {
        const response = await fetch(`${apiConfig.apiUrl}/api/admin/company-updates/announcements/all`);
        if (response.ok) {
          const announcements = await response.json();
          console.log('📢 Fetched announcements:', announcements);
          
          // Check for new announcements
          announcements.forEach(announcement => {
            if (announcement.id > lastAnnouncementId.current) {
              console.log('📢 New announcement detected:', announcement);
              handleAnnouncementReceived(announcement);
              lastAnnouncementId.current = announcement.id;
            }
          });
        } else {
          console.log('ℹ️ Announcements endpoint returned:', response.status);
        }
      } catch (error) {
        console.log('ℹ️ Could not fetch announcements (endpoint may not exist):', error.message);
      }
    };

    const pollPolls = async () => {
      try {
        const response = await fetch(`${apiConfig.apiUrl}/api/admin/company-updates/polls/active`);
        if (response.ok) {
          const polls = await response.json();
          console.log('📊 Fetched polls:', polls);
          
          // Check for new polls
          polls.forEach(poll => {
            if (poll.id > lastPollId.current) {
              console.log('📊 New poll detected:', poll);
              handlePollReceived(poll);
              lastPollId.current = poll.id;
            }
          });
        } else {
          console.log('ℹ️ Polls endpoint returned:', response.status);
        }
      } catch (error) {
        console.log('ℹ️ Could not fetch polls (endpoint may not exist):', error.message);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(() => {
      pollAnnouncements();
      pollPolls();
    }, 5000);

    // Initial poll
    pollAnnouncements();
    pollPolls();

    return () => clearInterval(interval);
  }, [handleAnnouncementReceived, handlePollReceived]);

  // Update browser tab title with unread count
  useEffect(() => {
    notificationService.updateTabTitle(unreadCount);
  }, [unreadCount]);

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-3 max-w-sm">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`p-4 rounded-xl shadow-2xl bg-gradient-to-r ${notif.color} text-white transform transition-all duration-300 animate-slide-in hover:shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{notif.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{notif.title}</div>
                <div className="text-xs opacity-90 mt-1">{notif.content}</div>
              </div>
              <button
                onClick={() => {
                  setNotifications(prev => prev.filter(n => n.id !== notif.id));
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }}
                className="text-white opacity-70 hover:opacity-100 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementPollNotificationHub;
