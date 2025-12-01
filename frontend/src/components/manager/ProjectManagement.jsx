import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import ChatWindow from '../common/ChatWindow';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [projectGroups, setProjectGroups] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newGroup, setNewGroup] = useState({ groupName: '', description: '' });
  const [showChat, setShowChat] = useState(false);
  const [chatGroupId, setChatGroupId] = useState(null);
  const [selectedGroupForChat, setSelectedGroupForChat] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const managerId = authHelpers.getUserId();
      if (!managerId) return;

      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId.toString()
      };

      const [projectsResponse, groupsResponse] = await Promise.allSettled([
        axios.get(`${apiConfig.managerService}/projects/my/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/project-groups/${managerId}`, { headers: authHeaders })
      ]);

      const projectsData = projectsResponse.status === 'fulfilled' ? projectsResponse.value.data : [];
      const groupsData = groupsResponse.status === 'fulfilled' ? groupsResponse.value.data : [];

      setProjects(projectsData);
      setProjectGroups(groupsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const managerId = authHelpers.getUserId();
      
      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId.toString()
      };

      const projectData = {
        name: newProject.title,
        description: newProject.description,
        startDate: newProject.startDate || null,
        endDate: newProject.endDate || null
      };

      await axios.post(`${apiConfig.managerService}/projects`, projectData, { headers: authHeaders });
      setNewProject({ title: '', description: '', startDate: '', endDate: '' });
      setShowCreateProject(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const createProjectGroup = async () => {
    try {
      // If no project is selected, show error
      if (!selectedProject) {
        alert('Please select a project first');
        return;
      }

      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': authHelpers.getUserId().toString()
      };

      const groupData = {
        name: newGroup.groupName,
        description: newGroup.description,
        projectId: selectedProject.id
      };

      await axios.post(`${apiConfig.managerService}/project-groups`, groupData, { headers: authHeaders });
      setNewGroup({ groupName: '', description: '' });
      setShowCreateGroup(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project group:', error);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      if (!projectId) return;
      if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

      const managerId = authHelpers.getUserId();
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId?.toString()
      };

      await axios.delete(`${apiConfig.managerService}/projects/${projectId}`, { headers: authHeaders });
      // Remove from local state for snappy UI, then refresh
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setSelectedProject(null);
      // Optional: refetch to sync groups
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert(error?.response?.data?.error || 'Failed to delete project');
    }
  };

  const getProjectGroups = (projectId) => {
    return projectGroups.filter(group => group.projectId === projectId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ih-primary text-xl">Loading Projects...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Project Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateProject(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            disabled={projects.length === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              projects.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Create Group
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{project.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{project.description || 'No description'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                project.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
              }`}>
                {project.status}
              </span>
            </div>

            {/* Project Groups */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Project Groups</h4>
              <div className="space-y-2">
                {getProjectGroups(project.id).map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{group.name}</p>
                      <p className="text-xs text-gray-600">{group.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {group.employeeIds?.length || 0} members
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            if (group.chatGroupId) {
                              setChatGroupId(group.chatGroupId);
                              setSelectedGroupForChat(group);
                              setShowChat(true);
                            } else {
                              // Fetch or create chat group ID
                              const response = await axios.get(
                                `${apiConfig.managerService}/project-groups/${group.id}/chat-id`,
                                {
                                  headers: {
                                    'X-User-Name': authHelpers.getUserEmail() || 'manager',
                                    'X-User-Role': 'MANAGER',
                                    'X-Manager-Id': authHelpers.getUserId().toString()
                                  }
                                }
                              );
                              if (response.data && response.data.chatGroupId && response.data.chatGroupId.trim() !== '') {
                                setChatGroupId(response.data.chatGroupId);
                                setSelectedGroupForChat(group);
                                setShowChat(true);
                              } else {
                                const errorMsg = response.data?.message || 'Chat group not available yet.';
                                alert(errorMsg);
                              }
                            }
                          } catch (err) {
                            console.error('Error opening chat:', err);
                            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to open chat. Please try again.';
                            alert(`Failed to open chat: ${errorMessage}`);
                          }
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                ))}
                {getProjectGroups(project.id).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No groups created yet</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedProject(project)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  setSelectedProject(project);
                  setShowCreateGroup(true);
                }}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
              >
                Add Group
              </button>
              <button
                onClick={() => deleteProject(project.id)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Projects Yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowCreateProject(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter project description"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createProject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProject({ title: '', description: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Project Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Create Project Group
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Project</label>
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === parseInt(e.target.value));
                    setSelectedProject(project);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={newGroup.groupName}
                  onChange={(e) => setNewGroup({ ...newGroup, groupName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Enter group description"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createProjectGroup}
                disabled={!selectedProject || !newGroup.groupName}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  !selectedProject || !newGroup.groupName
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Create Group
              </button>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroup({ groupName: '', description: '' });
                  setSelectedProject(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && !showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{selectedProject.name}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => deleteProject(selectedProject.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Delete Project
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Project Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedProject.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      selectedProject.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                      selectedProject.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Created</label>
                    <p className="text-sm text-gray-800">
                      {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {selectedProject.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Project Groups */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Project Groups</h3>
                <div className="space-y-3">
                  {getProjectGroups(selectedProject.id).map((group) => (
                    <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{group.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {group.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Members: {group.employeeIds?.length || 0}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-gray-500">
                            ID: {group.id}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                if (group.chatGroupId) {
                                  setChatGroupId(group.chatGroupId);
                                  setSelectedGroupForChat(group);
                                  setShowChat(true);
                                } else {
                                  // Fetch or create chat group ID
                                  const response = await axios.get(
                                    `${apiConfig.managerService}/project-groups/${group.id}/chat-id`,
                                    {
                                      headers: {
                                        'X-User-Name': authHelpers.getUserEmail() || 'manager',
                                        'X-User-Role': 'MANAGER',
                                        'X-Manager-Id': authHelpers.getUserId().toString()
                                      }
                                    }
                                  );
                                  if (response.data && response.data.chatGroupId && response.data.chatGroupId.trim() !== '') {
                                    setChatGroupId(response.data.chatGroupId);
                                    setSelectedGroupForChat(group);
                                    setShowChat(true);
                                  } else {
                                    const errorMsg = response.data?.message || 'Chat group not available yet.';
                                    alert(errorMsg);
                                  }
                                }
                              } catch (err) {
                                console.error('Error opening chat:', err);
                                const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to open chat. Please try again.';
                                alert(`Failed to open chat: ${errorMessage}`);
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            💬 Open Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getProjectGroups(selectedProject.id).length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No groups created for this project yet</p>
                      <button
                        onClick={() => {
                          setShowCreateGroup(true);
                        }}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Create First Group
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Chat Window Modal */}
      {showChat && chatGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
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
    </motion.div>
  );
};

export default ProjectManagement;
