import React, { useRef, useEffect, useState } from 'react';
import { canDeleteMessage, getDeleteTimeRemaining } from '../../utils/whatsappFeatures';

/**
 * Message Options Menu
 * Context menu for message actions (reply, forward, delete, etc.)
 */
const MessageOptions = ({ 
  message, 
  currentUser, 
  onReply, 
  onForward, 
  onDelete, 
  onCopy,
  onClose
}) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const isOwnMessage = message.senderName === currentUser;
  const canDelete = isOwnMessage && canDeleteMessage(message.sentAt);
  const deleteTimeRemaining = canDelete ? getDeleteTimeRemaining(message.sentAt) : null;

  useEffect(() => {
    // Position menu relative to viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      let top = rect.top;
      let left = rect.left;
      
      // Adjust if menu goes off-screen
      if (top + 200 > viewportHeight) {
        top = viewportHeight - 220;
      }
      if (left + 150 > viewportWidth) {
        left = viewportWidth - 170;
      }
      
      setPosition({ top, left });
    }
  }, []);

  const options = [
    {
      id: 'reply',
      label: 'Reply',
      icon: '↩️',
      action: () => {
        onReply?.();
        onClose?.();
      },
      show: true
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: '↪️',
      action: () => {
        onForward?.();
        onClose?.();
      },
      show: true
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      action: () => {
        onCopy?.();
        onClose?.();
      },
      show: !!message.content
    },
    {
      id: 'delete',
      label: canDelete ? `Delete (${deleteTimeRemaining})` : 'Delete',
      icon: '🗑️',
      action: () => {
        onDelete?.();
        onClose?.();
      },
      show: isOwnMessage,
      disabled: !canDelete,
      className: !canDelete ? 'opacity-50 cursor-not-allowed' : ''
    }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-300 rounded-lg shadow-xl z-50 py-1 min-w-max"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      {options.map(option => (
        option.show && (
          <button
            key={option.id}
            onClick={() => {
              if (!option.disabled) {
                option.action?.();
              }
            }}
            disabled={option.disabled}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-all flex items-center gap-2 whitespace-nowrap ${option.className || ''}`}
            title={option.label}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        )
      ))}
    </div>
  );
};

export default MessageOptions;
