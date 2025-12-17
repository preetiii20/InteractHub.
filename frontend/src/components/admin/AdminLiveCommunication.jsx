import React, { useEffect, useMemo, useState } from 'react';
import ChatWindow from '../common/ChatWindow';
import { authHelpers } from '../../config/auth';
import axios from 'axios';

const CHAT_SERVICE_URL = 'http://localhost:8085/api/chat';

const normalizeDmChannel = (a, b) => {
    // a and b are expected to be emails (lowercase)
    const A = (a || '').trim().toLowerCase();
    const B = (b || '').trim().toLowerCase();
    return `DM_${A <= B ? `${A}|${B}` : `${B}|${A}`}`;
};

const AdminLiveCommunication = () => {
    // CRITICAL: Use user's email as the unique chat identifier
    const selfIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName();
    const [recipientIdentifier, setRecipientIdentifier] = useState('');
    const [directory, setDirectory] = useState([]);
    
    // Map to store display names
    const [nameMap, setNameMap] = useState({});
    
    // Call state
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, in_call, ended
    const [callType, setCallType] = useState('voice'); // voice, video
    const [roomId, setRoomId] = useState(null);

    useEffect(() => {
        (async () => {
            const urls = [
                'http://localhost:8081/api/admin/users',
                'http://localhost:8085/api/chat/users/all'
            ];

            // Arrays to store all identifiers and names from all endpoints
            const allIdentifiers = new Set();
            const allNames = {};

            // Fetch from all endpoints
            for (const url of urls) {
                try {
                    const res = await fetch(url, { credentials: 'include' });
                    if (!res.ok) continue;
                    const users = await res.json();
                    
                    if (Array.isArray(users)) {
                        users.forEach(u => {
                            const email = (u.email || '').trim();
                            if (!email) return;

                            const fullName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || u.username || '');
                            
                            // Use email as the identifier
                            allIdentifiers.add(email);
                            allNames[email] = fullName || email;
                        });
                    }
                } catch (e) {
                    console.error("Error fetching user directory:", e);
                }
            }

            // Ensure self is in the directory
            if (selfIdentifier && !allIdentifiers.has(selfIdentifier)) {
                allIdentifiers.add(selfIdentifier);
                allNames[selfIdentifier] = authHelpers.getUserName() || selfIdentifier;
            }

            // Set the state with all collected users
            setNameMap(allNames);
            setDirectory(Array.from(allIdentifiers).filter(id => id.includes('@')).sort());
        })();
    }, [selfIdentifier]);

    const channelId = useMemo(() => {
        return recipientIdentifier ? normalizeDmChannel(selfIdentifier, recipientIdentifier) : '';
    }, [selfIdentifier, recipientIdentifier]);

    const currentUserName = authHelpers.getUserName() || 'User';

    // Call functions
    const startCall = async (type) => {
        if (!recipientIdentifier) {
            alert('Please select a recipient first');
            return;
        }

        try {
            setCallType(type);
            setCallStatus('calling');
            
            const response = await axios.post(`${CHAT_SERVICE_URL}/call/start`, {
                fromUser: selfIdentifier,
                toUser: recipientIdentifier,
                callType: type
            });
            
            setRoomId(response.data.roomId);
            console.log('Call started:', response.data);
        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus('idle');
            alert('Failed to start call. Please try again.');
        }
    };

    const endCall = async () => {
        if (!roomId) return;

        try {
            await axios.post(`${CHAT_SERVICE_URL}/call/end`, {
                roomId: roomId,
                fromUser: selfIdentifier,
                toUser: recipientIdentifier
            });
            
            setCallStatus('ended');
            setRoomId(null);
            console.log('Call ended');
        } catch (error) {
            console.error('Failed to end call:', error);
        }
    };

    const resetCall = () => {
        setCallStatus('idle');
        setRoomId(null);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white px-8 py-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold">Live Communication Hub</h1>
                <p className="text-indigo-100 text-sm mt-1">Real-time collaboration and messaging</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex gap-6">
                {/* Left Sidebar - Recipient Selection & Controls */}
                <div className="w-80 flex flex-col gap-4 flex-shrink-0">
                    {/* Recipient Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Select Recipient</label>
                        <RecipientSelectorComponent 
                            names={directory}
                            displayNames={nameMap}
                            value={recipientIdentifier} 
                            onChange={setRecipientIdentifier} 
                        />
                    </div>

                    {/* Call Controls */}
                    {recipientIdentifier && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Voice & Video Calls</h3>
                            <div className="space-y-2">
                                {callStatus === 'idle' && (
                                    <>
                                        <button
                                            onClick={() => startCall('voice')}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                        >
                                            📞 Voice Call
                                        </button>
                                        <button
                                            onClick={() => startCall('video')}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                        >
                                            📹 Video Call
                                        </button>
                                    </>
                                )}
                                
                                {callStatus === 'calling' && (
                                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300 text-sm">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                                        <span className="font-medium">Calling...</span>
                                    </div>
                                )}
                                
                                {callStatus === 'in_call' && (
                                    <button
                                        onClick={endCall}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                    >
                                        📞 End Call
                                    </button>
                                )}
                                
                                {callStatus === 'ended' && (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-center text-gray-600 text-sm font-medium py-1">Call ended</div>
                                        <button
                                            onClick={resetCall}
                                            className="w-full px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Start New Call
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!recipientIdentifier && (
                        <div className="text-sm text-gray-600 py-4 text-center">
                            <p className="font-medium">Select a recipient to begin</p>
                        </div>
                    )}
                </div>

                {/* Right Content - Chat Window */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {channelId ? (
                        <ChatWindow 
                            channelId={channelId} 
                            selfName={currentUserName}
                            selfIdentifier={selfIdentifier}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-6xl mb-4">💬</div>
                                <p className="text-gray-500 font-medium">Select a recipient to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Custom RecipientSelectorComponent definition (REQUIRED to be here or correctly imported) ---
const RecipientSelectorComponent = ({ names = [], displayNames = {}, value, onChange }) => {
    return (
        <select 
            className="w-full border-2 border-indigo-200 rounded-lg px-4 py-3 text-gray-700 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white hover:border-indigo-300"
            value={value || ''}
            onChange={e => onChange(e.target.value)}>
            <option value="">Select a person</option>
            {names.filter(Boolean).map(n => (
                <option key={n} value={n}>
                    {displayNames[n] || n} ({n})
                </option>
            ))}
        </select>
    );
};

export default AdminLiveCommunication;