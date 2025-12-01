import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ChatWindow from '../common/ChatWindow';
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

// Format relative time
const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return messageDate.toLocaleDateString();
};

const LiveCommunicationHub = () => {
    const [conversations, setConversations] = useState(new Map());
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState(new Map());
    const [notifications, setNotifications] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [nameMap, setNameMap] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const wsClientRef = React.useRef(null); // Store WebSocket client reference

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
                            lastMessage: 'Start a conversation',
                            lastMessageTime: null,
                            isOnline: false
                        });
                    });
                }

                if (selfIdentifier && !identifiers.includes(selfIdentifier)) {
                    identifiers.push(selfIdentifier);
                    names[selfIdentifier] = userName || selfIdentifier;
                }
                
                // Load groups from localStorage with last message info
                try {
                    const storedGroups = localStorage.getItem('chat_groups');
                    if (storedGroups) {
                        const groups = JSON.parse(storedGroups);
                        Object.entries(groups).forEach(([groupId, groupData]) => {
                            convs.set(groupId, {
                                id: groupId,
                                name: groupData.name,
                                type: 'group',
                                participants: groupData.members || [],
                                lastMessage: groupData.lastMessage || 'Start a conversation',
                                lastMessageTime: groupData.lastMessageTime ? new Date(groupData.lastMessageTime) : (groupData.createdAt ? new Date(groupData.createdAt) : null),
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
            } catch (e) {
                console.error("Error fetching user directory:", e);
            }
        };
        load();
    }, [selfIdentifier, userName]);

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
        
        setNotifications(prev => [...prev, newNotif]);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, [nameMap]);

    // Handle new message
    const handleNewMessage = useCallback((message) => {
        let channelId = message.channelId || message.roomId;
        
        // If it's a group message, ensure proper GROUP_ prefix
        if (message.groupId && !channelId) {
            channelId = `GROUP_${message.groupId}`;
        }
        
        if (!channelId) return;
        
        console.log('📬 Handling new message for channel:', channelId, message);
        
        // Update conversation last message
        setConversations(prev => {
            const newConvs = new Map(prev);
            let conv = newConvs.get(channelId);
            
            // If conversation doesn't exist yet (shouldn't happen but handle it)
            if (!conv && message.groupId) {
                console.log('⚠️ Creating conversation for unknown group:', channelId);
                conv = {
                    id: channelId,
                    name: 'New Group',
                    type: 'group',
                    participants: [],
                    lastMessage: message.content || '',
                    lastMessageTime: new Date(message.sentAt || Date.now()),
                    isOnline: false
                };
                newConvs.set(channelId, conv);
            } else if (conv) {
                // Update existing conversation
                conv.lastMessage = message.content || '';
                conv.lastMessageTime = new Date(message.sentAt || Date.now());
                newConvs.set(channelId, conv);
                console.log('✅ Updated conversation last message:', channelId, conv.lastMessage);
                
                // Save to localStorage if it's a group
                if (conv.type === 'group') {
                    try {
                        const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                        if (storedGroups[channelId]) {
                            storedGroups[channelId].lastMessage = conv.lastMessage;
                            storedGroups[channelId].lastMessageTime = conv.lastMessageTime.toISOString();
                            localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                            console.log('💾 Saved last message to localStorage for:', channelId);
                        }
                    } catch (e) {
                        console.error('Error saving last message to localStorage:', e);
                    }
                }
            }
            
            return newConvs;
        });
        
        // Increment unread if not active conversation
        if (channelId !== activeConversationId) {
            setUnreadCounts(prev => {
                const newCounts = new Map(prev);
                newCounts.set(channelId, (newCounts.get(channelId) || 0) + 1);
                return newCounts;
            });
            
            // Show notifications (skip system messages)
            if (message.senderName !== 'System') {
                const from = message.senderName || message.fromUser || 'Someone';
                const displayName = nameMap[from] || from;
                showBrowserNotification(displayName, message.content || 'New message', channelId);
                showToastNotification('message', from, message.content || 'New message', channelId);
            }
        }
    }, [activeConversationId, nameMap, showBrowserNotification, showToastNotification]);

    // Select conversation
    const selectConversation = useCallback((conversationId) => {
        setActiveConversationId(conversationId);
        // Clear unread count
        setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            newCounts.delete(conversationId);
            return newCounts;
        });
    }, []);

    // Create group with notifications to all members
    const handleCreateGroup = useCallback(async (groupName, members) => {
        try {
            console.log('📝 Creating group:', groupName, 'with members:', members);
            
            // Call backend API to create group
            const response = await fetch('http://localhost:8085/api/group/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: groupName,
                    createdByName: userName || selfIdentifier,
                    members: [...members, selfIdentifier] // Include self in members
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create group');
            }
            
            const result = await response.json();
            console.log('✅ Group created successfully:', result);
            
            // Use backend-generated group ID
            const groupId = `GROUP_${result.groupId}`;
            const newGroup = {
                id: groupId,
                name: result.name,
                type: 'group',
                participants: [...members, selfIdentifier],
                lastMessage: 'Group created',
                lastMessageTime: new Date(),
                isOnline: false
            };
            
            // Add to conversations
            setConversations(prev => {
                const newConvs = new Map(prev);
                newConvs.set(groupId, newGroup);
                return newConvs;
            });
            
            // Save to localStorage with initial last message
            try {
                const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                storedGroups[groupId] = {
                    name: result.name,
                    members: [...members, selfIdentifier],
                    createdAt: new Date().toISOString(),
                    lastMessage: 'Group created',
                    lastMessageTime: new Date().toISOString()
                };
                localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                console.log('✅ Group saved to localStorage');
            } catch (e) {
                console.error('Error saving group to localStorage:', e);
            }
            
            // Show success notification
            showToastNotification('message', 'System', `Group "${groupName}" created successfully!`, groupId);
            
            // Subscribe to the new group's messages if WebSocket is connected
            if (wsClientRef.current && wsClientRef.current.connected) {
                console.log('📡 Subscribing to new group messages:', result.groupId);
                wsClientRef.current.subscribe(`/topic/group.${result.groupId}`, frame => {
                    try {
                        const newMsg = JSON.parse(frame.body || '{}');
                        handleNewMessage({ ...newMsg, channelId: groupId });
                    } catch (e) {
                        console.error('Error handling group message:', e);
                    }
                });
            }
            
            // Close modal and switch to new group
            setShowCreateGroupModal(false);
            setActiveConversationId(groupId);
            
        } catch (e) {
            console.error('❌ Error creating group:', e);
            alert('Failed to create group. Please try again.');
        }
    }, [selfIdentifier, userName, showToastNotification, handleNewMessage]);

    // Subscribe for WebSocket notifications
    useEffect(() => {
        const socket = new SockJS(apiConfig.websocketUrl);
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });
        
        // Store client reference
        wsClientRef.current = client;
        
        client.onConnect = () => {
            console.log('🔌 WebSocket connected for user:', selfIdentifier);
            
            // ✅ Subscribe to user-specific notifications (NEW_GROUP, etc.)
            console.log('📡 Subscribing to: /user/' + selfIdentifier + '/queue/notify');
            client.subscribe(`/user/${selfIdentifier}/queue/notify`, frame => {
                try {
                    const payload = JSON.parse(frame.body || '{}');
                    console.log('📨 Received notification:', payload);
                    
                    if (payload.type === 'NEW_GROUP') {
                        console.log('👥 New group notification received:', payload);
                        
                        // Create group object with proper ID format
                        const groupId = `GROUP_${payload.groupId}`;
                        const newGroup = {
                            id: groupId,
                            name: payload.groupName,
                            type: 'group',
                            participants: payload.members || [],
                            lastMessage: payload.message || 'Group created',
                            lastMessageTime: new Date(),
                            isOnline: false
                        };
                        
                        // Add to conversations
                        setConversations(prev => {
                            const newConvs = new Map(prev);
                            if (!newConvs.has(groupId)) {
                                newConvs.set(groupId, newGroup);
                                console.log('✅ Group added to conversations:', groupId);
                            }
                            return newConvs;
                        });
                        
                        // Save to localStorage with initial last message
                        try {
                            const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                            if (!storedGroups[groupId]) {
                                storedGroups[groupId] = {
                                    name: payload.groupName,
                                    members: payload.members || [],
                                    createdAt: new Date().toISOString(),
                                    lastMessage: payload.message || 'Group created',
                                    lastMessageTime: new Date().toISOString()
                                };
                                localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                                console.log('✅ Group saved to localStorage:', groupId);
                            }
                        } catch (e) {
                            console.error('Error saving group to localStorage:', e);
                        }
                        
                        // Show notification
                        showBrowserNotification(payload.createdBy || 'Someone', payload.message, groupId);
                        showToastNotification('message', payload.createdBy || 'Someone', payload.message, groupId);
                        
                        // Subscribe to the new group's messages
                        client.subscribe(`/topic/group.${payload.groupId}`, frame => {
                            try {
                                const newMsg = JSON.parse(frame.body || '{}');
                                handleNewMessage({ ...newMsg, channelId: groupId });
                            } catch (e) {
                                console.error('Error handling group message:', e);
                            }
                        });
                    }
                } catch (e) {
                    console.error('Error handling notification:', e);
                }
            });
            
            // ✅ Fallback subscription to public topic
            console.log('📡 Subscribing to fallback: /topic/notify.' + selfIdentifier);
            client.subscribe(`/topic/notify.${selfIdentifier}`, frame => {
                try {
                    const payload = JSON.parse(frame.body || '{}');
                    console.log('📨 Received fallback notification:', payload);
                    
                    if (payload.type === 'NEW_GROUP') {
                        // Same handling as above
                        const groupId = `GROUP_${payload.groupId}`;
                        const newGroup = {
                            id: groupId,
                            name: payload.groupName,
                            type: 'group',
                            participants: payload.members || [],
                            lastMessage: payload.message || 'Group created',
                            lastMessageTime: new Date(),
                            isOnline: false
                        };
                        
                        setConversations(prev => {
                            const newConvs = new Map(prev);
                            if (!newConvs.has(groupId)) {
                                newConvs.set(groupId, newGroup);
                            }
                            return newConvs;
                        });
                        
                        try {
                            const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                            if (!storedGroups[groupId]) {
                                storedGroups[groupId] = {
                                    name: payload.groupName,
                                    members: payload.members || [],
                                    createdAt: new Date().toISOString(),
                                    lastMessage: payload.message || 'Group created',
                                    lastMessageTime: new Date().toISOString()
                                };
                                localStorage.setItem('chat_groups', JSON.stringify(storedGroups));
                            }
                        } catch (e) {}
                        
                        showBrowserNotification(payload.createdBy || 'Someone', payload.message, groupId);
                        showToastNotification('message', payload.createdBy || 'Someone', payload.message, groupId);
                        
                        client.subscribe(`/topic/group.${payload.groupId}`, frame => {
                            try {
                                const newMsg = JSON.parse(frame.body || '{}');
                                handleNewMessage({ ...newMsg, channelId: groupId });
                            } catch (e) {}
                        });
                    }
                } catch (e) {
                    console.error('Error handling fallback notification:', e);
                }
            });
            
            // Subscribe to DM messages
            directory.forEach(email => {
                const dmChannel = normalizeDmChannel(selfIdentifier, email);
                const dmRoom = dmChannel.replace('DM_', '');
                
                client.subscribe(`/queue/dm.${dmRoom}`, frame => {
                    try {
                        const newMsg = JSON.parse(frame.body || '{}');
                        handleNewMessage({ ...newMsg, channelId: dmChannel });
                    } catch {}
                });
            });
            
            // Subscribe to existing group messages from localStorage
            try {
                const storedGroups = JSON.parse(localStorage.getItem('chat_groups') || '{}');
                Object.keys(storedGroups).forEach(groupKey => {
                    const groupId = groupKey.replace('GROUP_', '');
                    console.log('📡 Subscribing to existing group:', groupId);
                    client.subscribe(`/topic/group.${groupId}`, frame => {
                        try {
                            const newMsg = JSON.parse(frame.body || '{}');
                            handleNewMessage({ ...newMsg, channelId: groupKey });
                        } catch (e) {
                            console.error('Error handling group message:', e);
                        }
                    });
                });
            } catch (e) {
                console.error('Error loading groups for subscription:', e);
            }
        };
        
        client.activate();
        return () => {
            wsClientRef.current = null;
            client.deactivate();
        };
    }, [selfIdentifier, directory, handleNewMessage, showToastNotification, showBrowserNotification]);

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

    // Start video call
    const startVideoCall = () => {
        if (!activeConversationId) return;
        alert('Video call feature - integrate with your video call component');
    };

    // Start voice call
    const startVoiceCall = () => {
        if (!activeConversationId) return;
        alert('Voice call feature - integrate with your voice call component');
    };

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
                <h1 className="text-2xl font-bold">Live Communication Hub</h1>
                <p className="text-sm text-blue-100">Real-time collaboration</p>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-300 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-300 bg-white">
                        <input
                            type="text"
                            placeholder="🔍 Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
                        >
                            ➕ Create Group
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No conversations yet
                            </div>
                        ) : (
                            filteredConversations
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
                                            className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                                                isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : unreadCount > 0 ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                                                        conv.type === 'group' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                                    }`}>
                                                        {conv.type === 'group' ? '👥' : conv.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`text-sm font-medium truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                            {conv.name}
                                                        </h3>
                                                        {conv.lastMessageTime && (
                                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                                {formatRelativeTime(conv.lastMessageTime)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs truncate ${unreadCount > 0 ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
                                                        {conv.lastMessage || '💬 Start a conversation'}
                                                    </p>
                                                </div>
                                                {unreadCount > 0 && (
                                                    <div className="flex-shrink-0">
                                                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-md">
                                                            {unreadCount > 9 ? '9+' : unreadCount}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {activeConversationId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-300 bg-gradient-to-r from-white to-gray-50 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                                        conversations.get(activeConversationId)?.type === 'group' 
                                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                    }`}>
                                        {conversations.get(activeConversationId)?.type === 'group' 
                                            ? '👥' 
                                            : conversations.get(activeConversationId)?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">
                                            {conversations.get(activeConversationId)?.name || 'Chat'}
                                        </h2>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
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
                            <div className="flex-1">
                                <ChatWindow 
                                    channelId={activeConversationId}
                                    selfName={userName}
                                    selfIdentifier={selfIdentifier}
                                    onNewMessage={handleNewMessage}
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

            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-50 space-y-3">
                {notifications.map(notif => (
                    <div
                        key={notif.id}
                        onClick={() => {
                            if (notif.conversationId) {
                                selectConversation(notif.conversationId);
                            }
                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                        }}
                        className={`p-4 rounded-xl shadow-2xl cursor-pointer transform transition-all duration-300 animate-slide-in hover:scale-105 ${
                            notif.type === 'call' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                        } text-white max-w-sm backdrop-blur-sm`}
                        style={{ animation: 'slide-in 0.3s ease-out' }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{notif.type === 'call' ? '📞' : '💬'}</span>
                            <div className="font-bold text-lg">{notif.fromDisplayName}</div>
                        </div>
                        <div className="text-sm opacity-95 pl-7">{notif.content}</div>
                    </div>
                ))}
            </div>

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
            {showGroupInfoModal && activeConversationId && conversations.get(activeConversationId)?.type === 'group' && (
                <GroupInfoModal
                    isOpen={showGroupInfoModal}
                    onClose={() => setShowGroupInfoModal(false)}
                    groupName={conversations.get(activeConversationId)?.name || ''}
                    members={conversations.get(activeConversationId)?.participants || []}
                    displayNames={nameMap}
                    onLeaveGroup={() => {
                        setConversations(prev => {
                            const newConvs = new Map(prev);
                            newConvs.delete(activeConversationId);
                            return newConvs;
                        });
                        setActiveConversationId(null);
                        setShowGroupInfoModal(false);
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
        if (groupName.trim() && selectedMembers.length >= 1) {
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
                        disabled={!groupName.trim() || selectedMembers.length < 1}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        ✨ Create
                    </button>
                </div>
            </div>
        </div>
    );
};

// Group Info Modal Component
const GroupInfoModal = ({ isOpen, onClose, groupName, members, displayNames, onLeaveGroup }) => {
    if (!isOpen) return null;

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Group Info</h2>
                
                <div className="mb-4">
                    <label className="text-sm text-gray-600">Group Name</label>
                    <div className="text-lg font-semibold">{groupName}</div>
                </div>

                <div className="mb-4">
                    <label className="text-sm text-gray-600 mb-2 block">Members ({members.length})</label>
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                        {members.map((email, idx) => (
                            <div key={email} className="p-3 border-b last:border-b-0 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${colors[idx % colors.length]} flex items-center justify-center text-white font-semibold`}>
                                    {(displayNames[email] || email).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium">{displayNames[email] || email}</div>
                                    <div className="text-xs text-gray-500">{email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
                    >
                        Close
                    </button>
                    <button
                        onClick={onLeaveGroup}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        Leave Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveCommunicationHub;
