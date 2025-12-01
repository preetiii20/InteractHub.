import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ComprehensiveAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [managers, setManagers] = useState([]);
  const [hrOverview, setHrOverview] = useState({});
  const [employees, setEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);

    try {
      const [statsRes, managersRes, hrRes, employeesRes, activitiesRes, healthRes] = await Promise.allSettled([
        fetch('http://localhost:8081/api/admin/dashboard/stats').then(r => r.json()),
        fetch('http://localhost:8081/api/admin/dashboard/managers').then(r => r.json()),
        fetch('http://localhost:8081/api/admin/dashboard/hr').then(r => r.json()),
        fetch('http://localhost:8081/api/admin/dashboard/employees').then(r => r.json()),
        fetch('http://localhost:8081/api/admin/dashboard/activities?limit=20').then(r => r.json()),
        fetch('http://localhost:8081/api/admin/dashboard/health').then(r => r.json()),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (managersRes.status === 'fulfilled') setManagers(managersRes.value);
      if (hrRes.status === 'fulfilled') setHrOverview(hrRes.value);
      if (employeesRes.status === 'fulfilled') setEmployees(employeesRes.value);
      if (activitiesRes.status === 'fulfilled') setActivities(activitiesRes.value);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value);

      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Admin Dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching real-time data from all services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Welcome, Admin User</p>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-blue-600">🎯</span>
              Admin Command Center
            </h1>
            <p className="text-gray-600 text-sm mt-1">Real-time system overview and management</p>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* System Health Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">System Health</h3>
          <div className="flex gap-4 items-center">
            {Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'UP' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600">{service.replace('Service', '')}</span>
              </div>
            ))}
            <button
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              {refreshing ? 'Checking...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto bg-white rounded-lg shadow-sm p-2 border border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'managers', label: 'Managers', icon: '👔' },
          { id: 'hr', label: 'HR', icon: '👥' },
          { id: 'employees', label: 'Employees', icon: '👤' },
          { id: 'activities', label: 'Activities', icon: '📝' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'managers' && <ManagersTab managers={managers} />}
          {activeTab === 'hr' && <HRTab hrOverview={hrOverview} />}
          {activeTab === 'employees' && <EmployeesTab employees={employees} />}
          {activeTab === 'activities' && <ActivitiesTab activities={activities} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats }) => {
  const statCards = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers || 0, 
      icon: '👥', 
      bgColor: 'bg-blue-50', 
      iconColor: 'text-blue-600',
      change: stats.userGrowth,
      trend: stats.userGrowth ? 'up' : null
    },
    { 
      label: 'Active Users', 
      value: stats.activeUsers || 0, 
      icon: '✅', 
      bgColor: 'bg-green-50', 
      iconColor: 'text-green-600',
      subtitle: stats.totalUsers > 0 ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total` : null,
      change: stats.activeGrowth,
      trend: stats.activeGrowth ? 'up' : null
    },
    { 
      label: 'Managers', 
      value: stats.totalManagers || 0, 
      icon: '👔', 
      bgColor: 'bg-purple-50', 
      iconColor: 'text-purple-600',
      subtitle: stats.managerProjects > 0 ? `${stats.managerProjects} active projects` : null
    },
    { 
      label: 'HR Staff', 
      value: stats.totalHR || 0, 
      icon: '👥', 
      bgColor: 'bg-pink-50', 
      iconColor: 'text-pink-600',
      subtitle: stats.pendingLeaves > 0 ? `${stats.pendingLeaves} pending requests` : null
    },
    { 
      label: 'Employees', 
      value: stats.totalEmployees || 0, 
      icon: '👤', 
      bgColor: 'bg-indigo-50', 
      iconColor: 'text-indigo-600',
      subtitle: stats.onboardedThisMonth > 0 ? `${stats.onboardedThisMonth} joined this month` : null
    },
    { 
      label: 'Admins', 
      value: stats.totalAdmins || 0, 
      icon: '🎯', 
      bgColor: 'bg-red-50', 
      iconColor: 'text-red-600',
      subtitle: null
    },
  ];

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-1 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                )}
                {stat.change && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                    </span>
                    <span className="text-xs text-gray-400">vs last month</span>
                  </div>
                )}
              </div>
              <div className={`${stat.bgColor} p-4 rounded-lg group-hover:scale-110 transition-transform`}>
                <span className={`text-3xl ${stat.iconColor}`}>{stat.icon}</span>
              </div>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${stat.iconColor.replace('text-', 'bg-')} transition-all duration-1000`}
                style={{ width: `${Math.min((stat.value / (stats.totalUsers || 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Manager Stats */}
      {stats.managerStats && stats.managerStats.error !== 'Service unavailable' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> Manager Service Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.managerStats).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{value}</p>
                <p className="text-xs text-gray-600 capitalize mt-1">{key.replace(/([A-Z])/g, ' $1')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR Stats */}
      {stats.hrStats && stats.hrStats.error !== 'Service unavailable' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>👥</span> HR Service Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.hrStats).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-pink-50 rounded-lg border border-pink-100">
                <p className="text-2xl font-bold text-pink-600">{value}</p>
                <p className="text-xs text-gray-600 capitalize mt-1">{key.replace(/([A-Z])/g, ' $1')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Managers Tab Component
const ManagersTab = ({ managers }) => {
  const [expandedManager, setExpandedManager] = useState(null);
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>👔</span> Manager Overview
            </h3>
            <p className="text-gray-600 text-sm mt-1">Total Managers: {managers.length}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {managers.reduce((sum, m) => sum + (m.projectCount || 0), 0)}
              </p>
              <p className="text-gray-500">Total Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {managers.reduce((sum, m) => sum + (m.teamSize || 0), 0)}
              </p>
              <p className="text-gray-500">Total Team Members</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {managers.map((manager, index) => (
          <motion.div
            key={manager.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all"
          >
            {/* Manager Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {manager.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{manager.name}</h4>
                    <p className="text-sm text-gray-500">{manager.email}</p>
                    {manager.department && (
                      <p className="text-xs text-gray-400 mt-1">📍 {manager.department}</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  manager.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {manager.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                     onClick={() => setExpandedManager(expandedManager === manager.id ? null : manager.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{manager.projectCount || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Projects</p>
                    </div>
                    <span className="text-blue-600">📊</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer"
                     onClick={() => setExpandedManager(expandedManager === manager.id ? null : manager.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{manager.teamSize || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Team Members</p>
                    </div>
                    <span className="text-purple-600">👥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Details */}
            <AnimatePresence>
              {expandedManager === manager.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 bg-gray-50 space-y-4">
                    {/* Projects List */}
                    {manager.projects && manager.projects.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span>📊</span> Projects ({manager.projects.length})
                          </h5>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {manager.projects.map((project, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 text-sm">
                                    {project.name || project.projectName || 'Unnamed Project'}
                                  </p>
                                  {project.description && (
                                    <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                                  )}
                                  {project.status && (
                                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                      project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                      project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {project.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-400 text-sm">📊 No projects assigned yet</p>
                      </div>
                    )}

                    {/* Team Members List */}
                    {manager.team && manager.team.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span>👥</span> Team Members ({manager.team.length})
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                          {manager.team.map((member, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {(member.name || member.firstName || 'U').charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 text-sm">
                                  {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Team Member'}
                                </p>
                                {member.email && (
                                  <p className="text-xs text-gray-500">{member.email}</p>
                                )}
                                {member.role && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                    {member.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-400 text-sm">👥 No team members assigned yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setExpandedManager(expandedManager === manager.id ? null : manager.id)}
                className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                {expandedManager === manager.id ? (
                  <>
                    <span>▲</span> Hide Details
                  </>
                ) : (
                  <>
                    <span>▼</span> View Projects & Team
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {managers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <div className="text-gray-400 text-5xl mb-3">👔</div>
          <p className="text-gray-500 font-semibold">No Managers Found</p>
          <p className="text-sm text-gray-400 mt-1">Add managers to see their projects and teams here</p>
        </div>
      )}
    </div>
  );
};

// HR Tab Component
const HRTab = ({ hrOverview }) => {
  const [retrying, setRetrying] = useState(false);
  const [localHrOverview, setLocalHrOverview] = useState(hrOverview);
  const [expandedHR, setExpandedHR] = useState(null);

  const retryFetchHR = async () => {
    setRetrying(true);
    try {
      const response = await fetch('http://localhost:8081/api/admin/dashboard/hr');
      const data = await response.json();
      setLocalHrOverview(data);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetrying(false);
    }
  };

  React.useEffect(() => {
    setLocalHrOverview(hrOverview);
  }, [hrOverview]);

  const totalPendingLeaves = localHrOverview.pendingLeaves?.length || 0;
  const totalOnboarded = localHrOverview.hrUsers?.reduce((sum, hr) => sum + (hr.metrics?.onboarded || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* HR Overview Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>👥</span> HR Overview
            </h3>
            <p className="text-gray-600 text-sm mt-1">Total HR Staff: {localHrOverview.hrCount || 0}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-600">{totalOnboarded}</p>
              <p className="text-gray-500">Employees Onboarded</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{totalPendingLeaves}</p>
              <p className="text-gray-500">Pending Leaves</p>
            </div>
          </div>
        </div>
      </div>

      {/* HR Staff Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {localHrOverview.hrUsers && localHrOverview.hrUsers.map((hr, index) => (
          <motion.div
            key={hr.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all"
          >
            {/* HR Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {hr.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{hr.name}</h4>
                    <p className="text-sm text-gray-500">{hr.email}</p>
                    <p className="text-xs text-gray-400 mt-1">📍 {hr.department || 'HR Department'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hr.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {hr.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 hover:bg-pink-100 transition-colors cursor-pointer"
                     onClick={() => setExpandedHR(expandedHR === hr.id ? null : hr.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-pink-600">{hr.metrics?.onboarded || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Onboarded</p>
                    </div>
                    <span className="text-pink-600">👤</span>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors cursor-pointer"
                     onClick={() => setExpandedHR(expandedHR === hr.id ? null : hr.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{hr.metrics?.pendingLeaves || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Pending Leaves</p>
                    </div>
                    <span className="text-yellow-600">🏖️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Details */}
            <AnimatePresence>
              {expandedHR === hr.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 bg-gray-50 space-y-4">
                    {/* Activity Metrics */}
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span>📊</span> Activity Metrics
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Employees Onboarded</p>
                          <p className="text-xl font-bold text-pink-600">{hr.metrics?.onboarded || 0}</p>
                          <p className="text-xs text-gray-400 mt-1">Total count</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Leave Requests</p>
                          <p className="text-xl font-bold text-yellow-600">{hr.metrics?.pendingLeaves || 0}</p>
                          <p className="text-xs text-gray-400 mt-1">Pending</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Active Employees</p>
                          <p className="text-xl font-bold text-green-600">{hr.metrics?.attendance || 0}</p>
                          <p className="text-xs text-gray-400 mt-1">Currently active</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-bold text-blue-600">{hr.department || 'HR'}</p>
                          <p className="text-xs text-gray-400 mt-1">Assignment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setExpandedHR(expandedHR === hr.id ? null : hr.id)}
                className="w-full text-sm font-semibold text-pink-600 hover:text-pink-700 flex items-center justify-center gap-2 transition-colors"
              >
                {expandedHR === hr.id ? (
                  <>
                    <span>▲</span> Hide Details
                  </>
                ) : (
                  <>
                    <span>▼</span> View Activity Details
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leave Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🏖️</span> Leave Management
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              User status and leave request overview
            </p>
          </div>
          {retrying && (
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Refreshing...
            </span>
          )}
        </div>
        {localHrOverview.leaveStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors">
              <p className="text-3xl font-bold text-yellow-600">{localHrOverview.leaveStats.pending || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Pending Requests</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
              <p className="text-3xl font-bold text-green-600">{localHrOverview.leaveStats.approved || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Approved</p>
              <p className="text-xs text-gray-400 mt-1">Active users</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
              <p className="text-3xl font-bold text-red-600">{localHrOverview.leaveStats.rejected || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Rejected</p>
              <p className="text-xs text-gray-400 mt-1">Declined requests</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
              <p className="text-3xl font-bold text-blue-600">{localHrOverview.leaveStats.total || 0}</p>
              <p className="text-xs text-gray-600 mt-2">Total Users</p>
              <p className="text-xs text-gray-400 mt-1">In system</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-gray-400 text-4xl mb-3">📊</div>
            <p className="text-gray-600 font-semibold mb-2">Loading Leave Data...</p>
            <button
              onClick={retryFetchHR}
              disabled={retrying}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto mt-3"
            >
              <span className={retrying ? 'animate-spin' : ''}>🔄</span>
              {retrying ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        )}
      </div>

      {/* Pending Leave Requests */}
      {hrOverview.pendingLeaves && hrOverview.pendingLeaves.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⏳</span> Pending Leave Requests
          </h3>
          <div className="space-y-3">
            {hrOverview.pendingLeaves.map((leave, index) => (
              <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Employee ID: {leave.employeeId}</p>
                  <p className="text-sm text-gray-600 mt-1">{leave.leaveType} - {leave.days} days</p>
                </div>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Employees Tab Component
const EmployeesTab = ({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0 });
  const [paginatedEmployees, setPaginatedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch paginated users
  const fetchPaginatedUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        ...(filterRole !== 'ALL' && { role: filterRole }),
        ...(filterStatus && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`http://localhost:8081/api/admin/users?${params}`);
      const data = await response.json();

      if (data.users) {
        // Paginated response
        setPaginatedEmployees(data.users);
        setPagination({
          page: data.currentPage,
          size: data.size,
          total: data.totalElements,
          totalPages: data.totalPages
        });
      } else {
        // Fallback to old format
        setPaginatedEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setPaginatedEmployees(employees);
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action, value = null) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      console.log('Sending bulk update:', { userIds: selectedUsers, action, value });
      
      const response = await fetch('http://localhost:8081/api/admin/users/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userIds: selectedUsers.map(id => Number(id)), // Ensure numbers
          action: action,
          value: value
        })
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        alert(`Successfully updated ${selectedUsers.length} users`);
        setSelectedUsers([]);
        fetchPaginatedUsers();
      } else {
        alert(`Error updating users: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Error: ' + error.message);
    }
  };

  React.useEffect(() => {
    fetchPaginatedUsers();
  }, [pagination.page, filterRole, filterStatus, searchTerm]);

  const filteredEmployees = paginatedEmployees.length > 0 ? paginatedEmployees : employees.filter(emp => {
    const matchesSearch = emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="HR">HR</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Showing {filteredEmployees.length} of {pagination.total || employees.length} employees
        </p>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4"
        >
          <span className="font-semibold text-blue-800">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => handleBulkAction('activate')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
          >
            ✅ Activate
          </button>
          <button
            onClick={() => handleBulkAction('deactivate')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            ❌ Deactivate
          </button>
          <button
            onClick={() => setSelectedUsers([])}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-semibold"
          >
            Clear Selection
          </button>
        </motion.div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredEmployees.map(emp => emp.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-gray-600">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.map((emp, index) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, emp.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== emp.id));
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-800">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-gray-500">{emp.position || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      emp.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                      emp.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
                      emp.role === 'HR' ? 'bg-pink-100 text-pink-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.department || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">
                      Edit
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.total > pagination.size && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {pagination.page * pagination.size + 1} to{' '}
            {Math.min((pagination.page + 1) * pagination.size, pagination.total)} of{' '}
            {pagination.total} employees
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.page + 1} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= (pagination.totalPages - 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Activities Tab Component
const ActivitiesTab = ({ activities }) => {
  const [localActivities, setLocalActivities] = useState(activities);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshActivities = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://localhost:8081/api/admin/dashboard/activities?limit=50');
      const data = await response.json();
      setLocalActivities(data);
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  // Auto-refresh every 30 seconds if enabled
  React.useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshActivities();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getActivityColor = (type) => {
    switch (type) {
      case 'USER_CREATED': return 'border-l-4 border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'USER_UPDATED': return 'border-l-4 border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'USER_DELETED': return 'border-l-4 border-l-red-500 bg-red-50 hover:bg-red-100';
      default: return 'border-l-4 border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Active</span>;
    } else if (status === 'Pending' || status === 'Inactive') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">{status}</span>;
    }
    return null;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'USER_CREATED': return '👤';
      case 'USER_UPDATED': return '✏️';
      case 'USER_DELETED': return '🗑️';
      default: return '📌';
    }
  };

  // Filter activities
  const filteredActivities = localActivities?.filter(activity => {
    const matchesType = filterType === 'ALL' || activity.type === filterType;
    const matchesSearch = !searchTerm || 
      activity.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const activityStats = {
    total: localActivities?.length || 0,
    created: localActivities?.filter(a => a.type === 'USER_CREATED').length || 0,
    updated: localActivities?.filter(a => a.type === 'USER_UPDATED').length || 0,
    deleted: localActivities?.filter(a => a.type === 'USER_DELETED').length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>📝</span> Recent Activities
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              System activity feed • {activityStats.total} total activities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              Auto-refresh
            </label>
            <button
              onClick={refreshActivities}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-gray-700">{activityStats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Activities</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-600">{activityStats.created}</p>
            <p className="text-xs text-gray-500 mt-1">Users Created</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{activityStats.updated}</p>
            <p className="text-xs text-gray-500 mt-1">Users Updated</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-600">{activityStats.deleted}</p>
            <p className="text-xs text-gray-500 mt-1">Users Deleted</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DELETED">User Deleted</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`rounded-lg shadow-sm p-5 transition-all cursor-pointer flex items-start gap-4 ${getActivityColor(activity.type)}`}
            >
              <div className="text-3xl">{activity.icon || getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{activity.message || activity.description}</p>
                    {activity.description && activity.message !== activity.description && (
                      <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                    )}
                  </div>
                  {activity.status && getStatusBadge(activity.status)}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-gray-500">
                    🕐 {new Date(activity.timestamp || activity.createdAt).toLocaleString()}
                  </p>
                  {activity.type && (
                    <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
                      {activity.type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
            <div className="text-gray-400 text-6xl mb-4">
              {searchTerm || filterType !== 'ALL' ? '🔍' : '📭'}
            </div>
            <p className="text-gray-600 font-semibold text-lg">
              {searchTerm || filterType !== 'ALL' ? 'No matching activities' : 'No recent activities'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || filterType !== 'ALL' 
                ? 'Try adjusting your filters or search term'
                : 'Activity feed will appear here as users interact with the system'}
            </p>
            {(searchTerm || filterType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('ALL');
                }}
                className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
            {!searchTerm && filterType === 'ALL' && (
              <button
                onClick={refreshActivities}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Activities
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredActivities.length} of {activityStats.total} activities
            {autoRefresh && <span className="ml-2 text-green-600">• Auto-refreshing every 30s</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveAdminDashboard;
