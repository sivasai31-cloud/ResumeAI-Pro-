import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Pill,
  Calendar,
  FileText,
  PhoneCall,
  Bell,
  ShieldCheck,
  HeartHandshake,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/parents', label: 'Parents', icon: Users },
    { to: '/medicines', label: 'Medications', icon: Pill },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/reports', label: 'Medical Records', icon: FileText },
    { to: '/emergency', label: 'Emergency & SOS', icon: PhoneCall, highlight: true },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    ...(user?.role === 'ADMIN'
      ? [{ to: '/admin', label: 'Admin Portal', icon: ShieldCheck }]
      : []),
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <div className="logo-icon-wrap">
              <HeartHandshake className="logo-icon" size={24} />
            </div>
            <div className="logo-text">
              <span className="brand-name">ParentCare</span>
              <span className="brand-tag">Family Health Hub</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">MAIN NAVIGATION</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${item.highlight ? 'nav-highlight' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={19} className="nav-icon" />
                <span className="nav-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info-text">
              <span className="user-name" title={user?.full_name}>{user?.full_name}</span>
              <span className="user-role-pill">{user?.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout} title="Sign Out">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
