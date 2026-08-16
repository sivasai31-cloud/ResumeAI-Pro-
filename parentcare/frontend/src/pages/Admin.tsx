import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Pill,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import type { AdminStats, User } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load admin stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setActionLoading(userId);
      const updated = await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      const updated = await adminApi.toggleUserStatus(userId, !currentStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to change status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading administration console..." />;
  }

  if (error) {
    return (
      <div className="error-card">
        <AlertCircle size={32} color="var(--danger)" />
        <h2>Access Denied or Error</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={loadAdminData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Platform Administration</h2>
          <p className="page-subtitle">Manage users, security roles, system health metrics, and account statuses.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box bg-blue">
            <Users size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.total_users || 0}</span>
            <span className="metric-label">Total Users</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-teal">
            <ShieldCheck size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.total_parents || 0}</span>
            <span className="metric-label">Total Parents</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-emerald">
            <Pill size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.total_active_medicines || 0}</span>
            <span className="metric-label">Active Medications</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-purple">
            <Calendar size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.total_appointments || 0}</span>
            <span className="metric-label">Total Appointments</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box bg-amber">
            <FileText size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.total_reports || 0}</span>
            <span className="metric-label">Medical Records</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="panel-card mt-4">
        <div className="panel-header">
          <h3>Registered System Users ({users.length})</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <select
                      className="table-select"
                      value={u.role}
                      disabled={actionLoading === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="PARENT">PARENT</option>
                    </select>
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="status-badge-active">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <span className="status-badge-inactive">
                        <XCircle size={13} /> Inactive
                      </span>
                    )}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`btn-table-action ${u.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                      disabled={actionLoading === u.id}
                      onClick={() => handleStatusToggle(u.id, u.is_active)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
