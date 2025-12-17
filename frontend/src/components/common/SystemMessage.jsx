import React from 'react';

/**
 * System Message Component
 * Displays system messages like "User joined", "User left", etc.
 */
const SystemMessage = ({ message, timestamp }) => {
  if (!message) return null;

  return (
    <div className="flex justify-center py-3 px-4">
      <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full max-w-xs text-center">
        <p className="font-medium">{message}</p>
        {timestamp && (
          <p className="text-gray-500 text-xs mt-1">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default SystemMessage;
