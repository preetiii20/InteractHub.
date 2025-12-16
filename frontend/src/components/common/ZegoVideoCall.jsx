import React, { useState, useEffect, useRef, useCallback } from 'react';
import ZegoCloudService from '../../services/ZegoCloudService';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const ZegoVideoCall = ({ channelId, userId, userName, autoStart = false, prefetchMedia = false, onCancel, onCallEnd }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [permissionError, setPermissionError] = useState('');
  const [debugMsg, setDebugMsg] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const zegoServiceRef = useRef(ZegoCloudService);
  const isInitializedRef = useRef(false);

  const addDebug = (msg) => {
    console.log(msg);
    setDebugMsg(msg);
  };

  /**
   * Get token from backend
   */
  const getZegoToken = useCallback(async () => {
    try {
      const response = await fetch(apiConfig.chatService + '/api/zego/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: userId,
          userName: userName,
          roomID: channelId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('[Zego] Failed to get token:', error);
      throw error;
    }
  }, [userId, userName, channelId]);

  /**
   * Initialize Zego service
   */
  const initializeZego = useCallback(async () => {
    try {
      if (isInitializedRef.current) {
        addDebug('[Zego] Already initialized');
        return true;
      }

      addDebug('[Zego] Initializing...');
      await zegoServiceRef.current.initZego();

      // Setup event handlers
      zegoServiceRef.current.on('roomStateUpdate', (data) => {
        if (data.state === 0) {
          setConnectionStatus('connected');
          addDebug('[Zego] Connected to room');
        } else {
          setConnectionStatus('disconnected');
          addDebug('[Zego] Disconnected from room');
        }
      });

      zegoServiceRef.current.on('userUpdate', (data) => {
        if (data.updateType === 'ADD') {
          addDebug(`[Zego] Users joined: ${data.userList.map(u => u.userName).join(', ')}`);
          setParticipants(prev => {
            const newParticipants = [...prev];
            data.userList.forEach(user => {
              if (!newParticipants.find(p => p.id === user.userID)) {
                newParticipants.push({ id: user.userID, name: user.userName });
              }
            });
            return newParticipants;
          });
        } else if (data.updateType === 'DELETE') {
          addDebug(`[Zego] Users left: ${data.userList.map(u => u.userName).join(', ')}`);
          setParticipants(prev => prev.filter(p => !data.userList.find(u => u.userID === p.id)));
        }
      });

      zegoServiceRef.current.on('streamAdded', async (data) => {
        const { stream } = data;
        addDebug(`[Zego] Stream added: ${stream.streamID}`);

        // Get or create video element for this stream
        let videoElement = remoteVideoRefs.current.get(stream.streamID);
        if (!videoElement) {
          videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.muted = false;
          videoElement.playsinline = true;
          remoteVideoRefs.current.set(stream.streamID, videoElement);
        }

        try {
          await zegoServiceRef.current.startPlayingStream(stream.streamID, videoElement);
          setRemoteStreams(prev => new Map(prev).set(stream.streamID, stream));
        } catch (error) {
          console.error('[Zego] Failed to play stream:', error);
        }
      });

      zegoServiceRef.current.on('streamRemoved', async (data) => {
        const { stream } = data;
        addDebug(`[Zego] Stream removed: ${stream.streamID}`);

        try {
          await zegoServiceRef.current.stopPlayingStream(stream.streamID);
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(stream.streamID);
            return newStreams;
          });
          remoteVideoRefs.current.delete(stream.streamID);
        } catch (error) {
          console.error('[Zego] Failed to stop playing stream:', error);
        }
      });

      zegoServiceRef.current.on('publishingFailed', (data) => {
        addDebug(`[Zego] Publishing failed: ${data.error}`);
        setPermissionError(data.error);
      });

      zegoServiceRef.current.on('error', (data) => {
        addDebug(`[Zego] Error: ${data.errorCode}`);
      });

      isInitializedRef.current = true;
      addDebug('[Zego] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Zego] Initialization failed:', error);
      addDebug(`[Zego] Initialization failed: ${error.message}`);
      throw error;
    }
  }, []);

  /**
   * Request permissions and start call
   */
  const requestPermissions = useCallback(async () => {
    try {
      setPermissionStatus('pending');
      setPermissionError('');

      // Initialize Zego if not already done
      if (!isInitializedRef.current) {
        await initializeZego();
      }

      // Get token from backend
      const token = await getZegoToken();

      // Login to room
      await zegoServiceRef.current.loginRoom(channelId, userId, userName, token);

      setPermissionStatus('granted');
      addDebug('[Zego] Permissions granted and room joined');
      return true;
    } catch (error) {
      console.error('[Zego] Permission request failed:', error);
      setPermissionStatus('denied');

      let errorMsg = error.message;
      if (error.message.includes('camera')) {
        errorMsg = 'Camera access denied. Please allow camera access in browser settings.';
      } else if (error.message.includes('microphone')) {
        errorMsg = 'Microphone access denied. Please allow microphone access in browser settings.';
      }

      setPermissionError(errorMsg);
      addDebug(`[Zego] Permission error: ${errorMsg}`);
      return false;
    }
  }, [channelId, userId, userName, initializeZego, getZegoToken]);

  /**
   * Start publishing local stream
   */
  const startPublishing = useCallback(async () => {
    try {
      addDebug('[Zego] Starting to publish...');

      const streamID = `${channelId}_${userId}`;
      await zegoServiceRef.current.startPublishing(streamID, localVideoRef.current, {
        audio: true,
        video: true,
        videoCodec: 'H264',
        bitrate: 1500,
        frameRate: 30,
        resolution: '1280x720'
      });

      addDebug('[Zego] Publishing started');
      return true;
    } catch (error) {
      console.error('[Zego] Failed to start publishing:', error);
      addDebug(`[Zego] Publishing failed: ${error.message}`);
      throw error;
    }
  }, [channelId, userId]);

  /**
   * Start call
   */
  const startCall = useCallback(async () => {
    if (!channelId) {
      alert('Please select a recipient first');
      return;
    }

    try {
      setIsCallActive(true);
      setParticipants([{ id: userId, name: userName }]);

      // Request permissions and join room
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        alert('Camera and microphone permissions are required for video calls');
        setIsCallActive(false);
        return;
      }

      // Start publishing
      await startPublishing();

      addDebug('[Zego] Call started');
    } catch (error) {
      console.error('[Zego] Failed to start call:', error);
      setIsCallActive(false);
      alert('Failed to start call. Please try again.');
    }
  }, [channelId, userId, userName, requestPermissions, startPublishing]);

  /**
   * End call
   */
  const endCall = useCallback(async () => {
    try {
      addDebug('[Zego] Ending call...');

      // Stop publishing
      await zegoServiceRef.current.stopPublishing();

      // Logout from room
      await zegoServiceRef.current.logoutRoom();

      // Clear state
      setIsCallActive(false);
      setParticipants([]);
      setRemoteStreams(new Map());
      setPermissionStatus('idle');
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      setConnectionStatus('disconnected');

      addDebug('[Zego] Call ended');

      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error) {
      console.error('[Zego] Error ending call:', error);
      addDebug(`[Zego] Error ending call: ${error.message}`);
    }
  }, [onCallEnd]);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(async () => {
    try {
      const newState = !isVideoEnabled;
      await zegoServiceRef.current.toggleVideo(newState);
      setIsVideoEnabled(newState);
      addDebug(`[Zego] Video ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('[Zego] Failed to toggle video:', error);
    }
  }, [isVideoEnabled]);

  /**
   * Toggle audio
   */
  const toggleAudio = useCallback(async () => {
    try {
      const newState = !isAudioEnabled;
      await zegoServiceRef.current.toggleAudio(newState);
      setIsAudioEnabled(newState);
      addDebug(`[Zego] Audio ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('[Zego] Failed to toggle audio:', error);
    }
  }, [isAudioEnabled]);

  /**
   * Auto-start call if needed
   */
  useEffect(() => {
    if (autoStart && !isCallActive && channelId) {
      const timer = setTimeout(() => {
        startCall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isCallActive, channelId, startCall]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, []);

  if (!channelId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📹</div>
          <p className="text-lg text-gray-600">Please select a conversation to start a video call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col min-h-0">
      {debugMsg && (
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-900 rounded text-xs">
          {debugMsg}
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Video Call (ZegoCloud) - {channelId}
      </h3>

      {/* Connection Status */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className="text-sm text-gray-600">
          {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Camera/Microphone Access Denied</h4>
              <p className="text-red-600 text-sm mt-1">{permissionError}</p>
              <button
                onClick={requestPermissions}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
            <span className="text-yellow-800">Requesting permissions...</span>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 mb-4 min-h-0">
        {/* Local Video */}
        <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.values()).map((stream, idx) => (
          <div key={stream.streamID} className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video
              ref={(el) => {
                if (el) remoteVideoRefs.current.set(stream.streamID, el);
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Participants List */}
      {participants.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Participants ({participants.length})</p>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <span key={p.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isCallActive ? (
          <button
            onClick={startCall}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.058.3.102.605.102.924v1.902c0 .319-.044.624-.102.924l1.548.773a1 1 0 01.54 1.06l-.74 4.435a1 1 0 01-.986.836H3a1 1 0 01-1-1V3z" />
            </svg>
            Start Call
          </button>
        ) : (
          <>
            <button
              onClick={toggleVideo}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isVideoEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.293-3.293a1 1 0 111.414 1.414L13.414 9l2.293 2.293a1 1 0 11-1.414 1.414L12 10.414l-2.293 2.293a1 1 0 11-1.414-1.414L10.586 9 8.293 6.707a1 1 0 011.414-1.414L12 7.586l2.293-2.293z" />
              </svg>
              {isVideoEnabled ? 'Video On' : 'Video Off'}
            </button>

            <button
              onClick={toggleAudio}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isAudioEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16A6 6 0 1020 10v1h-2v-1a4 4 0 10-8 0v3.999H8V16z" />
              </svg>
              {isAudioEnabled ? 'Audio On' : 'Audio Off'}
            </button>

            <button
              onClick={endCall}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" clipRule="evenodd" />
              </svg>
              End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ZegoVideoCall;
