import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import CalendarComponent from '../common/CalendarComponent';

const HRDashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        pendingLeaveRequests: 0,
        todaysAttendance: 0
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            // Fetch users first for calendar
            console.log('📡 Fetching users for HR calendar...');
            try {
                const usersResponse = await axios.get('http://localhost:8081/api/admin/users/all');
                if (usersResponse.data && Array.isArray(usersResponse.data)) {
                    setUsers(usersResponse.data);
                    console.log('✅ Users fetched for HR calendar:', usersResponse.data.length);
                }
            } catch (userError) {
                console.log('ℹ️ Could not fetch users for calendar:', userError.message);
            }

            const response = await axios.get('http://localhost:8082/api/hr/dashboard');
            setStats(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching HR dashboard stats:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">HR Dashboard</h1>
            
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Employees</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Leave Requests</h3>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingLeaveRequests}</p>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Today's Attendance</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.todaysAttendance}</p>
                </motion.div>
            </div>

            {/* Calendar Widget */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <CalendarComponent 
                    role="hr"
                    eventTypes={{
                        company: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500', border: 'border-blue-300' },
                        holiday: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500', border: 'border-green-300' },
                        training: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500', border: 'border-purple-300' },
                        meeting: { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-500', border: 'border-orange-300' }
                    }}
                    canCreateGlobalEvents={true}
                    canScheduleMeetings={true}
                    userList={users}
                />
            </motion.div>
        </div>
    );
};

export default HRDashboard;
