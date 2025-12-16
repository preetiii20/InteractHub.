import React, { useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import globalNotificationService from '../../services/GlobalNotificationService';

const GlobalNotificationCenter = () => {
  const { notifications, removeNotification } = useNotification();

  // Subscribe to global notifications
  useEffect(() => {
    const unsubscribe = globalNotificationService.subscribe('global-center', (notification) => {
      console.log('🔔 GlobalNotificationCenter received notification:', notification);
    });

    return unsubscribe;
  }, []);

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'announcement':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 border-l-4 border-blue-700';
      case 'poll':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 border-l-4 border-purple-700';
      case 'live-chat':
        return 'bg-gradient-to-r from-green-500 to-green-600 border-l-4 border-green-700';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 border-l-4 border-yellow-700';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 border-l-4 border-red-700';
      case 'success':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-l-4 border-emerald-700';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 border-l-4 border-gray-700';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'announcement':
        return '📢';
      case 'poll':
        return '📊';
      case 'live-chat':
        return '💬';
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

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`${getNotificationStyles(notif.type)} text-white rounded-lg shadow-2xl p-4 animate-in fade-in slide-in-from-right-full duration-300 transform transition-all`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="text-2xl flex-shrink-0 mt-0.5">
              {getIcon(notif.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {notif.title && (
                <h3 className="font-bold text-sm mb-1 truncate">
                  {notif.title}
                </h3>
              )}
              <p className="text-sm opacity-95 line-clamp-2">
                {notif.message}
              </p>
              {notif.details && (
                <p className="text-xs opacity-75 mt-1">
                  {notif.details}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeNotification(notif.id)}
              className="flex-shrink-0 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          {!notif.persistent && (
            <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white bg-opacity-60 rounded-full animate-pulse"
                style={{
                  animation: 'shrink 8s linear forwards'
                }}
              />
            </div>
          )}
        </div>
      ))}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default GlobalNotificationCenter;
