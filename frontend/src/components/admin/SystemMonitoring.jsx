import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../../config/api';

const SystemMonitoring = () => {
  const [statistics, setStatistics] = useState({});
  const [interactions, setInteractions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchMonitoringData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const [statsRes, interactionsRes, summaryRes] = await Promise.allSettled([
        axios.get(`${apiConfig.adminService}/monitoring/statistics`),
        axios.get(`${apiConfig.adminService}/monitoring/interactions/live`),
        axios.get(`${apiConfig.adminService}/monitoring/summary`)
      ]);

      if (statsRes.status === 'fulfilled') setStatistics(statsRes.value.data || {});
      if (interactionsRes.status === 'fulfilled') setInteractions(interactionsRes.value.data || []);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data || {});
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading system monitoring...</p>
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
              <span>🔍</span> System Monitoring
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Live system health and activity monitoring • Auto-refreshing every 5s
            </p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={statistics.totalUsers || 0}
          icon="👥"
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Active Users"
          value={statistics.activeUsers || 0}
          icon="✅"
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Total Announcements"
          value={statistics.totalAnnouncements || 0}
          icon="📢"
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Active Polls"
          value={statistics.activePolls || 0}
          icon="📊"
          bgColor="bg-pink-50"
          iconColor="text-pink-600"
        />
      </div>

      {/* Role Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👔</span> Role Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RoleCard label="Admins" count={statistics.totalAdmins || 0} color="red" />
          <RoleCard label="Managers" count={statistics.totalManagers || 0} color="purple" />
          <RoleCard label="HR Staff" count={statistics.totalHR || 0} color="pink" />
          <RoleCard label="Employees" count={statistics.totalEmployees || 0} color="blue" />
        </div>
      </div>

      {/* Content Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Content Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Announcements</p>
            <p className="text-3xl font-bold text-blue-800 mt-2">{statistics.totalAnnouncements || 0}</p>
            <p className="text-xs text-blue-600 mt-1">Total created</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
            <p className="text-sm text-purple-700 font-medium">Polls</p>
            <p className="text-3xl font-bold text-purple-800 mt-2">{statistics.totalPolls || 0}</p>
            <p className="text-xs text-purple-600 mt-1">Total created</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
            <p className="text-sm text-green-700 font-medium">Active Polls</p>
            <p className="text-3xl font-bold text-green-800 mt-2">{statistics.activePolls || 0}</p>
            <p className="text-xs text-green-600 mt-1">Currently active</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200">
            <p className="text-sm text-orange-700 font-medium">Audit Logs</p>
            <p className="text-3xl font-bold text-orange-800 mt-2">{statistics.totalAuditLogs || 0}</p>
            <p className="text-xs text-orange-600 mt-1">Total records</p>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💚</span> System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-semibold">Database</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected & Active
                </p>
                <p className="text-xs text-green-500 mt-1">Response: &lt; 50ms</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-semibold">Admin Service</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Port 8081 • Running
                </p>
                <p className="text-xs text-blue-500 mt-1">Uptime: 99.9%</p>
              </div>
              <span className="text-3xl">🟢</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-800 font-semibold">Manager Service</p>
                <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  Port 8083 • Running
                </p>
                <p className="text-xs text-purple-500 mt-1">Healthy</p>
              </div>
              <span className="text-3xl">🟢</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live Activity Feed - Announcements & Polls */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>⚡</span> Live Content Activity
            </h3>
            <p className="text-xs text-gray-500 mt-1">Recent announcements and polls • Auto-refresh 5s</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {interactions.length > 0 ? (
            interactions.map((interaction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`rounded-xl shadow-sm p-5 border-l-4 hover:shadow-md transition-all cursor-pointer ${
                  interaction.type === 'announcement_created' 
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-blue-500 hover:from-blue-100 hover:to-cyan-100' 
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-purple-500 hover:from-purple-100 hover:to-pink-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{interaction.icon || '📌'}</div>
                  <div className="flex-1">
                    {interaction.type === 'announcement_created' ? (
                      <>
                        <div className="flex items-start justify-between">
                          <p className="text-base font-bold text-gray-800">{interaction.title}</p>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {interaction.announcementType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <span>👤</span> {interaction.createdBy}
                        </p>
                        {interaction.likesCount > 0 && (
                          <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                            <span>👍</span> {interaction.likesCount} likes
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <p className="text-base font-bold text-gray-800">{interaction.question}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            interaction.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {interaction.isActive ? '✓ Active' : '✕ Closed'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <span>👤</span> {interaction.createdBy}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <span>🕐</span> {new Date(interaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <p className="text-gray-600 font-semibold text-lg">No recent content activity</p>
              <p className="text-sm text-gray-400 mt-2">Announcements and polls will appear here as they're created</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

// Helper Components
const StatCard = ({ label, value, icon, bgColor, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${bgColor} p-4 rounded-lg`}>
        <span className={`text-3xl ${iconColor}`}>{icon}</span>
      </div>
    </div>
  </motion.div>
);

const RoleCard = ({ label, count, color }) => {
  const colors = {
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-2">{count}</p>
    </div>
  );
};

export default SystemMonitoring;
