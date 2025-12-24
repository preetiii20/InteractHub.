import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import ChatWindow from '../common/ChatWindow';

const ProjectGroupManagement = () => {
  const navigate = useNavigate();
  const [projectGroups, setProjectGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatGroupId, setChatGroupId] = useState(null);
  const [selectedGroupForChat, setSelectedGroupForChat] = useState(null);

  // Get managerId from authentication context
  const managerId = authHelpers.getUserId();

  // New group form state
  const [newGroup, setNewGroup] = useState({
    projectId: '',
    groupName: '',
    description: '',
    employeeIds: []
  });

  // Ensure projectGroups is always an array before mapping
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId.toString()
      };

      const [groupsResponse, projectsResponse, employeesResponse] = await Promise.allSettled([
        axios.get(`${apiConfig.managerService}/project-groups/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/projects/my/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/employees/${managerId}`, { headers: authHeaders })
      ]);

      const groups = groupsResponse.status === 'fulfilled' ? groupsResponse.value.data : [];
      const projects = projectsResponse.status === 'fulfilled' ? projectsResponse.value.data : [];
      const employees = employeesResponse.status === 'fulfilled' ? employeesResponse.value.data : [];

      setProjectGroups(Array.isArray(groups) ? groups : []);
      setProjects(Array.isArray(projects) ? projects : []);
      setEmployees(Array.isArray(employees) ? employees : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    fetchData();
  }, [managerId, fetchData]);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    try {
      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId.toString()
      };

      const groupData = {
        name: newGroup.groupName,
        description: newGroup.description,
        projectId: parseInt(newGroup.projectId),
        employeeIds: newGroup.employeeIds || []
      };

      console.log('Creating project group with data:', {
        name: groupData.name,
        projectId: groupData.projectId,
        employeeIds: groupData.employeeIds,
        employeeIdsCount: groupData.employeeIds.length
      });

      const response = await axios.post(`${apiConfig.managerService}/project-groups`, groupData, { headers: authHeaders });

      console.log('Project group created, response:', {
        status: response.status,
        data: response.data,
        employeeIds: response.data?.employeeIds,
        employeeIdsCount: response.data?.employeeIds?.length || 0
      });

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Group created successfully. Response data:', response.data);
        
        // Add a small delay to ensure backend has fully processed
        setTimeout(() => {
          setShowAddForm(false);
          setNewGroup({
            projectId: '',
            groupName: '',
            description: '',
            employeeIds: []
          });
          fetchData(); // Refresh the list
        }, 500);
      }
    } catch (error) {
      console.error('Error adding project group:', error);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating project group:', editingGroup);
      
      const response = await axios.put(
        `${apiConfig.managerService}/project-groups/${editingGroup.id}`,
        editingGroup
      );

      if (response.status === 200) {
        console.log('Successfully updated project group');
        setEditingGroup(null);
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating project group:', error);
      alert('Failed to update project group. Please check console for details.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this project group?')) {
      try {
        const response = await axios.delete(`${apiConfig.managerService}/project-groups/${groupId}`);

        if (response.status === 200) {
          fetchData(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting project group:', error);
      }
    }
  };

  const handleAddEmployeeToGroup = async (groupId, employeeId) => {
    try {
      console.log('Adding employee to group:', { groupId, employeeId });
      
      const response = await axios.put(
        `${apiConfig.managerService}/project-groups/${groupId}/add-employee/${employeeId}`
      );

      if (response.status === 200) {
        console.log('Successfully added employee to group');
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding employee to group:', error);
      alert('Failed to add employee to group. Please check console for details.');
    }
  };

  const handleRemoveEmployeeFromGroup = async (groupId, employeeId) => {
    try {
      console.log('Removing employee from group:', { groupId, employeeId });
      
      const response = await axios.put(
        `${apiConfig.managerService}/project-groups/${groupId}/remove-employee/${employeeId}`
      );

      if (response.status === 200) {
        console.log('Successfully removed employee from group');
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error removing employee from group:', error);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setNewGroup(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter(id => id !== employeeId)
        : [...prev.employeeIds, employeeId]
    }));
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Project Group Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Project Group
        </button>
      </div>

      {/* Add Project Group Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Create New Project Group</h3>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={newGroup.projectId}
                onChange={(e) => setNewGroup({...newGroup, projectId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Group Name"
              value={newGroup.groupName}
              onChange={(e) => setNewGroup({...newGroup, groupName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <textarea
              placeholder="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Employees</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {employees.map(employee => (
                  <label key={employee.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newGroup.employeeIds.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm">{employee.firstName} {employee.lastName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Create Group
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Groups List */}
      <div className="space-y-4">
        {projectGroups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-600">Project: {getProjectName(group.projectId)}</p>
                {group.description && (
                  <p className="text-gray-700 mt-2">{group.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Kanban feature removed
                  }}
                  className="hidden"
                >
                  📋 View Kanban
                </button>
                <button
                  onClick={async () => {
                    try {
                      const authHeaders = {
                        'X-User-Name': authHelpers.getUserEmail() || 'manager',
                        'X-User-Role': 'MANAGER',
                        'X-Manager-Id': managerId.toString()
                      };

                      if (group.chatGroupId) {
                        setChatGroupId(group.chatGroupId);
                        setSelectedGroupForChat(group);
                        setShowChat(true);
                      } else {
                        // Fetch or create chat group ID
                        console.log('Fetching chat group ID for group:', {
                          id: group.id,
                          name: group.name,
                          projectId: group.projectId,
                          fullGroup: group
                        });
                        const response = await axios.get(
                          `${apiConfig.managerService}/project-groups/${group.id}/chat-id`,
                          { headers: authHeaders }
                        );
                        
                        if (response.data && response.data.chatGroupId && response.data.chatGroupId.trim() !== '') {
                          setChatGroupId(response.data.chatGroupId);
                          setSelectedGroupForChat(group);
                          setShowChat(true);
                          
                          // If chat group was just created, show a message
                          if (response.data.message && response.data.message.includes('created')) {
                            console.log('Chat group created successfully');
                          }
                        } else {
                          const errorMsg = response.data?.message || 'Chat group not available yet.';
                          alert(errorMsg);
                        }
                      }
                    } catch (err) {
                      console.error('Error opening chat:', err);
                      console.error('Error response:', err.response);
                      console.error('Error response data:', err.response?.data);
                      console.error('Error status:', err.response?.status);
                      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to open chat. Please try again.';
                      const statusCode = err.response?.status;
                      if (statusCode === 404) {
                        alert(`Project group not found. Please refresh and try again.`);
                      } else {
                        alert(`Failed to open chat: ${errorMessage}`);
                      }
                    }
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  💬 View Chat
                </button>
                <button
                  onClick={() => setEditingGroup(group)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Group Members */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Group Members ({group.employeeIds?.length || 0})</h4>
              <div className="flex flex-wrap gap-2">
                {group.employeeIds?.map(employeeId => (
                  <div key={employeeId} className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm">{getEmployeeName(employeeId)}</span>
                    <button
                      onClick={() => handleRemoveEmployeeFromGroup(group.id, employeeId)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Employee to Group */}
              <div className="mt-3">
                <select
                  onChange={(e) => {
                    console.log('Dropdown changed:', e.target.value);
                    if (e.target.value) {
                      const employeeId = parseInt(e.target.value);
                      console.log('Attempting to add employee:', employeeId, 'to group:', group.id);
                      handleAddEmployeeToGroup(group.id, employeeId);
                      // Reset dropdown
                      setTimeout(() => {
                        e.target.value = '';
                      }, 100);
                    }
                  }}
                  className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Add employee...</option>
                  {employees
                    .filter(emp => !group.employeeIds?.includes(emp.id))
                    .map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </option>
                    ))
                  }
                  {employees.filter(emp => !group.employeeIds?.includes(emp.id)).length === 0 && (
                    <option value="" disabled>No available employees</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projectGroups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No project groups found. Create one to get started!</p>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Project Group</h3>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <input
                type="text"
                placeholder="Group Name"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Description"
                value={editingGroup.description}
                onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Window Modal */}
      {showChat && chatGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedGroupForChat ? `${selectedGroupForChat.name} - Group Chat` : 'Project Group Chat'}
              </h2>
              <button
                onClick={() => {
                  setShowChat(false);
                  setChatGroupId(null);
                  setSelectedGroupForChat(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <ChatWindow
                channelId={`GROUP_${chatGroupId}`}
                selfName={authHelpers.getUserName() || authHelpers.getUserEmail() || 'Manager'}
                selfIdentifier={authHelpers.getUserEmail() || authHelpers.getUserId()?.toString() || ''}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectGroupManagement;
