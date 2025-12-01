import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../../config/api';

const AuditLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuditLogs();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get(`${apiConfig.adminService}/audit-logs`);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.action === filter;
    const matchesSearch = searchTerm === '' || 
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const actionTypes = ['ALL', ...new Set(logs.map(log => log.action))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span> Audit Logs
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Complete security trail of all system actions • Auto-refreshing every 10s
            </p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {actionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <button
            onClick={fetchAuditLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
      </div>

      {/* Logs List - Enhanced Card Style */}
      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => {
            const isCreate = log.action?.includes('CREATE');
            const isDelete = log.action?.includes('DELETE');
            const isUpdate = log.action?.includes('UPDATE');
            const isLogin = log.action?.includes('LOGIN');
            
            return (
              <motion.div
                key={log.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`rounded-xl shadow-sm p-5 border-l-4 hover:shadow-lg transition-all cursor-pointer ${
                  isCreate ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-teal-500 hover:from-teal-100 hover:to-cyan-100' :
                  isDelete ? 'bg-gradient-to-r from-red-50 to-rose-50 border-l-red-500 hover:from-red-100 hover:to-rose-100' :
                  isUpdate ? 'bg-gradient-to-r from-blue-50 to-sky-50 border-l-blue-500 hover:from-blue-100 hover:to-sky-100' :
                  isLogin ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-purple-500 hover:from-purple-100 hover:to-pink-100' :
                  'bg-gradient-to-r from-gray-50 to-slate-50 border-l-gray-500 hover:from-gray-100 hover:to-slate-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-4xl p-2 rounded-lg ${
                    isCreate ? 'bg-teal-100' :
                    isDelete ? 'bg-red-100' :
                    isUpdate ? 'bg-blue-100' :
                    isLogin ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {isCreate ? '✅' :
                     isDelete ? '🗑️' :
                     isUpdate ? '✏️' :
                     isLogin ? '🔐' : '📋'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-gray-800">{log.userEmail || 'System'}</p>
                          {log.entityType && (
                            <span className="px-2 py-1 bg-white/80 rounded-lg border border-gray-200 text-xs font-medium text-gray-600">
                              {log.entityType}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-2 font-medium">{log.description || 'No description'}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                        isCreate ? 'bg-teal-500 text-white' :
                        isDelete ? 'bg-red-500 text-white' :
                        isUpdate ? 'bg-blue-500 text-white' :
                        isLogin ? 'bg-purple-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {log.action || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs">
                      <span className="flex items-center gap-1.5 text-gray-600 bg-white/60 px-3 py-1.5 rounded-lg">
                        <span>🕐</span>
                        <span className="font-medium">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</span>
                      </span>
                      {log.ipAddress && (
                        <span className="flex items-center gap-1.5 text-gray-600 bg-white/60 px-3 py-1.5 rounded-lg">
                          <span>🌐</span>
                          <span className="font-medium">{log.ipAddress}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-12 border-2 border-dashed border-gray-300 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-600 font-bold text-xl">No audit logs found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || filter !== 'ALL' 
                ? 'Try adjusting your filters or search term'
                : 'Audit logs will appear here as users perform actions'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Logs</p>
          <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
          <p className="text-sm text-green-700">Create Actions</p>
          <p className="text-2xl font-bold text-green-800">
            {logs.filter(l => l.action?.includes('CREATE')).length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700">Update Actions</p>
          <p className="text-2xl font-bold text-yellow-800">
            {logs.filter(l => l.action?.includes('UPDATE')).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-sm p-4 border border-red-200">
          <p className="text-sm text-red-700">Delete Actions</p>
          <p className="text-2xl font-bold text-red-800">
            {logs.filter(l => l.action?.includes('DELETE')).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsViewer;
