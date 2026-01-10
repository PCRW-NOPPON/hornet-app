/**
 * Hornet AI - Sidebar Component (Refactored)
 * Improved accessibility and navigation
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  MessageSquare,
  Car,
  User,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

// Navigation configuration
const NAVIGATION = {
  workspace: {
    label: 'WORKSPACE',
    items: [
      { path: '/cases', label: 'หน้าหลัก', icon: Home },
      { path: '/cases', label: 'คดี', icon: Briefcase },
      {
        path: '/ai-interview',
        label: 'AI Interview',
        icon: MessageSquare,
        badge: 'BETA',
        disabled: true,
      },
      {
        path: '/batch-dui',
        label: 'Batch DUI',
        icon: Car,
        badge: 'BETA',
        disabled: true,
      },
    ],
  },
  management: {
    label: 'MANAGEMENT',
    items: [
      { path: '/profile', label: 'โปรไฟล์', icon: User, disabled: true },
      { path: '/library', label: 'คลังกฎหมาย', icon: BookOpen, disabled: true },
      { path: '/settings', label: 'ตั้งค่า', icon: Settings, disabled: true },
    ],
  },
};

function NavItem({ item }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        className="nav-item disabled"
        style={{
          opacity: 0.5,
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
        }}
        title="เร็วๆ นี้"
      >
        <Icon size={18} />
        <span>{item.label}</span>
        {item.badge && (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '2px 6px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              marginLeft: 'auto',
            }}
          >
            {item.badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive: navActive }) =>
        `nav-item ${navActive || isActive ? 'active' : ''}`
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        textDecoration: 'none',
        color: isActive ? 'white' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--brand-black)' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={18} />
      <span>{item.label}</span>
      {item.badge && (
        <span
          style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
            borderRadius: '4px',
            marginLeft: 'auto',
          }}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

function NavGroup({ group }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="nav-group" style={{ marginBottom: '1.5rem' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="menu-group-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.5rem 1rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
        aria-expanded={isExpanded}
      >
        {group.label}
        <ChevronDown
          size={14}
          style={{
            transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isExpanded && (
        <nav className="nav-items" style={{ marginTop: '0.5rem' }}>
          {group.items.map((item) => (
            <NavItem key={item.path + item.label} item={item} />
          ))}
        </nav>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div
        className="sidebar-brand"
        style={{
          padding: '1.5rem 1rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--brand-black)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            H
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
              Hornet AI
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              PROFESSIONAL PLATFORM
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav" style={{ padding: '1rem 0.5rem', flex: 1 }}>
        <NavGroup group={NAVIGATION.workspace} />
        <NavGroup group={NAVIGATION.management} />
      </div>

      {/* Footer */}
      <div
        className="sidebar-footer"
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <button
          className="nav-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            width: '100%',
            background: 'none',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
          disabled
          title="เร็วๆ นี้"
        >
          <LogOut size={18} />
          <span>ออกจากระบบ</span>
        </button>

        {/* Version Info */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          Version 0.1.0-beta
        </div>
      </div>
    </aside>
  );
}
