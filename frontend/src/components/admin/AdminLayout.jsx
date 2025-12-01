import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { authHelpers } from '../../config/auth';
import { useToast } from '../common/ToastProvider';

const menu = [
    { to: '/dashboard/admin', label: 'Dashboard', icon: '🏠', exact: true },
    { to: '/dashboard/admin/users', label: 'User Management', icon: '👥' },
    { to: '/dashboard/admin/comms', label: 'Communications', icon: '📢' },
    { to: '/dashboard/admin/live', label: 'Live Communication', icon: '🖥️' },
    { to: '/dashboard/admin/monitoring', label: 'Live Monitoring', icon: '📊' },
    { to: '/dashboard/admin/audit', label: 'Audit Logs', icon: '🧾' }
];

const AdminLayout = () => {
    const me = authHelpers.getUserName() || 'Admin';
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [unreadDM, setUnreadDM] = useState(0);

    useEffect(() => {
        if (location.pathname.startsWith('/dashboard/admin/live')) setUnreadDM(0);
    }, [location.pathname]);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8085/ws');
        const client = new Client({ webSocketFactory: () => socket, reconnectDelay: 3000 });

        // FIX: Normalize the user name to lowercase for the STOMP destination path
        const normalizedMe = me.toLowerCase();

        client.onConnect = () => {
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
    }, [me, showToast]);

    const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-100">
            <aside className="w-64 flex flex-col h-full flex-shrink-0 bg-slate-900 text-slate-100">
                <div className="px-6 py-5 text-2xl font-bold border-b border-slate-800 flex-shrink-0">Admin Portal</div>
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {menu.map(item => (
                        <NavLink key={item.to} to={item.to}
                            className={isActive(item.to, item.exact) ? 'flex items-center justify-between px-3 py-2 rounded-md bg-indigo-600 text-white'
                                                                     : 'flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-800'}>
                            <span className="flex items-center gap-2"><span>{item.icon}</span><span>{item.label}</span></span>
                            {item.to === '/dashboard/admin/live' && unreadDM > 0 && (
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
                <header className="h-16 flex-shrink-0 bg-white border-b px-6 flex items-center justify-between">
                    <div className="text-slate-700">Welcome, {me}</div>
                    <div className="text-xs text-slate-500">Live notifications enabled</div>
                </header>
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
