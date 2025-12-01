import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logout } from '../../services/AuthService'; 
import { useNavigate } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/dashboard/admin', icon: '🏠' },
  { name: 'User Management', path: '/dashboard/admin/users', icon: '👥' },
  { name: 'Departments', path: '/dashboard/admin/departments', icon: '🏢' },
  { name: 'Communications', path: '/dashboard/admin/comms', icon: '📢' },
  { name: 'Live Communication', path: '/dashboard/admin/live', icon: '🎥' },
  { name: 'Live Monitoring', path: '/dashboard/admin/monitoring', icon: '📊' },
  { name: 'Audit Logs', path: '/dashboard/admin/audit', icon: '📋' },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <motion.div 
            className="w-64 bg-ih-dark h-full p-6 flex flex-col shadow-2xl"
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 120 }}
        >
            <div className="text-2xl font-extrabold text-white mb-8 border-b border-ih-primary/50 pb-4">
                Admin Portal
            </div>
            
            <nav className="flex-grow space-y-3">
                {navItems.map((item, index) => (
                    <motion.div key={item.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                        <NavLink
                            end
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center p-3 rounded-lg font-medium transition-colors duration-200 
                                ${isActive 
                                    ? 'bg-ih-primary text-white shadow-lg' 
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-ih-secondary'}`
                            }
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.name}
                        </NavLink>
                    </motion.div>
                ))}
            </nav>
            <button 
                onClick={handleLogout} 
                className="mt-8 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
                Log Out
            </button>
        </motion.div>
    );
};

export default Sidebar;