import React, { useState, useEffect, useRef, useCallback } from 'react';

const VoiceCallComponent = ({ channelId, userId, userName, autoStart = false, prefetchMedia = false, onCancel, onCallEnd }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  const containerRef = useRef(null);
  const callTimerRef = useRef(null);

  /**
   * Start voice call using Jitsi iframe (audio-only mode)
   */
  const startVoiceCall = useCallback(async () => {
    if (!channelId) {
      alert('Please select a recipient first');
      return;
    }

    try {
      console.log('[Voice] Starting voice call with room:', channelId);
      setIsCallActive(true);
      setCallDuration(0);
      setParticipants([userName || userId]); // Add self as first participant
    } catch (error) {
      console.error('[Voice] Failed to start call:', error);
      alert('Failed to start voice call. Please try again.');
    }
  }, [channelId, userId, userName]);

  /**
   * End voice call and broadcast to other participants
   */
  const endVoiceCall = useCallback(() => {
    try {
      console.log('[Voice] Ending voice call...');
      setIsCallActive(false);
      setCallDuration(0);
      setParticipants([]);

      // Broadcast call end event via WebSocket
      try {
        const broadcastCallEnd = async () => {
          const persistentWebSocketService = (await import('../../services/PersistentWebSocketService')).default;
          if (persistentWebSocketService.client && persistentWebSocketService.isConnected) {
            const callEndEvent = {
              type: 'call-ended',
              roomId: channelId,
              fromUser: userId,
              timestamp: Date.now()
            };
            persistentWebSocketService.client.publish({
              destination: `/topic/call.${channelId}`,
              body: JSON.stringify(callEndEvent)
            });
            console.log('📢 Broadcasted call end event');
          }
        };
        broadcastCallEnd();
      } catch (error) {
        console.error('Error broadcasting call end:', error);
      }

      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error) {
      console.error('[Voice] Error ending call:', error);
    }
  }, [channelId, userId, onCallEnd]);

  /**
   * Auto-start call if needed
   */
  useEffect(() => {
    if (autoStart && !isCallActive && channelId) {
      const timer = setTimeout(() => {
        startVoiceCall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isCallActive, channelId, startVoiceCall]);

  /**
   * Call duration timer
   */
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
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endVoiceCall();
      }
    };
  }, []);

  /**
   * Format call duration
   */
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!channelId) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 h-full flex items-center justify-center border border-blue-100">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">📞</div>
          <p className="text-lg text-gray-700 font-medium">Please select a conversation to start a voice call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col min-h-0">
      {!isCallActive ? (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg shadow-lg p-8 h-full flex flex-col items-center justify-center border border-blue-100">
          <div className="text-center">
            {autoStart ? (
              <>
                <div className="text-8xl mb-6 animate-pulse">🎤</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to start a voice call?</h2>
                <p className="text-gray-600 mb-8">Connect with crystal clear audio</p>
                <button
                  onClick={startVoiceCall}
                  className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 flex items-center gap-3 mx-auto text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.058.3.102.605.102.924v1.902c0 .319-.044.624-.102.924l1.548.773a1 1 0 01.54 1.06l-.74 4.435a1 1 0 01-.986.836H3a1 1 0 01-1-1V3z" />
                  </svg>
                  Start Voice Call
                </button>
              </>
            ) : (
              <>
                <div className="text-8xl mb-6 animate-bounce">📞</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Calling...</h2>
                <p className="text-gray-600 mb-8">Waiting for recipient to accept</p>
                <div className="flex justify-center gap-1 mb-8">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <button
                  onClick={onCancel}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 flex items-center gap-2 mx-auto font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" clipRule="evenodd" />
                  </svg>
                  Cancel Call
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0 p-3 gap-2">
          {/* Call Header with Duration */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-md flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">Voice call in progress</span>
              </div>
              <div className="text-2xl font-bold font-mono">
                {formatDuration(callDuration)}
              </div>
            </div>
          </div>

          {/* Jitsi Container - Audio Only */}
          <div
            ref={containerRef}
            className="flex-1 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg border-2 border-slate-700 min-h-0"
          >
            <iframe
              src={`https://meet.jit.si/${channelId}?userInfo.displayName=${encodeURIComponent(userName || userId)}&config.startAudioOnly=true&config.startWithAudioMuted=false&config.startWithVideoMuted=true&config.disableProfile=false&config.prejoinPageEnabled=false&config.toolbarButtons=["microphone","hangup","chat","raisehand","settings"]&config.brandingDataUrl=false&config.disableBrandingLogo=true`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              allow="microphone; display-capture"
              title="Jitsi Meet Voice Call"
            />
          </div>

          {/* Audio Visualization */}
          <div className="flex justify-center p-2 bg-white rounded-lg shadow-md flex-shrink-0">
            <div className="flex items-center space-x-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-green-500 to-emerald-400 shadow-lg"
                  style={{
                    height: `${16 + Math.random() * 24}px`,
                    animationDelay: `${i * 0.1}s`,
                    animation: 'pulse 0.8s ease-in-out infinite'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-700 mb-1.5">👥 Participants ({participants.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {participants.length > 0 ? (
                participants.map((participant, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 bg-white text-green-700 text-xs rounded-full border border-green-200 font-medium">
                    {participant}
                  </span>
                ))
              ) : (
                <span className="px-2.5 py-0.5 bg-white text-green-700 text-xs rounded-full border border-green-200 font-medium">
                  {userName || userId}
                </span>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex gap-2 justify-center flex-shrink-0">
            <button
              onClick={endVoiceCall}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" clipRule="evenodd" />
              </svg>
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCallComponent;
