import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { authHelpers } from '../../config/auth';
import CalendarComponent from '../common/CalendarComponent';

const EMPLOYEE_SERVICE_URL = 'http://localhost:8084/api/employee';
const MANAGER_SERVICE_URL = 'http://localhost:8083/api/manager';

const EmployeeDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            // Fetch users first for calendar
            console.log('📡 Fetching users for Employee calendar...');
            try {
                const usersResponse = await axios.get('http://localhost:8081/api/admin/users/all');
                if (usersResponse.data && Array.isArray(usersResponse.data)) {
                    setUsers(usersResponse.data);
                    console.log('✅ Users fetched for Employee calendar:', usersResponse.data.length);
                }
            } catch (userError) {
                console.log('ℹ️ Could not fetch users for calendar:', userError.message);
            }

            const userId = authHelpers.getUserId();
            const email = authHelpers.getUserEmail();
            const role = authHelpers.getUserRole();
            
            console.log('👤 User:', { userId, email, role });
            
            const authHeaders = {
                'X-User-Name': email || 'employee',
                'X-User-Role': role || 'EMPLOYEE',
                'X-Employee-Id': userId.toString()
            };
            
            console.log('📡 Calling:', `${EMPLOYEE_SERVICE_URL}/dashboard`);
            
            const response = await axios.get(`${EMPLOYEE_SERVICE_URL}/dashboard`, {
                headers: authHeaders
            });
            
            console.log('✅ Dashboard data received:', response.data);
            setDashboard(response.data);
            setLoading(false);
        } catch (err) {
            console.error('❌ Dashboard error:', err);
            console.error('❌ Error response:', err.response);
            setError('Failed to load dashboard: ' + (err.response?.data || err.message));
            setLoading(false);
            if (err.response?.status === 401) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
    };

    const fetchProjects = async () => {
        try {
            const userId = authHelpers.getUserId();
            const email = authHelpers.getUserEmail();
            
            const authHeaders = {
                'X-User-Name': email || 'employee',
                'X-User-Role': 'EMPLOYEE',
                'X-Employee-Id': userId.toString()
            };
            
            // Fetch tasks assigned to this employee from manager service
            const tasksResponse = await axios.get(
                `${MANAGER_SERVICE_URL}/tasks?assigneeId=${userId}`,
                { headers: authHeaders }
            );
            
            console.log('✅ Projects/Tasks data received:', tasksResponse.data);
        } catch (err) {
            console.error('❌ Projects fetch error:', err);
            // Don't set error state, just log it
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!dashboard) return <div className="p-8">No data available</div>;

    const { profile, activityLogs } = dashboard;

    const getStatusBadgeColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'todo':
                return 'bg-gray-100 text-gray-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'done':
                return 'bg-green-100 text-green-800';
            case 'blocked':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityBadgeColor = (priority) => {
        const priorityLower = (priority || '').toLowerCase();
        switch (priorityLower) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
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

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
            </div>
            
            {/* Profile Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-semibold">{profile.firstName} {profile.lastName}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-semibold">{profile.email}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Department</p>
                        <p className="font-semibold">{profile.department || 'Not assigned'}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Position</p>
                        <p className="font-semibold">{profile.position || 'Not assigned'}</p>
                    </div>
                </div>
            </div>

            {/* Assigned Projects/Tasks Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">My Assigned Projects</h2>
                {dashboard.tasks && dashboard.tasks.length > 0 ? (
                    <div className="space-y-3">
                        {dashboard.tasks.map(task => (
                            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-800">{task.title}</h3>
                                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(task.status)}`}>
                                                {task.status?.replace('_', ' ') || 'TODO'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(task.priority)}`}>
                                                {task.priority || 'MEDIUM'}
                                            </span>
                                            {task.dueDate && (
                                                <span className="text-xs text-gray-500">
                                                    Due: {formatDate(task.dueDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No projects assigned</p>
                )}
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
                {activityLogs && activityLogs.length > 0 ? (
                    <div className="space-y-2">
                        {activityLogs.map(log => (
                            <div key={log.id} className="border-b pb-2">
                                <p className="font-semibold">{log.action}</p>
                                <p className="text-sm text-gray-600">{log.target} - {log.details}</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(log.timestamp).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No recent activity</p>
                )}
            </div>

            {/* Calendar Widget */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <CalendarComponent 
                    role="employee"
                    eventTypes={{
                        personal: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500', border: 'border-blue-300' },
                        important: { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500', border: 'border-red-300' },
                        reminder: { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-500', border: 'border-yellow-300' },
                        holiday: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500', border: 'border-green-300' }
                    }}
                    canCreateGlobalEvents={false}
                    canScheduleMeetings={true}
                    userList={users}
                />
            </motion.div>
        </div>
    );
};

export default EmployeeDashboard;
