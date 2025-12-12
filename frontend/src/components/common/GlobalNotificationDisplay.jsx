import React, { useEffect, useState, useCallback, useRef } from 'react';
import persistentWebSocketService from '../../services/PersistentWebSocketService';
import { authHelpers } from '../../config/auth';

/**
 * Global Notification Display
 * Shows notifications anywhere on the website
 * Displays toast notifications for all incoming messages
 */
const GlobalNotificationDisplay = () => {
  console.log('🔔 GlobalNotificationDisplay: Component rendering');
  const [notifications, setNotifications] = useState([]);
  const [nameMap, setNameMap] = useState({}); // Map email -> display name
  // Normalize to lowercase to match backend format
  const selfIdentifierRef = useRef((authHelpers.getUserEmail() || authHelpers.getUserName())?.toLowerCase());
  const getChatRouteRef = useRef(null);
  const addNotificationRef = useRef(null);
  
  // Load user directory to get display names
  useEffect(() => {
    const loadUserDirectory = async () => {
      try {
        const res = await fetch('http://localhost:8085/api/chat/users/all', { credentials: 'include' });
        const users = await res.json();
        const names = {};
        
        if (Array.isArray(users)) {
          users.forEach(u => {
            const email = (u.email || '').trim().toLowerCase();
            if (!email) return;
            const fullName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || u.username || email);
            names[email] = fullName;
          });
        }
        
        setNameMap(names);
      } catch (error) {
        console.error('Error loading user directory:', error);
      }
    };
    
    loadUserDirectory();
  }, []);
  
  // Helper to get display name from email
  const getDisplayName = useCallback((email) => {
    if (!email) return 'Someone';
    const normalizedEmail = email.toLowerCase();
    return nameMap[normalizedEmail] || email.split('@')[0] || email;
  }, [nameMap]);
  
  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    const email = authHelpers.getUserEmail();
    const name = authHelpers.getUserName();
    selfIdentifierRef.current = (email || name)?.toLowerCase();
  }, []);

  // Get the chat route based on user role
  const getChatRoute = useCallback((channelId) => {
    const role = (authHelpers.getUserRole() || '').toLowerCase();
    const routes = {
      admin: '/dashboard/admin/live',
      manager: '/dashboard/manager/communication',
      employee: '/dashboard/employee/chat',
      hr: '/dashboard/hr/communication'
    };
    const baseRoute = routes[role] || '/dashboard/employee/chat';
    return channelId ? `${baseRoute}?channelId=${encodeURIComponent(channelId)}` : baseRoute;
  }, []);
  
  // Store getChatRoute in ref
  useEffect(() => {
    getChatRouteRef.current = getChatRoute;
  }, [getChatRoute]);

  // Add notification to display
  const addNotification = useCallback((notification) => {
    console.log('🔔 GlobalNotificationDisplay: Adding notification:', notification);
    setNotifications(prev => {
      const updated = [...prev, notification];
      console.log('🔔 GlobalNotificationDisplay: Notifications updated, count:', updated.length);
      return updated;
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== notification.id);
        console.log('🔔 GlobalNotificationDisplay: Auto-removed notification, remaining:', filtered.length);
        return filtered;
      });
    }, 5000);
  }, []);
  
  // Store addNotification in ref
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  // Create handler function that uses refs - this prevents re-subscription
  const handleWebSocketMessage = useCallback((payload) => {
    const selfIdentifier = selfIdentifierRef.current;
    const getChatRoute = getChatRouteRef.current;
    const addNotification = addNotificationRef.current;
    
    console.log('🔔 handleWebSocketMessage called with payload:', payload);
    console.log('🔔 selfIdentifier:', selfIdentifier);
    console.log('🔔 addNotification exists?', !!addNotification);
    
    if (!addNotification) {
      console.warn('🔔 addNotification is not available!');
      return;
    }

    // Show notification for direct messages (DM)
    if (payload.type === 'dm') {
      const fromEmail = payload.from || '';
      const preview = payload.preview || 'New message';
      const roomId = payload.roomId;
      
      console.log('🔔 Processing DM notification, from:', fromEmail, 'selfIdentifier:', selfIdentifier);
      if (fromEmail && selfIdentifier && fromEmail.toLowerCase() !== selfIdentifier.toLowerCase()) {
        const displayName = getDisplayName(fromEmail);
        const channelId = roomId ? `DM_${roomId}` : null;
        
        console.log('🔔 Adding DM notification, displayName:', displayName, 'channelId:', channelId);
        addNotification({
          id: `dm-${roomId}-${Date.now()}`,
          type: 'chat',
          title: displayName,
          message: preview,
          icon: '💬',
          color: 'bg-blue-500',
          channelId: channelId,
          onClick: () => {
            if (channelId && getChatRoute) {
              const route = getChatRoute(channelId);
              console.log('🔔 Navigating to chat:', route, 'channelId:', channelId);
              // Use window.location.href for full page navigation
              window.location.href = route;
            } else {
              console.warn('🔔 Cannot navigate: channelId or getChatRoute missing', { channelId, hasGetChatRoute: !!getChatRoute });
            }
          }
        });
      } else {
        console.log('🔔 Skipping DM notification (from self or missing data)');
      }
    }

    // Show notification for group messages
    if (payload.type === 'group_message') {
      const fromEmail = payload.from || '';
      const preview = payload.preview || 'New message';
      const groupId = payload.groupId;
      
      console.log('🔔 Processing group_message notification, from:', fromEmail, 'selfIdentifier:', selfIdentifier);
      if (fromEmail && selfIdentifier && fromEmail.toLowerCase() !== selfIdentifier.toLowerCase()) {
        const displayName = getDisplayName(fromEmail);
        const channelId = groupId ? `GROUP_${groupId}` : null;
        
        console.log('🔔 Adding group_message notification, displayName:', displayName, 'channelId:', channelId);
        addNotification({
          id: `group-msg-${groupId}-${Date.now()}`,
          type: 'chat',
          title: displayName,
          message: preview,
          icon: '👥',
          color: 'bg-purple-500',
          channelId: channelId,
          onClick: () => {
            if (channelId && getChatRoute) {
              const route = getChatRoute(channelId);
              console.log('🔔 Navigating to group chat:', route);
              window.location.href = route;
            }
          }
        });
      } else {
        console.log('🔔 Skipping group_message notification (from self or missing data)');
      }
    }

    // Show notification for NEW_GROUP
    if (payload.type === 'NEW_GROUP' && payload.members && Array.isArray(payload.members)) {
      const isMember = payload.members.some(m => 
        m && selfIdentifier && m.toLowerCase() === selfIdentifier.toLowerCase()
      );
      if (isMember) {
        addNotification({
          id: `group-${payload.groupId}-${Date.now()}`,
          type: 'group',
          title: 'New Group',
          message: `Added to group: ${payload.groupName}`,
          icon: '👥',
          color: 'bg-blue-500',
          channelId: payload.groupId ? `GROUP_${payload.groupId}` : null,
          onClick: () => {
            if (payload.groupId && getChatRoute) {
              window.location.href = getChatRoute(`GROUP_${payload.groupId}`);
            }
          }
        });
      }
    }

    // Show notification for GROUP_LEFT
    if (payload.type === 'GROUP_LEFT') {
      addNotification({
        id: `left-${payload.groupId}-${Date.now()}`,
        type: 'group',
        title: 'Left Group',
        message: `You left the group`,
        icon: '👋',
        color: 'bg-orange-500'
      });
    }

    // Show notification for GROUP_DELETED
    if (payload.type === 'GROUP_DELETED') {
      addNotification({
        id: `deleted-${payload.groupId}-${Date.now()}`,
        type: 'group',
        title: 'Group Deleted',
        message: `Group "${payload.groupName}" has been deleted`,
        icon: '🗑️',
        color: 'bg-red-500'
      });
    }

    // Show notification for incoming calls
    if (payload.type === 'incoming_call') {
      addNotification({
        id: `call-${payload.roomId}-${Date.now()}`,
        type: 'call',
        title: 'Incoming Call',
        message: `${payload.fromUser} is calling...`,
        icon: '📞',
        color: 'bg-green-500',
        channelId: payload.roomId,
        onClick: () => {
          if (payload.roomId && getChatRoute) {
            window.location.href = getChatRoute(payload.roomId);
          }
        }
      });
    }
  }, [addNotification, getDisplayName]);

  // Subscribe to WebSocket messages - only once on mount
  useEffect(() => {
    console.log('🔔 GlobalNotificationDisplay: Component mounted, setting up WebSocket subscription');
    
    // Ensure WebSocket is connected
    const setupWebSocket = async () => {
      const userEmail = authHelpers.getUserEmail();
      const userName = authHelpers.getUserName();
      const userIdentifier = (userEmail || userName)?.toLowerCase();
      
      if (!userIdentifier) {
        console.warn('🔔 GlobalNotificationDisplay: No user identifier found!');
        return null;
      }
      
      if (!persistentWebSocketService.isConnectedStatus()) {
        console.log('🔔 GlobalNotificationDisplay: WebSocket not connected, connecting for:', userIdentifier);
        try {
          await persistentWebSocketService.connect(userIdentifier);
          console.log('🔔 GlobalNotificationDisplay: WebSocket connected successfully');
        } catch (error) {
          console.error('🔔 GlobalNotificationDisplay: Failed to connect WebSocket:', error);
          return null;
        }
      } else {
        console.log('🔔 GlobalNotificationDisplay: WebSocket already connected');
      }
      
      // Wait a bit to ensure connection is fully established
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Subscribe to messages using the stable callback
      console.log('🔔 GlobalNotificationDisplay: Subscribing to WebSocket messages with handler:', !!handleWebSocketMessage);
      const unsubscribe = persistentWebSocketService.subscribe(
        'GlobalNotificationDisplay',
        handleWebSocketMessage
      );
      
      console.log('🔔 GlobalNotificationDisplay: Subscription created, unsubscribe function:', !!unsubscribe);
      return unsubscribe;
    };
    
    let unsubscribeFn = null;
    setupWebSocket().then((unsubscribe) => {
      if (unsubscribe) {
        unsubscribeFn = unsubscribe;
        console.log('🔔 GlobalNotificationDisplay: Subscription setup complete');
      } else {
        console.warn('🔔 GlobalNotificationDisplay: Failed to setup subscription');
      }
    });

    return () => {
      console.log('🔔 GlobalNotificationDisplay: Component unmounting, cleaning up');
      if (unsubscribeFn) {
        console.log('🔔 GlobalNotificationDisplay: Unsubscribing from WebSocket messages');
        unsubscribeFn();
      }
    };
  }, [handleWebSocketMessage]); // Depend on handleWebSocketMessage


  // Debug: Log notifications state and verify DOM
  useEffect(() => {
    console.log('🔔 GlobalNotificationDisplay: Current notifications:', notifications.length, notifications);
    if (notifications.length > 0) {
      console.log('🔔 GlobalNotificationDisplay: Rendering', notifications.length, 'notification(s)');
      // Verify the notification is in the DOM
      setTimeout(() => {
        const container = document.getElementById('global-notification-container');
        const notificationElements = container?.querySelectorAll('[id^="notification-"]');
        console.log('🔔 GlobalNotificationDisplay: DOM check - Container found?', !!container);
        console.log('🔔 GlobalNotificationDisplay: DOM check - Notification elements found?', notificationElements?.length || 0);
        if (notificationElements && notificationElements.length > 0) {
          notificationElements.forEach((el, idx) => {
            const rect = el.getBoundingClientRect();
            console.log(`🔔 GlobalNotificationDisplay: Notification ${idx} position:`, {
              top: rect.top,
              right: window.innerWidth - rect.right,
              visible: rect.width > 0 && rect.height > 0,
              zIndex: window.getComputedStyle(el).zIndex,
              opacity: window.getComputedStyle(el).opacity,
              display: window.getComputedStyle(el).display
            });
          });
        }
      }, 100);
    }
  }, [notifications]);

  // Test function to verify component is working
  const testNotification = () => {
    console.log('🔔 Test button clicked, adding test notification');
    addNotification({
      id: `test-${Date.now()}`,
      type: 'test',
      title: 'Test Notification',
      message: 'If you see this, the component is working!',
      icon: '✅',
      color: 'bg-blue-500'
    });
    console.log('🔔 Test notification added');
  };

  return (
    <>
      {/* Test button - remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={testNotification}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100001,
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Test Notification
        </button>
      )}
      
      {/* Notification Container */}
      <div 
        id="global-notification-container"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 99999,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          maxWidth: 'calc(100vw - 32px)',
          width: 'auto',
          minHeight: '0',
          overflow: 'visible'
        }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const bgColor = notification.color === 'bg-blue-500' ? '#3b82f6' : 
                           notification.color === 'bg-purple-500' ? '#a855f7' :
                           notification.color === 'bg-green-500' ? '#10b981' :
                           notification.color === 'bg-orange-500' ? '#f97316' :
                           notification.color === 'bg-red-500' ? '#ef4444' : '#3b82f6';
            
            return (
              <div
                key={notification.id}
                id={`notification-${notification.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (notification.onClick) {
                    notification.onClick();
                  }
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                }}
                style={{
                  position: 'relative',
                  zIndex: 100000,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 24px',
                  backgroundColor: bgColor,
                  color: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  minWidth: '300px',
                  maxWidth: '400px',
                  width: 'fit-content',
                  opacity: 1,
                  visibility: 'visible',
                  animation: 'slideInRight 0.3s ease-out',
                  transition: 'opacity 0.2s, transform 0.2s',
                  transform: 'translateX(0)',
                  willChange: 'transform, opacity',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{notification.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.875rem',
                    margin: 0,
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {notification.title}
                  </h3>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    opacity: 0.9,
                    margin: 0,
                    wordBreak: 'break-word'
                  }}>
                    {notification.message}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          // Debug indicator when no notifications (development only)
          process.env.NODE_ENV === 'development' && (
            <div style={{
              fontSize: '10px',
              color: '#999',
              padding: '4px 8px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
              pointerEvents: 'none'
            }}>
              No notifications ({notifications.length})
            </div>
          )
        )}
      </div>
    </>
  );
};

export default GlobalNotificationDisplay;
