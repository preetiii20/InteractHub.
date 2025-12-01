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
        <div className="p-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5">
                    <h1 className="text-xl font-semibold">Live Communication</h1>
                    <p className="text-indigo-100 text-sm">1:1 chat {channelId ? `— ${channelId}` : ''}</p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipient (Email/ID)</label>
                        <RecipientSelectorComponent 
                            names={directory} // Contains emails/IDs
                            displayNames={nameMap} // Map for rendering full names
                            value={recipientIdentifier} 
                            onChange={setRecipientIdentifier} 
                        />
                    </div>

                    {/* Call Controls */}
                    {recipientIdentifier && (
                        <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Voice & Video Calls</h3>
                                <div className="flex gap-2">
                                    {callStatus === 'idle' && (
                                        <>
                                            <button
                                                onClick={() => startCall('voice')}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                📞 Voice Call
                                            </button>
                                            <button
                                                onClick={() => startCall('video')}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                📹 Video Call
                                            </button>
                                        </>
                                    )}
                                    
                                    {callStatus === 'calling' && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                            Calling {nameMap[recipientIdentifier] || recipientIdentifier}...
                                        </div>
                                    )}
                                    
                                    {callStatus === 'in_call' && (
                                        <button
                                            onClick={endCall}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            📞 End Call
                                        </button>
                                    )}
                                    
                                    {callStatus === 'ended' && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Call ended</span>
                                            <button
                                                onClick={resetCall}
                                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {channelId ? (
                        <div className="h-[28rem]">
                            <ChatWindow 
                                channelId={channelId} 
                                selfName={currentUserName} // Display Name for UI
                                selfIdentifier={selfIdentifier} // Email for DM logic
                            />
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">Pick a recipient to start.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Custom RecipientSelectorComponent definition (REQUIRED to be here or correctly imported) ---
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

export default AdminLiveCommunication;