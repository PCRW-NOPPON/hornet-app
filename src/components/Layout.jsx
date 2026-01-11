import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { HelpCircle, User } from 'lucide-react';
import { useMemo } from 'react';

export default function Layout() {
    const location = useLocation();

    // Build breadcrumbs from path - XSS SAFE version
    const breadcrumbs = useMemo(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);

        const segmentLabels = {
            cases: 'คดี',
            data: 'ข้อมูล',
            documents: 'เอกสาร',
            collect: 'รวบรวม',
        };

        const crumbs = pathSegments.map((segment, index) => {
            const path = '/' + pathSegments.slice(0, index + 1).join('/');
            const label = segmentLabels[segment] || segment;
            const isLast = index === pathSegments.length - 1;
            return { label, path, isLast };
        });

        return [{ label: 'หน้าหลัก', path: '/', isLast: crumbs.length === 0 }, ...crumbs];
    }, [location.pathname]);

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <nav style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        {breadcrumbs.map((crumb, index) => (
                            <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {index > 0 && <span>/</span>}
                                {crumb.isLast ? (
                                    <strong style={{ color: 'var(--text-primary)' }}>{crumb.label}</strong>
                                ) : (
                                    <Link to={crumb.path} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {crumb.label}
                                    </Link>
                                )}
                            </span>
                        ))}
                    </nav>
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
