import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../config/api';

class PersistentWebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect(userIdentifier) {
    if (this.client && this.isConnected) {
      console.log('✅ WebSocket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const socket = new SockJS(apiConfig.websocketUrl);
        this.client = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 3000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Persistent WebSocket connected for user:', userIdentifier);

          // Subscribe to user-specific queue
          const userDest = `/user/${userIdentifier}/queue/notify`;
          console.log('📡 Subscribing to persistent user queue:', userDest);
          this.client.subscribe(userDest, (msg) => {
            this.handleMessage(msg);
          });

          // Subscribe to broadcast topic
          const broadcastDest = '/topic/group-notifications';
          console.log('📡 Subscribing to persistent broadcast topic:', broadcastDest);
          this.client.subscribe(broadcastDest, (msg) => {
            this.handleMessage(msg);
          });

          resolve();
        };

        this.client.onStompError = (error) => {
          console.error('❌ STOMP error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.client.onWebSocketError = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.client.onDisconnect = () => {
          console.log('⚠️ WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect(userIdentifier);
        };

        this.client.activate();
      } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  attemptReconnect(userIdentifier) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect(userIdentifier).catch((error) => {
          console.error('❌ Reconnection failed:', error);
        });
      }, 3000 * this.reconnectAttempts);
    }
  }

  handleMessage(msg) {
    try {
      const payload = JSON.parse(msg.body || '{}');
      console.log('📨 Persistent WebSocket message received:', payload);

      // Notify all listeners
      this.listeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error('❌ Error in listener callback:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  }

  subscribe(listenerId, callback) {
    console.log('📌 Registering listener:', listenerId);
    this.listeners.set(listenerId, callback);

    // Return unsubscribe function
    return () => {
      console.log('📌 Unregistering listener:', listenerId);
      this.listeners.delete(listenerId);
    };
  }

  disconnect() {
    if (this.client && this.isConnected) {
      console.log('🔌 Disconnecting WebSocket');
      this.client.deactivate();
      this.isConnected = false;
    }
  }

  isConnectedStatus() {
    return this.isConnected;
  }
}

// Singleton instance
const persistentWebSocketService = new PersistentWebSocketService();

export default persistentWebSocketService;
