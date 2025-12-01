import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const EmployeeAttendance = () => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taskStatus, setTaskStatus] = useState({});
    const [tasks, setTasks] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const employeeId = authHelpers.getUserId();

    useEffect(() => {
        fetchAttendance();
        fetchTasks();
    }, []);

    const fetchAttendance = async () => {
        try {
            // Assuming HR service endpoint (we'll create this)
            const response = await axios.get(
                `http://localhost:8082/api/hr/attendance/employee/${employeeId}`,
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'EMPLOYEE',
                        'X-Employee-Id': employeeId?.toString()
                    }
                }
            );
            setAttendanceRecords(response.data || []);
            
            // Find today's attendance
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = response.data?.find(record => 
                record.date === today || record.date?.startsWith(today)
            );
            setTodayAttendance(todayRecord);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            // If service doesn't exist yet, set empty state
            if (err.response?.status === 404) {
                setAttendanceRecords([]);
                setTodayAttendance(null);
                setLoading(false);
            } else {
                setError('Failed to load attendance. Please try again later.');
                setLoading(false);
            }
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                `${apiConfig.managerService}/tasks?assigneeId=${employeeId}`,
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'EMPLOYEE',
                        'X-Employee-Id': employeeId?.toString()
                    }
                }
            );
            setTasks(response.data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    const markAttendance = async (type) => {
        try {
            setSubmitting(true);
            const response = await axios.post(
                `http://localhost:8082/api/hr/attendance/mark`,
                {
                    employeeId: employeeId,
                    type: type, // 'CHECK_IN' or 'CHECK_OUT'
                    date: new Date().toISOString().split('T')[0]
                },
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'EMPLOYEE',
                        'X-Employee-Id': employeeId?.toString()
                    }
                }
            );
            
            await fetchAttendance();
            setSubmitting(false);
        } catch (err) {
            console.error('Error marking attendance:', err);
            setError('Failed to mark attendance: ' + (err.response?.data?.error || err.message));
            setSubmitting(false);
        }
    };

    const updateTaskStatus = async (taskId, status) => {
        try {
            await axios.put(
                `${apiConfig.managerService}/tasks/${taskId}/status`,
                { status: status },
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'EMPLOYEE',
                        'X-Employee-Id': employeeId?.toString()
                    }
                }
            );
            
            setTaskStatus(prev => ({ ...prev, [taskId]: status }));
            await fetchTasks();
        } catch (err) {
            console.error('Error updating task status:', err);
            alert('Failed to update task status: ' + (err.response?.data?.error || err.message));
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

    const getStatusBadgeColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'present':
            case 'checked_in':
                return 'bg-green-100 text-green-800';
            case 'absent':
                return 'bg-red-100 text-red-800';
            case 'late':
                return 'bg-yellow-100 text-yellow-800';
            case 'half_day':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTaskStatusBadgeColor = (status) => {
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

    const formatDuration = (checkInTime, checkOutTime, workHours) => {
		if (typeof workHours === 'number' && !Number.isNaN(workHours)) {
			const totalMinutes = Math.floor(workHours * 60);
			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;
			return `${hours}h ${minutes}m`;
		}
		if (!checkInTime || !checkOutTime) return '';
		const [inH, inM, inS] = (checkInTime || '0:0:0').split(':').map(n => parseInt(n || '0', 10));
		const [outH, outM, outS] = (checkOutTime || '0:0:0').split(':').map(n => parseInt(n || '0', 10));
		const inSeconds = (inH * 3600) + (inM * 60) + (inS || 0);
		const outSeconds = (outH * 3600) + (outM * 60) + (outS || 0);
		let diff = outSeconds - inSeconds;
		if (diff < 0) return '';
		const hours = Math.floor(diff / 3600);
		diff = diff % 3600;
		const minutes = Math.floor(diff / 60);
		const seconds = diff % 60;
		if (hours > 0) return `${hours}h ${minutes}m`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	};

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading attendance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Attendance & Tasks</h1>
            </div>

            {/* Mark Attendance Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Mark Today's Attendance</h2>
                <div className="flex gap-4 items-center">
                    {!todayAttendance || !todayAttendance.checkInTime ? (
                        <button
                            onClick={() => markAttendance('CHECK_IN')}
                            disabled={submitting}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
                        >
                            {submitting ? 'Marking...' : 'Check In'}
                        </button>
                    ) : (
                        <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-semibold">
                            ✓ Checked In: {todayAttendance.checkInTime || 'Today'}
                        </div>
                    )}
                    
                    {todayAttendance?.checkInTime && !todayAttendance?.checkOutTime ? (
                        <button
                            onClick={() => markAttendance('CHECK_OUT')}
                            disabled={submitting}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-semibold"
                        >
                            {submitting ? 'Marking...' : 'Check Out'}
                        </button>
                    ) : todayAttendance?.checkOutTime ? (
                        <div className="px-6 py-3 bg-red-100 text-red-800 rounded-lg font-semibold">
                            ✓ Checked Out: {todayAttendance.checkOutTime || 'Today'}
                        </div>
                    ) : null}
                </div>
                
                {todayAttendance?.checkInTime && todayAttendance?.checkOutTime && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                        <p className="text-sm text-gray-700 mb-1">
                            <strong>Total Work Duration:</strong>
                        </p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {formatDuration(todayAttendance.checkInTime, todayAttendance.checkOutTime, todayAttendance.workHours) || '0s'}
                        </p>
                    </div>
                )}
                
                {todayAttendance && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            <strong>Status:</strong> <span className={getStatusBadgeColor(todayAttendance.status)}>
                                {todayAttendance.status || 'Present'}
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {/* Task Status Update Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{task.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getTaskStatusBadgeColor(task.status)}`}>
                                                {task.status || 'TODO'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <select
                                            value={taskStatus[task.id] || task.status || 'TODO'}
                                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="DONE">Done</option>
                                            <option value="BLOCKED">Blocked</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No tasks assigned</p>
                )}
            </div>

            {/* Attendance History */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Attendance History</h2>
                {attendanceRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceRecords.slice(0, 30).map((record, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(record.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkInTime || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkOutTime || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(record.status)}`}>
                                                {record.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.workHours ? `${record.workHours.toFixed(2)} hrs` : (formatDuration(record.checkInTime, record.checkOutTime) || '-')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No attendance records found</p>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendance;

