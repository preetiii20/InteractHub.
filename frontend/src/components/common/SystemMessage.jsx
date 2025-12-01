import React from 'react';

/**
 * System Message Component
 * Displays system events like "Admin created the group", "Alice added Bob"
 */
const SystemMessage = ({ message, timestamp }) => {
  if (!message) return null;

  const getIcon = () => {
    if (message.includes('created')) return '👥';
    if (message.includes('added')) return '➕';
    if (message.includes('removed')) return '➖';
    if (message.includes('left')) return '👋';
    if (message.includes('renamed')) return '✏️';
    return 'ℹ️';
  };

  return (
    <div className="flex justify-center my-4 px-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600 text-sm">
        <span className="text-lg">{getIcon()}</span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default SystemMessage;
