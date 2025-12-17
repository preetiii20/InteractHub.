import { useState, useRef, useEffect } from 'react';
import { Avatar } from '../../utils/avatarGenerator';

/**
 * Mention Input Component
 * Allows users to mention (@tag) other users in messages
 */
const MentionInput = ({ value, onChange, onMention, onKeyDown, members = [], nameMap = {} }) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const inputRef = useRef(null);

  // Filter members based on search - calculate before useEffect
  const filteredMembers = members.filter(member =>
    member.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Detect @ symbol and show mention suggestions
  useEffect(() => {
    if (!inputRef.current) return;

    const text = value;
    const cursorPos = inputRef.current.selectionStart;

    // Find the last @ symbol before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Only show mentions if @ is followed by text without space
      if (searchText && !searchText.includes(' ')) {
        setMentionSearch(searchText);
        setShowMentions(true);
      } else if (!searchText) {
        setMentionSearch('');
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [value]);



  const handleMentionSelect = (member) => {
    const text = value;
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const beforeMention = text.substring(0, lastAtIndex);
      const afterMention = text.substring(cursorPos);
      // Use display name if available, otherwise use email
      const displayName = nameMap[member] || member;
      const newText = `${beforeMention}@${displayName} ${afterMention}`;

      onChange({ target: { value: newText } });
      onMention?.(member);
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  return (
    <div className="relative w-full overflow-visible">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type @ to mention someone..."
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 text-sm"
      />

      {/* Mention suggestions dropdown */}
      {showMentions && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-48 overflow-y-auto">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, idx) => {
              const displayName = nameMap[member] || member;
              return (
                <button
                  key={idx}
                  onClick={() => handleMentionSelect(member)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
                >
                  <Avatar name={displayName} size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{member}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {members.length === 0 ? 'No members available' : 'No matches found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
