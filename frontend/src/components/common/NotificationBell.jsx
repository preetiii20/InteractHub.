import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, MessageSquare, Megaphone, BarChart3, Video, Phone, Calendar, Check } from 'lucide-react';

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  
  // Ensure userId is numeric
  const numericUserId = Number(userId);

  // Single effect to handle all notification loading and listening
  useEffect(() => {
    if (!numericUserId) return;

    const loadNotifications = () => {
      try {
        const saved = localStorage.getItem(`notifications_${numericUserId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setNotifications(parsed);
          const unread = parsed.filter(n => !n.read).length;
          setUnreadCount(unread);
          
          setLastNotificationCount(parsed.length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
          setLastNotificationCount(0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    // Load immediately on mount
    loadNotifications();
    console.log(`🔔 NotificationBell mounted for user ${numericUserId}`);

    // Set up polling - check every 500ms for faster detection
    const pollInterval = setInterval(() => {
      loadNotifications();
    }, 500);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === `notifications_${numericUserId}`) {
        console.log(`📬 Storage change detected for notifications_${numericUserId}`);
        loadNotifications();
      }
    };

    // Listen for custom notification events from same tab
    const handleCustomNotification = (e) => {
      const eventUserId = Number(e.detail?.userId);
      if (e.detail && eventUserId === numericUserId) {
        console.log(`📬 Notification event for user ${numericUserId}, reloading`);
        loadNotifications();
      }
    };

    // Listen for broadcast messages from other tabs
    let bc;
    try {
      bc = new BroadcastChannel('meeting_notifications');
      bc.onmessage = (event) => {
        if (event.data.userId === numericUserId) {
          console.log(`📢 Broadcast message received for user ${numericUserId}:`, event.data);
          loadNotifications();
          
          // Show browser notification if available
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(event.data.notification.title, {
              body: event.data.notification.message,
              icon: '🔔'
            });
          }
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not available');
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notificationsUpdated', handleCustomNotification);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationsUpdated', handleCustomNotification);
      if (bc) bc.close();
    };
  }, [numericUserId, lastNotificationCount]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      // Persist to localStorage
      localStorage.setItem(`notifications_${numericUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      // Persist to localStorage
      localStorage.setItem(`notifications_${numericUserId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    // Persist to localStorage
    localStorage.setItem(`notifications_${numericUserId}`, JSON.stringify([]));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CHAT':
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-orange-500" />;
      case 'POLL':
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      case 'VIDEO_CALL':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'VOICE_CALL':
        return <Phone className="w-4 h-4 text-green-500" />;
      case 'MEETING_INVITATION':
      case 'MEETING_SCHEDULED':
      case 'MEETING_CREATED':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'MEETING_CANCELLED':
      case 'MEETING_DELETED':
        return <Calendar className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'CHAT':
      case 'MESSAGE':
        return 'bg-blue-50 border-blue-200';
      case 'ANNOUNCEMENT':
        return 'bg-orange-50 border-orange-200';
      case 'POLL':
        return 'bg-purple-50 border-purple-200';
      case 'VIDEO_CALL':
        return 'bg-red-50 border-red-200';
      case 'VOICE_CALL':
        return 'bg-green-50 border-green-200';
      case 'MEETING_INVITATION':
      case 'MEETING_SCHEDULED':
      case 'MEETING_CREATED':
        return 'bg-indigo-50 border-indigo-200';
      case 'MEETING_CANCELLED':
      case 'MEETING_DELETED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Notifications</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDropdown(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {notifications.map(notification => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                        notification.read ? 'border-gray-300' : 'border-blue-500'
                      } ${getNotificationColor(notification.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-1">
                          {!notification.read && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-blue-600" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                <p className="text-xs text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Clear All
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
