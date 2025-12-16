// import React, { useEffect, useState } from 'react';
// import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';
// import { authHelpers } from '../../config/auth';
// import { useToast } from '../common/ToastProvider';

// const menu = [
//     { to: '/dashboard/admin', label: 'Dashboard', icon: '🏠', exact: true },
//     { to: '/dashboard/admin/users', label: 'User Management', icon: '👥' },
//     { to: '/dashboard/admin/comms', label: 'Communications', icon: '📢' },
//     { to: '/dashboard/admin/live', label: 'Live Communication', icon: '🖥️' },
//     { to: '/dashboard/admin/monitoring', label: 'Live Monitoring', icon: '📊' },
//     { to: '/dashboard/admin/audit', label: 'Audit Logs', icon: '🧾' }
// ];

// const AdminLayout = () => {
//     const me = authHelpers.getUserName() || 'Admin';
//     const location = useLocation();
//     const navigate = useNavigate();
//     const { showToast } = useToast();
//     const [unreadDM, setUnreadDM] = useState(0);

//     useEffect(() => {
//         if (location.pathname.startsWith('/dashboard/admin/live')) setUnreadDM(0);
//     }, [location.pathname]);

//     useEffect(() => {
//         const socket = new SockJS('http://localhost:8085/ws');
//         const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });

//         // FIX: Normalize the user name to lowercase for the STOMP destination path
//         const normalizedMe = me.toLowerCase();

//         client.onConnect = () => {
//             client.subscribe(`/user/${normalizedMe}/queue/notify`, frame => {
//                 try {
//                     const n = JSON.parse(frame.body || '{}');
//                     if (n.type === 'dm') {
//                         setUnreadDM(x => x + 1);
//                         showToast(`New message from ${n.from}: ${(n.preview || '').slice(0, 60)}`);
//                     }
//                 } catch {}
//             }, { id: `notify-${normalizedMe}` });
//         };

//         client.activate();
//         return () => client.deactivate();
//     }, [me, showToast]);

//     const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

//     return (
//         <div className="flex h-screen w-full overflow-hidden bg-slate-100">
//             <aside className="w-64 flex flex-col h-full flex-shrink-0 bg-slate-900 text-slate-100">
//                 <div className="px-6 py-5 text-2xl font-bold border-b border-slate-800 flex-shrink-0">Admin Portal</div>
//                 <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
//                     {menu.map(item => (
//                         <NavLink key={item.to} to={item.to}
//                             className={isActive(item.to, item.exact) ? 'flex items-center justify-between px-3 py-2 rounded-md bg-indigo-600 text-white'
//                                                                      : 'flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-800'}>
//                             <span className="flex items-center gap-2"><span>{item.icon}</span><span>{item.label}</span></span>
//                             {item.to === '/dashboard/admin/live' && unreadDM > 0 && (
//                                 <span className="bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{unreadDM}</span>
//                             )}
//                         </NavLink>
//                     ))}
//                 </nav>
//                 <div className="p-4 border-t border-slate-800 flex-shrink-0">
//                     <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">Log Out</button>
//                 </div>
//             </aside>

//             <main className="flex-1 flex flex-col h-full overflow-hidden">
//                 <header className="h-16 flex-shrink-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 border-b border-indigo-700 px-8 flex items-center justify-between shadow-lg">
//                     <div className="flex items-center gap-4 h-full">
//                         <div className="text-2xl font-bold text-white">🚀 Interacthub</div>
//                         <div className="h-6 w-0.5 bg-white opacity-40"></div>
//                         <div className="text-white text-xs font-semibold opacity-90 tracking-wide">ADMIN PORTAL</div>
//                     </div>
//                     <div className="flex items-center gap-6 h-full">
//                         <div className="flex items-center gap-3 bg-white bg-opacity-15 px-4 py-2 rounded-full hover:bg-opacity-25 transition">
//                             <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-sm">
//                                 {me.charAt(0).toUpperCase()}
//                             </div>
//                             <div className="text-white text-sm font-medium">{me}</div>
//                         </div>
//                         <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-1.5 rounded-lg text-xs font-medium transition">
//                             Logout
//                         </button>
//                     </div>
//                 </header>
//                 <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
//                     <Outlet />
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default AdminLayout;
// import React, { useEffect, useState } from 'react';
// import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';
// import { 
//     LayoutDashboard, 
//     Users, 
//     MessageSquare, 
//     Video, 
//     Activity, 
//     FileText, 
//     LogOut, 
//     Bell,
//     Menu,
//     ChevronRight
// } from 'lucide-react';
// import { authHelpers } from '../../config/auth';
// import { useToast } from '../common/ToastProvider';

// // Professional Menu Configuration
// const menu = [
//     { to: '/dashboard/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
//     { to: '/dashboard/admin/users', label: 'User Management', icon: <Users size={20} /> },
//     { to: '/dashboard/admin/comms', label: 'Communications', icon: <MessageSquare size={20} /> },
//     { to: '/dashboard/admin/live', label: 'Live Communication', icon: <Video size={20} /> },
//     { to: '/dashboard/admin/monitoring', label: 'Live Monitoring', icon: <Activity size={20} /> },
//     { to: '/dashboard/admin/audit', label: 'Audit Logs', icon: <FileText size={20} /> }
// ];

// const AdminLayout = () => {
//     const me = authHelpers.getUserName() || 'Admin';
//     const location = useLocation();
//     const navigate = useNavigate();
//     const { showToast } = useToast();
//     const [unreadDM, setUnreadDM] = useState(0);
//     const [isSidebarOpen, setSidebarOpen] = useState(true);

//     // Reset unread count when visiting the live chat page
//     useEffect(() => {
//         if (location.pathname.startsWith('/dashboard/admin/live')) setUnreadDM(0);
//     }, [location.pathname]);

//     // WebSocket Connection for Real-time Notifications
//     useEffect(() => {
//         const socket = new SockJS('http://localhost:8085/ws');
//         const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });

//         const normalizedMe = me.toLowerCase();

//         client.onConnect = () => {
//             client.subscribe(`/user/${normalizedMe}/queue/notify`, frame => {
//                 try {
//                     const n = JSON.parse(frame.body || '{}');
//                     if (n.type === 'dm') {
//                         setUnreadDM(x => x + 1);
//                         showToast(`New message from ${n.from}`, 'info');
//                     }
//                 } catch (e) {
//                     console.error("Notification parsing error", e);
//                 }
//             }, { id: `notify-${normalizedMe}` });
//         };

//         client.activate();
//         return () => client.deactivate();
//     }, [me, showToast]);

//     const isActiveLink = (path, exact) => 
//         exact ? location.pathname === path : location.pathname.startsWith(path);

//     return (
//         <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
            
//             {/* --- SIDEBAR --- */}
//             <aside 
//                 className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
//                 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-xl z-20`}
//             >
//                 {/* Brand Logo */}
//                 <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
//                     <div className="flex items-center gap-3 overflow-hidden">
//                         <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
//                             IH
//                         </div>
//                         <span className={`font-bold text-lg text-white tracking-wide transition-opacity duration-300 ${!isSidebarOpen && 'opacity-0'}`}>
//                             InteractHub
//                         </span>
//                     </div>
//                 </div>

//                 {/* Navigation Links */}
//                 <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
//                     {menu.map(item => {
//                         const active = isActiveLink(item.to, item.exact);
//                         return (
//                             <NavLink 
//                                 key={item.to} 
//                                 to={item.to}
//                                 className={`
//                                     relative flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
//                                     ${active 
//                                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
//                                         : 'hover:bg-slate-800 hover:text-white'
//                                     }
//                                 `}
//                             >
//                                 <span className="flex-shrink-0">{item.icon}</span>
                                
//                                 <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
//                                     {item.label}
//                                 </span>

//                                 {/* Unread Badge with Pulse Animation */}
//                                 {item.to === '/dashboard/admin/live' && unreadDM > 0 && (
//                                     <div className={`absolute right-3 flex h-5 w-5 ${!isSidebarOpen && 'top-1 right-1'}`}>
//                                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
//                                         <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] items-center justify-center font-bold">
//                                             {unreadDM > 9 ? '9+' : unreadDM}
//                                         </span>
//                                     </div>
//                                 )}
                                
//                                 {/* Tooltip for collapsed sidebar */}
//                                 {!isSidebarOpen && (
//                                     <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
//                                         {item.label}
//                                     </div>
//                                 )}
//                             </NavLink>
//                         );
//                     })}
//                 </nav>

//                 {/* Logout Button */}
//                 <div className="p-4 border-t border-slate-800">
//                     <button 
//                         onClick={() => { authHelpers.logout?.(); navigate('/login'); }} 
//                         className={`w-full flex items-center ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors`}
//                     >
//                         <LogOut size={20} />
//                         <span className={`ml-3 font-medium transition-all duration-300 ${!isSidebarOpen && 'hidden'}`}>Log Out</span>
//                     </button>
//                 </div>
//             </aside>

//             {/* --- MAIN CONTENT --- */}
//             <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
                
//                 {/* Header */}
//                 <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 z-10">
//                     <div className="flex items-center gap-4">
//                         <button 
//                             onClick={() => setSidebarOpen(!isSidebarOpen)}
//                             className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
//                         >
//                             <Menu size={20} />
//                         </button>
                        
//                         {/* Breadcrumbs / Page Title */}
//                         <div className="flex items-center text-sm text-slate-500">
//                             <span className="font-medium text-slate-900">Admin Portal</span>
//                             <ChevronRight size={14} className="mx-2" />
//                             <span className="text-indigo-600 font-medium">
//                                 {menu.find(m => isActiveLink(m.to, m.exact))?.label || 'Overview'}
//                             </span>
//                         </div>
//                     </div>

//                     {/* User Profile & Actions */}
//                     <div className="flex items-center gap-6">
//                         {/* Notification Bell */}
//                         <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
//                             <Bell size={20} />
//                             <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
//                         </button>

//                         <div className="h-6 w-px bg-slate-200"></div>

//                         {/* Profile Dropdown Trigger */}
//                         <div className="flex items-center gap-3 pl-2 cursor-pointer group">
//                             <div className="text-right hidden sm:block">
//                                 <p className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">{me}</p>
//                                 <p className="text-xs text-slate-400">Administrator</p>
//                             </div>
//                             <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-white group-hover:ring-indigo-100 transition-all">
//                                 {me.charAt(0).toUpperCase()}
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 {/* Content Area with Fade-in Animation */}
//                 <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
//                     <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-2">
//                         <Outlet />
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default AdminLayout;

import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
    LayoutDashboard, 
    Users, 
    MessageSquare, 
    Video, 
    Activity, 
    FileText, 
    LogOut, 
    Bell,
    Menu,
    ChevronRight
} from 'lucide-react';
import { authHelpers } from '../../config/auth';
import { useToast } from '../common/ToastProvider';

// Professional Menu Configuration
const menu = [
    { to: '/dashboard/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { to: '/dashboard/admin/users', label: 'User Management', icon: <Users size={20} /> },
    { to: '/dashboard/admin/comms', label: 'Communications', icon: <MessageSquare size={20} /> },
    { to: '/dashboard/admin/live', label: 'Live Communication', icon: <Video size={20} /> },
    { to: '/dashboard/admin/monitoring', label: 'Live Monitoring', icon: <Activity size={20} /> },
    { to: '/dashboard/admin/audit', label: 'Audit Logs', icon: <FileText size={20} /> }
];

const AdminLayout = () => {
    const me = authHelpers.getUserName() || 'Admin';
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [unreadDM, setUnreadDM] = useState(0);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Reset unread count when visiting the live chat page
    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/admin/live')) setUnreadDM(0);
    }, [location.pathname]);

    // WebSocket Connection for Real-time Notifications
    useEffect(() => {
        const socket = new SockJS('http://localhost:8085/ws');
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });

        const normalizedMe = me.toLowerCase();

        client.onConnect = () => {
            client.subscribe(`/user/${normalizedMe}/queue/notify`, frame => {
                try {
                    const n = JSON.parse(frame.body || '{}');
                    if (n.type === 'dm') {
                        setUnreadDM(x => x + 1);
                        showToast(`New message from ${n.from}`, 'info');
                    }
                } catch (e) {
                    console.error("Notification parsing error", e);
                }
            }, { id: `notify-${normalizedMe}` });
        };

        client.activate();
        return () => client.deactivate();
    }, [me, showToast]);

    const isActiveLink = (path, exact) => 
        exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
            
            {/* --- SIDEBAR with Enhanced Alignment & Animation --- */}
            <aside 
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
                bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 
                flex flex-col transition-all duration-500 ease-out shadow-2xl z-20
                border-r border-slate-800/50`}
            >
                {/* Brand Logo with Animation */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-slate-950">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 
                                      flex items-center justify-center text-white font-bold flex-shrink-0 
                                      shadow-lg shadow-indigo-500/20 animate-in zoom-in duration-300">
                            IH
                        </div>
                        <div className={`transition-all duration-500 ${!isSidebarOpen && 'opacity-0 w-0'}`}>
                            <span className="font-bold text-lg text-white tracking-wide animate-in slide-in-from-left-2 duration-500">
                                InteractHub
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Links with Improved Alignment */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
                    {menu.map((item, index) => {
                        const active = isActiveLink(item.to, item.exact);
                        return (
                            <NavLink 
                                key={item.to} 
                                to={item.to}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`
                                    relative flex items-center px-3 py-3.5 rounded-xl transition-all duration-300 
                                    group animate-in fade-in duration-300 fill-mode-backwards
                                    ${active 
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]' 
                                        : 'hover:bg-slate-800/80 hover:text-white hover:shadow-md hover:scale-[1.02]'
                                    }
                                `}
                            >
                                <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                                    {item.icon}
                                </span>
                                
                                <span className={`ml-4 font-medium whitespace-nowrap transition-all duration-500 
                                                ${!isSidebarOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 animate-in slide-in-from-left-2 duration-500'}`}>
                                    {item.label}
                                </span>

                                {/* Unread Badge with Enhanced Animation */}
                                {item.to === '/dashboard/admin/live' && unreadDM > 0 && (
                                    <div className={`absolute ${isSidebarOpen ? 'right-3' : 'top-1 right-1'}`}>
                                        <div className="relative flex items-center justify-center">
                                            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-6 w-6 bg-gradient-to-b from-red-500 to-red-600 
                                                          text-white text-xs items-center justify-center font-bold shadow-lg shadow-red-500/20
                                                          animate-in zoom-in duration-300">
                                                {unreadDM > 9 ? '9+' : unreadDM}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Enhanced Tooltip for collapsed sidebar */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm 
                                                  rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                                                  whitespace-nowrap pointer-events-none z-50 border border-slate-700 
                                                  animate-in slide-in-from-left-2 duration-300">
                                        {item.label}
                                        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-0 h-0 
                                                        border-t-4 border-b-4 border-l-0 border-r-4 border-r-slate-900 
                                                        border-t-transparent border-b-transparent"></div>
                                    </div>
                                )}
                                
                                {/* Active Link Indicator */}
                                {active && (
                                    <div className={`absolute right-3 w-1.5 h-6 bg-white rounded-full animate-in zoom-in duration-300 
                                                    ${!isSidebarOpen && 'hidden'}`} />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout Button with Animation */}
                <div className="p-4 border-t border-slate-800/50">
                    <button 
                        onClick={() => { authHelpers.logout?.(); navigate('/login'); }} 
                        className={`
                            w-full flex items-center relative overflow-hidden group animate-in fade-in duration-300
                            ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} 
                            py-3 text-slate-400 hover:text-white hover:bg-slate-800/80 
                            rounded-xl transition-all duration-300 hover:scale-[1.02]
                        `}
                    >
                        <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
                        <span className={`ml-4 font-medium transition-all duration-500 
                                        ${!isSidebarOpen ? 'opacity-0 w-0' : 'opacity-100 animate-in slide-in-from-left-2 duration-500'}`}>
                            Log Out
                        </span>
                        {!isSidebarOpen && (
                            <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm 
                                          rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 
                                          whitespace-nowrap pointer-events-none z-50 border border-slate-700">
                                Log Out
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT with Enhanced Alignment --- */}
            <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 relative overflow-hidden">
                
                {/* Header with Glass Morphism */}
                <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200/60 
                                 shadow-sm flex items-center justify-between px-6 z-10 
                                 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 
                                     rounded-xl transition-all duration-300 focus:outline-none
                                     transform hover:scale-110 active:scale-95"
                        >
                            <Menu size={20} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
                        </button>
                        
                        {/* Enhanced Breadcrumbs */}
                        <div className="flex items-center text-sm text-slate-500 animate-in slide-in-from-left-2 duration-500">
                            <span className="font-semibold text-slate-800 bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
                                Admin Portal
                            </span>
                            <ChevronRight size={16} className="mx-3 text-slate-400 animate-pulse" />
                            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {menu.find(m => isActiveLink(m.to, m.exact))?.label || 'Overview'}
                            </span>
                        </div>
                    </div>

                    {/* User Profile & Actions with Improved Alignment */}
                    <div className="flex items-center gap-5 animate-in slide-in-from-right-2 duration-500">
                        {/* Notification Bell with Animation */}
                        <button className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 
                                         rounded-xl transition-all duration-300 group">
                            <Bell size={20} className="group-hover:animate-bounce" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-gradient-to-br from-red-500 to-red-600 
                                           rounded-full border-2 border-white animate-pulse"></span>
                        </button>

                        <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

                        {/* Profile with Enhanced Animation */}
                        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                            <div className="text-right hidden sm:block animate-in slide-in-from-right-2 duration-500">
                                <p className="text-sm font-semibold text-slate-700 leading-tight 
                                            group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 
                                            group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                    {me}
                                </p>
                                <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">Administrator</p>
                            </div>
                            <div className="relative">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 
                                              flex items-center justify-center text-white font-bold shadow-lg 
                                              ring-2 ring-white group-hover:ring-4 group-hover:ring-indigo-100 
                                              transition-all duration-300 transform group-hover:scale-110">
                                    {me.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/20 to-transparent 
                                              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area with Enhanced Alignment & Animation */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto">
                        {/* Animated Page Header */}
                        <div className="mb-6 animate-in slide-in-from-top duration-500">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 
                                         bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
                                {menu.find(m => isActiveLink(m.to, m.exact))?.label || 'Dashboard'}
                            </h1>
                            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full 
                                         animate-in slide-in-from-left duration-700"></div>
                        </div>

                        {/* Main Content with Staggered Animation */}
                        <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;