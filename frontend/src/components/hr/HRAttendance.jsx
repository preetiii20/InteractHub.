import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authHelpers } from '../../config/auth';

const HRAttendance = () => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate]);

    const fetchAttendance = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8082/api/hr/attendance?date=${selectedDate}`,
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'HR',
                        'X-HR-Id': authHelpers.getUserId()?.toString()
                    }
                }
            );
            setAttendanceRecords(response.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setAttendanceRecords([]);
            setLoading(false);
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

    const formatDuration = (checkInTime, checkOutTime, workHours) => {
        // If backend provided workHours but it's less than 1 minute, ignore and compute from times
        if (typeof workHours === 'number' && !Number.isNaN(workHours) && workHours >= (1 / 60)) {
            const totalMinutes = Math.floor(workHours * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours}h ${minutes}m`;
        }
        if (!checkInTime || !checkOutTime) return '-';
        const [inH, inM, inS] = checkInTime.split(':').map(n => parseInt(n || '0', 10));
        const [outH, outM, outS] = checkOutTime.split(':').map(n => parseInt(n || '0', 10));
        const inSeconds = (inH * 3600) + (inM * 60) + (inS || 0);
        const outSeconds = (outH * 3600) + (outM * 60) + (outS || 0);
        let diff = outSeconds - inSeconds;
        if (diff < 0) return '-';
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading attendance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Attendance Records for {formatDate(selectedDate)}</h2>
                {attendanceRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {record.employeeName || record.employeeId || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkInTime || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkOutTime || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {record.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDuration(record.checkInTime, record.checkOutTime, record.workHours)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No attendance records found for this date</p>
                )}
            </div>
        </div>
    );
};

export default HRAttendance;

