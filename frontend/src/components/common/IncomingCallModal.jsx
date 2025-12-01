import React, { useState, useEffect } from 'react';
import { Avatar } from '../../utils/avatarGenerator';

/**
 * Incoming Call Modal
 * Displays incoming call notification with Accept/Decline options
 */
const IncomingCallModal = ({ isOpen, onClose, callerName, callType = 'VIDEO', onAccept, onDecline }) => {
  const [ringing, setRinging] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setRinging(false);
      return;
    }

    // Play ringing sound effect (optional)
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    const interval = setInterval(() => {
      audio.play().catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        {/* Avatar */}
        <div className="mb-6 flex justify-center">
          <div className={`relative ${ringing ? 'animate-pulse' : ''}`}>
            <Avatar name={callerName} size={96} />
            {ringing && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping" />
            )}
          </div>
        </div>

        {/* Caller Info */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{callerName}</h2>
        <p className="text-lg text-gray-600 mb-8">
          {callType === 'VIDEO' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call'}
        </p>

        {/* Ringing Animation */}
        {ringing && (
          <div className="flex justify-center gap-1 mb-8">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setRinging(false);
              onDecline?.();
              onClose();
            }}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 font-semibold text-lg"
          >
            ✕ Decline
          </button>
          <button
            onClick={() => {
              setRinging(false);
              onAccept?.();
              onClose();
            }}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all transform hover:scale-105 active:scale-95 font-semibold text-lg"
          >
            ✓ Accept
          </button>
        </div>

        {/* Call Type Info */}
        <p className="text-xs text-gray-500 mt-6">
          {callType === 'VIDEO' ? 'Your camera and microphone will be enabled' : 'Your microphone will be enabled'}
        </p>
      </div>
    </div>
  );
};

export default IncomingCallModal;
