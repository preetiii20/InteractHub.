import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../services/apiClient';

const cardVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Fixed StatCard with proper Tailwind classes
const StatCard = ({ title, value, icon, color }) => {
  // Define color classes explicitly since dynamic Tailwind classes don't work well
  const colorClasses = {
    indigo: 'border-indigo-500 text-indigo-500',
    blue: 'border-blue-500 text-blue-500',
    green: 'border-green-500 text-green-500',
    yellow: 'border-yellow-500 text-yellow-500'
  };

  return (
    <motion.div 
      className={`p-6 rounded-xl shadow-lg bg-white border-b-4 ${colorClasses[color]} transform hover:scale-[1.03] transition-all duration-300 cursor-pointer`}
      variants={cardVariants}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Fetch new admin dashboard data
        const response = await apiClient.get('/admin/dashboard');
        setReport(response.data);
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
        
        // Try to fetch individual service data as fallback
        try {
          const [usersResponse, departmentsResponse, announcementsResponse, pollsResponse] = await Promise.allSettled([
            apiClient.get('/admin/users'),
            apiClient.get('/admin/departments'),
            apiClient.get('/admin/announcements'),
            apiClient.get('/admin/polls')
          ]);

          const users = usersResponse.status === 'fulfilled' ? usersResponse.value.data : [];
          const departments = departmentsResponse.status === 'fulfilled' ? departmentsResponse.value.data : [];
          const announcements = announcementsResponse.status === 'fulfilled' ? announcementsResponse.value.data : [];
          const polls = pollsResponse.status === 'fulfilled' ? pollsResponse.value.data : [];

          setReport({
            totalUsers: users.length || 0, 
            totalManagers: users.filter(u => u.role === 'MANAGER').length || 0, 
            totalDepartments: departments.length || 0,
            totalPolls: polls.filter(p => p.isActive).length || 0,
            totalAnnouncements: announcements.length || 0,
            activeUsers: users.filter(u => u.isActive).length || 0
          });
        } catch (fallbackError) {
          console.error("Fallback fetch failed:", fallbackError);
          setReport({
            totalUsers: 'N/A', 
            totalManagers: 'N/A', 
            totalDepartments: 'N/A', 
            totalPolls: 'N/A',
            totalAnnouncements: 'N/A',
            activeUsers: 'N/A'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-indigo-600">Loading Admin Data...</div>;
  }

  return (
    <motion.div className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        
        <h1 className="text-4xl font-extrabold text-gray-800 border-b pb-4">Admin Dashboard</h1>
        
        {/* System Statistics Section (Animated Grid) */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            initial="initial"
            animate="animate"
        >
            <StatCard title="Total Users" value={report.totalUsers || '0'} icon="👥" color="indigo" />
            <StatCard title="Total Managers" value={report.totalManagers || '0'} icon="👔" color="blue" />
            <StatCard title="Total Departments" value={report.totalDepartments || '0'} icon="🏢" color="green" />
            <StatCard title="Total Polls" value={report.totalPolls || '0'} icon="📊" color="yellow" />
            <StatCard title="Announcements" value={report.totalAnnouncements || '0'} icon="📢" color="yellow" />
            <StatCard title="Active Users" value={report.activeUsers || '0'} icon="✅" color="green" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">System Monitoring</h1>

        {/* System Monitoring Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* System Status Card */}
            <motion.div 
                className="p-6 bg-white rounded-xl shadow-xl border-l-4 border-emerald-500" 
                variants={cardVariants}
            >
                <h2 className="text-2xl font-semibold text-emerald-600 mb-4">🖥️ System Status</h2>
                <div className='space-y-2'>
                    <p className="text-gray-600">Admin Service: <span className="font-bold text-green-600">Online</span></p>
                    <p className="text-gray-600">Chat Service: <span className="font-bold text-green-600">Online</span></p>
                    <p className="text-gray-600">Manager Service: <span className="font-bold text-yellow-600">Check Status</span></p>
                    <p className="text-gray-600">Notification Service: <span className="font-bold text-yellow-600">Check Status</span></p>
                </div>
            </motion.div>

            {/* Recent Activity Card */}
            <motion.div 
                className="p-6 bg-white rounded-xl shadow-xl border-l-4 border-indigo-500" 
                variants={cardVariants}
            >
                <h2 className="text-2xl font-semibold text-indigo-600 mb-4">📈 Recent Activity</h2>
                <div className='space-y-2'>
                    <p className="text-gray-600">Last Login: <span className="font-bold text-indigo-600">Just now</span></p>
                    <p className="text-gray-600">Active Sessions: <span className="font-bold">{report.activeUsers || '0'}</span></p>
                    <p className="text-gray-600">System Uptime: <span className="font-bold">99.9%</span></p>
                </div>
            </motion.div>
        </div>
    </motion.div>
  );
};

export default AdminDashboard;