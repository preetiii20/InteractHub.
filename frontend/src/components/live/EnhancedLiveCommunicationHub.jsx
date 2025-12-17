import React, { useEffect, useMemo, useState, useCallback } from 'react';
import JitsiVideoCall from '../common/JitsiVideoCall';
import VoiceCallComponent from '../common/VoiceCallComponent';
import ChatWindow from '../common/ChatWindow';
import GroupInfoModal from '../common/GroupInfoModal';
import IncomingCallModal from '../common/IncomingCallModal';
import ConnectionStatus from '../common/ConnectionStatus';
import NotificationService from '../../services/NotificationService';
import { Avatar } from '../../utils/avatarGenerator';
import { getRelativeTime } from '../../utils/timeFormatter';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Normalize DM channelId
const normalizeDmChannel = (a, b) => {
    const A = (a || '').trim().toLowerCase();
    const B = (b || '').trim().toLowerCase();
    return `DM_${A <= B ? `${A}|${B}` : `${B}|${A}`}`;
};

// Build group channelId
const normalizeGroupChannel = (names) => {
    const uniq = Array.from(new Set(names.map(n => String(n||'').trim().toLowerCase()).filter(Boolean)));
    uniq.sort();
    return `GROUP_${uniq.join('|')}`;
};

const EnhancedLiveCommunicationHub = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const [conversations, setConversations] = useState(new Map());
    const [activeConversationId, setActiveConversationId] = useState(null);
    const channelIdHandledRef = React.useRef(false);
    const lastChannelIdRef = React.useRef(null);
    const [unreadCounts, setUnreadCounts] = useState(new Map());
    const [notifications, setNotifications] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [nameMap, setNameMap] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
    const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
    const [autoStart, setAutoStart] = useState(false);
    const [incoming, setIncoming] = useState(null);
    const [overrideChannelId, setOverrideChannelId] = useState('');
    const [prefetchMedia, setPrefetchMedia] = useState(false);
    const [outgoingCall, setOutgoingCall] = useState(null); // Track outgoing call state
    const outgoingCallRef = React.useRef(null); // Ref to track outgoing call for callbacks
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [isConnected, setIsConnected] = useState(false);
    const wsClientRef = React.useRef(null);

    const selfIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName();
    const userName = authHelpers.getUserName();

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
            });
        } else if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    // Initialize unread counts from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('chat_unread_counts');
            if (stored) {
                const counts = JSON.parse(stored);
                const map = new Map(Object.entries(counts));
                setUnreadCounts(map);
            }
        } catch (e) {
            console.error('Error loading unread counts:', e);
        }
    }, []);

    // Save unread counts to localStorage
    useEffect(() => {
        try {
            const obj = Object.fromEntries(unreadCounts);
            localStorage.setItem('chat_unread_counts', JSON.stringify(obj));
        } catch (e) {
            console.error('Error saving unread counts:', e);
        }
    }, [unreadCounts]);

    // Load directory and initialize conversations
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(apiConfig.chatService + '/users/all' || 'http://localhost:8085/api/chat/users/all');
                const users = await res.json();
                
                const identifiers = [];
                const names = {};
                const convs = new Map();
                
                if (Array.isArray(users)) {
                    users.forEach(u => {
                        const email = (u.email || '').trim();
                        if (!email || email === selfIdentifier) return;
                        const fullName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || u.username || '');
                        identifiers.push(email);
                        names[email] = fullName || email;
                        
                        // Create DM conversation
                        const channelId = normalizeDmChannel(selfIdentifier, email);
                        convs.set(channelId, {
                            id: channelId,
                            name: fullName || email,
                            type: 'direct',
                            participants: [selfIdentifier, email],
                            lastMessage: '',
                            lastMessageTime: null,
                            isOnline: false
                        });
                    });
                }

                if (selfIdentifier && !identifiers.includes(selfIdentifier)) {
                    identifiers.push(selfIdentifier);
                    names[selfIdentifier] = userName || selfIdentifier;
                }
                
                // Load groups from localStorage
                try {
                    const storedGroups = localStorage.getItem('chat_groups');
                    if (storedGroups) {
                        const groups = JSON.parse(storedGroups);
                        Object.entries(groups).forEach(([groupId, groupData]) => {
                            convs.set(groupId, {
                                id: groupId,
                                name: groupData.name,
                                type: 'group',
                                participants: groupData.members,
                                createdBy: groupData.createdBy,
                                lastMessage: '',
                                lastMessageTime: groupData.createdAt ? new Date(groupData.createdAt) : null,
                                isOnline: false
                            });
                        });
                    }
                } catch (e) {
                    console.error('Error loading groups from localStorage:', e);
                }
                
                setNameMap(names);
                setDirectory(identifiers.sort());
                setConversations(convs);
                
                // Load last message for each conversation
                const loadLastMessages = async () => {
                    try {
                        const updatedConvs = new Map(convs);
                        
                        // Load DM last messages
                        for (const [channelId, conv] of updatedConvs.entries()) {
                            if (conv.type === 'direct') {
                                const [userA, userB] = channelId.replace(/^DM_/, '').split('|');
                                try {
                                    const res = await fetch(`http://localhost:8085/api/direct/history?userA=${userA}&userB=${userB}`, { credentials: 'include' });
                                    const messages = await res.json();
                                    if (Array.isArray(messages) && messages.length > 0) {
                                        const lastMsg = messages[messages.length - 1];
                                        updatedConvs.set(channelId, {
                                            ...conv,
                                            lastMessage: lastMsg.content || '',
                                            lastMessageTime: new Date(lastMsg.sentAt || Date.now())
                                        });
                                    }
                                } catch (e) {
                                    console.error(`Error loading last message for ${channelId}:`, e);
                                }
                            }
                        }
                        
                        // Load group last messages
                        for (const [groupId, conv] of updatedConvs.entries()) {
                            if (conv.type === 'group') {
                                const cleanGroupId = groupId.replace(/^GROUP_/, '');
                                try {
                                    const res = await fetch(`http://localhost:8085/api/group/${cleanGroupId}/history`, { credentials: 'include' });
                                    const messages = await res.json();
                                    if (Array.isArray(messages) && messages.length > 0) {
                                        const lastMsg = messages[messages.length - 1];
                                        updatedConvs.set(groupId, {
                                            ...conv,
                                            lastMessage: lastMsg.content || '',
                                            lastMessageTime: new Date(lastMsg.sentAt || Date.now())
                                        });
                                    }
                                } catch (e) {
                                    console.error(`Error loading last message for group ${groupId}:`, e);
                                }
                            }
                        }
                        
                        setConversations(updatedConvs);
                        console.log('✅ Last messages loaded for all conversations');
                    } catch (e) {
                        console.error('Error loading last messages:', e);
                    }
                };
                
                loadLastMessages();
            } catch (e) {
                console.error("Error fetching user directory:", e);
            }
        };
        load();
    }, [selfIdentifier, userName]);

    // Helper: clear channelId query param after navigation to avoid forcing chat selection again
    const clearChannelIdParam = useCallback(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('channelId')) {
            url.searchParams.delete('channelId');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    // Select conversation
    const selectConversation = useCallback((conversationId) => {
        setActiveConversationId(conversationId);
        setActiveTab('chat');
        clearChannelIdParam();
        // Clear unread count
        setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            newCounts.set(conversationId, 0);
            return newCounts;
        });
    }, [clearChannelIdParam]);

    // Read channelId from URL and set active conversation (only once)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const channelIdFromUrl = urlParams.get('channelId');
        
        // Only process the URL param if it's new
        if (channelIdHandledRef.current && channelIdFromUrl === lastChannelIdRef.current) {
            return;
        }
        if (channelIdFromUrl) {
            channelIdHandledRef.current = true;
            lastChannelIdRef.current = channelIdFromUrl;
        }
        
        // Check for pending call from notification click
        const pendingCallStr = sessionStorage.getItem('pendingCall');
        if (pendingCallStr) {
            try {
                const pendingCall = JSON.parse(pendingCallStr);
                console.log('📞 Pending call found:', pendingCall);
                sessionStorage.removeItem('pendingCall');
                
                // Set incoming call state to show modal
                setIncoming({
                    fromUser: pendingCall.fromUser,
                    callType: pendingCall.callType || 'VIDEO',
                    roomId: pendingCall.roomId
                });
                
                // Navigate to the conversation if it exists
                if (pendingCall.roomId) {
                    // For calls, the roomId is the channelId
                    setOverrideChannelId(pendingCall.roomId);
                    setActiveTab(pendingCall.callType === 'VOICE' ? 'voice' : 'video');
                }
            } catch (e) {
                console.error('Error parsing pending call:', e);
            }
        }
        
        if (channelIdFromUrl) {
            console.log('🔔 URL channelId found:', channelIdFromUrl);
            console.log('🔔 Available conversations:', Array.from(conversations.keys()));
            
            // Check if conversation exists
            if (conversations.has(channelIdFromUrl)) {
                console.log('🔔 Conversation found, setting as active:', channelIdFromUrl);
                setActiveConversationId(channelIdFromUrl);
                setActiveTab('chat');
                clearChannelIdParam();
                // Clear unread count
                setUnreadCounts(prev => {
                    const newCounts = new Map(prev);
                    newCounts.delete(channelIdFromUrl);
                    return newCounts;
                });
            } else {
                console.log('🔔 Conversation not found in map, creating if DM:', channelIdFromUrl);
                // If it's a DM and not in conversations, create it
                if (channelIdFromUrl.startsWith('DM_')) {
                    const roomId = channelIdFromUrl.replace('DM_', '');
                    const [userA, userB] = roomId.split('|');
                    const otherUserEmail = (userA === selfIdentifier?.toLowerCase()) ? userB : userA;
                    const otherUserName = nameMap[otherUserEmail] || otherUserEmail;
                    
                    console.log('🔔 Creating DM conversation:', channelIdFromUrl, 'with:', otherUserEmail);
                    setConversations(prev => {
                        const newConvs = new Map(prev);
                        newConvs.set(channelIdFromUrl, {
                            id: channelIdFromUrl,
                            name: otherUserName,
                            type: 'direct',
                            participants: [selfIdentifier, otherUserEmail],
                            lastMessage: '',
                            lastMessageTime: null,
                            isOnline: false
                        });
                        return newConvs;
                    });
                    setActiveConversationId(channelIdFromUrl);
                    setActiveTab('chat');
                    clearChannelIdParam();
                }
            }
        }
    }, [conversations, selfIdentifier, nameMap, clearChannelIdParam]);

    // Listen for in-app notification click events to open chats without full reload
    useEffect(() => {
        const handleChatOpen = (event) => {
            const channelId = event?.detail?.channelId;
            if (!channelId) return;

            // If conversation exists, select it; otherwise, set as override so ChatWindow can still attach
            if (conversations.has(channelId)) {
                selectConversation(channelId);
            } else {
                setActiveConversationId(channelId);
                setActiveTab('chat');
            }
            clearChannelIdParam();
        };

        window.addEventListener('chat:open', handleChatOpen);
        return () => window.removeEventListener('chat:open', handleChatOpen);
    }, [conversations, selectConversation, clearChannelIdParam]);

    // Show browser notification
    const showBrowserNotification = useCallback((from, content, conversationId) => {
        if (notificationPermission === 'granted' && 'Notification' in window) {
            const notification = new Notification(`New message from ${from}`, {
                body: content.substring(0, 100),
                icon: '/logo192.png',
                tag: conversationId
            });
            
            notification.onclick = () => {
                window.focus();
                setActiveConversationId(conversationId);
                setActiveTab('chat');
                notification.close();
            };
        }
    }, [notificationPermission]);

    // Show toast notification
    const showToastNotification = useCallback((type, from, content, conversationId) => {
        const id = `notif-${Date.now()}-${Math.random()}`;
        const newNotif = {
            id,
            type,
            from,
            fromDisplayName: nameMap[from] || from,
            content,
            timestamp: new Date(),
            conversationId
        };
        
        console.log('📢 Toast notification:', newNotif);
        setNotifications(prev => [...prev, newNotif]);
        
        // Auto-dismiss after 6 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 6000);
    }, [nameMap]);

    // Handle new message
    const handleNewMessage = useCallback((message) => {
        const channelId = message.channelId || message.roomId || message.groupId;
        if (!channelId) return;
        
        // Update conversation last message
        setConversations(prev => {
            const newConvs = new Map(prev);
            const conv = newConvs.get(channelId);
            if (conv) {
                conv.lastMessage = message.content || '';
                conv.lastMessageTime = new Date(message.sentAt || Date.now());
                newConvs.set(channelId, conv);
            }
            return newConvs;
        });
        
        // Increment unread if not active conversation
        if (channelId !== activeConversationId) {
            setUnreadCounts(prev => {
                const newCounts = new Map(prev);
                const currentCount = newCounts.get(channelId) || 0;
                newCounts.set(channelId, currentCount + 1);
                return newCounts;
            });
            
            // Show notifications
            const from = message.senderName || message.fromUser || 'Someone';
            const displayName = nameMap[from] || from;
            showBrowserNotification(displayName, message.content || 'New message', channelId);
            showToastNotification('message', from, message.content || 'New message', channelId);
        }
    }, [activeConversationId, nameMap, showBrowserNotification, showToastNotification]);

    // Create group
    const handleCreateGroup = useCallback(async (groupName, members) => {
        try {
            console.log('🔄 Creating group:', { groupName, members, selfIdentifier });
            
            // Call the backend to create the group (backend will handle notifications)
            const response = await fetch('http://localhost:8085/api/group/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: groupName,
                    createdByName: userName || selfIdentifier,
                    createdByEmail: selfIdentifier,
                    members: [...members, selfIdentifier]
                })
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', errorText);
                throw new Error(`Failed to create group: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Group created:', result);
            const groupId = result.groupId;
            
            const newGroup = {
                id: groupId,
                name: groupName,
                type: 'group',
                participants: [...members, selfIdentifier],
                createdBy: selfIdentifier,
                lastMessage: '',
                lastMessageTime: new Date(),
                isOnline: false
            };
            
            // Add to conversations
            setConversations(prev => {
                const newConvs = new Map(prev);
                newConvs.set(groupId, newGroup);
                return newConvs;
            });
            
            // Save to localStorage AND backend
            try {
                const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                storedGroups[groupId] = {
                    name: groupName,
                    members: [...members, selfIdentifier],
                    createdAt: new Date().toISOString(),
                    createdBy: userName || selfIdentifier
                };
                localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                
                // Also save to backend for persistence
                console.log('💾 Saving group to backend database');
                // Groups are already saved by the backend during creation
            } catch (e) {
                console.error('Error saving group to localStorage:', e);
            }
            
            setShowCreateGroupModal(false);
            setActiveConversationId(groupId);
            
            // Subscribe to the new group's messages using persistent WebSocket
            try {
                const persistentWebSocketService = (await import('../../services/PersistentWebSocketService')).default;
                if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
                    const topic = `/topic/group.${groupId}`;
                    console.log('📡 Subscribing to new group topic:', topic);
                    persistentWebSocketService.client.subscribe(topic, (frame) => {
                        try {
                            const newMsg = JSON.parse(frame.body || '{}');
                            console.log('📨 Received group message (new group subscription):', newMsg);
                            
                            // Update conversation with new message
                            setConversations(prev => {
                                const newConvs = new Map(prev);
                                const conv = newConvs.get(groupId);
                                if (conv) {
                                    newConvs.set(groupId, {
                                        ...conv,
                                        lastMessage: newMsg.content || '',
                                        lastMessageTime: new Date(newMsg.sentAt || Date.now())
                                    });
                                }
                                return newConvs;
                            });
                            
                            // Trigger new message handler
                            handleNewMessage({ ...newMsg, channelId: groupId });
                        } catch (error) {
                            console.error('❌ Error handling group message:', error);
                        }
                    }, { id: `global-grp-${groupId}` });
                }
            } catch (error) {
                console.error('❌ Error subscribing to new group:', error);
            }
            
            console.log('✅ Group created successfully:', groupId);
        } catch (e) {
            console.error('❌ Error creating group:', e);
            alert('Failed to create group. Please try again.');
        }
    }, [selfIdentifier, userName, handleNewMessage]);

    // Subscribe for call and group notifications using persistent service
    useEffect(() => {
        const setupWebSocket = async () => {
            try {
                // Import the persistent service
                const persistentWebSocketService = (await import('../../services/PersistentWebSocketService')).default;
                
                // Connect to WebSocket
                await persistentWebSocketService.connect(selfIdentifier);
                setIsConnected(true);
                
                // Subscribe to messages
                const unsubscribe = persistentWebSocketService.subscribe('EnhancedLiveCommunicationHub', (payload) => {
                    handleWebSocketMessage(payload);
                    
                    // Track unread for chat messages
                    if (payload.content && payload.channelId && payload.senderName !== selfIdentifier) {
                        const channelId = payload.channelId;
                        if (channelId !== activeConversationId) {
                            setUnreadCounts(prev => {
                                const newCounts = new Map(prev);
                                const currentCount = newCounts.get(channelId) || 0;
                                newCounts.set(channelId, currentCount + 1);
                                return newCounts;
                            });
                        }
                    }
                });
                
                // Subscribe to call end events for all active calls
                if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
                    // Subscribe to call end topic (generic for all calls)
                    persistentWebSocketService.client.subscribe('/topic/call.end', (frame) => {
                        try {
                            const callEndEvent = JSON.parse(frame.body || '{}');
                            console.log('📞 Received call end event:', callEndEvent);
                            handleWebSocketMessage(callEndEvent);
                        } catch (error) {
                            console.error('Error handling call end event:', error);
                        }
                    }, { id: 'call-end-subscription' });
                    
                    // Subscribe to group notifications (new groups, group deleted, etc.)
                    persistentWebSocketService.client.subscribe('/topic/group-notifications', (frame) => {
                        try {
                            const notification = JSON.parse(frame.body || '{}');
                            console.log('📢 Received group notification:', notification);
                            
                            if (notification.type === 'NEW_GROUP') {
                                // Add new group to conversations
                                const newGroup = {
                                    id: notification.groupId,
                                    name: notification.groupName,
                                    type: 'group',
                                    participants: notification.members || [],
                                    createdBy: notification.createdBy,
                                    lastMessage: '',
                                    lastMessageTime: new Date(),
                                    isOnline: false
                                };
                                
                                setConversations(prev => {
                                    const newConvs = new Map(prev);
                                    newConvs.set(notification.groupId, newGroup);
                                    return newConvs;
                                });
                                
                                // Save to localStorage
                                try {
                                    const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                                    storedGroups[notification.groupId] = {
                                        name: notification.groupName,
                                        members: notification.members || [],
                                        createdAt: new Date().toISOString(),
                                        createdBy: notification.createdBy
                                    };
                                    localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                                } catch (e) {
                                    console.error('Error saving group to localStorage:', e);
                                }
                                
                                // Show notification
                                showToastNotification('group', notification.createdBy, `${notification.createdBy} created group: ${notification.groupName}`, notification.groupId);
                            }
                        } catch (error) {
                            console.error('Error handling group notification:', error);
                        }
                    }, { id: 'group-notifications-subscription' });
                }
                
                // Subscribe to all groups (from backend and localStorage)
                const subscribeToGroups = async () => {
                    try {
                        const groupIdsSet = new Set();
                        
                        // First, try to fetch groups from backend
                        try {
                            const response = await fetch(`http://localhost:8085/api/group/user/${encodeURIComponent(selfIdentifier)}/groups`, { credentials: 'include' });
                            if (response.ok) {
                                const backendGroups = await response.json();
                                console.log('📡 Fetched groups from backend:', backendGroups);
                                backendGroups.forEach(group => {
                                    if (group.groupId) {
                                        groupIdsSet.add(group.groupId);
                                        // Also update localStorage and conversations
                                        setConversations(prev => {
                                            const newConvs = new Map(prev);
                                            if (!newConvs.has(group.groupId)) {
                                                newConvs.set(group.groupId, {
                                                    id: group.groupId,
                                                    name: group.name,
                                                    type: 'group',
                                                    participants: group.members || [],
                                                    lastMessage: '',
                                                    lastMessageTime: group.createdAt ? new Date(group.createdAt) : null,
                                                    isOnline: false
                                                });
                                            }
                                            return newConvs;
                                        });
                                        
                                        // Update localStorage
                                        try {
                                            const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                                            storedGroups[group.groupId] = {
                                                name: group.name,
                                                members: group.members || [],
                                                createdAt: group.createdAt,
                                                createdBy: group.createdBy
                                            };
                                            localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                                        } catch (e) {
                                            console.error('Error updating localStorage:', e);
                                        }
                                    }
                                });
                            }
                        } catch (error) {
                            console.warn('⚠️ Could not fetch groups from backend, using localStorage:', error);
                        }
                        
                        // Also add groups from localStorage (fallback)
                        try {
                            const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                            Object.keys(storedGroups).forEach(groupId => groupIdsSet.add(groupId));
                        } catch (e) {
                            console.error('Error reading localStorage groups:', e);
                        }
                        
                        const groupIds = Array.from(groupIdsSet);
                        console.log('📡 Subscribing to all user groups:', groupIds);
                        
                        if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
                            groupIds.forEach(groupId => {
                                // Remove GROUP_ prefix if present for topic subscription
                                const cleanGroupId = groupId.replace(/^GROUP_/, '');
                                const topic = `/topic/group.${cleanGroupId}`;
                                console.log('📡 Subscribing to group topic:', topic, 'for groupId:', cleanGroupId);
                                try {
                                    const subscription = persistentWebSocketService.client.subscribe(topic, (frame) => {
                                        try {
                                            const newMsg = JSON.parse(frame.body || '{}');
                                            console.log('📨 Received group message (global subscription):', newMsg, 'for group:', cleanGroupId);
                                            
                                            // Update conversation with new message
                                            setConversations(prev => {
                                                const newConvs = new Map(prev);
                                                // Try both with and without GROUP_ prefix
                                                const conv = newConvs.get(cleanGroupId) || newConvs.get(`GROUP_${cleanGroupId}`) || newConvs.get(groupId);
                                                if (conv) {
                                                    const convKey = conv.id || cleanGroupId;
                                                    newConvs.set(convKey, {
                                                        ...conv,
                                                        lastMessage: newMsg.content || '',
                                                        lastMessageTime: new Date(newMsg.sentAt || Date.now())
                                                    });
                                                }
                                                return newConvs;
                                            });
                                            
                                            // Trigger new message handler
                                            handleNewMessage({ ...newMsg, channelId: cleanGroupId, groupId: cleanGroupId });
                                        } catch (error) {
                                            console.error('❌ Error handling group message:', error);
                                        }
                                    }, { id: `global-grp-${cleanGroupId}` });
                                    console.log('✅ Group subscription created:', topic, subscription ? 'success' : 'failed');
                                } catch (error) {
                                    console.error(`❌ Error subscribing to group ${cleanGroupId}:`, error);
                                }
                            });
                        } else {
                            console.warn('⚠️ WebSocket not connected, retrying group subscriptions in 1 second...');
                            setTimeout(subscribeToGroups, 1000);
                        }
                    } catch (error) {
                        console.error('❌ Error loading groups for subscription:', error);
                    }
                };
                
                // Subscribe to all DM conversations
                const subscribeToDMs = async () => {
                    try {
                        console.log('📡 Setting up DM subscriptions for:', selfIdentifier);
                        
                        // Get all DM conversations from the conversations map
                        const dmConversations = Array.from(conversations.values()).filter(dmConv => dmConv.type === 'direct');
                        console.log('📡 Found DM conversations:', dmConversations.map(c => c.id));
                        
                        if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
                            dmConversations.forEach(dmConv => {
                                const dmRoom = dmConv.id.replace(/^DM_/, '');
                                const conversationId = dmConv.id;
                                const topic = `/queue/dm.${dmRoom}`;
                                console.log('📡 Subscribing to DM topic:', topic);
                                
                                try {
                                    persistentWebSocketService.client.subscribe(topic, (frame) => {
                                        try {
                                            const newMsg = JSON.parse(frame.body || '{}');
                                            console.log('📨 Received DM message (global subscription):', newMsg, 'for room:', dmRoom);
                                            
                                            // Update conversation with new message
                                            setConversations(prev => {
                                                const newConvs = new Map(prev);
                                                const existingConv = newConvs.get(conversationId);
                                                if (existingConv) {
                                                    newConvs.set(conversationId, {
                                                        ...existingConv,
                                                        lastMessage: newMsg.content || '',
                                                        lastMessageTime: new Date(newMsg.sentAt || Date.now())
                                                    });
                                                }
                                                return newConvs;
                                            });
                                            
                                            // Trigger new message handler for unread tracking
                                            handleNewMessage({ ...newMsg, channelId: conversationId, roomId: dmRoom });
                                        } catch (error) {
                                            console.error('❌ Error handling DM message:', error);
                                        }
                                    }, { id: `global-dm-${dmRoom}` });
                                    console.log('✅ DM subscription created:', topic);
                                } catch (error) {
                                    console.error(`❌ Error subscribing to DM ${dmRoom}:`, error);
                                }
                            });
                        } else {
                            console.warn('⚠️ WebSocket not connected for DMs, retrying in 1 second...');
                            setTimeout(subscribeToDMs, 1000);
                        }
                    } catch (error) {
                        console.error('❌ Error setting up DM subscriptions:', error);
                    }
                };
                
                // Wait a bit for connection to be fully established
                setTimeout(() => {
                    subscribeToGroups();
                    subscribeToDMs();
                }, 500);
                
                return unsubscribe;
            } catch (error) {
                console.error('❌ Error setting up WebSocket:', error);
            }
        };
        
        let unsubscribe;
        setupWebSocket().then((unsub) => {
            unsubscribe = unsub;
        });
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selfIdentifier, handleNewMessage]);

    // Handle WebSocket messages
    const handleWebSocketMessage = useCallback((payload) => {
        console.log('📨 Handling WebSocket message:', payload);
        
        if (payload.type === 'incoming_call') {
            setIncoming({ fromUser: payload.fromUser, callType: (payload.callType || 'VIDEO').toUpperCase(), roomId: payload.roomId });
            showToastNotification('call', payload.fromUser, `Incoming ${payload.callType} call`, '');
        } else if (payload.type === 'call-accepted') {
            // Call was accepted by recipient, now start the call
            console.log('✅ Call accepted event received!', payload);
            const currentOutgoingCall = outgoingCallRef.current;
            console.log('✅ Checking outgoing call:', { currentOutgoingCall, payloadRoomId: payload.roomId });
            if (currentOutgoingCall && currentOutgoingCall.roomId === payload.roomId) {
                console.log('✅ Starting call for sender, roomId:', payload.roomId);
                setAutoStart(true);
                setPrefetchMedia(true);
                // Don't clear outgoingCall yet - let the call component handle it
            } else {
                console.log('⚠️ Call accepted but no matching outgoing call', { currentOutgoingCall, payload });
            }
        } else if (payload.type === 'call-declined') {
            // Call was declined by recipient
            const currentOutgoingCall = outgoingCallRef.current;
            if (currentOutgoingCall && currentOutgoingCall.roomId === payload.roomId) {
                alert('Call declined by recipient');
                setOutgoingCall(null);
                outgoingCallRef.current = null;
                setOverrideChannelId('');
                setActiveTab('chat');
            }
        } else if (payload.type === 'call-ended') {
            // Call was ended by the other participant
            console.log('📞 Call ended by other participant:', payload);
            if (activeTab === 'video' || activeTab === 'voice') {
                // Only end if we're in a call
                if (overrideChannelId === payload.roomId || activeConversationId === payload.roomId) {
                    console.log('🔴 Ending call because other participant ended it');
                    handleCallEnd();
                    showToastNotification('message', 'System', 'Call ended by other participant', '');
                }
            }
        } else if (payload.type === 'group_created' || payload.type === 'NEW_GROUP') {
            // Check if this notification is for the current user
            if (payload.members && Array.isArray(payload.members)) {
                const isMember = payload.members.some(m => 
                    m.toLowerCase() === selfIdentifier.toLowerCase()
                );
                if (isMember) {
                    console.log('✅ This group is for me!');
                    const newGroup = {
                        id: payload.groupId,
                        name: payload.groupName,
                        type: 'group',
                        participants: payload.members || [],
                        lastMessage: '',
                        lastMessageTime: new Date(),
                        isOnline: false,
                        createdBy: payload.createdBy,
                        groupId: payload.groupId
                    };
                    setConversations(prev => {
                        const newConvs = new Map(prev);
                        newConvs.set(payload.groupId, newGroup);
                        return newConvs;
                    });
                    
                    try {
                        const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                        storedGroups[payload.groupId] = {
                            name: payload.groupName,
                            members: payload.members || [],
                            createdAt: new Date().toISOString(),
                            createdBy: payload.createdBy
                        };
                        localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                    } catch (e) {
                        console.error('Error saving group to localStorage:', e);
                    }
                    
                    showToastNotification('message', payload.createdBy || 'Someone', `Added you to group: ${payload.groupName}`, payload.groupId);
                }
            }
        } else if (payload.type === 'GROUP_LEFT') {
            setConversations(prev => {
                const newConvs = new Map(prev);
                newConvs.delete(payload.groupId);
                return newConvs;
            });
            if (activeConversationId === payload.groupId) {
                setActiveConversationId(null);
            }
            showToastNotification('message', 'System', 'You left the group', payload.groupId);
        } else if (payload.type === 'GROUP_DELETED') {
            setConversations(prev => {
                const newConvs = new Map(prev);
                newConvs.delete(payload.groupId);
                return newConvs;
            });
            if (activeConversationId === payload.groupId) {
                setActiveConversationId(null);
            }
            showToastNotification('message', 'System', `Group "${payload.groupName}" has been deleted`, payload.groupId);
        } else if (payload.type === 'MEMBER_LEFT') {
            // Update conversations to remove the member from participants
            console.log('👤 Member left event:', payload);
            setConversations(prev => {
                const newConvs = new Map(prev);
                const groupId = payload.groupId;
                const conv = newConvs.get(groupId);
                if (conv) {
                    const updatedParticipants = conv.participants.filter(p => 
                        p.toLowerCase() !== payload.memberEmail.toLowerCase()
                    );
                    newConvs.set(groupId, {
                        ...conv,
                        participants: updatedParticipants
                    });
                    console.log('✅ Updated participants for group:', groupId, updatedParticipants);
                }
                return newConvs;
            });
        } else if (payload.type === 'MEMBER_ADDED') {
            // Update conversations to add the new member to participants
            console.log('👤 Member added event:', payload);
            setConversations(prev => {
                const newConvs = new Map(prev);
                const groupId = payload.groupId;
                const conv = newConvs.get(groupId);
                if (conv) {
                    const memberExists = conv.participants.some(p => 
                        p.toLowerCase() === payload.memberEmail.toLowerCase()
                    );
                    if (!memberExists) {
                        const updatedParticipants = [...conv.participants, payload.memberEmail];
                        newConvs.set(groupId, {
                            ...conv,
                            participants: updatedParticipants
                        });
                        console.log('✅ Added member to group:', groupId, payload.memberEmail);
                    }
                }
                return newConvs;
            });
        }
    }, [selfIdentifier, activeConversationId, showToastNotification]);

    // Start video call
    const startVideoCall = async () => {
        if (!activeConversationId) return;
        const conv = conversations.get(activeConversationId);
        if (!conv) return;
        
        const roomId = `call_${Date.now()}_${selfIdentifier}`;
        const participants = conv.participants.filter(p => p !== selfIdentifier);
        
        console.log('📞 Starting video call:', { selfIdentifier, participants, roomId });
        
        // Show toast notification that call is being initiated
        showToastNotification('call', 'You', `Calling ${conv.name}...`, activeConversationId);
        
        try {
            const base = apiConfig.chatService;
            await Promise.all(participants.map(async (to) => {
                console.log('📞 Sending call request to:', to);
                const response = await fetch(`${base}/call/start`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ fromUser: selfIdentifier, toUser: to, callType: 'VIDEO', roomId })
                });
                
                if (!response.ok) {
                    console.error('❌ Failed to start call:', response.status);
                } else {
                    const result = await response.json();
                    console.log('✅ Call request sent successfully:', result);
                }
            }));
        } catch (error) {
            console.error('❌ Error starting video call:', error);
            alert('Failed to start call. Please try again.');
            return;
        }
        
        // Don't auto-start - wait for recipient to accept
        setOverrideChannelId(roomId);
        setActiveTab('video');
        // Set a flag to show "calling" state instead of auto-starting
        setAutoStart(false);
        setPrefetchMedia(false);
        // Track outgoing call
        const callData = { roomId, callType: 'VIDEO', toUsers: participants };
        setOutgoingCall(callData);
        outgoingCallRef.current = callData;
    };

    // Start voice call
    const startVoiceCall = async () => {
        if (!activeConversationId) return;
        const conv = conversations.get(activeConversationId);
        if (!conv) return;
        
        const roomId = `call_${Date.now()}_${selfIdentifier}`;
        const participants = conv.participants.filter(p => p !== selfIdentifier);
        
        console.log('📞 Starting voice call:', { selfIdentifier, participants, roomId });
        
        // Show toast notification that call is being initiated
        showToastNotification('call', 'You', `Calling ${conv.name}...`, activeConversationId);
        
        try {
            const base = apiConfig.chatService;
            await Promise.all(participants.map(async (to) => {
                console.log('📞 Sending call request to:', to);
                const response = await fetch(`${base}/call/start`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ fromUser: selfIdentifier, toUser: to, callType: 'VOICE', roomId })
                });
                
                if (!response.ok) {
                    console.error('❌ Failed to start call:', response.status);
                } else {
                    const result = await response.json();
                    console.log('✅ Call request sent successfully:', result);
                }
            }));
        } catch (error) {
            console.error('❌ Error starting voice call:', error);
            alert('Failed to start call. Please try again.');
            return;
        }
        
        // Don't auto-start - wait for recipient to accept
        setOverrideChannelId(roomId);
        setActiveTab('voice');
        // Set a flag to show "calling" state instead of auto-starting
        setAutoStart(false);
        setPrefetchMedia(false);
        // Track outgoing call
        const callData = { roomId, callType: 'VOICE', toUsers: participants };
        setOutgoingCall(callData);
        outgoingCallRef.current = callData;
    };

    // Cancel outgoing call
    const cancelOutgoingCall = async () => {
        if (!outgoingCall) return;
        
        // Notify recipients that the call was cancelled
        try {
            const base = apiConfig.chatService;
            await Promise.all(outgoingCall.toUsers.map(async (to) => {
                await fetch(`${base}/call/decline`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        fromUser: selfIdentifier,
                        toUser: to,
                        callType: outgoingCall.callType,
                        roomId: outgoingCall.roomId
                    })
                });
            }));
        } catch (error) {
            console.error('Error cancelling call:', error);
        }
        
        // Clear outgoing call state
        setOutgoingCall(null);
        outgoingCallRef.current = null;
        setOverrideChannelId('');
        setActiveTab('chat');
        setAutoStart(false);
        setPrefetchMedia(false);
    };

    // Handle call end - redirect to chat
    const handleCallEnd = () => {
        setOutgoingCall(null);
        outgoingCallRef.current = null;
        setOverrideChannelId('');
        setActiveTab('chat');
        setAutoStart(false);
        setPrefetchMedia(false);
    };

    // Filter conversations by search
    const filteredConversations = useMemo(() => {
        const convArray = Array.from(conversations.values());
        if (!searchQuery.trim()) return convArray;
        const query = searchQuery.toLowerCase();
        return convArray.filter(conv => 
            conv.name.toLowerCase().includes(query) ||
            conv.participants.some(p => (nameMap[p] || p).toLowerCase().includes(query))
        );
    }, [conversations, searchQuery, nameMap]);

    return (
        <div className="h-screen flex flex-col bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold mb-1">Live Communication Hub</h1>
                        <p className="text-sm text-blue-100">Real-time collaboration and messaging</p>
                    </div>
                    <ConnectionStatus isConnected={isConnected} showLabel={true} />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                    {(activeTab === 'chat' || !activeTab) && (
                        <div className="flex w-full h-full">
                            {/* Sidebar */}
                            <div className="w-80 border-r border-gray-200 flex flex-col bg-white flex-shrink-0">
                                <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
                                    <div className="relative mb-2.5">
                                        <input
                                            type="text"
                                            placeholder="🔍 Search conversations..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowCreateGroupModal(true)}
                                        className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm"
                                    >
                                        ➕ Create Group
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto min-h-0">
                                    {filteredConversations.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No conversations yet
                                        </div>
                                    ) : (
                                        <>
                                            {/* Unread Section */}
                                            {filteredConversations.filter(c => (unreadCounts.get(c.id) || 0) > 0).length > 0 && (
                                                <>
                                                    <div className="px-3 py-2 bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200 sticky top-0 z-10">
                                                        <p className="text-xs font-bold text-red-700 uppercase tracking-wide">🔴 Unread Messages</p>
                                                    </div>
                                                    {filteredConversations
                                                        .filter(c => (unreadCounts.get(c.id) || 0) > 0)
                                                        .sort((a, b) => {
                                                            const timeA = a.lastMessageTime || new Date(0);
                                                            const timeB = b.lastMessageTime || new Date(0);
                                                            return timeB - timeA;
                                                        })
                                                        .map(conv => {
                                                            const unreadCount = unreadCounts.get(conv.id) || 0;
                                                            const isActive = conv.id === activeConversationId;
                                                
                                                return (
                                                    <div
                                                        key={conv.id}
                                                        onClick={() => selectConversation(conv.id)}
                                                        className={`px-3 py-2.5 border-b border-gray-200 cursor-pointer transition-all duration-150 relative ${
                                                            isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : unreadCount > 0 ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {/* Unread Indicator Dot */}
                                                        {unreadCount > 0 && !isActive && (
                                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r"></div>
                                                        )}
                                                        
                                                        <div className="flex items-center gap-2.5">
                                                            {/* Avatar */}
                                                            <div className="flex-shrink-0 relative">
                                                                <Avatar name={conv.name} size={40} />
                                                                {/* Unread Dot on Avatar */}
                                                                {unreadCount > 0 && (
                                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                    <h3 className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                                                                        {conv.name}
                                                                    </h3>
                                                                    {conv.lastMessageTime && (
                                                                        <span className={`text-xs flex-shrink-0 whitespace-nowrap ${unreadCount > 0 ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                                                                            {getRelativeTime(conv.lastMessageTime)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-xs truncate ${unreadCount > 0 ? 'font-semibold text-gray-800 bg-blue-50 px-1 py-0.5 rounded' : 'text-gray-600'}`}>
                                                                    {conv.lastMessage ? conv.lastMessage.substring(0, 50) + (conv.lastMessage.length > 50 ? '...' : '') : '💬 No messages yet'}
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Unread Badge */}
                                                            {unreadCount > 0 && (
                                                                <div className="flex-shrink-0">
                                                                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full shadow-md">
                                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                        })}
                                </>
                            )}
                            
                            {/* Read Section */}
                            {filteredConversations.filter(c => (unreadCounts.get(c.id) || 0) === 0).length > 0 && (
                                <>
                                    {filteredConversations.filter(c => (unreadCounts.get(c.id) || 0) > 0).length > 0 && (
                                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-12 z-10">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">💬 All Messages</p>
                                        </div>
                                    )}
                                    {filteredConversations
                                        .filter(c => (unreadCounts.get(c.id) || 0) === 0)
                                        .sort((a, b) => {
                                            const timeA = a.lastMessageTime || new Date(0);
                                            const timeB = b.lastMessageTime || new Date(0);
                                            return timeB - timeA;
                                        })
                                        .map(conv => {
                                            const isActive = conv.id === activeConversationId;
                                            return (
                                                <div
                                                    key={conv.id}
                                                    onClick={() => selectConversation(conv.id)}
                                                    className={`px-3 py-2.5 border-b border-gray-200 cursor-pointer transition-all duration-150 relative ${
                                                        isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        {/* Avatar */}
                                                        <div className="flex-shrink-0 relative">
                                                            <Avatar name={conv.name} size={40} />
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                <h3 className="text-sm truncate font-medium text-gray-800">
                                                                    {conv.name}
                                                                </h3>
                                                                {conv.lastMessageTime && (
                                                                    <span className="text-xs flex-shrink-0 whitespace-nowrap text-gray-500">
                                                                        {getRelativeTime(conv.lastMessageTime)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs truncate text-gray-600">
                                                                {conv.lastMessage ? conv.lastMessage.substring(0, 50) + (conv.lastMessage.length > 50 ? '...' : '') : '💬 No messages yet'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </>
                            )}
                        </>
                    )}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 flex flex-col min-w-0 bg-white">
                                {activeConversationId ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="px-4 py-2.5 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <Avatar name={conversations.get(activeConversationId)?.name || 'Chat'} size={36} />
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-sm font-bold text-gray-900 truncate">
                                                        {conversations.get(activeConversationId)?.name || 'Chat'}
                                                    </h2>
                                                    <p className="text-xs text-gray-500">
                                                        {conversations.get(activeConversationId)?.type === 'group' 
                                                            ? `👥 ${conversations.get(activeConversationId)?.participants.length} members`
                                                            : '💬 Direct message'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={startVideoCall}
                                                    className="p-3 hover:bg-blue-50 rounded-full transition-all hover:scale-110 text-xl"
                                                    title="Start video call"
                                                >
                                                    📹
                                                </button>
                                                <button
                                                    onClick={startVoiceCall}
                                                    className="p-3 hover:bg-green-50 rounded-full transition-all hover:scale-110 text-xl"
                                                    title="Start voice call"
                                                >
                                                    📞
                                                </button>
                                                {conversations.get(activeConversationId)?.type === 'group' && (
                                                    <button
                                                        onClick={() => setShowGroupInfoModal(true)}
                                                        className="p-3 hover:bg-purple-50 rounded-full transition-all hover:scale-110 text-xl"
                                                        title="Group info"
                                                    >
                                                        ℹ️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Chat Window */}
                                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                            <ChatWindow 
                                                channelId={activeConversationId}
                                                selfName={userName}
                                                selfIdentifier={selfIdentifier}
                                                onNewMessage={handleNewMessage}
                                                groupMembers={conversations.get(activeConversationId)?.participants || []}
                                                nameMap={nameMap}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">💬</div>
                                            <p className="text-lg">Select a conversation to start chatting</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'video' && (
                        <div className="flex w-full h-full min-h-0">
                            <div className="flex-1 flex flex-col h-full min-h-0">
                                <JitsiVideoCall
                                    channelId={overrideChannelId || activeConversationId || ''}
                                    userId={selfIdentifier}
                                    userName={userName}
                                    autoStart={autoStart}
                                    prefetchMedia={prefetchMedia}
                                    onCancel={cancelOutgoingCall}
                                    onCallEnd={handleCallEnd}
                                />
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'voice' && (
                        <div className="flex w-full h-full min-h-0">
                            <div className="flex-1 flex flex-col h-full min-h-0">
                                <VoiceCallComponent
                                    channelId={overrideChannelId || activeConversationId || ''}
                                    userId={selfIdentifier}
                                    userName={userName}
                                    autoStart={autoStart}
                                    prefetchMedia={prefetchMedia}
                                    onCancel={cancelOutgoingCall}
                                    onCallEnd={handleCallEnd}
                                />
                            </div>
                        </div>
                    )}
            </div>
            
            {/* Toast Notifications */}
            {notifications.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2">
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => {
                                if (notif.conversationId) {
                                    selectConversation(notif.conversationId);
                                }
                                setNotifications(prev => prev.filter(n => n.id !== notif.id));
                            }}
                            className={`p-3 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 animate-in fade-in slide-in-from-right ${
                                notif.type === 'call' 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                            } text-white max-w-xs`}
                        >
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-lg">{notif.type === 'call' ? '📞' : '💬'}</span>
                                <div className="font-semibold text-sm">{notif.fromDisplayName}</div>
                            </div>
                            <div className="text-xs opacity-90 pl-6">{notif.content}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateGroupModal && (
                <CreateGroupModal
                    isOpen={showCreateGroupModal}
                    onClose={() => setShowCreateGroupModal(false)}
                    onCreateGroup={handleCreateGroup}
                    availableUsers={directory.filter(email => email !== selfIdentifier)}
                    displayNames={nameMap}
                />
            )}

            {/* Group Info Modal */}
            {showGroupInfoModal && activeConversationId && conversations.get(activeConversationId)?.type === 'group' ? (
                <GroupInfoModal
                    isOpen={showGroupInfoModal}
                    onClose={() => setShowGroupInfoModal(false)}
                    groupId={conversations.get(activeConversationId)?.groupId || activeConversationId}
                    groupName={conversations.get(activeConversationId)?.name || ''}
                    members={conversations.get(activeConversationId)?.participants || []}
                    createdBy={conversations.get(activeConversationId)?.createdBy || ''}
                    createdAt={conversations.get(activeConversationId)?.createdAt || null}
                    currentUser={selfIdentifier}
                    allUsers={directory}
                    onGroupLeft={(groupId) => {
                        // Remove group from conversations
                        const newConvs = new Map(conversations);
                        newConvs.delete(groupId);
                        setConversations(newConvs);
                        
                        // Remove from localStorage
                        try {
                            const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                            delete storedGroups[groupId];
                            localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                        } catch (e) {
                            console.error('Error updating localStorage:', e);
                        }
                        
                        setActiveConversationId(null);
                    }}
                    onGroupDeleted={(groupId) => {
                        // Remove group from conversations
                        const newConvs = new Map(conversations);
                        newConvs.delete(groupId);
                        setConversations(newConvs);
                        
                        // Remove from localStorage
                        try {
                            const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                            delete storedGroups[groupId];
                            localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                        } catch (e) {
                            console.error('Error updating localStorage:', e);
                        }
                        
                        setActiveConversationId(null);
                    }}
                />
            ) : null}

            {/* Incoming Call Modal */}
            {incoming && (
                <IncomingCallModal
                    isOpen={true}
                    onClose={() => setIncoming(null)}
                    callerName={nameMap[incoming.fromUser] || incoming.fromUser}
                    callType={incoming.callType}
                    onAccept={async () => {
                        // Notify the caller that we accepted
                        try {
                            const base = apiConfig.chatService;
                            console.log('📞 Accepting call, sending to:', `${base}/call/accept`);
                            const response = await fetch(`${base}/call/accept`, {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify({
                                    fromUser: incoming.fromUser,
                                    toUser: selfIdentifier,
                                    callType: incoming.callType,
                                    roomId: incoming.roomId
                                })
                            });
                            
                            if (!response.ok) {
                                console.error('❌ Failed to accept call via REST, trying WebSocket fallback:', response.status);
                                // Fallback: Send notification directly via WebSocket
                                const persistentWebSocketService = (await import('../../services/PersistentWebSocketService')).default;
                                if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
                                    const callAccepted = {
                                        type: 'call-accepted',
                                        roomId: incoming.roomId,
                                        fromUser: selfIdentifier, // The person who accepted
                                        toUser: incoming.fromUser, // The original caller
                                        callType: incoming.callType,
                                        timestamp: Date.now()
                                    };
                                    const fromUserLower = incoming.fromUser.toLowerCase();
                                    // Send to all the same topics the backend would use
                                    persistentWebSocketService.client.publish({
                                        destination: `/topic/user-notifications.${fromUserLower}`,
                                        body: JSON.stringify(callAccepted)
                                    });
                                    persistentWebSocketService.client.publish({
                                        destination: `/topic/notify.${fromUserLower}`,
                                        body: JSON.stringify(callAccepted)
                                    });
                                    console.log('✅ Sent call-accepted notification via WebSocket fallback');
                                } else {
                                    console.error('❌ WebSocket not available for fallback');
                                }
                            } else {
                                const result = await response.json();
                                console.log('✅ Call accept response:', result);
                            }
                        } catch (error) {
                            console.error('Error accepting call:', error);
                            // Try WebSocket fallback even on network errors
                            try {
                                const persistentWebSocketService = (await import('../../services/PersistentWebSocketService')).default;
                                if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
                                    const callAccepted = {
                                        type: 'call-accepted',
                                        roomId: incoming.roomId,
                                        fromUser: selfIdentifier,
                                        toUser: incoming.fromUser,
                                        callType: incoming.callType,
                                        timestamp: Date.now()
                                    };
                                    const fromUserLower = incoming.fromUser.toLowerCase();
                                    persistentWebSocketService.client.publish({
                                        destination: `/topic/user-notifications.${fromUserLower}`,
                                        body: JSON.stringify(callAccepted)
                                    });
                                    persistentWebSocketService.client.publish({
                                        destination: `/topic/notify.${fromUserLower}`,
                                        body: JSON.stringify(callAccepted)
                                    });
                                    console.log('✅ Sent call-accepted notification via WebSocket fallback (after error)');
                                }
                            } catch (wsError) {
                                console.error('❌ WebSocket fallback also failed:', wsError);
                            }
                        }
                        
                        setOverrideChannelId(incoming.roomId);
                        setActiveTab(incoming.callType === 'VOICE' ? 'voice' : 'video');
                        setAutoStart(true);
                        setPrefetchMedia(true);
                        setIncoming(null);
                    }}
                    onDecline={async () => {
                        // Notify the caller that we declined
                        try {
                            const base = apiConfig.chatService;
                            await fetch(`${base}/call/decline`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                    fromUser: incoming.fromUser,
                                    toUser: selfIdentifier,
                                    callType: incoming.callType,
                                    roomId: incoming.roomId
                                })
                            });
                        } catch (error) {
                            console.error('Error declining call:', error);
                        }
                        setIncoming(null);
                    }}
                />
            )}
        </div>
    );
};

// Create Group Modal Component
const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, availableUsers, displayNames }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredUsers = availableUsers.filter(email =>
        (displayNames[email] || email).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMember = (email) => {
        setSelectedMembers(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const handleCreate = () => {
        if (groupName.trim() && selectedMembers.length >= 2) {
            onCreateGroup(groupName.trim(), selectedMembers);
            setGroupName('');
            setSelectedMembers([]);
            setSearchQuery('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl transform transition-all">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create Group Chat</h2>
                
                <input
                    type="text"
                    placeholder="✏️ Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    maxLength={50}
                />

                <input
                    type="text"
                    placeholder="🔍 Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />

                {selectedMembers.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                        {selectedMembers.map(email => (
                            <span
                                key={email}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all"
                            >
                                {displayNames[email] || email}
                                <button
                                    onClick={() => toggleMember(email)}
                                    className="hover:bg-white hover:bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center transition-all"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto border rounded-lg mb-4">
                    {filteredUsers.map(email => (
                        <div
                            key={email}
                            onClick={() => toggleMember(email)}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                                selectedMembers.includes(email) ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{displayNames[email] || email}</div>
                                    <div className="text-xs text-gray-500">{email}</div>
                                </div>
                                {selectedMembers.includes(email) && (
                                    <span className="text-blue-600">✓</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedMembers.length < 2}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        ✨ Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnhancedLiveCommunicationHub;
