import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

export const Profile: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: { full_name?: string; phone?: string; password?: string } = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      };
      if (password) {
        payload.password = password;
      }

      const updated = await authApi.updateMe(payload);
      updateCurrentUser(updated);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '750px' }}>
      <div className="page-header-row">
        <div>
          <h2>My Profile & Settings</h2>
          <p className="page-subtitle">Update your personal account details and security credentials.</p>
        </div>
      </div>

      <div className="panel-card">
        <div className="profile-header-strip">
          <div className="profile-large-avatar">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-title-col">
            <h3>{user?.full_name}</h3>
            <span className="profile-email">{user?.email}</span>
            <div className="role-chip mt-1">
              <Shield size={13} /> {user?.role} ACCOUNT
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error mt-3">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-success mt-3">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form mt-4">
          <div className="form-group">
            <label>Email Address (Read-only)</label>
            <input type="email" value={user?.email || ''} disabled className="input-disabled" />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="password-update-box">
            <h4>Change Account Password (Optional)</h4>
            <div className="form-row-2 mt-2">
              <div className="form-group">
                <label>New Password (min 6 chars)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions-row mt-4">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (
                <span className="btn-flex"><Save size={16} /> Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
