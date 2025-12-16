import React, { useState, useEffect, useRef, useCallback } from 'react';

const JitsiVideoCall = ({ channelId, userId, userName, autoStart = false, prefetchMedia = false, onCancel, onCallEnd }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [participants, setParticipants] = useState([]);
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  /**
   * Start call using Jitsi iframe
   */
  const startCall = useCallback(async () => {
    if (!channelId) {
      alert('Please select a recipient first');
      return;
    }

    try {
      console.log('[Jitsi] Starting call with room:', channelId);
      setIsCallActive(true);
      setParticipants([userName || userId]); // Add self as first participant
    } catch (error) {
      console.error('[Jitsi] Failed to start call:', error);
      alert('Failed to start call. Please try again.');
    }
  }, [channelId, userId, userName]);

  /**
   * End call and broadcast to other participants
   */
  const endCall = useCallback(() => {
    try {
      console.log('[Jitsi] Ending call...');
      setIsCallActive(false);
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
      console.error('[Jitsi] Error ending call:', error);
    }
  }, [channelId, userId, onCallEnd]);

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
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-8 h-full flex items-center justify-center border border-purple-100">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">📹</div>
          <p className="text-lg text-gray-700 font-medium">Please select a conversation to start a video call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col min-h-0">
      {!isCallActive ? (
        <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg shadow-lg p-8 h-full flex flex-col items-center justify-center border border-purple-100">
          <div className="text-center">
            {autoStart ? (
              <>
                <div className="text-8xl mb-6 animate-pulse">📹</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to start a video call?</h2>
                <p className="text-gray-600 mb-8">Connect face-to-face with HD video</p>
                <button
                  onClick={startCall}
                  className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full hover:from-purple-600 hover:to-pink-700 flex items-center gap-3 mx-auto text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.058.3.102.605.102.924v1.902c0 .319-.044.624-.102.924l1.548.773a1 1 0 01.54 1.06l-.74 4.435a1 1 0 01-.986.836H3a1 1 0 01-1-1V3z" />
                  </svg>
                  Start Video Call
                </button>
              </>
            ) : (
              <>
                <div className="text-8xl mb-6 animate-bounce">📞</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Calling...</h2>
                <p className="text-gray-600 mb-8">Waiting for recipient to accept</p>
                <div className="flex justify-center gap-1 mb-8">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        <div className="flex flex-col h-full min-h-0 p-4 gap-3">
          {/* Jitsi Container - Takes most space */}
          <div
            ref={containerRef}
            className="flex-1 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 min-h-0 shadow-lg border-2 border-slate-700"
            style={{ minHeight: '350px' }}
          >
            <iframe
              src={`https://meet.jit.si/${channelId}?userInfo.displayName=${encodeURIComponent(userName || userId)}&config.toolbarButtons=["microphone","camera","closedcaptions","desktop","fullscreen","hangup","chat","raisehand","videoquality","settings"]&config.brandingDataUrl=false&config.disableBrandingLogo=true`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              allow="camera; microphone; display-capture"
              title="Jitsi Meet"
            />
          </div>

          {/* Participants List */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-700 mb-2">👥 Active Participants ({participants.length})</p>
            <div className="flex flex-wrap gap-2">
              {participants.length > 0 ? (
                participants.map((participant, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white text-purple-700 text-xs rounded-full border border-purple-200 font-medium">
                    {participant}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 bg-white text-purple-700 text-xs rounded-full border border-purple-200 font-medium">
                  {userName || userId}
                </span>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex gap-3 justify-center flex-shrink-0">
            <button
              onClick={endCall}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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

export default JitsiVideoCall;
