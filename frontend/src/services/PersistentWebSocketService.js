import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../config/api';
import globalNotificationService from './GlobalNotificationService';

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

    // Normalize user identifier to lowercase to match backend format
    const normalizedIdentifier = userIdentifier?.toLowerCase();

    return new Promise((resolve, reject) => {
      try {
        const socket = new SockJS(apiConfig.websocketUrl);
        this.client = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 3000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Persistent WebSocket connected for user:', normalizedIdentifier);
          console.log('✅ STOMP frame:', frame);

          // Small delay to ensure connection is fully established
          setTimeout(() => {
            // Subscribe to user-specific queue (normalized to lowercase)
            const userDest = `/user/${normalizedIdentifier}/queue/notify`;
            console.log('📡 Subscribing to persistent user queue:', userDest);
            try {
              const userSubscription = this.client.subscribe(userDest, (msg) => {
                console.log('📨 Received message on user queue:', userDest);
                console.log('📨 Message headers:', msg.headers);
                this.handleMessage(msg);
              }, {
                id: `user-notify-${normalizedIdentifier}`
              });
              console.log('📡 User queue subscription created:', !!userSubscription);
            } catch (error) {
              console.error('❌ Error subscribing to user queue:', error);
            }

          // Subscribe to broadcast topic
          const broadcastDest = '/topic/group-notifications';
          console.log('📡 Subscribing to persistent broadcast topic:', broadcastDest);
          try {
            const broadcastSubscription = this.client.subscribe(broadcastDest, (msg) => {
              console.log('📨 Received message on broadcast topic:', broadcastDest);
              this.handleMessage(msg);
            }, {
              id: 'broadcast-group-notifications'
            });
            console.log('📡 Broadcast topic subscription created:', !!broadcastSubscription);
          } catch (error) {
            console.error('❌ Error subscribing to broadcast topic:', error);
          }

          // Subscribe to user-specific topic (fallback for unauthenticated connections)
          const userTopicDest = `/topic/user-notifications.${normalizedIdentifier}`;
          console.log('📡 Subscribing to user topic (fallback):', userTopicDest);
          try {
            const userTopicSubscription = this.client.subscribe(userTopicDest, (msg) => {
              console.log('📨 Received message on user topic:', userTopicDest);
              this.handleMessage(msg);
            }, {
              id: `user-topic-${normalizedIdentifier}`
            });
            console.log('📡 User topic subscription created:', !!userTopicSubscription);
          } catch (error) {
            console.error('❌ Error subscribing to user topic:', error);
          }

          // Subscribe to notify topic (another fallback format)
          const notifyTopicDest = `/topic/notify.${normalizedIdentifier}`;
          console.log('📡 Subscribing to notify topic (fallback):', notifyTopicDest);
          try {
            const notifyTopicSubscription = this.client.subscribe(notifyTopicDest, (msg) => {
              console.log('📨 Received message on notify topic:', notifyTopicDest);
              this.handleMessage(msg);
            }, {
              id: `notify-topic-${normalizedIdentifier}`
            });
            console.log('📡 Notify topic subscription created:', !!notifyTopicSubscription);
          } catch (error) {
            console.error('❌ Error subscribing to notify topic:', error);
          }

          // Subscribe to global announcements
          const announcementDest = '/topic/announcements';
          console.log('📡 Subscribing to announcements:', announcementDest);
          try {
            const announcementSubscription = this.client.subscribe(announcementDest, (msg) => {
              console.log('📨 Received announcement:', announcementDest);
              this.handleGlobalNotification(msg, 'announcement');
            }, {
              id: 'global-announcements'
            });
            console.log('📡 Announcement subscription created:', !!announcementSubscription);
          } catch (error) {
            console.error('❌ Error subscribing to announcements:', error);
          }

          // Subscribe to global polls
          const pollDest = '/topic/polls';
          console.log('📡 Subscribing to polls:', pollDest);
          try {
            const pollSubscription = this.client.subscribe(pollDest, (msg) => {
              console.log('📨 Received poll:', pollDest);
              this.handleGlobalNotification(msg, 'poll');
            }, {
              id: 'global-polls'
            });
            console.log('📡 Poll subscription created:', !!pollSubscription);
          } catch (error) {
            console.error('❌ Error subscribing to polls:', error);
          }

          // Subscribe to live chat messages
          const liveChatDest = '/topic/live-chat';
          console.log('📡 Subscribing to live chat:', liveChatDest);
          try {
            const liveChatSubscription = this.client.subscribe(liveChatDest, (msg) => {
              console.log('📨 Received live chat message:', liveChatDest);
              this.handleGlobalNotification(msg, 'live-chat');
            }, {
              id: 'global-live-chat'
            });
            console.log('📡 Live chat subscription created:', !!liveChatSubscription);
          } catch (error) {
            console.error('❌ Error subscribing to live chat:', error);
          }
          }, 100);

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
          this.attemptReconnect(normalizedIdentifier);
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
        // Normalize identifier for reconnection
        const normalizedIdentifier = userIdentifier?.toLowerCase();
        this.connect(normalizedIdentifier).catch((error) => {
          console.error('❌ Reconnection failed:', error);
        });
      }, 3000 * this.reconnectAttempts);
    }
  }

  handleMessage(msg) {
    try {
      const payload = JSON.parse(msg.body || '{}');
      console.log('📨 Persistent WebSocket message received:', payload);
      console.log('📨 Message destination:', msg.headers?.destination || 'unknown');
      console.log('📨 Active listeners:', this.listeners.size);

      // Notify all listeners
      this.listeners.forEach((callback, listenerId) => {
        try {
          console.log(`📨 Notifying listener: ${listenerId}`);
          callback(payload);
        } catch (error) {
          console.error(`❌ Error in listener callback (${listenerId}):`, error);
        }
      });
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      console.error('❌ Message body:', msg.body);
    }
  }

  handleGlobalNotification(msg, type) {
    try {
      const payload = JSON.parse(msg.body || '{}');
      console.log(`📢 Global ${type} notification received:`, payload);

      // Extract data from wrapped format if present
      const data = payload.data || payload;
      
      // Broadcast to global notification service
      const notification = {
        type,
        title: data.title || data.subject || 'New ' + type,
        message: data.message || data.content || data.text || '',
        details: data.details || data.author || data.senderName || data.createdBy || '',
        timestamp: data.timestamp || Date.now(),
        data: data
      };

      console.log(`📢 Broadcasting ${type} notification:`, notification);
      globalNotificationService.broadcast(notification);
    } catch (error) {
      console.error(`❌ Error parsing ${type} notification:`, error);
      console.error('❌ Message body:', msg.body);
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
