/**
 * Avatar Generator Utility
 * Generates colored circles with initials for users/groups
 */

const colors = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-red-400 to-red-600',
  'from-orange-400 to-orange-600',
  'from-yellow-400 to-yellow-600',
  'from-green-400 to-green-600',
  'from-teal-400 to-teal-600',
  'from-cyan-400 to-cyan-600',
  'from-indigo-400 to-indigo-600',
];

/**
 * Generate a consistent color based on a string
 * @param {string} str - Input string (name, email, etc.)
 * @returns {string} - Tailwind gradient class
 */
export const getColorForString = (str) => {
  if (!str) return colors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Avatar component
 * @param {string} name - User/group name
 * @param {string} imageUrl - Optional image URL
 * @param {number} size - Avatar size in pixels (default: 32)
 * @returns {JSX.Element}
 */
export const Avatar = ({ name = 'User', imageUrl = null, size = 32 }) => {
  const sizeClass = {
    24: 'w-6 h-6 text-xs',
    32: 'w-8 h-8 text-sm',
    40: 'w-10 h-10 text-base',
    48: 'w-12 h-12 text-lg',
    56: 'w-14 h-14 text-xl',
    64: 'w-16 h-16 text-2xl',
  }[size] || 'w-8 h-8 text-sm';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-md`}
      />
    );
  }

  const gradient = getColorForString(name);
  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shadow-md`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default {
  getColorForString,
  getInitials,
  Avatar,
};
