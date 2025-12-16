import React, { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Enhanced WhatsApp-like Chat Window with all features
const EnhancedChatWindow = ({ channelId, selfName, selfIdentifier, onNewMessage }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [replyTo, setReplyTo] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMessageInfo, setShowMessageInfo] = useState(null);
    
    const fileInputRef = useRef(null);
    const stompRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    // Support both prefixed IDs (GROUP_x) and raw UUIDs (no prefix)
    const normalizedChannelId = channelId || '';
    const isDm = normalizedChannelId.startsWith('DM_');
    const isGroup = normalizedChannelId.startsWith('GROUP_') || (!isDm && !!normalizedChannelId);
    const dmRoom = isDm ? normalizedChannelId.replace(/^DM_/, '') : '';
    const groupId = isGroup ? normalizedChannelId.replace(/^GROUP_/, '') : '';
    
    const normalizedSelfIdentifier = (selfIdentifier || selfName || '').trim().toLowerCase();
    const senderDisplayName = selfName || 'User';

    // Format date for separators
    const formatDateSeparator = (date) => {
        const today = new Date();
        const msgDate = new Date(date);
        const diffDays = Math.floor((today - msgDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'TODAY';
        if (diffDays === 1) return 'YESTERDAY';
        if (diffDays < 7) return msgDate.toLocaleDateString('en-US', { weekday: 'long' });
        return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Group messages by date and sender
    const groupMessages = (msgs) => {
        const grouped = [];
        let lastDate = null;
        let lastSender = null;
        let lastTime = null;
        let currentGroup = [];

        msgs.forEach((msg, idx) => {
            const msgDate = new Date(msg.sentAt).toDateString();
            const msgTime = new Date(msg.sentAt).getTime();
            const sender = msg.senderName;

            // Add date separator
            if (msgDate !== lastDate) {
                if (currentGroup.length > 0) {
                    grouped.push({ type: 'group', messages: currentGroup });
                    currentGroup = [];
                }
                grouped.push({ type: 'date', date: msg.sentAt });
                lastDate = msgDate;
                lastSender = null;
            }

            // Check if we should start a new group
            const timeDiff = lastTime ? (msgTime - lastTime) / 1000 / 60 : 999; // minutes
            if (sender !== lastSender || timeDiff > 5) {
                if (currentGroup.length > 0) {
                    grouped.push({ type: 'group', messages: currentGroup });
                }
                currentGroup = [msg];
            } else {
                currentGroup.push(msg);
            }

            lastSender = sender;
            lastTime = msgTime;

            // Last message
            if (idx === msgs.length - 1 && currentGroup.length > 0) {
                grouped.push({ type: 'group', messages: currentGroup });
            }
        });

        return grouped;
    };

    // WebSocket setup
    useEffect(() => {
        const socket = new SockJS('http://localhost:8085/ws');
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 2000 });

        client.onConnect = () => {
            // Subscribe to messages
            if (isDm && dmRoom) {
                client.subscribe(`/queue/dm.${dmRoom}`, frame => {
                    try {
                        const newMsg = JSON.parse(frame.body || '{}');
                        setMessages(prev => [...prev, newMsg]);
                        
                        // Send delivered receipt
                        if (newMsg.senderName !== normalizedSelfIdentifier) {
                            client.publish({
                                destination: '/app/message.delivered',
                                body: JSON.stringify({
                                    messageId: newMsg.id,
                                    messageType: 'DIRECT',
                                    userId: normalizedSelfIdentifier,
                                    senderId: newMsg.senderName
                                })
                            });
                            
                            if (onNewMessage) onNewMessage(newMsg);
                            if (!document.hasFocus()) setUnreadCount(c => c + 1);
                        }
                    } catch {}
                }, { id: `dm-${dmRoom}` });
            }
            
            if (isGroup && groupId) {
                client.subscribe(`/topic/group.${groupId}`, frame => {
                    try {
                        const newMsg = JSON.parse(frame.body || '{}');
                        setMessages(prev => [...prev, newMsg]);
                        
                        if (newMsg.senderName !== selfName) {
                            client.publish({
                                destination: '/app/message.delivered',
                                body: JSON.stringify({
                                    messageId: newMsg.id,
                                    messageType: 'GROUP',
                                    userId: normalizedSelfIdentifier,
                                    senderId: newMsg.senderName
                                })
                            });
                            
                            if (onNewMessage) onNewMessage(newMsg);
                            if (!document.hasFocus()) setUnreadCount(c => c + 1);
                        }
                    } catch {}
                }, { id: `grp-${groupId}` });
            }

            // Subscribe to typing indicators
            const roomForTyping = isDm ? dmRoom : groupId;
            if (roomForTyping) {
                client.subscribe(`/topic/typing.${roomForTyping}`, frame => {
                    try {
                        const event = JSON.parse(frame.body || '{}');
                        if (event.userId !== normalizedSelfIdentifier) {
                            setTypingUsers(prev => {
                                const newSet = new Set(prev);
                                if (event.typing) {
                                    newSet.add(event.userName);
                                } else {
                                    newSet.delete(event.userName);
                                }
                                return newSet;
                            });
                        }
                    } catch {}
                });
            }

            // Subscribe to presence updates
            client.subscribe('/topic/presence', frame => {
                try {
                    const presence = JSON.parse(frame.body || '{}');
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        if (presence.status === 'ONLINE') {
                            newSet.add(presence.userId);
                        } else {
                            newSet.delete(presence.userId);
                        }
                        return newSet;
                    });
                } catch {}
            });

            // Subscribe to status updates
            client.subscribe(`/user/${normalizedSelfIdentifier}/queue/status`, frame => {
                try {
                    const statusUpdate = JSON.parse(frame.body || '{}');
                    setMessages(prev => prev.map(msg => 
                        msg.id === statusUpdate.messageId 
                            ? { ...msg, status: statusUpdate.status }
                            : msg
                    ));
                } catch {}
            });
        };

        client.onStompError = f => console.error('STOMP error', f);
        client.onWebSocketError = e => console.error('WS error', e);

        client.activate();
        stompRef.current = client;

        // Load message history
        (async () => {
            try {
                if (isDm && dmRoom) {
                    const [userA, userB] = dmRoom.split('|');
                    const res = await fetch(`http://localhost:8085/api/direct/history?userA=${userA}&userB=${userB}`, { credentials: 'include' });
                    const data = await res.json();
                    setMessages(Array.isArray(data) ? data : []);
                } else if (isGroup && groupId) {
                    const res = await fetch(`http://localhost:8085/api/group/${groupId}/history`, { credentials: 'include' });
                    const data = await res.json();
                    setMessages(Array.isArray(data) ? data : []);
                }
            } catch {}
        })();

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
            fetch('http://localhost:8085/api/presence/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: normalizedSelfIdentifier,
                    displayName: senderDisplayName
                }),
                credentials: 'include'
            }).catch(() => {});
        }, 30000);

        return () => {
            client.deactivate();
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, [channelId, dmRoom, groupId, isDm, isGroup, normalizedSelfIdentifier, senderDisplayName, selfName, onNewMessage]);

    // Mark messages as read when window is focused
    useEffect(() => {
        const handleFocus = () => {
            setUnreadCount(0);
            messages.forEach(msg => {
                if (msg.senderName !== normalizedSelfIdentifier && msg.status !== 'READ') {
                    stompRef.current?.publish({
                        destination: '/app/message.read',
                        body: JSON.stringify({
                            messageId: msg.id,
                            messageType: isGroup ? 'GROUP' : 'DIRECT',
                            userId: normalizedSelfIdentifier,
                            senderId: msg.senderName
                        })
                    });
                }
            });
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [messages, normalizedSelfIdentifier, isGroup]);

    // Auto-scroll logic
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowScrollButton(false);
        } else {
            setShowScrollButton(true);
        }
    }, [messages]);

    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        setShowScrollButton(!isNearBottom);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
        setUnreadCount(0);
    };

    // Typing indicator with debounce
    const handleTyping = (e) => {
        setText(e.target.value);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing start
        const roomForTyping = isDm ? dmRoom : groupId;
        stompRef.current?.publish({
            destination: '/app/typing',
            body: JSON.stringify({
                roomId: roomForTyping,
                userId: normalizedSelfIdentifier,
                userName: senderDisplayName,
                typing: true
            })
        });

        // Send typing stop after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
            stompRef.current?.publish({
                destination: '/app/typing',
                body: JSON.stringify({
                    roomId: roomForTyping,
                    userId: normalizedSelfIdentifier,
                    userName: senderDisplayName,
                    typing: false
                })
            });
        }, 2000);
    };

    const send = () => {
        const content = (text || '').trim();
        if (!content && !uploading) return;

        const payload = {
            content,
            replyToId: replyTo?.id,
            replyToContent: replyTo?.content?.substring(0, 200),
            replyToSender: replyTo?.senderName
        };

        if (isDm && dmRoom) {
            const [userA, userB] = dmRoom.split('|');
            const recipientLower = normalizedSelfIdentifier === userA ? userB : userA;
            
            stompRef.current?.publish({
                destination: '/app/dm.send',
                body: JSON.stringify({
                    roomId: dmRoom,
                    senderName: normalizedSelfIdentifier,
                    recipientName: recipientLower,
                    ...payload
                })
            });
        } else if (isGroup && groupId) {
            stompRef.current?.publish({
                destination: '/app/group.send',
                body: JSON.stringify({
                    groupId,
                    senderName: senderDisplayName,
                    ...payload
                })
            });
        }

        setText('');
        setReplyTo(null);
    };

    // Continue in next part...
