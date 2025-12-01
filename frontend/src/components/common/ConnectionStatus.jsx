import React, { useState, useEffect } from 'react';

/**
 * Connection Status Indicator
 * Shows visual pulse indicator for active WebSocket connection
 */
const ConnectionStatus = ({ isConnected = true, showLabel = true }) => {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setPulse(false);
      return;
    }

    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1500);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-3 h-3">
        {/* Outer pulse ring */}
        {isConnected && (
          <div
            className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-pulse"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        )}
        {/* Inner dot */}
        <div
          className={`absolute inset-0 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } shadow-lg`}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
