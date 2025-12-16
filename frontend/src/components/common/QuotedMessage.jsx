import React from 'react';

/**
 * Quoted Message Component
 * Displays a quoted/replied message reference
 */
const QuotedMessage = ({ quotedMessage, onRemove }) => {
  if (!quotedMessage) return null;

  return (
    <div className="bg-gray-100 border-l-4 border-blue-500 p-3 rounded-lg mb-2 flex items-start gap-2">
      {/* Quote Icon */}
      <div className="text-blue-500 text-lg flex-shrink-0">
        💬
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 mb-1">
          {quotedMessage.senderName}
        </p>
        <p className="text-sm text-gray-600 truncate">
          {quotedMessage.content || '📎 Media'}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-all"
        title="Remove quote"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default QuotedMessage;
