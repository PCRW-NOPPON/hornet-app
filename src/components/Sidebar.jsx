import { NavLink } from 'react-router-dom';
import { Home, Folder, Mic, Car, User, Book, Settings } from 'lucide-react';

export default function Sidebar() {
    return (
        <nav className="sidebar">
            <div className="brand">
                Hornet AI
                <span>PROFESSIONAL PLATFORM</span>
            </div>

            <div className="menu-group-label">Workspace</div>
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Home size={18} /> Home
            </NavLink>
            <NavLink to="/cases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Folder size={18} /> Cases
            </NavLink>
            <a className="nav-item">
                <Mic size={18} /> AI Interview <span className="tag">BETA</span>
            </a>
            <a className="nav-item">
                <Car size={18} /> Batch DUI <span className="tag">BETA</span>
            </a>

            <div className="menu-group-label">Management</div>
            <a className="nav-item">
                <User size={18} /> Profile
            </a>
            <a className="nav-item">
                <Book size={18} /> Legal Library
            </a>
            <a className="nav-item">
                <Settings size={18} /> Settings
            </a>
        </nav>
    );
}
