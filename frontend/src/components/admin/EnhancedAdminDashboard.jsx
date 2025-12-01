import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/apiClient';

const EnhancedAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [projects, setProjects] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [usersRes, projectsRes, leaveRequestsRes] = await Promise.allSettled([
        // Fetch users from admin service
        fetch('http://localhost:8081/api/admin/users')
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        
        // Fetch ALL projects from manager service
        fetch('http://localhost:8083/api/manager/projects/all')
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        
        // Fetch ALL leave requests from HR service
        fetch('http://localhost:8084/api/hr/leave-requests')
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      ]);

      // Process data
      const users = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const projectsData = projectsRes.status === 'fulfilled' ? projectsRes.value : [];
      const leaveData = leaveRequestsRes.status === 'fulfilled' ? leaveRequestsRes.value : [];

      console.log('✅ Data fetched:', { 
        users: users.length, 
        projects: projectsData.length, 
        leaves: leaveData.length 
      });

      setEmployees(users);
      setProjects(projectsData);
      setLeaveRequests(leaveData);

      // Calculate statistics
      const calculatedStats = {
        totalEmployees: users.length,
        activeEmployees: users.filter(u => u.isActive).length,
        totalManagers: users.filter(u => u.role === 'MANAGER').length,
        totalHR: users.filter(u => u.role === 'HR').length,
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length,
        completedProjects: projectsData.filter(p => p.status === 'COMPLETED').length,
        pendingProjects: projectsData.filter(p => p.status === 'PENDING' || p.status === 'PLANNED').length,
        pendingLeaves: leaveData.filter(l => l.status === 'PENDING').length,
        approvedLeaves: leaveData.filter(l => l.status === 'APPROVED').length,
        rejectedLeaves: leaveData.filter(l => l.status === 'REJECTED').length,
      };

      setStats(calculatedStats);
      generateRecentActivities(users, projectsData, leaveData);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (users, projects, leaves) => {
    const activities = [];

    leaves.slice(0, 3).forEach(leave => {
      const user = users.find(u => u.id === leave.employeeId);
      activities.push({
        type: 'leave',
        icon: '🏖️',
        message: `${user?.firstName || 'Employee'} ${user?.lastName || ''} requested ${leave.leaveType} leave`,
        time: formatTime(leave.requestedAt),
        color: 'yellow'
      });
    });

    projects.slice(0, 3).forEach(project => {
      activities.push({
        type: 'project',
        icon: '📊',
        message: `Project "${project.name}" - ${project.status}`,
        time: formatTime(project.createdAt),
        color: 'blue'
      });
    });

    users.slice(0, 2).forEach(user => {
      activities.push({
        type: 'user',
        icon: user.isActive ? '✅' : '❌',
        message: `${user.firstName} ${user.lastName} - ${user.role}`,
        time: 'Recently',
        color: user.isActive ? 'green' : 'gray'
      });
    });

    setRecentActivities(activities.slice(0, 10));
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete overview of your organization</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-primary flex items-center gap-2">
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees || 0}
          icon="👥"
          color="blue"
          subtitle={`${stats.activeEmployees || 0} active`}
        />
        <StatCard
          title="Total Projects"
          value={stats.totalProjects || 0}
          icon="📊"
          color="purple"
          subtitle={`${stats.activeProjects || 0} in progress`}
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves || 0}
          icon="🏖️"
          color="yellow"
          subtitle={`${stats.approvedLeaves || 0} approved`}
        />
        <StatCard
          title="Managers"
          value={stats.totalManagers || 0}
          icon="👔"
          color="green"
          subtitle={`${stats.totalHR || 0} HR staff`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Section */}
        <div className="lg:col-span-2">
          <ProjectsCard projects={projects} />
        </div>

        {/* Activities Section */}
        <div>
          <ActivitiesCard activities={recentActivities} />
        </div>
      </div>

      {/* Leave Requests Table */}
      <LeaveRequestsCard leaveRequests={leaveRequests} employees={employees} />

      {/* Employee Overview */}
      <EmployeeOverviewCard employees={employees} onEmployeeClick={handleEmployeeClick} />

      {/* Employee Detail Modal */}
      <EmployeeModal
        employee={selectedEmployee}
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        projects={projects}
        leaveRequests={leaveRequests}
      />
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="card-gradient p-6 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-3xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// ProjectsCard Component
const ProjectsCard = ({ projects }) => {
  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-700',
      ACTIVE: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      PLANNED: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="card-gradient p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 Recent Projects</h2>
        <span className="text-sm text-gray-500">{projects.length} total</span>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">📋</p>
          <p>No projects found</p>
          <p className="text-sm mt-2">Projects will appear here once created</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {projects.slice(0, 10).map((project, index) => (
            <motion.div
              key={project.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>📅 {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                    {project.endDate && <span>→ {new Date(project.endDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ActivitiesCard Component
const ActivitiesCard = ({ activities }) => {
  const getColorClass = (color) => {
    const colors = {
      yellow: 'bg-yellow-100',
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      gray: 'bg-gray-100',
    };
    return colors[color] || 'bg-gray-100';
  };

  return (
    <div className="card-gradient p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Recent Activities</h2>
      
      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🔔</p>
          <p>No recent activities</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
            >
              <div className={`w-10 h-10 rounded-full ${getColorClass(activity.color)} flex items-center justify-center text-xl flex-shrink-0`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// LeaveRequestsCard Component
const LeaveRequestsCard = ({ leaveRequests, employees }) => {
  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${employeeId}`;
  };

  return (
    <div className="card-gradient p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🏖️ Pending Leave Requests</h2>
        <span className="text-sm text-gray-500">{pendingLeaves.length} pending</span>
      </div>

      {pendingLeaves.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">✅</p>
          <p>No pending leave requests</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Requested</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.slice(0, 5).map((leave, index) => (
                <motion.tr
                  key={leave.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-800">{getEmployeeName(leave.employeeId)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{leave.leaveType}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {leave.requestedAt ? new Date(leave.requestedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      {leave.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// EmployeeOverviewCard Component
const EmployeeOverviewCard = ({ employees, onEmployeeClick }) => {
  return (
    <div className="card-gradient p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👥 Employee Overview</h2>
        <span className="text-sm text-gray-500">{employees.length} total</span>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">👤</p>
          <p>No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.slice(0, 12).map((employee, index) => (
            <motion.div
              key={employee.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => onEmployeeClick(employee)}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-xs text-gray-600 mt-1">{employee.role}</p>
                <p className="text-xs text-gray-500 mt-1">{employee.email}</p>
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    employee.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// EmployeeModal Component
const EmployeeModal = ({ employee, isOpen, onClose, projects, leaveRequests }) => {
  if (!employee) return null;

  const employeeProjects = projects.filter(p => p.managerId === employee.id);
  const employeeLeaves = leaveRequests.filter(l => l.employeeId === employee.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h2>
                      <p className="text-blue-100 mt-1">{employee.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard label="Email" value={employee.email} icon="📧" />
                  <InfoCard label="Phone" value={employee.phoneNumber || 'N/A'} icon="📱" />
                  <InfoCard label="Position" value={employee.position || 'N/A'} icon="💼" />
                  <InfoCard label="Department" value={employee.departmentId ? `Dept #${employee.departmentId}` : 'N/A'} icon="🏢" />
                  <InfoCard label="Status" value={employee.isActive ? 'Active' : 'Inactive'} icon="✅" />
                  <InfoCard label="Joined" value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'} icon="📅" />
                </div>

                {/* Projects (if Manager) */}
                {employee.role === 'MANAGER' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Managed Projects ({employeeProjects.length})</h3>
                    {employeeProjects.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No projects assigned</p>
                    ) : (
                      <div className="space-y-3">
                        {employeeProjects.map((project, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-800">{project.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                project.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Leave Requests */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">🏖️ Leave Requests ({employeeLeaves.length})</h3>
                  {employeeLeaves.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No leave requests</p>
                  ) : (
                    <div className="space-y-3">
                      {employeeLeaves.slice(0, 5).map((leave, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{leave.leaveType}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                              </p>
                              {leave.reason && <p className="text-xs text-gray-500 mt-1">{leave.reason}</p>}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {leave.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// InfoCard Component
const InfoCard = ({ label, value, icon }) => (
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

export default EnhancedAdminDashboard;
