import React, { useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import NotificationService from '../../services/NotificationService';

/**
 * AnnouncementPollNotificationHub
 * Handles real-time notifications for announcements and polls
 * Integrates with WebSocket for live updates
 */
const AnnouncementPollNotificationHub = ({ onAnnouncementReceived, onPollReceived }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userEmail = authHelpers.getUserEmail() || authHelpers.getUserName();

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
    NotificationService.showAnnouncementNotification(
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
  }, [addNotification, onAnnouncementReceived]);

  // Handle poll received
  const handlePollReceived = useCallback((poll) => {
    console.log('📊 Poll received:', poll);

    // Show browser notification
    NotificationService.showPollNotification(
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
  }, [addNotification, onPollReceived]);

  // Subscribe to announcements and polls via WebSocket
  useEffect(() => {
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 3000,
    });

    client.onConnect = () => {
      console.log('🔌 Announcement/Poll WebSocket connected');

      // Subscribe to announcements for all users
      client.subscribe('/topic/announcements', (msg) => {
        try {
          const announcement = JSON.parse(msg.body || '{}');
          handleAnnouncementReceived(announcement);
        } catch (e) {
          console.error('Error parsing announcement:', e);
        }
      });

      // Subscribe to announcements for specific user
      client.subscribe(`/user/${userEmail}/queue/announcements`, (msg) => {
        try {
          const announcement = JSON.parse(msg.body || '{}');
          handleAnnouncementReceived(announcement);
        } catch (e) {
          console.error('Error parsing user announcement:', e);
        }
      });

      // Subscribe to polls for all users
      client.subscribe('/topic/polls', (msg) => {
        try {
          const poll = JSON.parse(msg.body || '{}');
          handlePollReceived(poll);
        } catch (e) {
          console.error('Error parsing poll:', e);
        }
      });

      // Subscribe to polls for specific user
      client.subscribe(`/user/${userEmail}/queue/polls`, (msg) => {
        try {
          const poll = JSON.parse(msg.body || '{}');
          handlePollReceived(poll);
        } catch (e) {
          console.error('Error parsing user poll:', e);
        }
      });
    };

    client.onError = (error) => {
      console.error('WebSocket error:', error);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [userEmail, handleAnnouncementReceived, handlePollReceived]);

  // Update browser tab title with unread count
  useEffect(() => {
    NotificationService.updateTabTitle(unreadCount);
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
