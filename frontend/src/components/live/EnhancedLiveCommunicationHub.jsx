import React, { useEffect, useMemo, useState, useCallback } from 'react';
import VideoCallComponent from '../common/VideoCallComponent';
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
            } catch (e) {
                console.error("Error fetching user directory:", e);
            }
        };
        load();
    }, [selfIdentifier, userName]);

    // Read channelId from URL and set active conversation
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const channelIdFromUrl = urlParams.get('channelId');
        if (channelIdFromUrl) {
            console.log('🔔 URL channelId found:', channelIdFromUrl);
            console.log('🔔 Available conversations:', Array.from(conversations.keys()));
            
            // Check if conversation exists
            if (conversations.has(channelIdFromUrl)) {
                console.log('🔔 Conversation found, setting as active:', channelIdFromUrl);
                setActiveConversationId(channelIdFromUrl);
                setActiveTab('chat');
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
                }
            }
        }
    }, [conversations, selfIdentifier, nameMap]);

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
                newCounts.set(channelId, (newCounts.get(channelId) || 0) + 1);
                return newCounts;
            });
            
            // Show notifications
            const from = message.senderName || message.fromUser || 'Someone';
            const displayName = nameMap[from] || from;
            showBrowserNotification(displayName, message.content || 'New message', channelId);
            showToastNotification('message', from, message.content || 'New message', channelId);
        }
    }, [activeConversationId, nameMap, showBrowserNotification, showToastNotification]);

    // Select conversation
    const selectConversation = useCallback((conversationId) => {
        setActiveConversationId(conversationId);
        setActiveTab('chat');
        // Clear unread count
        setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            newCounts.delete(conversationId);
            return newCounts;
        });
    }, []);

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
            
            console.log('✅ Group created successfully:', groupId);
        } catch (e) {
            console.error('❌ Error creating group:', e);
            alert('Failed to create group. Please try again.');
        }
    }, [selfIdentifier, userName]);

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
                });
                
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
    }, [selfIdentifier]);

    // Handle WebSocket messages
    const handleWebSocketMessage = useCallback((payload) => {
        console.log('📨 Handling WebSocket message:', payload);
        
        if (payload.type === 'incoming_call') {
            setIncoming({ fromUser: payload.fromUser, callType: (payload.callType || 'VIDEO').toUpperCase(), roomId: payload.roomId });
            showToastNotification('call', payload.fromUser, `Incoming ${payload.callType} call`, '');
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
        }
    }, [selfIdentifier, activeConversationId, showToastNotification]);

    // Start video call
    const startVideoCall = async () => {
        if (!activeConversationId) return;
        const conv = conversations.get(activeConversationId);
        if (!conv) return;
        
        const roomId = `call_${Date.now()}_${selfIdentifier}`;
        const participants = conv.participants.filter(p => p !== selfIdentifier);
        
        try {
            const base = apiConfig.chatService;
            await Promise.all(participants.map(async (to) => {
                await fetch(`${base}/call/start`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fromUser: selfIdentifier, toUser: to, callType: 'VIDEO', roomId })
                });
            }));
        } catch {}
        
        setOverrideChannelId(roomId);
        setActiveTab('video');
        setTimeout(() => setAutoStart(true), 0);
    };

    // Start voice call
    const startVoiceCall = async () => {
        if (!activeConversationId) return;
        const conv = conversations.get(activeConversationId);
        if (!conv) return;
        
        const roomId = `call_${Date.now()}_${selfIdentifier}`;
        const participants = conv.participants.filter(p => p !== selfIdentifier);
        
        try {
            const base = apiConfig.chatService;
            await Promise.all(participants.map(async (to) => {
                await fetch(`${base}/call/start`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fromUser: selfIdentifier, toUser: to, callType: 'VOICE', roomId })
                });
            }));
        } catch {}
        
        setOverrideChannelId(roomId);
        setActiveTab('voice');
        setTimeout(() => setAutoStart(true), 0);
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
                                                                        <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                                                                            {getRelativeTime(conv.lastMessageTime)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className={`text-xs truncate ${unreadCount > 0 ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                                                                    {conv.lastMessage || '💬 Start a conversation'}
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
                                            })
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

            {/* Incoming Call Popup */}
            {incoming && (
                <div className="fixed bottom-6 right-6 bg-white shadow-2xl border-2 border-green-500 rounded-lg p-6 w-80 animate-bounce">
                    <div className="font-semibold text-lg mb-1">Incoming {incoming.callType === 'VOICE' ? 'Voice' : 'Video'} Call</div>
                    <div className="text-sm text-gray-600 mb-4">From: {nameMap[incoming.fromUser] || incoming.fromUser}</div>
                    <div className="flex justify-end gap-2">
                        <button 
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100" 
                            onClick={() => setIncoming(null)}
                        >
                            Decline
                        </button>
                        <button 
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" 
                            onClick={() => {
                                setOverrideChannelId(incoming.roomId);
                                setActiveTab(incoming.callType === 'VOICE' ? 'voice' : 'video');
                                setAutoStart(false);
                                setPrefetchMedia(true);
                                setIncoming(null);
                            }}
                        >
                            Accept
                        </button>
                    </div>
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
            {showGroupInfoModal && activeConversationId && conversations.get(activeConversationId)?.type === 'group' && (
                <GroupInfoModal
                    isOpen={showGroupInfoModal}
                    onClose={() => setShowGroupInfoModal(false)}
                    groupId={conversations.get(activeConversationId)?.groupId || activeConversationId}
                    groupName={conversations.get(activeConversationId)?.name || ''}
                    members={conversations.get(activeConversationId)?.participants || []}
                    createdBy={conversations.get(activeConversationId)?.createdBy || ''}
                    createdAt={conversations.get(activeConversationId)?.createdAt || null}
                    currentUser={selfIdentifier}
                    onGroupLeft={(groupId) => {
                        // Remove group from conversations
                        const newConvs = new Map(conversations);
                        newConvs.delete(activeConversationId);
                        setConversations(newConvs);
                        setActiveConversationId(null);
                    }}
                    onGroupDeleted={(groupId) => {
                        // Remove group from conversations
                        const newConvs = new Map(conversations);
                        newConvs.delete(activeConversationId);
                        setConversations(newConvs);
                        setActiveConversationId(null);
                    }}
                />
            )}

            {/* Incoming Call Modal */}
            {incoming && (
                <IncomingCallModal
                    isOpen={true}
                    onClose={() => setIncoming(null)}
                    callerName={nameMap[incoming.fromUser] || incoming.fromUser}
                    callType={incoming.callType}
                    onAccept={() => {
                        setOverrideChannelId(incoming.roomId);
                        setActiveTab(incoming.callType === 'VOICE' ? 'voice' : 'video');
                        setAutoStart(false);
                        setPrefetchMedia(true);
                    }}
                    onDecline={() => setIncoming(null)}
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
