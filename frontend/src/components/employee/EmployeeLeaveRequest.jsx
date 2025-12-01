import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authHelpers } from '../../config/auth';

const EmployeeLeaveRequest = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        leaveType: 'SICK',
        reason: ''
    });

    const employeeId = authHelpers.getUserId();

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const fetchLeaveRequests = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8082/api/hr/leave-requests/employee/${employeeId}`,
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'EMPLOYEE',
                        'X-Employee-Id': employeeId?.toString()
                    }
                }
            );
            setLeaveRequests(response.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            if (err.response?.status === 404) {
                setLeaveRequests([]);
                setLoading(false);
            } else {
                setError('Failed to load leave requests. Please try again later.');
                setLoading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await axios.post(
                `http://localhost:8082/api/hr/leave-requests`,
                {
                    employeeId: employeeId,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    leaveType: formData.leaveType,
                    reason: formData.reason
                },
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'EMPLOYEE',
                        'X-Employee-Id': employeeId?.toString()
                    }
                }
            );
            
            setShowForm(false);
            setFormData({ startDate: '', endDate: '', leaveType: 'SICK', reason: '' });
            await fetchLeaveRequests();
            setSubmitting(false);
        } catch (err) {
            console.error('Error submitting leave request:', err);
            setError('Failed to submit leave request: ' + (err.response?.data?.error || err.message));
            setSubmitting(false);
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
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getLeaveTypeColor = (type) => {
        const typeLower = (type || '').toLowerCase();
        switch (typeLower) {
            case 'sick':
                return 'bg-red-50 text-red-700';
            case 'vacation':
                return 'bg-blue-50 text-blue-700';
            case 'personal':
                return 'bg-purple-50 text-purple-700';
            case 'emergency':
                return 'bg-orange-50 text-orange-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leave requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Leave Requests</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? 'Cancel' : '+ New Leave Request'}
                </button>
            </div>

            {/* Create Leave Request Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Create Leave Request</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Leave Type *
                            </label>
                            <select
                                required
                                value={formData.leaveType}
                                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="SICK">Sick Leave</option>
                                <option value="VACATION">Vacation</option>
                                <option value="PERSONAL">Personal</option>
                                <option value="EMERGENCY">Emergency</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason *
                            </label>
                            <textarea
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                rows={4}
                                placeholder="Please provide a reason for your leave request..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {formData.startDate && formData.endDate && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Total Days:</strong> {calculateDays(formData.startDate, formData.endDate)} day(s)
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({ startDate: '', endDate: '', leaveType: 'SICK', reason: '' });
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Leave Requests List */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">My Leave Requests</h2>
                {leaveRequests.length > 0 ? (
                    <div className="space-y-4">
                        {leaveRequests.map((request) => (
                            <div
                                key={request.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeColor(request.leaveType)}`}>
                                                {request.leaveType || 'N/A'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(request.status)}`}>
                                                {request.status || 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-sm text-gray-600">Start Date</p>
                                                <p className="font-semibold">{formatDate(request.startDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">End Date</p>
                                                <p className="font-semibold">{formatDate(request.endDate)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600">Duration</p>
                                            <p className="font-semibold">
                                                {calculateDays(request.startDate, request.endDate)} day(s)
                                            </p>
                                        </div>
                                        {request.reason && (
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-600">Reason</p>
                                                <p className="text-gray-800">{request.reason}</p>
                                            </div>
                                        )}
                                        {request.hrComments && (
                                            <div className="mt-3 p-2 bg-gray-50 rounded">
                                                <p className="text-sm text-gray-600">HR Comments</p>
                                                <p className="text-gray-800">{request.hrComments}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                    <p>Requested: {formatDate(request.requestedAt)}</p>
                                    {request.processedAt && <p>Processed: {formatDate(request.processedAt)}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No leave requests found</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Leave Request
                        </button>
                    </div>
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

export default EmployeeLeaveRequest;

