import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const VideoCallComponent = ({ channelId, userId, userName, autoStart = false, prefetchMedia = false }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('idle'); // idle, pending, granted, denied
  const [permissionError, setPermissionError] = useState('');
  const [debugMsg, setDebugMsg] = useState('');
  const addDebug = (msg) => { console.log(msg); setDebugMsg(msg); };
  
  // ICE servers (STUN + optional TURN from env)
  const iceServers = React.useMemo(() => {
    const servers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    const turnUrl = process.env.REACT_APP_TURN_URL;
    const turnUser = process.env.REACT_APP_TURN_USERNAME;
    const turnCred = process.env.REACT_APP_TURN_CREDENTIAL;
    if (turnUrl && turnUrl.trim()) {
      const entry = { urls: turnUrl.trim() };
      if (turnUser) entry.username = turnUser;
      if (turnCred) entry.credential = turnCred;
      servers.push(entry);
      addDebug('[ice] TURN added: ' + turnUrl);
    }
    return servers;
  }, []);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false);
  const pendingSignalsRef = useRef([]);

  const flushPendingSignals = () => {
    if (!isConnectedRef.current || !stompClientRef.current) return;
    while (pendingSignalsRef.current.length) {
      const msg = pendingSignalsRef.current.shift();
      try {
        addDebug('[signal:flush] '+JSON.stringify(msg));
        stompClientRef.current.publish({
          destination: `/app/chat.sendSignal`,
          body: JSON.stringify({ channelId, signal: msg })
        });
      } catch {}
    }
  };

  const requestPermissions = async () => {
    try {
      // If we already have a stream, reuse it
      if (localStreamRef.current && localStreamRef.current.active) {
        addDebug('[media] Reusing existing stream');
        setPermissionStatus('granted');
        return true;
      }

      // Stop any existing tracks first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      setPermissionStatus('pending');
      setPermissionError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try { 
          await localVideoRef.current.play(); 
        } catch (e) {
          addDebug('[video] Play error: ' + e.message);
        }
      }
      
      setPermissionStatus('granted');
      addDebug('[media] Permissions granted');
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionStatus('denied');
      
      let errorMsg = error.message;
      if (error.name === 'NotReadableError') {
        errorMsg = 'Device in use by another application. Please close other apps using your camera/microphone.';
      } else if (error.name === 'NotAllowedError') {
        errorMsg = 'Permission denied. Please allow camera and microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No camera or microphone found. Please connect a device.';
      }
      
      setPermissionError(errorMsg);
      addDebug('[media] Error: ' + errorMsg);
      return false;
    }
  };

  const initializeWebSocket = useCallback(() => {
    addDebug('[ws] initializing for channel '+channelId);
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({ webSocketFactory: () => socket, debug: (str) => addDebug('[stomp] '+str), reconnectDelay: 5000 });
    
    client.onConnect = () => {
      addDebug('[stomp] Connected');
      stompClientRef.current = client;
      setStompClient(client);
      isConnectedRef.current = true;
      
      // Subscribe to signaling
      client.subscribe(`/topic/channel.${channelId}.signal`, (msg) => { addDebug('[ws<-] '+msg.body); handleSignalingMessage(msg); });
      client.subscribe(`/topic/channel.${channelId}.call`, handleCallEvent);
      flushPendingSignals();
    };
    
    client.onStompError = () => { addDebug('[stomp] error'); isConnectedRef.current = false; };
    client.onWebSocketClose = () => { addDebug('[ws] closed'); isConnectedRef.current = false; };
    
    client.activate();
  }, [channelId]);

  useEffect(() => {
    initializeWebSocket();
    if (prefetchMedia && !localStreamRef.current) {
      (async () => {
        const ok = await requestPermissions();
        if (ok) {
          // Show local preview even before negotiation
          setIsCallActive(true);
          setParticipants(prev => (prev.length ? prev : [{ id: userId, name: userName }]));
        }
      })();
    }
    if (autoStart) {
      // try to request permissions early; then start call
      (async () => {
        // If we already have a stream, don't re-prompt
        let ok = true;
        if (!localStreamRef.current) {
          ok = await requestPermissions();
        } else {
          setPermissionStatus('granted');
        }
        if (ok && !isCallActive && channelId) {
          await startCall();
        }
      })();
    }
    
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [channelId, initializeWebSocket, autoStart]);

  const handleSignalingMessage = (message) => {
    const payload = typeof message?.body === 'string' ? JSON.parse(message.body) : message;
    const signal = payload?.type ? payload : payload?.signal || {};
    const fromUserId = payload?.userId || signal?.userId;
    // Ignore echoes of our own messages
    if (fromUserId && String(fromUserId) === String(userId)) {
      addDebug('[ws<-] ignored self message ' + signal.type);
      return;
    }

    if (signal.type === 'offer') {
      handleOffer(signal.offer);
    } else if (signal.type === 'answer') {
      // Apply answer only if we are in the right state
      const state = peerConnectionRef.current?.signalingState;
      if (state !== 'have-local-offer') {
        addDebug('[rtc] skip answer; state=' + state);
        return;
      }
      handleAnswer(signal.answer);
    } else if (signal.type === 'ice-candidate') {
      handleIceCandidate(signal.candidate);
    }
  };

  const handleCallEvent = (message) => {
    const event = JSON.parse(message.body);
    
    if (event.type === 'user-joined') {
      setParticipants(prev => [...prev, { id: event.userId, name: event.userName }]);
    } else if (event.type === 'user-left') {
      setParticipants(prev => prev.filter(p => p.id !== event.userId));
    }
  };

  const startCall = async () => {
    if (!channelId) {
      alert('Please select a recipient first');
      return;
    }

    // Ensure signaling connected before producing offer/ICE
    if (!isConnectedRef.current) {
      // wait briefly for connection
      await new Promise(resolve => setTimeout(resolve, 300));
    }
 
    const hasPermissions = localStreamRef.current ? true : await requestPermissions();
    if (!hasPermissions) {
      alert('Camera and microphone permissions are required for video calls');
      return;
    }

    try {
      setIsCallActive(true);
      
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers
      });

      // Add tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          try { remoteVideoRef.current.play?.(); } catch {}
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            userId: userId
          });
        }
      };

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      sendSignalingMessage({
        type: 'offer',
        offer: offer,
        userId: userId
      });

      // Notify others about call start
      if (stompClientRef.current && isConnectedRef.current) {
        stompClientRef.current.publish({
          destination: `/app/chat.sendCallEvent`,
          body: JSON.stringify({
            channelId: channelId,
            type: 'call-started',
            userId: userId,
            userName: userName
          })
        });
      }

      setIsCallActive(true);
      setParticipants([{ id: userId, name: userName }]);

    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const endCall = () => {
    addDebug('[call] Ending call');
    
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebug('[media] Stopped track: ' + track.kind);
      });
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Notify others about call end
    if (stompClientRef.current && isConnectedRef.current) {
      try {
        stompClientRef.current.publish({
          destination: `/app/chat.sendCallEvent`,
          body: JSON.stringify({
            channelId: channelId,
            type: 'call-ended',
            userId: userId
          })
        });
      } catch (e) {
        addDebug('[ws] Error sending call-ended: ' + e.message);
      }
    }

    setIsCallActive(false);
    setParticipants([]);
    setPermissionStatus('idle');
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const handleOffer = async (offer) => {
    try {
      addDebug('[rtc<-] got offer');
      if (!peerConnectionRef.current) {
        addDebug('[rtc] No connection: callee building PC and starting local stream...');
        peerConnectionRef.current = new RTCPeerConnection({
          iceServers
        });
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            addDebug('[rtc ICE->]', event.candidate);
            sendSignalingMessage({ type: 'ice-candidate', candidate: event.candidate, userId: userId });
          }
        };
        if (!localStreamRef.current) {
          const ok = await requestPermissions();
          if (!ok) { addDebug('[media] denied'); return; }
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            peerConnectionRef.current.addTrack(track, localStreamRef.current);
          });
        }
        setIsCallActive(true);
        setParticipants(prev => (prev.length ? prev : [{ id: userId, name: userName }]));
      }
      await peerConnectionRef.current.setRemoteDescription(offer);
      addDebug('[rtc] Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      sendSignalingMessage({ type: 'answer', answer: answer, userId: userId });
      addDebug('[rtc->] Sent answer');
    } catch (error) {
      addDebug('[rtc] offer ERROR: '+error.message);
      console.error('Error handling offer:', error);
      setDebugMsg('Offer negotiation failed: '+error.message);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      addDebug('[rtc<-] got answer');
      await peerConnectionRef.current.setRemoteDescription(answer);
      addDebug('[rtc] Set remotedesc (answer)');
    } catch (error) {
      addDebug('[rtc] answer ERROR: '+error.message);
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      addDebug('[rtc<-] got ICE candidate');
      await peerConnectionRef.current.addIceCandidate(candidate);
      addDebug('[rtc] ICE add OK');
    } catch (error) {
      addDebug('[rtc] ICE ERROR: '+error.message);
      console.error('Error handling ICE candidate:', error);
    }
  };

  const sendSignalingMessage = (message) => {
    if (stompClientRef.current && isConnectedRef.current) {
      try {
        addDebug('[ws->] '+JSON.stringify(message));
        stompClientRef.current.publish({
          destination: `/app/chat.sendSignal`,
          body: JSON.stringify({ channelId, signal: message })
        });
      } catch (e) {
        pendingSignalsRef.current.push(message);
        addDebug('[ws~queue on error] '+JSON.stringify(message));
      }
    } else {
      pendingSignalsRef.current.push(message);
      addDebug('[ws~queue, not connected] '+JSON.stringify(message));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {debugMsg && (
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-900 rounded text-xs">
          {debugMsg}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Video Call - {channelId}
      </h3>

      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Camera/Microphone Access Denied</h4>
              <p className="text-red-600 text-sm mt-1">
                {permissionError || 'Please allow camera and microphone access in your browser settings to use video calls.'}
              </p>
              <div className="mt-3 space-y-2">
                <button 
                  onClick={requestPermissions}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 mr-2"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => {
                    setPermissionStatus('idle');
                    setPermissionError('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 text-xs text-red-700 bg-red-100 p-2 rounded">
                <strong>Troubleshooting:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Close other apps using your camera/microphone (Zoom, Teams, etc.)</li>
                  <li>Check browser permissions in Settings</li>
                  <li>Reload the page and try again</li>
                  <li>Make sure your device is properly connected</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {permissionStatus === 'pending' && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-yellow-800">Requesting camera and microphone permissions...</span>
          </div>
        </div>
      )}

      {!isCallActive ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <button
            onClick={startCall}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Start Video Call
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video Streams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full h-48 bg-gray-900 rounded-lg"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You
              </div>
            </div>
            
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full h-48 bg-gray-900 rounded-lg"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                Remote
              </div>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${
                isAudioEnabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isAudioEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
              </svg>
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${
                isVideoEnabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isVideoEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                )}
              </svg>
            </button>

            <button
              onClick={endCall}
              className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Participants */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Participants ({participants.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <span
                  key={participant.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {participant.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallComponent;
