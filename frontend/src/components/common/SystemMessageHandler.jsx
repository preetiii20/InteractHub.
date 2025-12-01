import React from 'react';

/**
 * SystemMessageHandler
 * Renders system messages in chat (e.g., "Admin created the group", "Alice added Bob")
 */
const SystemMessageHandler = ({ message }) => {
  if (!message || message.senderName !== 'System') {
    return null;
  }

  // Parse system message content
  const parseSystemMessage = (content) => {
    // Examples:
    // "Admin created the group"
    // "Alice added Bob to the group"
    // "Bob left the group"
    // "Group name changed to Project Alpha"
    // "Group description updated"
    
    return content;
  };

  const displayText = parseSystemMessage(message.content);

  return (
    <div className="flex justify-center my-4">
      <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full shadow-sm">
        <span className="italic">
          {displayText}
        </span>
      </div>
    </div>
  );
};

export default SystemMessageHandler;
