import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';

const OnboardManagement = () => {
  const [onboardRequests, setOnboardRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleTitle: '',
    department: ''
  });

  useEffect(() => {
    fetchOnboardRequests();
  }, []);

  const fetchOnboardRequests = async () => {
    try {
      const managerId = authHelpers.getUserId();
      if (!managerId) return;

      // Mock data since we don't have the onboard endpoint yet
      setOnboardRequests([
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john.doe@company.com',
          phone: '+1-555-0123',
          roleTitle: 'Software Developer',
          department: 'Engineering',
          status: 'PENDING',
          requestedAt: '2024-01-15T10:30:00',
          requestedByManagerId: managerId
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          email: 'jane.smith@company.com',
          phone: '+1-555-0124',
          roleTitle: 'UI/UX Designer',
          department: 'Design',
          status: 'APPROVED',
          requestedAt: '2024-01-10T14:20:00',
          resolvedAt: '2024-01-12T09:15:00',
          requestedByManagerId: managerId
        },
        {
          id: 3,
          fullName: 'Mike Johnson',
          email: 'mike.johnson@company.com',
          phone: '+1-555-0125',
          roleTitle: 'QA Engineer',
          department: 'Engineering',
          status: 'REJECTED',
          requestedAt: '2024-01-08T16:45:00',
          resolvedAt: '2024-01-09T11:30:00',
          requestedByManagerId: managerId
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch onboard requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOnboardRequest = async () => {
    try {
      const managerId = authHelpers.getUserId();
      const requestData = {
        ...newRequest,
        requestedByManagerId: managerId
      };

      // Mock API call - replace with actual endpoint when available
      console.log('Creating onboard request:', requestData);
      
      setNewRequest({
        fullName: '',
        email: '',
        phone: '',
        roleTitle: '',
        department: ''
      });
      setShowCreateRequest(false);
      fetchOnboardRequests();
    } catch (error) {
      console.error('Failed to create onboard request:', error);
    }
  };

  const cancelOnboardRequest = async (requestId) => {
    try {
      // Mock API call - replace with actual endpoint when available
      console.log('Cancelling onboard request:', requestId);
      
      setOnboardRequests(onboardRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Failed to cancel onboard request:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ih-primary text-xl">Loading Onboard Requests...</div>
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
        <h1 className="text-3xl font-bold text-gray-800">Employee Onboarding</h1>
        <button
          onClick={() => setShowCreateRequest(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request Onboarding
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">
                {onboardRequests.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <div className="text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {onboardRequests.filter(r => r.status === 'APPROVED').length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {onboardRequests.filter(r => r.status === 'REJECTED').length}
              </p>
            </div>
            <div className="text-2xl">❌</div>
          </div>
        </div>
      </div>

      {/* Onboard Requests List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Onboarding Requests</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {onboardRequests.map((request) => (
            <motion.div
              key={request.id}
              className="p-6 hover:bg-gray-50 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-800">{request.fullName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)} {request.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Email:</strong> {request.email}</p>
                      <p><strong>Phone:</strong> {request.phone}</p>
                    </div>
                    <div>
                      <p><strong>Role:</strong> {request.roleTitle}</p>
                      <p><strong>Department:</strong> {request.department}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Requested: {new Date(request.requestedAt).toLocaleString()}</p>
                    {request.resolvedAt && (
                      <p>Resolved: {new Date(request.resolvedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => cancelOnboardRequest(request.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {onboardRequests.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Onboarding Requests</h3>
          <p className="text-gray-500 mb-4">Create your first onboarding request to add a new team member</p>
          <button
            onClick={() => setShowCreateRequest(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Onboarding
          </button>
        </div>
      )}

      {/* Create Onboard Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Request Employee Onboarding</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newRequest.fullName}
                  onChange={(e) => setNewRequest({ ...newRequest, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newRequest.email}
                  onChange={(e) => setNewRequest({ ...newRequest, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newRequest.phone}
                  onChange={(e) => setNewRequest({ ...newRequest, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Title</label>
                <input
                  type="text"
                  value={newRequest.roleTitle}
                  onChange={(e) => setNewRequest({ ...newRequest, roleTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newRequest.department}
                  onChange={(e) => setNewRequest({ ...newRequest, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createOnboardRequest}
                disabled={!newRequest.fullName || !newRequest.email || !newRequest.roleTitle || !newRequest.department}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  !newRequest.fullName || !newRequest.email || !newRequest.roleTitle || !newRequest.department
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setShowCreateRequest(false);
                  setNewRequest({
                    fullName: '',
                    email: '',
                    phone: '',
                    roleTitle: '',
                    department: ''
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default OnboardManagement;
