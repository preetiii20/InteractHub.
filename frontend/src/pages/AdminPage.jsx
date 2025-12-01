import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ComprehensiveAdminDashboard from '../components/admin/ComprehensiveAdminDashboard';
import GlobalCommunications from '../components/admin/GlobalCommunications';
import AuditLogsViewer from '../components/admin/AuditLogsViewer';
import SystemMonitoring from '../components/admin/SystemMonitoring';

const AdminPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', component: ComprehensiveAdminDashboard },
    { id: 'communications', label: 'Communications', icon: '📢', component: GlobalCommunications },
    { id: 'audit', label: 'Audit Logs', icon: '📋', component: AuditLogsViewer },
    { id: 'monitoring', label: 'System Monitoring', icon: '🔍', component: SystemMonitoring },
  ];

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || ComprehensiveAdminDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Admin Control Center</h1>
                <p className="text-xs text-gray-500">Complete system oversight and management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Admin User</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPage;
