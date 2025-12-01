import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Shared chat window for Admin and Manager
// Props:
// - channelId: "DM_alice@corp.com|bob@corp.com" or "GROUP_team"
// - selfName: viewer's displayName string (for UI bubble display)
// - selfIdentifier: viewer's unique ID/Email (for DM logic and routing)
// - onNewMessage: callback when new message arrives (optional)
const ChatWindow = ({ channelId, selfName, selfIdentifier, onNewMessage }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    const fileInputRef = useRef(null);
    const stompRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const isGroup = channelId?.startsWith('GROUP_');
    const isDm = channelId?.startsWith('DM_');
    const dmRoom = isDm ? channelId.replace(/^DM_/, '') : '';
    const groupId = isGroup ? channelId.replace(/^GROUP_/, '') : '';
    
    // Use the unique identifier in lowercase for comparison logic
    const normalizedSelfIdentifier = (selfIdentifier || selfName || '').trim().toLowerCase();
    // Use selfName for display purposes in the chat bubble
    const senderDisplayName = selfName || 'User';

    useEffect(() => {
        const socket = new SockJS('http://localhost:8085/ws');
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 2000 });

        client.onConnect = () => {
            if (isDm && dmRoom) {
                // Subscription path for DM message delivery: /queue/dm.alice@corp.com|bob@corp.com
                client.subscribe(`/queue/dm.${dmRoom}`, frame => {
                    try { 
                        const newMsg = JSON.parse(frame.body || '{}');
                        setMessages(prev => [...prev, newMsg]);
                        // Trigger callback if message is from someone else
                        if (onNewMessage && newMsg.senderName !== normalizedSelfIdentifier) {
                            onNewMessage(newMsg);
                        }
                    } catch {}
                }, { id: `dm-${dmRoom}` });
                
                // Subscribe to typing indicators for DM
                client.subscribe(`/topic/typing.${dmRoom}`, frame => {
                    try {
                        const event = JSON.parse(frame.body || '{}');
                        if (event.userId !== normalizedSelfIdentifier) {
                            setTypingUsers(prev => {
                                if (event.typing) {
                                    return prev.includes(event.userName) ? prev : [...prev, event.userName];
                                } else {
                                    return prev.filter(u => u !== event.userName);
                                }
                            });
                        }
                    } catch {}
                });
            }
            if (isGroup && groupId) {
                client.subscribe(`/topic/group.${groupId}`, frame => {
                    try { 
                        const newMsg = JSON.parse(frame.body || '{}');
                        setMessages(prev => [...prev, newMsg]);
                        // Trigger callback if message is from someone else
                        if (onNewMessage && newMsg.senderName !== selfName) {
                            onNewMessage(newMsg);
                        }
                    } catch {}
                }, { id: `grp-${groupId}` });
                
                // Subscribe to typing indicators for group
                client.subscribe(`/topic/typing.${groupId}`, frame => {
                    try {
                        const event = JSON.parse(frame.body || '{}');
                        if (event.userId !== normalizedSelfIdentifier) {
                            setTypingUsers(prev => {
                                if (event.typing) {
                                    return prev.includes(event.userName) ? prev : [...prev, event.userName];
                                } else {
                                    return prev.filter(u => u !== event.userName);
                                }
                            });
                        }
                    } catch {}
                });
            }
        };

        client.onStompError = f => console.error('STOMP error', f);
        client.onWebSocketError = e => console.error('WS error', e);

        client.activate();
        stompRef.current = client;

        (async () => {
            try {
                if (isDm && dmRoom) {
                    const [userA, userB] = dmRoom.split('|');
                    // Fetch history using the normalized unique identifiers
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

        return () => client.deactivate();
    }, [channelId, dmRoom, groupId, isDm, isGroup, normalizedSelfIdentifier]);

    const send = () => {
        const content = (text || '').trim();
        if (!content && !uploading) return;

        if (isDm && dmRoom) {
            const [userA, userB] = dmRoom.split('|');
            
            // CRITICAL FIX: Use the unique identifier for comparison to determine the recipient's identifier
            const recipientLower = normalizedSelfIdentifier === userA ? userB : userA;
            
            // FIX: senderName and recipientName are both set to the unique EMAIL/ID for backend routing
            const payload = { 
                roomId: dmRoom, 
                senderName: normalizedSelfIdentifier, // Send SENDER'S EMAIL as the routing ID
                recipientName: recipientLower,       // Send RECIPIENT'S EMAIL as the routing ID
                content 
            };
            
            stompRef.current?.publish({ destination: '/app/dm.send', body: JSON.stringify(payload) });
        } else if (isGroup && groupId) {
            const payload = { groupId, senderName: senderDisplayName, content };
            stompRef.current?.publish({ destination: '/app/group.send', body: JSON.stringify(payload) });
        }
        setText('');
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // File validation
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
                              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                              'text/plain'];
        
        if (file.size > maxSize) {
            alert('File size must be less than 10MB');
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            alert('File type not allowed. Please upload images, PDFs, or documents.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('content', text.trim() || '');
            
            let endpoint;
            if (isGroup) {
                formData.append('groupId', groupId);
                formData.append('senderName', senderDisplayName);
                endpoint = 'http://localhost:8085/api/group/upload-file';
            } else if (isDm) {
                const [userA, userB] = dmRoom.split('|');
                const recipientEmail = normalizedSelfIdentifier === userA ? userB : userA;
                formData.append('senderName', normalizedSelfIdentifier);
                formData.append('recipientName', recipientEmail);
                endpoint = 'http://localhost:8085/api/direct/upload-file';
            }

            // Simulate progress for better UX (real progress requires XMLHttpRequest)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            if (response.ok) {
                setText('');
                setTimeout(() => setUploadProgress(0), 500);
                // Message will be received via WebSocket
            } else {
                const errorText = await response.text();
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch {
                    error = { error: errorText || `HTTP ${response.status}: ${response.statusText}` };
                }
                alert('Failed to upload file: ' + (error.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Failed to upload file: ' + (err.message || 'Please try again.'));
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Helper function to format relative time
    const getRelativeTime = (timestamp) => {
        if (!timestamp) return '';
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffMs = now - messageTime;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return messageTime.toLocaleDateString();
    };

    // Local viewer: mine on right, others on left
    const Bubble = ({ m }) => {
        // We rely on the stored senderName (which is now the email) for styling comparison
        // Also check against selfName for backward compatibility
        const senderLower = (m.senderName || '').trim().toLowerCase();
        const selfNameLower = (selfName || '').trim().toLowerCase();
        const mine = senderLower === normalizedSelfIdentifier || senderLower === selfNameLower || m.senderName === selfName;
        const align = mine ? 'justify-end' : 'justify-start';
        const style = mine ? 'bg-green-500 text-white' : 'bg-white text-gray-800 border border-gray-200';
        const isImage = m.fileType && m.fileType.startsWith('image/');
        const hasFile = m.fileUrl && m.fileName;
        
        // Message status icons (WhatsApp-style)
        const getStatusIcon = () => {
            if (!mine) return null;
            const status = m.status || 'SENT';
            if (status === 'READ') return <span className="text-blue-300 text-xs ml-1">✓✓</span>;
            if (status === 'DELIVERED') return <span className="text-gray-300 text-xs ml-1">✓✓</span>;
            return <span className="text-gray-300 text-xs ml-1">✓</span>;
        };
        
        return (
            <div className={`flex ${align} mb-2 px-4`}>
                {!mine && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 font-bold shadow-md">
                        {(m.senderName || 'U').charAt(0).toUpperCase()}
                    </div>
                )}
                <div className={`max-w-[65%] px-3 py-2 rounded-2xl ${style} ${mine ? 'rounded-br-md' : 'rounded-bl-md'} shadow-md`}>
                    {/* File/Image Display */}
                    {hasFile && (
                        <div className="mb-2">
                            {isImage ? (
                                <img 
                                    src={`http://localhost:8085${m.fileUrl}`} 
                                    alt={m.fileName}
                                    className="max-w-full max-h-64 rounded-lg cursor-pointer border border-white border-opacity-20 hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(`http://localhost:8085${m.fileUrl}`, '_blank')}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className={`p-3 rounded-lg ${mine ? 'bg-blue-500 bg-opacity-30' : 'bg-gray-300'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">📎</span>
                                        <div className="flex-1 min-w-0">
                                            <a 
                                                href={`http://localhost:8085${m.fileUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`text-sm font-medium hover:underline block truncate ${mine ? 'text-blue-100' : 'text-gray-800'}`}
                                                title={m.fileName}
                                            >
                                                {m.fileName}
                                            </a>
                                            {m.fileSize && (
                                                <div className={`text-xs ${mine ? 'text-blue-200' : 'text-gray-600'}`}>
                                                    {(m.fileSize / 1024).toFixed(1)} KB
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Message Content */}
                    {m.content && (
                        <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                    
                    {/* Timestamp and Status */}
                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${mine ? 'text-green-100' : 'text-gray-400'}`}>
                        <span title={new Date(m.sentAt).toLocaleString()}>
                            {getRelativeTime(m.sentAt)}
                        </span>
                        {getStatusIcon()}
                    </div>
                </div>
            </div>
        );
    };

    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle typing indicator with debounce
    const handleTyping = (e) => {
        setText(e.target.value);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Send typing start event
        const roomForTyping = isDm ? dmRoom : groupId;
        if (roomForTyping && stompRef.current?.connected) {
            stompRef.current.publish({
                destination: '/app/typing',
                body: JSON.stringify({
                    roomId: roomForTyping,
                    userId: normalizedSelfIdentifier,
                    userName: senderDisplayName,
                    typing: true
                })
            });
            
            // Auto-stop typing after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                if (stompRef.current?.connected) {
                    stompRef.current.publish({
                        destination: '/app/typing',
                        body: JSON.stringify({
                            roomId: roomForTyping,
                            userId: normalizedSelfIdentifier,
                            userName: senderDisplayName,
                            typing: false
                        })
                    });
                }
            }, 2000);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
            <div className="flex-1 overflow-auto p-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                            <div className="text-4xl mb-2">💬</div>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((m, i) => <Bubble key={m.id || i} m={m} />)}
                        {typingUsers.length > 0 && (
                            <div className="flex justify-start mb-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-2xl">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 px-2">
                                        {typingUsers.length === 1 
                                            ? `${typingUsers[0]} is typing...`
                                            : typingUsers.length === 2
                                            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                                            : `${typingUsers.length} people are typing...`}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            <div className="border-t bg-white p-4">
                {/* Upload Progress Bar */}
                {uploading && uploadProgress > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Uploading file...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}
                
                <div className="flex gap-2 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Upload file or image (Max 10MB)"
                        disabled={uploading}
                    >
                        {uploading ? '⏳' : '📎'}
                    </button>
                    <div className="flex-1 relative">
                        <input
                            className="w-full border rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-50"
                            placeholder={uploading ? "Uploading file..." : "Type a message"}
                            value={text}
                            onChange={handleTyping}
                            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
                            disabled={uploading}
                        />
                    </div>
                    <button 
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95" 
                        onClick={send}
                        disabled={uploading || (!text.trim() && !uploading)}
                    >
                        {uploading ? '⏳' : '📤'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;