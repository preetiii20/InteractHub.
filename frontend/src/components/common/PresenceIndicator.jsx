import React, { useEffect, useState, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const PresenceIndicator = ({ userId, userName, size = 'sm' }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const clientRef = useRef(null);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const sendHeartbeat = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.publish({
      destination: '/app/presence.heartbeat',
      body: JSON.stringify({
        userId: Number(userId),
        userName,
        timestamp: new Date().toISOString()
      })
    });
  }, [userId, userName]);

  useEffect(() => {
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      // Subscribe to presence updates for this user
      client.subscribe(`/topic/presence.${userId}`, (msg) => {
        const body = JSON.parse(msg.body || '{}');
        setIsOnline(body.isOnline);
        setLastSeen(body.lastSeen);
      });

      // Send initial heartbeat
      sendHeartbeat();
      
      // Set up periodic heartbeat
      const heartbeatInterval = setInterval(sendHeartbeat, 30000); // Every 30 seconds
      
      return () => clearInterval(heartbeatInterval);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [userId, sendHeartbeat]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizeClasses[size]} rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'} ${isOnline ? 'animate-pulse' : ''}`}></div>
      <span className="text-sm text-gray-600">
        {isOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
      </span>
    </div>
  );
};

export default PresenceIndicator;
