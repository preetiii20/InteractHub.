import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { authHelpers } from '../../config/auth';
import { useToast } from '../common/ToastProvider';

const menu = [
  { to: '/dashboard/hr', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/dashboard/hr/employees', label: 'Employees', icon: '👤' },
  { to: '/dashboard/hr/communication', label: 'Live Communication', icon: '🗣️' },
  { to: '/dashboard/hr/global-comms', label: 'Global Comms', icon: '📣' },
  { to: '/dashboard/hr/attendance', label: 'Attendance', icon: '✅' },
  { to: '/dashboard/hr/leave-requests', label: 'Leave Requests', icon: '🏖️' }
];

const HRLayout = () => {
    const meIdentifier = authHelpers.getUserEmail() || authHelpers.getUserName();
    const meDisplayName = authHelpers.getUserName() || 'HR';
    
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [unreadDM, setUnreadDM] = useState(0);

    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/hr/communication')) setUnreadDM(0);
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
        <div className="flex h-screen w-full overflow-hidden bg-slate-100">
            <aside className="w-64 flex flex-col h-full flex-shrink-0 bg-slate-900 text-slate-100">
                <div className="px-6 py-5 text-2xl font-bold border-b border-slate-800 flex-shrink-0">HR Portal</div>
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {menu.map(item => (
                        <NavLink key={item.to} to={item.to}
                            className={isActive(item.to, item.exact) ? 'flex items-center justify-between px-3 py-2 rounded-md bg-indigo-600 text-white'
                                                                     : 'flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-800'}>
                            <span className="flex items-center gap-2"><span>{item.icon}</span><span>{item.label}</span></span>
                            {item.to === '/dashboard/hr/communication' && unreadDM > 0 && (
                                <span className="bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{unreadDM}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800 flex-shrink-0">
                    <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">Log Out</button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 flex-shrink-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 border-b border-indigo-700 px-8 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4 h-full">
                        <div className="text-2xl font-bold text-white">🚀 Interacthub</div>
                        <div className="h-6 w-0.5 bg-white opacity-40"></div>
                        <div className="text-white text-xs font-semibold opacity-90 tracking-wide">HR PORTAL</div>
                    </div>
                    <div className="flex items-center gap-6 h-full">
                        <div className="flex items-center gap-3 bg-white bg-opacity-15 px-4 py-2 rounded-full hover:bg-opacity-25 transition">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-sm">
                                {meDisplayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-white text-sm font-medium">{meDisplayName}</div>
                        </div>
                        <button onClick={() => { authHelpers.logout?.(); navigate('/login'); }} className="text-white hover:bg-white hover:bg-opacity-20 px-4 py-1.5 rounded-lg text-xs font-medium transition">
                            Logout
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default HRLayout;

