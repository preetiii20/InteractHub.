import { useState } from 'react';
import { EMOJI_REACTIONS } from '../../utils/whatsappFeatures';
import ReactionDetailsModal from './ReactionDetailsModal';

/**
 * Message Reactions Component
 * Displays emoji reactions on messages (WhatsApp-style)
 */
const MessageReactions = ({ messageId, reactions = {}, onAddReaction, onRemoveReaction, currentUser }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);

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
    <div className="flex items-center gap-1 mt-1.5 flex-wrap px-1.5 overflow-visible">
      {/* Display existing reactions */}
      {uniqueReactions.map(emoji => {
        const count = reactions[emoji]?.length || 0;
        const hasReacted = reactions[emoji]?.includes(currentUser);
        const reactedUsers = reactions[emoji] || [];
        
        return (
          <div key={emoji} className="relative group">
            <button
              onClick={() => setSelectedReaction({ emoji, users: reactedUsers })}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                hasReacted
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>{emoji}</span>
              {count > 1 && <span className="text-xs">{count}</span>}
            </button>
            
            {/* Tooltip showing who reacted on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-40 pointer-events-none">
              {reactedUsers.join(', ')}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        );
      })}

      {/* Add reaction button */}
      <div className="relative z-40">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center justify-center w-6 h-6 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
          title="Add reaction"
        >
          +
        </button>

        {/* Emoji picker - positioned below and centered */}
        {showPicker && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-300 rounded-lg shadow-2xl p-2 z-50 grid grid-cols-4 gap-1 w-48 overflow-hidden">
            {EMOJI_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-2 cursor-pointer hover:bg-gray-100 rounded-lg flex items-center justify-center"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reaction Details Modal */}
      <ReactionDetailsModal
        isOpen={!!selectedReaction}
        onClose={() => setSelectedReaction(null)}
        emoji={selectedReaction?.emoji}
        reactedUsers={selectedReaction?.users || []}
      />
    </div>
  );
};

export default MessageReactions;
