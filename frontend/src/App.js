import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ToastProvider from './components/common/ToastProvider';
import GlobalNotificationCenter from './components/common/GlobalNotificationCenter';
import { NotificationProvider } from './context/NotificationContext';
import persistentWebSocketService from './services/PersistentWebSocketService';
import { authHelpers } from './config/auth';
import notificationFlowDebug from './utils/notificationFlowDebug';

// Import Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfessionalAuthPage from './pages/ProfessionalAuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// Import Admin Layout & Components
import AdminLayout from './components/admin/AdminLayout';
import AdminPage from './pages/AdminPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminDashboardWithCalendar from './components/admin/AdminDashboardWithCalendar';
import EnhancedAdminDashboard from './components/admin/EnhancedAdminDashboard';
import ComprehensiveAdminDashboard from './components/admin/ComprehensiveAdminDashboard';
import UserManagement from './components/admin/UserManagement';
import GlobalCommunications from './components/admin/GlobalCommunications';
import AdminMonitoringDashboard from './components/admin/AdminMonitoringDashboard';
import AdminAccountCreation from './components/admin/AdminAccountCreation';
import AdminAuditLogs from './components/admin/AdminAuditLogs';
import ChatWindow from './components/common/ChatWindow';

// Import Manager Layout & Components
import ManagerLayout from './components/manager/ManagerLayout';
import ManagerDashboard from './components/manager/ManagerDashboard';
import OnboardEmployee from './components/manager/OnboardEmployee';
import ManagerComms from './components/manager/ManagerComms';
import EmployeeManagement from './components/manager/EmployeeManagement';
import ProjectGroupManagement from './components/manager/ProjectGroupManagement';
import ProjectManagement from './components/manager/ProjectManagement';
import TaskManagement from './components/manager/TaskManagement';
import EnhancedLiveCommunicationHub from './components/live/EnhancedLiveCommunicationHub';

// Import Employee Layout & Components
import EmployeeLayout from './components/employee/EmployeeLayout';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeGlobalComms from './components/employee/EmployeeGlobalComms';
import EmployeeProjects from './components/employee/EmployeeProjects';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeaveRequest from './components/employee/EmployeeLeaveRequest';

// Import HR Layout & Components
import HRLayout from './components/hr/HRLayout';
import HRDashboard from './components/hr/HRDashboard';
import HREmployeeManagement from './components/hr/HREmployeeManagement';
import HRAttendance from './components/hr/HRAttendance';
import HRLeaveRequests from './components/hr/HRLeaveRequests';
import HRGlobalComms from './components/hr/HRGlobalComms';

// Define simple placeholders for future pages
const DepartmentSettings = () => (
  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-2xl p-6 bg-white rounded-lg">
    Department Settings Page
  </motion.div>
);


const App = () => {
  // Initialize persistent WebSocket on app load
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const userEmail = authHelpers.getUserEmail();
        const userName = authHelpers.getUserName();
        // Normalize to lowercase to match backend format
        const userIdentifier = (userEmail || userName)?.toLowerCase();

        if (userIdentifier) {
          console.log('🚀 Initializing persistent WebSocket for:', userIdentifier);
          await persistentWebSocketService.connect(userIdentifier);
          console.log('✅ Persistent WebSocket initialized globally');
        } else {
          console.warn('⚠️ No user identifier found for WebSocket connection');
        }
      } catch (error) {
        console.error('❌ Error initializing WebSocket:', error);
      }
    };

    initializeWebSocket();
  }, []);

  return (
    <NotificationProvider>
      <ToastProvider>
        <GlobalNotificationCenter />
        <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication Pages */}
        <Route path="/login" element={<ProfessionalAuthPage />} />
        <Route path="/login-old" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        {/* Admin Protected Routes: Uses Outlet to display nested components */}
        <Route path="/dashboard/admin" element={<AdminLayout />}>
            {/* The index route for /dashboard/admin - Original dashboard with calendar below */}
            <Route index element={<AdminDashboardWithCalendar />} />
            <Route path="enhanced" element={<EnhancedAdminDashboard />} />
            <Route path="old-dashboard" element={<AdminDashboard />} /> 
            
            {/* Nested Admin Features */}
            <Route path="users" element={<UserManagement />} /> 
            <Route path="comms" element={<GlobalCommunications />} /> 
            <Route path="live" element={<EnhancedLiveCommunicationHub />} />

            <Route path="accounts" element={<AdminAccountCreation />} />
            <Route path="monitoring" element={<AdminMonitoringDashboard />} />
            <Route path="audit" element={<AdminAuditLogs />} />
            
            {/* New comprehensive page available at /dashboard/admin/full */}
            <Route path="full" element={<AdminPage />} />
        </Route>

        {/* --- MANAGER ROUTES (Proper Nested Layout) --- */}
        <Route path="/dashboard/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboard />} /> 
            <Route path="projects" element={<ProjectManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="groups" element={<ProjectGroupManagement />} />
            <Route path="communication" element={<EnhancedLiveCommunicationHub />} />
            <Route path="comms" element={<ManagerComms />} /> 
            <Route path="communications" element={<ManagerComms />} /> 
            <Route path="chat" element={<ChatWindow />} />
        </Route>

        {/* Employee Dashboard with Layout */}
        <Route path="/dashboard/employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="global-comms" element={<EmployeeGlobalComms />} />
            <Route path="chat" element={<EnhancedLiveCommunicationHub />} />
            <Route path="projects" element={<EmployeeProjects />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leave-requests" element={<EmployeeLeaveRequest />} />
        </Route>

        {/* Legacy route support - Removed company-updates */}

        {/* HR Dashboard with Layout */}
        <Route path="/dashboard/hr" element={<HRLayout />}>
            <Route index element={<HRDashboard />} />
            <Route path="employees" element={<HREmployeeManagement />} />
            <Route path="communication" element={<EnhancedLiveCommunicationHub />} />
            <Route path="global-comms" element={<HRGlobalComms />} />
            <Route path="attendance" element={<HRAttendance />} />
            <Route path="leave-requests" element={<HRLeaveRequests />} />
        </Route>

        <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Router>
      </ToastProvider>
    </NotificationProvider>
  );
};

export default App;