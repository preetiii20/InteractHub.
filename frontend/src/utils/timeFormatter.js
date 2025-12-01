/**
 * Time Formatter Utility
 * Provides human-readable relative timestamps
 */

/**
 * Format timestamp as relative time
 * @param {string|Date|number} timestamp - Timestamp to format
 * @returns {string} - Relative time string (e.g., "Just now", "5 min ago")
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now - messageTime;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return messageTime.toLocaleDateString();
};

/**
 * Format timestamp as full date and time
 * @param {string|Date|number} timestamp - Timestamp to format
 * @returns {string} - Full date and time string
 */
export const getFullDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Format timestamp as time only (HH:MM)
 * @param {string|Date|number} timestamp - Timestamp to format
 * @returns {string} - Time string (e.g., "14:30")
 */
export const getTimeOnly = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Format timestamp as date only (MMM DD, YYYY)
 * @param {string|Date|number} timestamp - Timestamp to format
 * @returns {string} - Date string (e.g., "Dec 01, 2025")
 */
export const getDateOnly = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

/**
 * Check if two timestamps are on the same day
 * @param {string|Date|number} timestamp1 - First timestamp
 * @param {string|Date|number} timestamp2 - Second timestamp
 * @returns {boolean} - True if same day
 */
export const isSameDay = (timestamp1, timestamp2) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export default {
  getRelativeTime,
  getFullDateTime,
  getTimeOnly,
  getDateOnly,
  isSameDay,
};
