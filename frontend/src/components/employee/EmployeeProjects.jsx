import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import ChatWindow from '../common/ChatWindow';

const EmployeeProjects = () => {
    const [projectGroups, setProjectGroups] = useState([]);
    const [projects, setProjects] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [chatGroupId, setChatGroupId] = useState(null);

    useEffect(() => {
        fetchEmployeeProjects();
    }, []);

    const fetchEmployeeProjects = async () => {
        try {
            const employeeId = authHelpers.getUserId();
            if (!employeeId) {
                setError('Employee ID not found. Please log in again.');
                setLoading(false);
                return;
            }

            console.log('Fetching projects for employee ID:', employeeId);
            const url = `${apiConfig.managerService}/employees/${employeeId}/project-groups`;
            console.log('Request URL:', url);

            // Fetch project groups where employee is a member (includes project details)
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response received:', response);

            const data = response.data || {};
            const groups = data.groups || [];
            const projectsData = data.projects || {};

            console.log('Groups:', groups);
            console.log('Projects:', projectsData);

            setProjectGroups(groups);

            // Convert projects map from backend (keys are serialized as strings in JSON)
            const projectsMap = {};
            Object.keys(projectsData).forEach(key => {
                // Use both string and number keys for compatibility
                projectsMap[key] = projectsData[key];
                projectsMap[Number(key)] = projectsData[key];
            });

            setProjects(projectsMap);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching employee projects:', err);
            console.error('Error details:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                url: err.config?.url
            });
            
            const errorMessage = err.response?.status === 404 
                ? 'Projects endpoint not found. Please ensure the manager service is running and the endpoint is available.'
                : `Failed to load projects. ${err.response?.data?.error || err.message}`;
            
            setError(errorMessage);
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusBadgeColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'planned':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchEmployeeProjects}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
                <button
                    onClick={fetchEmployeeProjects}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {projectGroups.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No Projects Assigned</h2>
                    <p className="text-gray-600">
                        You haven't been assigned to any project groups yet. Your manager will add you to projects when needed.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projectGroups.map((group) => {
                        const project = projects[group.projectId];
                        return (
                            <div
                                key={group.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                                onClick={async () => {
                                    setSelectedGroup(group);
                                    // Try to get chat group ID and open chat
                                    try {
                                        if (group.chatGroupId) {
                                            setChatGroupId(group.chatGroupId);
                                            setShowChat(true);
                                        } else {
                                            // Fetch or create chat group ID
                                            const response = await axios.get(
                                                `${apiConfig.managerService}/project-groups/${group.id}/chat-id`
                                            );
                                            if (response.data && response.data.chatGroupId && response.data.chatGroupId.trim() !== '') {
                                                setChatGroupId(response.data.chatGroupId);
                                                setShowChat(true);
                                            } else {
                                                const errorMsg = response.data?.message || 'Chat group not available yet.';
                                                console.warn(errorMsg);
                                            }
                                        }
                                    } catch (err) {
                                        console.error('Error fetching chat group ID:', err);
                                        const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
                                        console.error('Chat error details:', errorMessage);
                                        // Still show details even if chat fails
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                            {group.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">Project Group</p>
                                    </div>
                                    <span className="text-2xl">👥</span>
                                </div>

                                <div className="mb-4">
                                    <p className="text-gray-600 text-sm mb-2">
                                        <strong>Description:</strong>
                                    </p>
                                    <p className="text-gray-700">
                                        {group.description || 'No description provided'}
                                    </p>
                                </div>

                                {project && (
                                    <div className="border-t pt-4 mt-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">
                                            Project: {project.name}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                                        project.status
                                                    )}`}
                                                >
                                                    {project.status || 'N/A'}
                                                </span>
                                            </div>
                                            {project.startDate && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Start Date:</span>
                                                    <span className="text-gray-800">
                                                        {formatDate(project.startDate)}
                                                    </span>
                                                </div>
                                            )}
                                            {project.endDate && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">End Date:</span>
                                                    <span className="text-gray-800">
                                                        {formatDate(project.endDate)}
                                                    </span>
                                                </div>
                                            )}
                                            {project.description && (
                                                <div className="mt-2 pt-2 border-t">
                                                    <p className="text-gray-600 text-xs">
                                                        <strong>Project Description:</strong>
                                                    </p>
                                                    <p className="text-gray-700 text-xs mt-1">
                                                        {project.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!project && (
                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-xs text-gray-500">
                                            Project ID: {group.projectId}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Project details unavailable
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        Created: {formatDate(group.createdAt)}
                                    </span>
                                    <span>
                                        {group.employeeIds?.length || 0} member(s)
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                if (group.chatGroupId) {
                                                    setChatGroupId(group.chatGroupId);
                                                    setShowChat(true);
                                                    } else {
                                                        // Fetch or create chat group ID
                                                        const response = await axios.get(
                                                            `${apiConfig.managerService}/project-groups/${group.id}/chat-id`
                                                        );
                                                        if (response.data && response.data.chatGroupId && response.data.chatGroupId.trim() !== '') {
                                                            setChatGroupId(response.data.chatGroupId);
                                                            setShowChat(true);
                                                        } else {
                                                            const errorMsg = response.data?.message || 'Chat group not available yet. Please contact your manager.';
                                                            alert(errorMsg);
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error('Error opening chat:', err);
                                                    const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to open chat. Please try again.';
                                                    alert(`Failed to open chat: ${errorMessage}`);
                                                }
                                        }}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        💬 Open Group Chat
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chat Window Modal */}
            {showChat && chatGroupId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">Project Group Chat</h2>
                            <button
                                onClick={() => {
                                    setShowChat(false);
                                    setChatGroupId(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                            <ChatWindow
                                channelId={`GROUP_${chatGroupId}`}
                                selfName={authHelpers.getUserName() || authHelpers.getUserEmail() || 'Employee'}
                                selfIdentifier={authHelpers.getUserEmail() || authHelpers.getUserId()?.toString() || ''}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedGroup && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedGroup(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {selectedGroup.name}
                                </h2>
                                <button
                                    onClick={() => setSelectedGroup(null)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-600 mb-1">
                                        Description
                                    </h3>
                                    <p className="text-gray-800">
                                        {selectedGroup.description || 'No description provided'}
                                    </p>
                                </div>

                                {projects[selectedGroup.projectId] && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                            Project Details
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-sm font-semibold text-gray-600">
                                                    Project Name:
                                                </span>
                                                <p className="text-gray-800">
                                                    {projects[selectedGroup.projectId].name}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-gray-600">
                                                    Status:
                                                </span>
                                                <span
                                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                                        projects[selectedGroup.projectId].status
                                                    )}`}
                                                >
                                                    {projects[selectedGroup.projectId].status || 'N/A'}
                                                </span>
                                            </div>
                                            {projects[selectedGroup.projectId].description && (
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-600">
                                                        Project Description:
                                                    </span>
                                                    <p className="text-gray-800 mt-1">
                                                        {projects[selectedGroup.projectId].description}
                                                    </p>
                                                </div>
                                            )}
                                            {projects[selectedGroup.projectId].startDate && (
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-600">
                                                        Start Date:
                                                    </span>
                                                    <p className="text-gray-800">
                                                        {formatDate(projects[selectedGroup.projectId].startDate)}
                                                    </p>
                                                </div>
                                            )}
                                            {projects[selectedGroup.projectId].endDate && (
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-600">
                                                        End Date:
                                                    </span>
                                                    <p className="text-gray-800">
                                                        {formatDate(projects[selectedGroup.projectId].endDate)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="text-sm text-gray-500">
                                        <p>
                                            <strong>Group ID:</strong> {selectedGroup.id}
                                        </p>
                                        <p>
                                            <strong>Project ID:</strong> {selectedGroup.projectId}
                                        </p>
                                        <p>
                                            <strong>Created:</strong>{' '}
                                            {formatDate(selectedGroup.createdAt)}
                                        </p>
                                        <p>
                                            <strong>Members:</strong>{' '}
                                            {selectedGroup.employeeIds?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeProjects;

