import { Avatar } from '../../utils/avatarGenerator';

/**
 * Reaction Details Modal
 * Shows who reacted to a message with their names and avatars
 */
const ReactionDetailsModal = ({ isOpen, onClose, emoji, reactedUsers = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h2 className="text-xl font-bold">{reactedUsers.length} reaction{reactedUsers.length !== 1 ? 's' : ''}</h2>
              <p className="text-sm text-blue-100">Who reacted</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {reactedUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No reactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reactedUsers.map((user, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Avatar name={user} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user}</p>
                    <p className="text-xs text-gray-500 truncate">{user}</p>
                  </div>
                  <span className="text-2xl">{emoji}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactionDetailsModal;
