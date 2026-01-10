import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { HelpCircle, User } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    // Build breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumb = pathSegments.length > 0
        ? `Home / ${pathSegments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')}`
        : 'Home';

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div style={{ color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: breadcrumb.replace(/(\S+)$/, '<b>$1</b>') }}></div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <HelpCircle size={20} style={{ color: '#999', cursor: 'pointer' }} />
                        <User size={20} style={{ color: '#999', cursor: 'pointer' }} />
                    </div>
                </header>
                <div className="page-container">
                    <Outlet />
                </div>
            </div>
        </>
    );
}
