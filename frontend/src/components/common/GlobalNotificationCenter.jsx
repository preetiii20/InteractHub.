import React, { useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import globalNotificationService from '../../services/GlobalNotificationService';

const GlobalNotificationCenter = () => {
  const { notifications, removeNotification } = useNotification();

  // Subscribe to global notifications
  useEffect(() => {
    console.log('🔔 GlobalNotificationCenter mounted');
    console.log('🔔 Current listener count:', globalNotificationService.getListenerCount());
    
    const unsubscribe = globalNotificationService.subscribe('global-center', (notification) => {
      console.log('🔔 GlobalNotificationCenter received notification:', notification);
    });

    console.log('🔔 GlobalNotificationCenter subscribed. Listener count:', globalNotificationService.getListenerCount());
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    console.log('🔔 GlobalNotificationCenter notifications updated:', notifications.length, 'notifications');
    notifications.forEach((n, i) => {
      console.log(`  ${i + 1}. ${n.title} (${n.type})`);
    });
  }, [notifications]);

  const getIcon = (type) => {
    switch (type) {
      case 'announcement':
        return '📢';
      case 'poll':
        return '📊';
      case 'live-chat':
        return '💬';
      case 'meeting-scheduled':
      case 'meeting-invitation':
        return '📅';
      case 'meeting-cancelled':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    // Meeting cancelled uses red, others use blue
    if (type === 'meeting-cancelled') {
      return 'bg-red-500';
    }
    return 'bg-blue-500';
  };

  return (
    <div className="fixed top-6 left-6 z-[9999] space-y-3 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="animate-in fade-in slide-in-from-left-full duration-300 transform transition-all"
        >
          {/* Chat Bubble Container */}
          <div className="flex items-end gap-2 mb-2">
            {/* Avatar Bubble */}
            <div className={`${getNotificationColor(notif.type)} rounded-full w-10 h-10 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg`}>
              {getIcon(notif.type)}
            </div>

            {/* Message Bubble */}
            <div className={`${getNotificationColor(notif.type)} text-white rounded-3xl rounded-tl-none px-5 py-3 shadow-lg max-w-xs`}>
              {notif.userName && (
                <h3 className="font-bold text-sm mb-1">
                  {notif.userName}
                </h3>
              )}
              {notif.title && (
                <p className="font-semibold text-sm mb-1">
                  {notif.title}
                </p>
              )}
              <p className="text-sm leading-snug">
                {notif.message}
              </p>
              {notif.details && (
                <p className="text-xs opacity-90 mt-1 italic">
                  {notif.details}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeNotification(notif.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalNotificationCenter;
