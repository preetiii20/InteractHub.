import React, { useState } from 'react';
import { EMOJI_REACTIONS } from '../../utils/whatsappFeatures';

/**
 * Message Reactions Component
 * Displays emoji reactions on messages (WhatsApp-style)
 */
const MessageReactions = ({ messageId, reactions = {}, onAddReaction, onRemoveReaction, currentUser }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleReactionClick = (emoji) => {
    const hasReacted = reactions[emoji]?.includes(currentUser);
    
    if (hasReacted) {
      onRemoveReaction?.(messageId, emoji, currentUser);
    } else {
      onAddReaction?.(messageId, emoji, currentUser);
    }
    
    setShowPicker(false);
  };

  // Get all unique reactions
  const uniqueReactions = Object.keys(reactions).filter(emoji => reactions[emoji]?.length > 0);

  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap px-1.5">
      {/* Display existing reactions */}
      {uniqueReactions.map(emoji => {
        const count = reactions[emoji]?.length || 0;
        const hasReacted = reactions[emoji]?.includes(currentUser);
        
        return (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              hasReacted
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
            title={reactions[emoji]?.join(', ')}
          >
            <span>{emoji}</span>
            {count > 1 && <span className="text-xs">{count}</span>}
          </button>
        );
      })}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center justify-center w-6 h-6 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
          title="Add reaction"
        >
          +
        </button>

        {/* Emoji picker - positioned above reactions */}
        {showPicker && (
          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-50 flex flex-wrap gap-1 w-48">
            {EMOJI_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
