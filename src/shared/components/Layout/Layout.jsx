/**
 * Hornet AI - Layout Component (Refactored)
 * Fixed XSS vulnerability and improved accessibility
 */

import { Outlet, useLocation, Link } from 'react-router-dom';
import { HelpCircle, User, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useMemo } from 'react';

/**
 * Build breadcrumb from path - XSS safe version
 */
function useBreadcrumbs() {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Map path segments to display names
    const segmentLabels = {
      cases: 'คดี',
      data: 'ข้อมูล',
      documents: 'เอกสาร',
      collect: 'รวบรวม',
      settings: 'ตั้งค่า',
      profile: 'โปรไฟล์',
    };

    const crumbs = pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segmentLabels[segment] || segment;
      const isLast = index === pathSegments.length - 1;

      return {
        label,
        path,
        isLast,
        // Case ID detection (starts with number or contains /)
        isCaseId: /^[0-9]|\//.test(segment) || segment.startsWith('NEW-'),
      };
    });

    return [{ label: 'หน้าหลัก', path: '/', isLast: crumbs.length === 0 }, ...crumbs];
  }, [location.pathname]);
}

export default function Layout() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        {/* Header */}
        <header className="header">
          {/* Breadcrumbs - XSS Safe */}
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0.5rem' }}>
              {breadcrumbs.map((crumb, index) => (
                <li
                  key={crumb.path}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {index > 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                  )}
                  {crumb.isLast ? (
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                      aria-current="page"
                    >
                      {crumb.isCaseId ? `คดี ${crumb.label}` : crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.path}
                      style={{
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                      }}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Header Actions */}
          <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="icon-button"
              aria-label="การแจ้งเตือน"
              style={iconButtonStyle}
            >
              <Bell size={20} />
            </button>
            <button
              className="icon-button"
              aria-label="ช่วยเหลือ"
              style={iconButtonStyle}
            >
              <HelpCircle size={20} />
            </button>
            <button
              className="icon-button"
              aria-label="โปรไฟล์"
              style={iconButtonStyle}
            >
              <User size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const iconButtonStyle = {
  padding: '8px',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  color: '#999',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s, color 0.2s',
};
