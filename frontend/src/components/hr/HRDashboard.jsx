import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HRDashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        pendingLeaveRequests: 0,
        todaysAttendance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">HR Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Employees</h3>
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalEmployees}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Leave Requests</h3>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pendingLeaveRequests}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Today's Attendance</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.todaysAttendance}</p>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
