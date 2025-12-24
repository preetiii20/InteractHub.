import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Briefcase, Building2, Megaphone, BarChart3, Server, TrendingUp, Clock, Zap } from 'lucide-react';
import apiClient from '../../services/apiClient';
import CalendarComponent from '../common/CalendarComponent';

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// Enhanced StatCard with Microsoft Teams-like design
const StatCard = ({ title, value, icon, color, trend }) => {
  const colorConfig = {
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-200 to-indigo-100',
      border: 'border-indigo-300',
      icon: 'text-indigo-700',
      accent: 'bg-indigo-600',
      light: 'bg-indigo-200'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-200 to-blue-100',
      border: 'border-blue-300',
      icon: 'text-blue-700',
      accent: 'bg-blue-600',
      light: 'bg-blue-200'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-200 to-green-100',
      border: 'border-green-300',
      icon: 'text-green-700',
      accent: 'bg-green-600',
      light: 'bg-green-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-200 to-purple-100',
      border: 'border-purple-300',
      icon: 'text-purple-700',
      accent: 'bg-purple-600',
      light: 'bg-purple-200'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-200 to-orange-100',
      border: 'border-orange-300',
      icon: 'text-orange-700',
      accent: 'bg-orange-600',
      light: 'bg-orange-200'
    }
  };

  const config = colorConfig[color] || colorConfig.indigo;

  return (
    <motion.div 
      className={`relative p-6 rounded-2xl border ${config.border} ${config.bg} 
                   shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer
                   overflow-hidden group`}
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Animated background accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${config.light} rounded-full 
                      opacity-0 group-hover:opacity-40 transition-opacity duration-300 
                      blur-2xl -mr-12 -mt-12`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">{value}</p>
          </div>
          <div className={`${config.icon} opacity-80 group-hover:opacity-100 
                         transition-opacity duration-300`}>
            {typeof icon === 'string' ? <span className="text-3xl md:text-4xl">{icon}</span> : icon && <icon size={40} />}
          </div>
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600">
            <span>↑</span>
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${config.accent} 
                      transform scale-x-0 group-hover:scale-x-100 transition-transform 
                      duration-300 origin-left`} />
    </motion.div>
  );
};

const AdminDashboard = () => {
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        console.log('📡 AdminDashboard: Fetching users from API...');
        const usersResponse = await apiClient.get('/admin/users/all');
        const usersData = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        console.log('✅ AdminDashboard: Users fetched:', usersData.length);
        if (usersData.length > 0) {
          console.log('📋 AdminDashboard: First user:', usersData[0]);
        }
        setUsers(usersData);

        const response = await apiClient.get('/admin/dashboard');
        setReport(response.data);
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
        
        // Try to fetch individual service data as fallback
        try {
          const [usersResponse, departmentsResponse, announcementsResponse, pollsResponse] = await Promise.allSettled([
            apiClient.get('/admin/users/all'),
            apiClient.get('/admin/departments'),
            apiClient.get('/admin/announcements'),
            apiClient.get('/admin/polls')
          ]);

          const usersData = usersResponse.status === 'fulfilled' ? (Array.isArray(usersResponse.value.data) ? usersResponse.value.data : []) : [];
          const departments = departmentsResponse.status === 'fulfilled' ? departmentsResponse.value.data : [];
          const announcements = announcementsResponse.status === 'fulfilled' ? announcementsResponse.value.data : [];
          const polls = pollsResponse.status === 'fulfilled' ? pollsResponse.value.data : [];

          // Store users for passing to CalendarComponent
          setUsers(usersData);
          console.log('✅ Users fetched for calendar (fallback):', usersData.length);
          
          setReport({
            totalUsers: usersData.length || 0, 
            totalManagers: usersData.filter(u => u.role === 'MANAGER').length || 0, 
            totalDepartments: departments.length || 0,
            totalPolls: polls.filter(p => p.isActive).length || 0,
            totalAnnouncements: announcements.length || 0,
            activeUsers: usersData.filter(u => u.isActive).length || 0
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100/40 overflow-x-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Decorative Blurred Circles - Warm Accent Colors */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-rose-100/12 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-amber-100/12 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-slate-100/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-100/10 rounded-full blur-3xl"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 space-y-8 p-8 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
      {/* Page Header with Gradient */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              System overview and key metrics
            </p>
          </div>
          <div className="hidden md:block opacity-10">
            <BarChart3 size={60} className="text-slate-900" />
          </div>
        </div>
        <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-4"></div>
      </motion.div>

      {/* Key Metrics Section */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-lg font-semibold text-slate-800 px-1">Key Metrics</h2>
        
        {/* Statistics Grid - Responsive Layout */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          variants={containerVariants}
        >
          <StatCard 
            title="Total Users" 
            value={report.totalUsers || '0'} 
            icon={Users} 
            color="indigo"
            trend="12% from last month"
          />
          <StatCard 
            title="Active Users" 
            value={report.activeUsers || '0'} 
            icon={CheckCircle} 
            color="green"
            trend="8% increase"
          />
          <StatCard 
            title="Managers" 
            value={report.totalManagers || '0'} 
            icon={Briefcase} 
            color="blue"
          />
          <StatCard 
            title="Departments" 
            value={report.totalDepartments || '0'} 
            icon={Building2} 
            color="purple"
          />
          <StatCard 
            title="Announcements" 
            value={report.totalAnnouncements || '0'} 
            icon={Megaphone} 
            color="orange"
          />
          <StatCard 
            title="Active Polls" 
            value={report.totalPolls || '0'} 
            icon={BarChart3} 
            color="indigo"
          />
        </motion.div>
      </motion.div>

      {/* System Monitoring Section */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="text-lg font-semibold text-slate-800 px-1">System Status</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* System Status Card */}
          <motion.div 
            className="p-6 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 
                       hover:shadow-md transition-all duration-300 overflow-hidden group"
            variants={cardVariants}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Server size={24} className="text-slate-700" />
                System Status
              </h3>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'Admin Service', status: 'Online', color: 'green' },
                { name: 'Chat Service', status: 'Online', color: 'green' },
                { name: 'Manager Service', status: 'Operational', color: 'green' },
                { name: 'Notification Service', status: 'Operational', color: 'green' }
              ].map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg 
                                        hover:bg-slate-100 transition-colors duration-200">
                  <span className="text-sm font-medium text-slate-700">{service.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      service.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-xs font-semibold ${
                      service.color === 'green' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity Card */}
          <motion.div 
            className="p-6 bg-gradient-to-br from-purple-100 to-pink-50 rounded-2xl shadow-sm border border-purple-200 
                       hover:shadow-md transition-all duration-300 overflow-hidden group"
            variants={cardVariants}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp size={24} className="text-slate-700" />
                Activity Overview
              </h3>
              <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                Live
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Last Login', value: 'Just now', Icon: Clock },
                { label: 'Active Sessions', value: `${report.activeUsers || '0'} users`, Icon: Users },
                { label: 'System Uptime', value: '99.9%', Icon: CheckCircle },
                { label: 'Response Time', value: '< 100ms', Icon: Zap }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg 
                                        hover:bg-slate-100 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <item.Icon size={18} className="text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Calendar Widget - VISIBLE ON DASHBOARD */}
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <CalendarComponent 
          role="admin"
          eventTypes={{
            system: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500', border: 'border-blue-300' },
            maintenance: { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-500', border: 'border-orange-300' },
            security: { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500', border: 'border-red-300' },
            update: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-500', border: 'border-purple-300' }
          }}
          canCreateGlobalEvents={true}
          canScheduleMeetings={true}
          userList={users}
        />
      </motion.div>

    </motion.div>
    </div>
  );
};

export default AdminDashboard;
