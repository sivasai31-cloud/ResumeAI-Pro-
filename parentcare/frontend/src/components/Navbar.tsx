import React, { useState, useEffect } from 'react';
import { Menu, Bell, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const notifs = await notificationsApi.getAll(true);
        setUnreadCount(notifs.length);
      } catch {
        // Silently ignore if not authorized yet
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar-header">
      <div className="navbar-left">
        <button
          className="btn-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <span className="navbar-subtitle">Care Portal</span>
      </div>

      <div className="navbar-right">
        <button
          className="btn-sos-nav"
          onClick={() => navigate('/emergency')}
          title="Emergency Contacts & SOS"
        >
          <PhoneCall size={16} />
          <span>SOS Center</span>
        </button>

        <button
          className="btn-icon-badge"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
        </button>
      </div>
    </header>
  );
};
