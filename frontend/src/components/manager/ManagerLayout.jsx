import React, { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { LayoutDashboard, User, Users, MessageSquare, Briefcase, Megaphone, LogOut, Trello, ChevronLeft, ChevronRight } from 'lucide-react';
import { authHelpers } from '../../config/auth';
import NotificationBell from '../common/NotificationBell';
import DarkModeToggle from '../common/DarkModeToggle';
import { useCommunicationNotifications } from '../../hooks/useCommunicationNotifications';

const menu = [
  { to: '/dashboard/manager', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/manager/employees', label: 'Employees', icon: User },
  { to: '/dashboard/manager/groups', label: 'Project Groups', icon: Users },
  { to: '/dashboard/manager/communication', label: 'Live Communication', icon: MessageSquare },
  { to: '/dashboard/manager/projects', label: 'Projects', icon: Briefcase },
  { to: '/dashboard/manager/comms', label: 'Global Comms', icon: Megaphone }
];

// Create context for sidebar state
export const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within ManagerLayout');
    }
    return context;
};

const ManagerLayout = () => {
    const meIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName(); 
    const meDisplayName = authHelpers.getUserName() || 'Manager';
    const userId = authHelpers.getUserId(); // Get numeric user ID
    
    const location = useLocation();
    const navigate = useNavigate();
    const [unreadDM, setUnreadDM] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Setup global communication notifications
  useCommunicationNotifications(meIdentifier, meDisplayName);

  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/manager/communication')) setUnreadDM(0);
  }, [location.pathname]);

  // Auto-collapse sidebar for specific routes
  useEffect(() => {
    const shouldCollapse = 
        location.pathname.startsWith('/dashboard/manager/communication') ||
        location.pathname.startsWith('/dashboard/manager/comms');
    setSidebarCollapsed(shouldCollapse);
  }, [location.pathname]);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8085/ws');
    const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });

    client.onConnect = () => {
        const normalizedMe = meIdentifier.toLowerCase();
        
        // Subscribe to user-specific queue (primary)
        client.subscribe(`/user/${normalizedMe}/queue/notify`, frame => {
        try {
          const n = JSON.parse(frame.body || '{}');
          if (n.type === 'dm' || n.type === 'group_message') {
            setUnreadDM(x => x + 1);
          }
        } catch {}
      }, { id: `notify-${normalizedMe}` });
      
      // Subscribe to topic-based destination (fallback for multi-line messages)
      client.subscribe(`/topic/user-notifications.${normalizedMe}`, frame => {
        try {
          const n = JSON.parse(frame.body || '{}');
          if (n.type === 'dm' || n.type === 'group_message') {
            setUnreadDM(x => x + 1);
          }
        } catch {}
      }, { id: `topic-notify-${normalizedMe}` });
    };

    client.activate();
    return () => client.deactivate();
  }, [meIdentifier]);

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-100">
      {/* Full Width Header */}
      <header className="h-20 flex-shrink-0 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-700 border-b-4 border-blue-900 px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4 h-full">
          <div className="text-4xl font-black text-white drop-shadow-lg">Interacthub</div>
          <div className="h-10 w-1 bg-white opacity-60 rounded-full"></div>
          <div className="text-white text-base font-bold opacity-100 tracking-widest drop-shadow-md">MANAGER PORTAL</div>
        </div>
        <div className="flex items-center gap-6 h-full">
          <NotificationBell userId={userId} />
          <DarkModeToggle />
          <div className="flex items-center gap-3 bg-blue-500 bg-opacity-40 px-5 py-2.5 rounded-full hover:bg-opacity-50 transition-all duration-200 border border-blue-300 border-opacity-50">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white">
              {meDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-white text-base font-bold drop-shadow-lg">{meDisplayName}</div>
          </div>
          <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="text-white hover:bg-white hover:bg-opacity-25 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border border-white border-opacity-30 hover:border-opacity-50">
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
          {/* Toggle Button */}
          <div className="flex-shrink-0 p-4 border-b border-slate-800 flex items-center justify-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors duration-200 text-slate-400 hover:text-slate-100"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-3 scrollbar-hide">
            {menu.map(item => (
              <NavLink key={item.to} to={item.to}
                className={isActive(item.to, item.exact) 
                  ? `flex items-center px-5 py-4 rounded-2xl bg-blue-600 text-white font-medium transition-all duration-200 group relative border-l-4 border-white ${sidebarCollapsed ? 'flex-col justify-center' : 'gap-4'}`
                  : `flex items-center px-5 py-4 rounded-2xl text-slate-400 hover:text-slate-100 transition-all duration-200 group relative ${sidebarCollapsed ? 'flex-col justify-center' : 'gap-4'}`}>
                <item.icon size={24} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-base font-medium">{item.label}</span>}
                {sidebarCollapsed && (
                  <span className={`text-xs font-medium text-center mt-1 transition-opacity duration-200 ${isActive(item.to, item.exact) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {item.label}
                  </span>
                )}
                {/* Hover Tooltip - Only show when collapsed and not active */}
                {sidebarCollapsed && !isActive(item.to, item.exact) && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-slate-100 text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
                {/* Unread Badge */}
                {item.to === '/dashboard/manager/communication' && unreadDM > 0 && (
                  sidebarCollapsed ? (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full"></span>
                  ) : (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadDM}</span>
                  )
                )}
              </NavLink>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-800 flex-shrink-0">
            <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-200 font-medium group relative text-slate-400 hover:text-slate-100 ${sidebarCollapsed ? 'flex-col justify-center' : 'gap-4'}`}>
              <LogOut size={24} className="flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-base">Log Out</span>}
              {sidebarCollapsed && (
                <span className="text-xs font-medium text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Log Out</span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-slate-100 text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  Log Out
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col ${location.pathname.startsWith('/dashboard/manager/communication') ? 'overflow-hidden' : 'overflow-y-auto'} bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50`}>
          <div className={`flex-1 ${location.pathname.startsWith('/dashboard/manager/communication') ? 'overflow-hidden p-0' : 'overflow-y-auto p-8'}`}>
            <SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
              <Outlet />
            </SidebarContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
