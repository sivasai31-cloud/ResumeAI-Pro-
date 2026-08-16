import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertCircle,
  Pill,
  Calendar,
  Info,
} from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import type { Notification } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsApi.getAll(unreadOnly);
      setNotifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Pill size={18} />;
      case 'alert':
        return <Calendar size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Notifications & Reminders</h2>
          <p className="page-subtitle">Medication reminders, appointment schedules, and critical care notifications.</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button className="btn-secondary btn-sm" onClick={handleMarkAllAsRead}>
            <CheckCheck size={15} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="search-filter-bar">
        <div className="filter-controls-row">
          <button
            className={`btn-filter-tab ${!unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(false)}
          >
            All Notifications
          </button>
          <button
            className={`btn-filter-tab ${unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(true)}
          >
            Unread Only
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} color="var(--accent-rose)" />
          <p>{error}</p>
          <button className="btn-primary" onClick={loadNotifications}>Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state-card">
          <Bell size={42} color="var(--palette-taupe)" />
          <h3>No Pending Notifications</h3>
          <p>You are all caught up with your parents' medication schedules and visits.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item-card ${notif.is_read ? 'read' : 'unread'}`}
              onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
            >
              <div className="notif-icon-wrap">
                {getIconForType(notif.notification_type)}
              </div>
              <div className="notif-content-col">
                <div className="notif-top-row">
                  <h4>{notif.title}</h4>
                  <span className="notif-time">
                    <Clock size={12} /> {new Date(notif.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="notif-msg">{notif.message}</p>
              </div>
              {!notif.is_read && (
                <div className="unread-dot" title="Unread notification" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
