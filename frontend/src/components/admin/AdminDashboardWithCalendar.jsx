import React from 'react';
import { motion } from 'framer-motion';
import ComprehensiveAdminDashboard from './ComprehensiveAdminDashboard';
import CalendarComponent from '../common/CalendarComponent';

const AdminDashboardWithCalendar = () => {
  return (
    <div className="w-full space-y-8">
      {/* Original Admin Dashboard */}
      <ComprehensiveAdminDashboard />

      {/* Calendar Widget Below */}
      <motion.div 
        className="w-full px-6 pb-8"
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
        />
      </motion.div>
    </div>
  );
};

export default AdminDashboardWithCalendar;
