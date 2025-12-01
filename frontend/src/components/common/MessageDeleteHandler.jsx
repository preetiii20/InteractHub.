import React, { useState } from 'react';

/**
 * MessageDeleteHandler
 * Handles soft delete functionality for messages
 * Allows "Delete for me" and "Delete for everyone" options
 */
const MessageDeleteHandler = ({ message, onDelete, currentUser }) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(message?.isDeleted || false);

  const handleDeleteForMe = async () => {
    try {
      // Call backend to mark message as deleted for current user
      const response = await fetch('http://localhost:8085/api/chat/message/delete-for-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          userId: currentUser,
        }),
      });

      if (response.ok) {
        setIsDeleted(true);
        onDelete?.('me');
      }
    } catch (error) {
      console.error('Error deleting message for me:', error);
    }
    setShowDeleteMenu(false);
  };

  const handleDeleteForEveryone = async () => {
    try {
      // Call backend to mark message as deleted for everyone
      const response = await fetch('http://localhost:8085/api/chat/message/delete-for-everyone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          userId: currentUser,
        }),
      });

      if (response.ok) {
        setIsDeleted(true);
        onDelete?.('everyone');
      }
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
    }
    setShowDeleteMenu(false);
  };

  // Show deleted message placeholder
  if (isDeleted) {
    return (
      <div className="text-gray-400 italic text-sm">
        This message was deleted
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Delete Menu Button */}
      <button
        onClick={() => setShowDeleteMenu(!showDeleteMenu)}
        className="text-gray-400 hover:text-gray-600 text-lg"
        title="Delete message"
      >
        ⋮
      </button>

      {/* Delete Menu */}
      {showDeleteMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={handleDeleteForMe}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b"
          >
            🗑️ Delete for me
          </button>
          <button
            onClick={handleDeleteForEveryone}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600"
          >
            🗑️ Delete for everyone
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageDeleteHandler;
