import React, { useState } from 'react';
import { Avatar } from '../../utils/avatarGenerator';

/**
 * Group Info Modal
 * Displays group details and member list with avatars
 * Provides leave and delete group options
 */
const GroupInfoModal = ({ isOpen, onClose, groupId, groupName, members = [], createdBy, createdAt, currentUser, onGroupLeft, onGroupDeleted }) => {
  const [showMembers, setShowMembers] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isCreator = currentUser && createdBy && currentUser.toLowerCase() === createdBy.toLowerCase();

  const handleLeaveGroup = async () => {
    if (!currentUser || !groupId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8085/api/group/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberEmail: currentUser })
      });

      if (response.ok) {
        console.log('✅ Left group successfully');
        onClose();
        if (onGroupLeft) onGroupLeft(groupId);
      } else {
        alert('Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Error leaving group');
    } finally {
      setIsLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentUser || !groupId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8085/api/group/${groupId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorEmail: currentUser })
      });

      if (response.ok) {
        console.log('✅ Group deleted successfully');
        onClose();
        if (onGroupDeleted) onGroupDeleted(groupId);
      } else {
        alert('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={groupName} size={48} />
            <div>
              <h2 className="text-xl font-bold">{groupName}</h2>
              <p className="text-sm text-blue-100">{members.length} members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Group Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">GROUP INFO</h3>
            <div className="space-y-2 text-sm">
              {createdBy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created by:</span>
                  <span className="font-medium text-gray-900">{createdBy}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3">MEMBERS ({members.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Avatar name={member} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{member}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">●</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
          >
            Leave
          </button>
          {isCreator && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Leave Confirmation Dialog */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Leave Group?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave <strong>{groupName}</strong>? You can rejoin if invited again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">Delete Group?</h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{groupName}</strong>?
            </p>
            <p className="text-gray-500 text-sm mb-6">
              ⚠️ This action is permanent. All messages and group data will be deleted for everyone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInfoModal;
