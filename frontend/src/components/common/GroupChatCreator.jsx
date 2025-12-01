import React, { useState } from 'react';
import MultiRecipientSelector from './MultiRecipientSelector';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const GroupChatCreator = ({ onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const currentUserId = authHelpers.getUserId();
  const currentUserName = authHelpers.getUserName();

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please provide a group name and select at least one member.');
      return;
    }

    setIsCreating(true);
    try {
      // Generate a stable group channel ID
      const sortedIds = [...selectedMembers, currentUserId].sort();
      const channelId = `GROUP_${sortedIds.join('_')}`;

      // Create group metadata (optional - could be stored in backend)
      const groupData = {
        channelId,
        name: groupName.trim(),
        members: [...selectedMembers, currentUserId],
        createdBy: currentUserId,
        createdAt: new Date().toISOString()
      };

      // Store group info in localStorage for now (could be sent to backend)
      const existingGroups = JSON.parse(localStorage.getItem('groupChats') || '[]');
      existingGroups.push(groupData);
      localStorage.setItem('groupChats', JSON.stringify(existingGroups));

      // Notify parent component
      onGroupCreated && onGroupCreated(groupData);

      // Reset form
      setGroupName('');
      setSelectedMembers([]);
      
      alert(`Group "${groupName}" created successfully!`);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Create Group Chat</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <MultiRecipientSelector
            roleFilter="MANAGER"
            selectedUsers={selectedMembers}
            onChange={setSelectedMembers}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatCreator;




