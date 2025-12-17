import React, { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { LayoutDashboard, User, MessageSquare, Megaphone, CheckCircle, Calendar, LogOut } from 'lucide-react';
import { authHelpers } from '../../config/auth';
import { useToast } from '../common/ToastProvider';

const menu = [
  { to: '/dashboard/hr', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/hr/employees', label: 'Employees', icon: User },
  { to: '/dashboard/hr/communication', label: 'Live Communication', icon: MessageSquare },
  { to: '/dashboard/hr/global-comms', label: 'Global Comms', icon: Megaphone },
  { to: '/dashboard/hr/attendance', label: 'Attendance', icon: CheckCircle },
  { to: '/dashboard/hr/leave-requests', label: 'Leave Requests', icon: Calendar }
];

// Create context for sidebar state
export const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within HRLayout');
    }
    return context;
};

const HRLayout = () => {
    const meIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName();
    const meDisplayName = authHelpers.getUserName() || 'HR';
    
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [unreadDM, setUnreadDM] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/hr/communication')) setUnreadDM(0);
    }, [location.pathname]);

    // Auto-collapse sidebar for specific routes
    useEffect(() => {
        const shouldCollapse = 
            location.pathname.startsWith('/dashboard/hr/communication') ||
            location.pathname.startsWith('/dashboard/hr/global-comms');
        setSidebarCollapsed(shouldCollapse);
    }, [location.pathname]);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8085/ws');
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });

        client.onConnect = () => {
            const normalizedMe = meIdentifier.toLowerCase();
            client.subscribe(`/user/${normalizedMe}/queue/notify`, frame => {
                try {
                    const n = JSON.parse(frame.body || '{}');
                    if (n.type === 'dm') {
                        setUnreadDM(x => x + 1);
                        showToast(`New message from ${n.from}: ${(n.preview || '').slice(0, 60)}`);
                    }
                } catch {}
            }, { id: `notify-${normalizedMe}` });
        };

        client.activate();
        return () => client.deactivate();
    }, [meIdentifier, showToast]);

    const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100">
            {/* Full Width Header */}
            <header className="h-20 flex-shrink-0 bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 border-b border-rose-700 px-8 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 h-full">
                    <div className="text-3xl font-bold text-white">Interacthub</div>
                    <div className="h-8 w-0.5 bg-white opacity-40"></div>
                    <div className="text-white text-sm font-semibold opacity-90 tracking-wide">HR PORTAL</div>
                </div>
                <div className="flex items-center gap-6 h-full">
                    <div className="flex items-center gap-3 bg-white bg-opacity-15 px-4 py-2 rounded-full hover:bg-opacity-25 transition">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {meDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-white text-sm font-medium">{meDisplayName}</div>
                    </div>
                    <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-2 rounded-lg text-sm font-medium transition">
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className={`flex flex-col flex-shrink-0 bg-slate-950 text-slate-100 border-r border-slate-800 overflow-hidden transition-all duration-300 ${
                    sidebarCollapsed ? 'w-20' : 'w-64'
                }`}>
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
                        {menu.map(item => (
                            <NavLink key={item.to} to={item.to}
                                className={isActive(item.to, item.exact) 
                                    ? 'flex items-center justify-between px-5 py-4 rounded-2xl bg-indigo-600 text-white font-medium transition-all duration-200 group'
                                    : 'flex items-center justify-between px-5 py-4 rounded-2xl text-slate-400 hover:text-slate-100 transition-all duration-200 group'}>
                                <span className="flex items-center gap-4">
                                    <item.icon size={24} className="flex-shrink-0" />
                                    {!sidebarCollapsed && <span className="text-base font-medium">{item.label}</span>}
                                </span>
                                {!sidebarCollapsed && isActive(item.to, item.exact) && (
                                    <span className="w-1.5 h-7 bg-white rounded-full"></span>
                                )}
                                {item.to === '/dashboard/hr/communication' && unreadDM > 0 && (
                                    <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{unreadDM}</span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="p-6 border-t border-slate-800 flex-shrink-0">
                        <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="w-full flex items-center gap-4 text-slate-400 hover:text-slate-100 px-5 py-4 rounded-2xl transition-all duration-200 font-medium">
                            <LogOut size={24} className="flex-shrink-0" />
                            {!sidebarCollapsed && <span className="text-base">Log Out</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
                    <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                        <SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
                            <Outlet />
                        </SidebarContext.Provider>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HRLayout;

