import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { authHelpers } from '../../config/auth';

const HRLeaveRequests = () => {
    const [allLeaveRequests, setAllLeaveRequests] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL

    useEffect(() => {
        fetchLeaveRequests();
    }, [filter]);

    const fetchLeaveRequests = async () => {
        try {
            // Always fetch all requests to show counts, then filter client-side if needed
            const response = await axios.get(`http://localhost:8082/api/hr/leave-requests`, {
                headers: {
                    'X-User-Name': authHelpers.getUserEmail(),
                    'X-User-Role': 'HR',
                    'X-HR-Id': authHelpers.getUserId()?.toString()
                }
            });
            const allRequests = response.data || [];
            setAllLeaveRequests(allRequests);
            
            // Filter based on selected filter (except ALL which shows everything)
            if (filter === 'ALL') {
                setLeaveRequests(allRequests);
            } else {
                setLeaveRequests(allRequests.filter(r => r.status === filter));
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leave requests:', err);
            setAllLeaveRequests([]);
            setLeaveRequests([]);
            setLoading(false);
        }
    };

    const handleApproveReject = async (requestId, action, comments = '') => {
        try {
            await axios.put(
                `http://localhost:8082/api/hr/leave-requests/${requestId}/${action.toLowerCase()}`,
                { comments },
                {
                    headers: {
                        'X-User-Name': authHelpers.getUserEmail(),
                        'X-User-Role': 'HR',
                        'X-HR-Id': authHelpers.getUserId()?.toString()
                    }
                }
            );
            await fetchLeaveRequests();
        } catch (err) {
            console.error(`Error ${action}ing leave request:`, err);
            alert(`Failed to ${action} leave request: ${err.response?.data?.error || err.message}`);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading leave requests...</p>
                </div>
            </div>
        );
    }

    const getStatusCounts = () => {
        const all = allLeaveRequests;
        return {
            pending: all.filter(r => r.status === 'PENDING').length,
            approved: all.filter(r => r.status === 'APPROVED').length,
            rejected: all.filter(r => r.status === 'REJECTED').length,
            total: all.length
        };
    };

    const sortedRequests = [...leaveRequests].sort((a, b) => {
        const dateA = new Date(a.requestedAt || 0);
        const dateB = new Date(b.requestedAt || 0);
        return dateB - dateA; // Newest first
    });

    const counts = getStatusCounts();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Leave Requests Management</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="PENDING">Pending ({counts.pending})</option>
                    <option value="APPROVED">Approved ({counts.approved})</option>
                    <option value="REJECTED">Rejected ({counts.rejected})</option>
                    <option value="ALL">All History ({counts.total})</option>
                </select>
            </div>

            {/* History Summary Cards */}
            {filter === 'ALL' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                        <p className="text-sm text-gray-600">Pending Requests</p>
                        <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                        <p className="text-sm text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
                        <p className="text-sm text-gray-600">Total Requests</p>
                        <p className="text-2xl font-bold text-indigo-600">{counts.total}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                    {filter === 'ALL' ? 'Leave Requests History' : `${filter} Leave Requests`}
                    {filter === 'ALL' && <span className="text-sm font-normal text-gray-500 ml-2">(Sorted by most recent)</span>}
                </h2>
                {leaveRequests.length > 0 ? (
                    <div className="space-y-4">
                        {sortedRequests.map((request) => (
                            <div
                                key={request.id}
                                className="border border-gray-200 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-semibold text-gray-800">
                                                {request.employeeName || 'Employee'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
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
                                    </div>
                                    {request.status === 'PENDING' && (
                                        <div className="ml-4 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const comments = prompt('Add comments (optional):');
                                                    handleApproveReject(request.id, 'APPROVE', comments || '');
                                                }}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const comments = prompt('Add rejection reason:');
                                                    if (comments) {
                                                        handleApproveReject(request.id, 'REJECT', comments);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                    <p>Requested: {formatDate(request.requestedAt)}</p>
                                    {request.processedAt && <p>Processed: {formatDate(request.processedAt)}</p>}
                                    {request.hrComments && (
                                        <p className="mt-1 text-gray-600">HR Comments: {request.hrComments}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No leave requests found</p>
                )}
            </div>
        </div>
    );
};

export default HRLeaveRequests;

