/**
 * WhatsApp-like Features Utilities
 * Includes read receipts, typing indicators, message reactions, etc.
 */

// Message Status Types
export const MESSAGE_STATUS = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED'
};

// Get status icon (blue ticks)
export const getStatusIcon = (status) => {
  switch (status) {
    case MESSAGE_STATUS.READ:
      return '✓✓'; // Double blue tick
    case MESSAGE_STATUS.DELIVERED:
      return '✓✓'; // Double gray tick
    case MESSAGE_STATUS.SENT:
      return '✓'; // Single tick
    case MESSAGE_STATUS.SENDING:
      return '⏱'; // Clock
    case MESSAGE_STATUS.FAILED:
      return '❌'; // Error
    default:
      return '';
  }
};

// Get status color
export const getStatusColor = (status) => {
  switch (status) {
    case MESSAGE_STATUS.READ:
      return 'text-blue-500';
    case MESSAGE_STATUS.DELIVERED:
      return 'text-gray-400';
    case MESSAGE_STATUS.SENT:
      return 'text-gray-400';
    case MESSAGE_STATUS.SENDING:
      return 'text-gray-300';
    case MESSAGE_STATUS.FAILED:
      return 'text-red-500';
    default:
      return 'text-gray-300';
  }
};

// Emoji reactions
export const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🙏'];

// Format time for message timestamps
export const formatMessageTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Check if message is from today
export const isToday = (date) => {
  const today = new Date();
  const msgDate = new Date(date);
  return (
    msgDate.getDate() === today.getDate() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getFullYear() === today.getFullYear()
  );
};

// Check if message is from yesterday
export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date);
  return (
    msgDate.getDate() === yesterday.getDate() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getFullYear() === yesterday.getFullYear()
  );
};

// Format date for message separator
export const formatMessageDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  
  if (isToday(d)) {
    return 'Today';
  } else if (isYesterday(d)) {
    return 'Yesterday';
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }
};

// Check if URL is valid
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Extract URLs from text
export const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get file type icon
export const getFileTypeIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const iconMap = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '🎯',
    pptx: '🎯',
    txt: '📄',
    zip: '📦',
    rar: '📦',
    mp3: '🎵',
    mp4: '🎬',
    avi: '🎬',
    mov: '🎬',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️'
  };
  
  return iconMap[ext] || '📎';
};

// Check if file is image
export const isImageFile = (fileName) => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const ext = fileName.split('.').pop().toLowerCase();
  return imageExts.includes(ext);
};

// Check if file is video
export const isVideoFile = (fileName) => {
  const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'];
  const ext = fileName.split('.').pop().toLowerCase();
  return videoExts.includes(ext);
};

// Check if file is audio
export const isAudioFile = (fileName) => {
  const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
  const ext = fileName.split('.').pop().toLowerCase();
  return audioExts.includes(ext);
};

// Detect mentions in text
export const detectMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

// Highlight mentions in text
export const highlightMentions = (text) => {
  return text.replace(/@(\w+)/g, '<span class="font-bold text-blue-500">@$1</span>');
};

// Check if message contains only emoji
export const isOnlyEmoji = (text) => {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u;
  return emojiRegex.test(text.trim());
};

// Get emoji count
export const getEmojiCount = (text) => {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return (text.match(emojiRegex) || []).length;
};

// Disappearing message timer options (in seconds)
export const DISAPPEARING_MESSAGE_TIMERS = {
  OFF: 0,
  '24_HOURS': 86400,
  '7_DAYS': 604800,
  '90_DAYS': 7776000
};

// Get disappearing message label
export const getDisappearingMessageLabel = (seconds) => {
  switch (seconds) {
    case 0:
      return 'Off';
    case 86400:
      return '24 hours';
    case 604800:
      return '7 days';
    case 7776000:
      return '90 days';
    default:
      return 'Off';
  }
};

// Check if message can be deleted (within 15 minutes)
export const canDeleteMessage = (sentAt) => {
  const now = Date.now();
  const messageTime = new Date(sentAt).getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  return (now - messageTime) < fifteenMinutes;
};

// Get time remaining for message deletion
export const getDeleteTimeRemaining = (sentAt) => {
  const now = Date.now();
  const messageTime = new Date(sentAt).getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  const remaining = fifteenMinutes - (now - messageTime);
  
  if (remaining <= 0) return null;
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// Message search
export const searchMessages = (messages, query) => {
  if (!query.trim()) return messages;
  
  const lowerQuery = query.toLowerCase();
  return messages.filter(msg => {
    const content = (msg.content || '').toLowerCase();
    const senderName = (msg.senderName || '').toLowerCase();
    return content.includes(lowerQuery) || senderName.includes(lowerQuery);
  });
};

// Group messages by date
export const groupMessagesByDate = (messages) => {
  const grouped = {};
  
  messages.forEach(msg => {
    const date = formatMessageDate(msg.sentAt);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(msg);
  });
  
  return grouped;
};

// Export all features
export default {
  MESSAGE_STATUS,
  getStatusIcon,
  getStatusColor,
  EMOJI_REACTIONS,
  formatMessageTime,
  isToday,
  isYesterday,
  formatMessageDate,
  isValidUrl,
  extractUrls,
  formatFileSize,
  getFileTypeIcon,
  isImageFile,
  isVideoFile,
  isAudioFile,
  detectMentions,
  highlightMentions,
  isOnlyEmoji,
  getEmojiCount,
  DISAPPEARING_MESSAGE_TIMERS,
  getDisappearingMessageLabel,
  canDeleteMessage,
  getDeleteTimeRemaining,
  searchMessages,
  groupMessagesByDate
};
