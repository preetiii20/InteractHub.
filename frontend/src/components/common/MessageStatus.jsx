/**
 * Message Status Component
 * Displays message delivery status (SENT, DELIVERED, READ)
 */
const MessageStatus = ({ status = 'SENT', timestamp }) => {
  const getStatusIcon = () => {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return '✓'; // Single checkmark
      case 'DELIVERED':
        return '✓✓'; // Double checkmark
      case 'READ':
        return '✓✓'; // Double checkmark (blue)
      default:
        return '⏱'; // Clock for pending
    }
  };

  const getStatusColor = () => {
    switch (status?.toUpperCase()) {
      case 'READ':
        return 'text-blue-500';
      case 'DELIVERED':
        return 'text-gray-500';
      case 'SENT':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const getStatusLabel = () => {
    switch (status?.toUpperCase()) {
      case 'READ':
        return 'Read';
      case 'DELIVERED':
        return 'Delivered';
      case 'SENT':
        return 'Sent';
      default:
        return 'Sending...';
    }
  };

  return (
    <span className={`font-bold ${getStatusColor()}`} title={getStatusLabel()}>
      {getStatusIcon()}
    </span>
  );
};

export default MessageStatus;
