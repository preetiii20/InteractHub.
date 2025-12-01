import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const VoiceCallComponent = ({ channelId, userId, userName }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [stompClient, setStompClient] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('idle'); // idle, pending, granted, denied
  const [permissionError, setPermissionError] = useState('');
  
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const stompClientRef = useRef(null);
  const callTimerRef = useRef(null);

  const requestPermissions = async () => {
    try {
      // If we already have a stream, reuse it
      if (localStreamRef.current && localStreamRef.current.active) {
        console.log('[audio] Reusing existing stream');
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
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      localStreamRef.current = stream;
      setPermissionStatus('granted');
      console.log('[audio] Permissions granted');
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissionStatus('denied');
      
      let errorMsg = error.message;
      if (error.name === 'NotReadableError') {
        errorMsg = 'Microphone in use by another application. Please close other apps using your microphone.';
      } else if (error.name === 'NotAllowedError') {
        errorMsg = 'Permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please connect a device.';
      }
      
      setPermissionError(errorMsg);
      console.log('[audio] Error: ' + errorMsg);
      return false;
    }
  };

  const initializeWebSocket = useCallback(() => {
    const socket = new SockJS(apiConfig.websocketUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });
    
    client.onConnect = () => {
      console.log('Connected to voice call signaling');
      stompClientRef.current = client;
      setStompClient(client);
      
      // Subscribe to signaling messages
      client.subscribe(`/topic/channel.${channelId}.voice-signal`, handleSignalingMessage);
      client.subscribe(`/topic/channel.${channelId}.voice-call`, handleCallEvent);
    };
    
    client.activate();
  }, [channelId]);

  useEffect(() => {
    initializeWebSocket();
    
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [channelId, initializeWebSocket]);

  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setCallDuration(0);
    }
  }, [isCallActive]);

  

  const handleSignalingMessage = (message) => {
    const signal = JSON.parse(message.body);
    
    if (signal.type === 'offer') {
      handleOffer(signal.offer);
    } else if (signal.type === 'answer') {
      handleAnswer(signal.answer);
    } else if (signal.type === 'ice-candidate') {
      handleIceCandidate(signal.candidate);
    }
  };

  const handleCallEvent = (message) => {
    const event = JSON.parse(message.body);
    
    if (event.type === 'voice-call-started') {
      setParticipants(prev => [...prev, { id: event.userId, name: event.userName }]);
    } else if (event.type === 'voice-call-ended') {
      setParticipants(prev => prev.filter(p => p.id !== event.userId));
    }
  };

  const startVoiceCall = async () => {
    if (!channelId) {
      alert('Please select a recipient first');
      return;
    }

    const hasPermissions = localStreamRef.current ? true : await requestPermissions();
    if (!hasPermissions) {
      alert('Microphone permission is required for voice calls');
      return;
    }

    try {
      setIsCallActive(true);
      
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add audio track to peer connection
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          peerConnectionRef.current.addTrack(audioTrack, localStreamRef.current);
        }
      }

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        // Play remote audio
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play();
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

      // Notify others about voice call start
      if (stompClientRef.current) {
        stompClientRef.current.publish({
          destination: `/app/chat.sendVoiceCallEvent`,
          body: JSON.stringify({
            channelId: channelId,
            type: 'voice-call-started',
            userId: userId,
            userName: userName
          })
        });
      }

      setIsCallActive(true);
      setParticipants([{ id: userId, name: userName }]);

    } catch (error) {
      console.error('Error starting voice call:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const endVoiceCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Notify others about voice call end
    if (stompClientRef.current) {
      try {
        stompClientRef.current.publish({
          destination: `/app/chat.sendVoiceCallEvent`,
          body: JSON.stringify({ channelId, type: 'voice-call-ended', userId })
        });
      } catch {}
    }

    setIsCallActive(false);
    setParticipants([]);
  };

  const toggleMute = () => {
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
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      sendSignalingMessage({
        type: 'answer',
        answer: answer,
        userId: userId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const sendSignalingMessage = (message) => {
    if (stompClientRef.current) {
      stompClientRef.current.publish({
        destination: `/app/chat.sendVoiceSignal`,
        body: JSON.stringify({
          channelId: channelId,
          signal: message
        })
      });
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Voice Call - {channelId}
      </h3>

      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-red-800 font-medium">Microphone Access Denied</h4>
              <p className="text-red-600 text-sm mt-1">
                Please allow microphone access in your browser settings to use voice calls.
              </p>
              <button 
                onClick={requestPermissions}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Try Again
              </button>
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
            <span className="text-yellow-800">Requesting microphone permission...</span>
          </div>
        </div>
      )}

      {!isCallActive ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <button
            onClick={startVoiceCall}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 flex items-center mx-auto text-lg"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Start Voice Call
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Call Status */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatDuration(callDuration)}
            </div>
            <div className="text-sm text-gray-600">
              Voice call in progress
            </div>
          </div>

          {/* Audio Visualization */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-8 rounded-full ${
                    isAudioEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  }`}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex justify-center space-x-6">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isAudioEnabled 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isAudioEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                )}
              </svg>
            </button>

            <button
              onClick={endVoiceCall}
              className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Participants */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
              Participants ({participants.length})
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-2 px-3 py-2 bg-white rounded-full shadow-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {participant.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Call Quality Indicator */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Excellent Connection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCallComponent;
