// Import the enhanced version
import EnhancedLiveCommunicationHub from '../live/EnhancedLiveCommunicationHub';

// Export the enhanced version for Employee users
export default EnhancedLiveCommunicationHub;

/* LEGACY CODE BELOW - Keeping for reference
import React, { useEffect, useMemo, useState } from 'react';
import VideoCallComponent from '../common/VideoCallComponent';
import VoiceCallComponent from '../common/VoiceCallComponent';
import MultiRecipientSelector from '../common/MultiRecipientSelector';
import ChatWindow from '../common/ChatWindow';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Normalize 1:1 DM channelId by emails/IDs
const normalizeDmChannel = (a, b) => {
    // a and b are expected to be emails (lowercase)
    const A = (a || '').trim().toLowerCase();
    const B = (b || '').trim().toLowerCase();
    return `DM_${A <= B ? `${A}|${B}` : `${B}|${A}`}`;
};

// Build group channelId from IDs (sorted)
const normalizeGroupChannel = (names) => {
    const uniq = Array.from(new Set(names.map(n => String(n||'').trim().toLowerCase()).filter(Boolean)));
    uniq.sort();
    return `GROUP_${uniq.join('|')}`;
};

const EmployeeLiveCommunicationHub = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const [recipientIdentifier, setRecipientIdentifier] = useState('');
    const [selectedRecipientIdentifiers, setSelectedRecipientIdentifiers] = useState([]);
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [directory, setDirectory] = useState([]);
    const [nameMap, setNameMap] = useState({});
    const [autoStart, setAutoStart] = useState(false);
    const [incoming, setIncoming] = useState(null);
    const [overrideChannelId, setOverrideChannelId] = useState('');
    const [prefetchMedia, setPrefetchMedia] = useState(false);

    // CRITICAL: Use user's email as the unique chat identifier
    const selfIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName();
    const userName = authHelpers.getUserName();
    
    // Load directory of emails/IDs from Admin-service users
    useEffect(() => {
        const load = async () => {
            try {
                // Fetch users from the Chat Service endpoint, which proxies the Admin Service
                const res = await fetch(apiConfig.chatService + '/users/all' || 'http://localhost:8085/api/chat/users/all');
                const users = await res.json();
                
                const identifiers = [];
                const names = {};
                
                if (Array.isArray(users)) {
                    users.forEach(u => {
                        const email = (u.email || '').trim();
                        if (!email) return;

                        const fullName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || u.username || '');
                        
                        // Use email as the identifier
                        identifiers.push(email);
                        names[email] = fullName || email;
                    });
                }

                // Ensure self is in the directory
                if (selfIdentifier && !identifiers.includes(selfIdentifier)) {
                    identifiers.push(selfIdentifier);
                    names[selfIdentifier] = authHelpers.getUserName() || selfIdentifier; 
                }
                
                setNameMap(names);
                setDirectory(Array.from(new Set(identifiers)).filter(id => id.includes('@')).sort());
            } catch (e) {
                console.error("Error fetching user directory:", e);
                // Fallback needed to prevent crashes
                setDirectory([selfIdentifier, 'fallback@user.com']);
                setNameMap({[selfIdentifier]: userName, 'fallback@user.com': 'Fallback User'});
            }
        };
        load();
    }, [selfIdentifier, userName]);

    // Subscribe for per-user incoming call notifications
    useEffect(() => {
        const socket = new SockJS(apiConfig.websocketUrl);
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });
        client.onConnect = () => {
            const userDest = `/user/${selfIdentifier}/queue/notify`;
            client.subscribe(userDest, (msg) => {
                try {
                    const payload = JSON.parse(msg.body || '{}');
                    if (payload.type === 'incoming_call') {
                        setIncoming({ fromUser: payload.fromUser, callType: (payload.callType || 'VIDEO').toUpperCase(), roomId: payload.roomId });
                    }
                } catch {}
            });
            const pubDest = `/topic/notify.${selfIdentifier}`;
            client.subscribe(pubDest, (msg) => {
                try {
                    const payload = JSON.parse(msg.body || '{}');
                    if (payload.type === 'incoming_call') {
                        setIncoming({ fromUser: payload.fromUser, callType: (payload.callType || 'VIDEO').toUpperCase(), roomId: payload.roomId });
                    }
                } catch {}
            });
        };
        client.activate();
        return () => client.deactivate();
    }, [selfIdentifier]);

    const channelParam = new URLSearchParams(window.location.search).get('channelId');
    const channelId = useMemo(() => {
        if (channelParam) return channelParam;
        if (isGroupMode && selectedRecipientIdentifiers.length > 0) {
            return normalizeGroupChannel([...selectedRecipientIdentifiers, selfIdentifier]);
        }
        if (!isGroupMode && recipientIdentifier) {
            return normalizeDmChannel(selfIdentifier, recipientIdentifier);
        }
        return '';
    }, [selfIdentifier, recipientIdentifier, channelParam, selectedRecipientIdentifiers, isGroupMode]);
    const effectiveChannelId = overrideChannelId || channelId;

    const startVideoWith = async (emails) => {
        if (!emails || emails.length === 0) return;
        const roomId = `call_${Date.now()}_${selfIdentifier}`;
        try {
            const base = apiConfig.chatService;
            await Promise.all(emails.filter(e => e && e !== selfIdentifier).map(async (to) => {
                await fetch(`${base}/call/start`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fromUser: selfIdentifier, toUser: to, callType: 'VIDEO', roomId })
                });
            }));
        } catch {}
        setIsGroupMode(emails.length > 1);
        setRecipientIdentifier('');
        setSelectedRecipientIdentifiers([]);
        setOverrideChannelId(roomId);
        setActiveTab('video');
        setTimeout(() => setAutoStart(true), 0);
    };

    const startVoiceWith = async (emails) => {
        if (!emails || emails.length === 0) return;
        const roomId = `call_${Date.now()}_${selfIdentifier}`;
        try {
            const base = apiConfig.chatService;
            await Promise.all(emails.filter(e => e && e !== selfIdentifier).map(async (to) => {
                await fetch(`${base}/call/start`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fromUser: selfIdentifier, toUser: to, callType: 'VOICE', roomId })
                });
            }));
        } catch {}
        setIsGroupMode(emails.length > 1);
        setRecipientIdentifier('');
        setSelectedRecipientIdentifiers([]);
        setOverrideChannelId(roomId);
        setActiveTab('voice');
        setTimeout(() => setAutoStart(true), 0);
    };

    const tabs = [
        { id: 'chat', label: 'Live Chat', icon: '💬' },
        { id: 'video', label: 'Video Call', icon: '📹' },
        { id: 'voice', label: 'Voice Call', icon: '📞' }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <h1 className="text-2xl font-bold mb-2">Employee Live Communication Hub</h1>
                    <p className="text-blue-100">Real-time collaboration {channelId ? `on ${channelId}` : ''}</p>
                    <div className="flex items-center mt-3 space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Live connection active</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                        {incoming && (
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-sm">Incoming {incoming.callType === 'VOICE' ? 'Voice' : 'Video'} call</span>
                                <button className="px-2 py-1 border rounded" onClick={() => setIncoming(null)}>Decline</button>
                                <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => {
                                    setOverrideChannelId(incoming.roomId);
                                    setActiveTab(incoming.callType === 'VOICE' ? 'voice' : 'video');
                                    setAutoStart(false);
                                    setPrefetchMedia(true);
                                    setIncoming(null);
                                }}>Accept</button>
                            </div>
                        )}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'chat' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* User List Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
                                        <button className="text-gray-600 hover:text-gray-800">
                                            <span className="text-xl">⚙️</span>
                                        </button>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="mb-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                            <input
                                                type="text"
                                                placeholder="Search conversations..."
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Mode Toggle */}
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => setIsGroupMode(false)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                !isGroupMode 
                                                    ? 'bg-blue-600 text-white shadow-md' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            💬 Direct
                                        </button>
                                        <button
                                            onClick={() => setIsGroupMode(true)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isGroupMode 
                                                    ? 'bg-purple-600 text-white shadow-md' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            👥 Group
                                        </button>
                                    </div>

                                    {/* New Group Button (only in group mode) */}
                                    {isGroupMode && (
                                        <button className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2">
                                            <span className="text-xl">➕</span>
                                            New Group
                                        </button>
                                    )}

                                    {/* User List */}
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {directory.filter(email => email !== selfIdentifier).map(email => (
                                            <div
                                                key={email}
                                                onClick={() => {
                                                    if (!isGroupMode) {
                                                        setRecipientIdentifier(email);
                                                    } else {
                                                        // Toggle selection in group mode
                                                        setSelectedRecipientIdentifiers(prev => 
                                                            prev.includes(email) 
                                                                ? prev.filter(e => e !== email)
                                                                : [...prev, email]
                                                        );
                                                    }
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                                    (!isGroupMode && recipientIdentifier === email) || 
                                                    (isGroupMode && selectedRecipientIdentifiers.includes(email))
                                                        ? 'bg-blue-100 border-2 border-blue-500'
                                                        : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                                                }`}
                                            >
                                                {/* Avatar */}
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {(nameMap[email] || email).charAt(0).toUpperCase()}
                                                    </div>
                                                    {/* Online Indicator */}
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                </div>

                                                {/* User Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-800 truncate">
                                                        {nameMap[email] || email}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {email}
                                                    </div>
                                                </div>

                                                {/* Selection Indicator */}
                                                {isGroupMode && selectedRecipientIdentifiers.includes(email) && (
                                                    <div className="text-blue-600 text-xl">✓</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Group Mode: Selected Count */}
                                    {isGroupMode && selectedRecipientIdentifiers.length > 0 && (
                                        <div className="mt-4 p-3 bg-purple-100 rounded-lg text-center">
                                            <span className="text-sm font-semibold text-purple-800">
                                                {selectedRecipientIdentifiers.length} member{selectedRecipientIdentifiers.length > 1 ? 's' : ''} selected
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div className="lg:col-span-2">
                                {channelId ? (
                                    <div className="h-[600px] bg-white rounded-lg shadow-md">
                                        <ChatWindow 
                                            channelId={channelId} 
                                            selfName={userName}
                                            selfIdentifier={selfIdentifier}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-[600px] bg-white rounded-lg shadow-md flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">💬</div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                {!isGroupMode ? 'Select a conversation' : 'Create a group chat'}
                                            </h3>
                                            <p className="text-gray-500">
                                                {!isGroupMode 
                                                    ? 'Choose a person from the list to start chatting' 
                                                    : 'Select 2 or more people to start a group chat'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Video and Voice call tabs */}
                    {activeTab === 'video' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <div className="bg-white border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">Directory</h3>
                                        <div className="space-x-2">
                                            <button onClick={() => startVideoWith(directory)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Call everyone</button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-auto divide-y">
                                        {directory.map(email => (
                                            <div key={email} className="flex items-center justify-between py-2">
                                                <div>
                                                    <div className="text-sm font-medium">{nameMap[email] || email}</div>
                                                    <div className="text-xs text-gray-500">{email}</div>
                                                </div>
                                                <div className="space-x-2">
                                                    <button onClick={() => startVideoWith([email])} className="px-2 py-1 text-xs border rounded">Call</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <VideoCallComponent
                                    channelId={effectiveChannelId}
                                    userId={authHelpers.getUserId()}
                                    userName={userName}
                                    autoStart={autoStart}
                                    prefetchMedia={prefetchMedia}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'voice' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <div className="bg-white border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">Directory</h3>
                                        <div className="space-x-2">
                                            <button onClick={() => startVoiceWith(directory)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Call everyone</button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-auto divide-y">
                                        {directory.map(email => (
                                            <div key={email} className="flex items-center justify-between py-2">
                                                <div>
                                                    <div className="text-sm font-medium">{nameMap[email] || email}</div>
                                                    <div className="text-xs text-gray-500">{email}</div>
                                                </div>
                                                <div className="space-x-2">
                                                    <button onClick={() => startVoiceWith([email])} className="px-2 py-1 text-xs border rounded">Call</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <VoiceCallComponent
                                    channelId={effectiveChannelId}
                                    userId={authHelpers.getUserId()}
                                    userName={userName}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {incoming && (
                <div className="fixed bottom-6 right-6 bg-white shadow-lg border rounded-lg p-4 w-80">
                    <div className="font-semibold mb-1">Incoming {incoming.callType === 'VOICE' ? 'Voice' : 'Video'} Call</div>
                    <div className="text-sm text-gray-600 mb-3">From: {incoming.fromUser}</div>
                    <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 border rounded" onClick={() => setIncoming(null)}>Decline</button>
                        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => {
                            setOverrideChannelId(incoming.roomId);
                            setActiveTab(incoming.callType === 'VOICE' ? 'voice' : 'video');
                            setAutoStart(false);
                            setIncoming(null);
                        }}>Accept</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Custom RecipientSelectorComponent Definition ---
// This is the custom component used to render the dropdown showing Name (Email) but returning only the Email ID.
const RecipientSelectorComponent = ({ names = [], displayNames = {}, value, onChange }) => {
    return (
        <select className="w-full border rounded px-2 py-2"
            value={value || ''}
            onChange={e => onChange(e.target.value)}>
            <option value="">Select a person</option>
            {names.filter(Boolean).map(n => (
                // Display the name/email, but use the email (n) as the value
                <option key={n} value={n}>
                    {displayNames[n] || n} ({n})
                </option>
            ))}
        </select>
    );
};

export default EmployeeLiveCommunicationHub;

