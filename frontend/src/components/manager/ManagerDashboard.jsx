import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import apiConfig from '../../config/api';
import { authHelpers } from '../../config/auth';
import CalendarComponent from '../common/CalendarComponent';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    teamMembers: 0,
    pendingTasks: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users first for calendar
      console.log('📡 Fetching users for Manager calendar...');
      try {
        const usersResponse = await axios.get('http://localhost:8081/api/admin/users/all');
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          setUsers(usersResponse.data);
          console.log('✅ Users fetched for Manager calendar:', usersResponse.data.length);
        }
      } catch (userError) {
        console.log('ℹ️ Could not fetch users for calendar:', userError.message);
      }

      // Fetch manager-specific data from backend
      const managerId = authHelpers.getUserId();
      
      if (!managerId) {
        console.error('No user ID found in authentication context');
        setLoading(false);
        return;
      }

      // Get auth headers for API calls
      const authHeaders = {
        'X-User-Name': authHelpers.getUserEmail() || 'manager',
        'X-User-Role': 'MANAGER',
        'X-Manager-Id': managerId.toString()
      };
      
      const [projectsResponse, employeesResponse, projectGroupsResponse] = await Promise.allSettled([
        axios.get(`${apiConfig.managerService}/projects/my/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/employees/${managerId}`, { headers: authHeaders }),
        axios.get(`${apiConfig.managerService}/project-groups/${managerId}`, { headers: authHeaders })
      ]);

      const projects = projectsResponse.status === 'fulfilled' ? projectsResponse.value.data : [];
      const employees = employeesResponse.status === 'fulfilled' ? employeesResponse.value.data : [];
      const projectGroups = projectGroupsResponse.status === 'fulfilled' ? projectGroupsResponse.value.data : [];

      // Calculate stats from real data
      const activeProjects = projects.filter(p => p.status === 'ACTIVE').length || 0;
      const plannedProjects = projects.filter(p => p.status === 'PLANNED').length || 0;
      const completedProjects = projects.filter(p => p.status === 'COMPLETED').length || 0;
      const activeEmployees = employees.filter(e => e.isActive).length || 0;

      setStats({
        totalProjects: projects.length || 0,
        activeProjects: activeProjects,
        teamMembers: activeEmployees,
        pendingTasks: 0 // Will be updated when we have task data
      });
      
      // Generate recent activities from real data
      const activities = [];
      if (projects.length > 0) {
        const recentProject = projects[0];
        activities.push({
          id: 1,
          type: 'project',
          message: `Project "${recentProject.name}" is ${recentProject.status.toLowerCase()}`,
          time: '2 hours ago'
        });
      }
      if (employees.length > 0) {
        activities.push({
          id: 2,
          type: 'team',
          message: `Team has ${activeEmployees} active members`,
          time: '4 hours ago'
        });
      }
      if (projectGroups.length > 0) {
        activities.push({
          id: 3,
          type: 'group',
          message: `Created project group "${projectGroups[0].name}"`,
          time: '1 day ago'
        });
      }
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback data
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        teamMembers: 0,
        pendingTasks: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ih-primary text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Manager Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back! Here's your team overview.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalProjects}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </motion.div>

        <motion.div 
          className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeProjects}</p>
            </div>
            <div className="text-3xl">🚀</div>
          </div>
        </motion.div>

        <motion.div 
          className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-purple-500"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-purple-600">{stats.teamMembers}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </motion.div>

        <motion.div 
          className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-orange-500"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-6"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">
                {activity.type === 'project' && '📋'}
                {activity.type === 'task' && '✅'}
                {activity.type === 'team' && '👤'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-6"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard/manager/projects'}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium text-blue-800">Manage Projects</div>
            <div className="text-sm text-blue-600">Create & track projects</div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/manager/tasks'}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium text-blue-800">Task Management</div>
            <div className="text-sm text-blue-600">Assign & track tasks</div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard/manager/communications'}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-medium text-purple-800">Live Communication</div>
            <div className="text-sm text-purple-600">Chat, video & voice calls</div>
          </button>
        </div>
      </motion.div>

      {/* Calendar Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <CalendarComponent 
          role="manager"
          eventTypes={{
            project: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500', border: 'border-blue-300' },
            deadline: { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500', border: 'border-red-300' },
            meeting: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500', border: 'border-purple-300' },
            milestone: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500', border: 'border-green-300' }
          }}
          canCreateGlobalEvents={false}
          canScheduleMeetings={true}
          userList={users}
        />
      </motion.div>
    </motion.div>
  );
};

export default ManagerDashboard;
