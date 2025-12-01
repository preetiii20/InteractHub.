import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const clientRef = useRef(null);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const userId = authHelpers.getUserId();
    if (!userId) return;

    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      const role = (authHelpers.getUserRole() || '').toUpperCase();
      // Subscribe to incoming calls
      client.subscribe(`/topic/user.${userId}.call`, (msg) => {
        const body = JSON.parse(msg.body || '{}');
        addToast({
          type: 'call',
          title: 'Incoming Call',
          message: `${body.callerName} is calling you`,
          callerId: body.callerId,
          channelId: body.channelId,
          isVideo: body.isVideo
        });
      });

      // Subscribe to incoming messages
      client.subscribe(`/topic/user.${userId}.message`, (msg) => {
        const body = JSON.parse(msg.body || '{}');
        addToast({
          type: 'message',
          title: 'New Message',
          message: `${body.senderName}: ${body.content}`,
          channelId: body.channelId
        });
      });

      // Subscribe to announcements (suppress for ADMIN)
      client.subscribe('/topic/announcements.new', (msg) => {
        const body = JSON.parse(msg.body || '{}');
        if (role === 'ADMIN') return; // Admin just posted; do not show self-toast
        addToast({
          type: 'announcement',
          title: 'New Announcement',
          message: body.title || 'New announcement posted',
          announcementId: body.id
        });
      });

      // Subscribe to polls (suppress for ADMIN)
      client.subscribe('/topic/polls.new', (msg) => {
        const body = JSON.parse(msg.body || '{}');
        if (role === 'ADMIN') return;
        addToast({
          type: 'poll',
          title: 'New Poll',
          message: body.question || 'New poll available',
          pollId: body.id
        });
      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'call':
        return 'bg-red-500 text-white';
      case 'message':
        return 'bg-blue-500 text-white';
      case 'announcement':
        return 'bg-green-500 text-white';
      case 'poll':
        return 'bg-purple-500 text-white';
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleAction = () => {
    switch (toast.type) {
      case 'call':
        // Navigate to call interface
        window.location.href = `/dashboard/${(authHelpers.getUserRole() || '').toLowerCase()}/live-communication?channelId=${toast.channelId}`;
        break;
      case 'message':
        // Navigate to chat
        window.location.href = `/dashboard/${(authHelpers.getUserRole() || '').toLowerCase()}/live-communication?channelId=${toast.channelId}`;
        break;
      case 'announcement':
      case 'poll':
        // No deep-link button for these toast types as requested
        return;
    }
    onRemove(toast.id);
  };

  return (
    <div className={`${getToastStyles()} p-4 rounded-lg shadow-lg max-w-sm animate-slide-in`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold">{toast.title}</h4>
          <p className="text-sm mt-1">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-2 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
      {!(toast.type === 'announcement' || toast.type === 'poll' || toast.type === 'success' || toast.type === 'error') && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleAction}
            className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
};

export default ToastProvider;
