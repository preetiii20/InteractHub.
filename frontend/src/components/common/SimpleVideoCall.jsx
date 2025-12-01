import React, { useState, useEffect, useRef } from 'react';

/**
 * Simplified Video Call Component
 * - Easier permission handling
 * - Better error messages
 * - Automatic retry
 * - Works with any browser
 */
const SimpleVideoCall = ({ channelId, userId, userName }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Ready to call');
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Request camera/microphone
  const requestMedia = async () => {
    setError('');
    setStatus('Requesting camera and microphone...');
    
    try {
      // Stop any existing stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Request new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        
        // Force play with multiple attempts
        try {
          await localVideoRef.current.play();
          console.log('Video playing successfully');
        } catch (playError) {
          console.warn('First play attempt failed, retrying...', playError);
          setTimeout(async () => {
            try {
              await localVideoRef.current.play();
              console.log('Video playing after retry');
            } catch (e) {
              console.error('Video play failed:', e);
            }
          }, 100);
        }
      }

      setHasPermissions(true);
      setStatus(`Camera and microphone ready! Using: ${stream.getVideoTracks()[0]?.label || 'Camera'}`);
      return true;
    } catch (err) {
      console.error('Media error:', err);
      
      let errorMsg = 'Could not access camera/microphone. ';
      
      if (err.name === 'NotReadableError') {
        errorMsg += 'Your camera is being used by another application. Please:';
        errorMsg += '\n1. Close ALL other browser tabs';
        errorMsg += '\n2. Close Zoom, Teams, Skype';
        errorMsg += '\n3. Restart your browser';
        errorMsg += '\n4. Try again';
      } else if (err.name === 'NotAllowedError') {
        errorMsg += 'Permission denied. Please:';
        errorMsg += '\n1. Click the camera icon in address bar';
        errorMsg += '\n2. Allow camera and microphone';
        errorMsg += '\n3. Reload the page';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera or microphone found. Please connect a device.';
      } else {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
      setStatus('Error accessing media');
      setHasPermissions(false);
      return false;
    }
  };

  // Start call
  const startCall = async () => {
    const success = await requestMedia();
    if (success) {
      setIsCallActive(true);
      setStatus('Call active');
    }
  };

  // End call
  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    setIsCallActive(false);
    setHasPermissions(false);
    setStatus('Call ended');
  };

  return (
    <div className="card-gradient p-6">
      <h2 className="text-2xl font-bold gradient-text mb-4">
        📹 Simple Video Call
      </h2>

      {/* Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
        <p className="text-sm font-medium text-blue-800">
          Status: {status}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">Error</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap font-sans">
                {error}
              </pre>
              <button
                onClick={requestMedia}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {!isCallActive ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl shadow-2xl">
              📹
            </div>
          </div>
          
          <button
            onClick={startCall}
            className="btn-primary"
          >
            Start Video Call
          </button>
          
          <p className="mt-4 text-sm text-gray-600">
            Click to request camera and microphone access
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Local Video */}
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-96 bg-gray-900 rounded-2xl shadow-2xl object-cover"
              onLoadedMetadata={() => {
                console.log('Video metadata loaded');
                if (localVideoRef.current) {
                  localVideoRef.current.play().catch(e => console.error('Play error:', e));
                }
              }}
              onCanPlay={() => {
                console.log('Video can play');
              }}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
              You ({userName})
            </div>
            {/* Debug info */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
              {localStreamRef.current ? `📹 ${localStreamRef.current.getVideoTracks()[0]?.label || 'Camera Active'}` : '❌ No Stream'}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                if (localVideoRef.current && localStreamRef.current) {
                  console.log('Stream active:', localStreamRef.current.active);
                  console.log('Video tracks:', localStreamRef.current.getVideoTracks());
                  console.log('Video element:', localVideoRef.current);
                  console.log('Video paused:', localVideoRef.current.paused);
                  localVideoRef.current.play().catch(e => console.error('Manual play error:', e));
                }
              }}
              className="btn-secondary"
            >
              🔄 Refresh Video
            </button>
            <button
              onClick={endCall}
              className="btn-danger"
            >
              End Call
            </button>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <h4 className="font-bold text-green-800 mb-2">✅ Success!</h4>
            <p className="text-sm text-green-700">
              Your camera and microphone are working. In a real call, you would see the other person's video here.
            </p>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-2">💡 Troubleshooting Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Close ALL other browser tabs with this application</li>
          <li>• Close Zoom, Teams, Skype, Discord</li>
          <li>• Restart your browser completely</li>
          <li>• Make sure camera is not covered</li>
          <li>• Check browser permissions (camera icon in address bar)</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleVideoCall;
