import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';

const LiveSocketContext = createContext(null);

export const LiveSocketProvider = ({ children }) => {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });
    client.onConnect = () => setConnected(true);
    client.onDisconnect = () => setConnected(false);
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, []);

  return (
    <LiveSocketContext.Provider value={{ client: clientRef.current, connected }}>
      {children}
    </LiveSocketContext.Provider>
  );
};

export const useLiveSocket = () => useContext(LiveSocketContext);
