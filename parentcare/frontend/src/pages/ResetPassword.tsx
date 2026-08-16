import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HeartHandshake, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/auth';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match. Please verify.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <HeartHandshake size={28} />
          </div>
          <h1>New Password</h1>
          <p className="auth-subtitle">Choose a strong new password for your ParentCare account.</p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="alert-success">
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>Password reset successfully! Redirecting to sign in...</span>
            </div>
            <Link to="/login" className="btn-primary btn-block" style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', borderRadius: 'var(--radius-full)' }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="rp-new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="rp-new-password"
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || !token}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--palette-taupe)', display: 'flex', alignItems: 'center', padding: 0 }}
                  tabIndex={-1} aria-label={showNew ? 'Hide password' : 'Show password'}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="rp-confirm-password">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="rp-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--palette-taupe)', display: 'flex', alignItems: 'center', padding: 0 }}
                  tabIndex={-1} aria-label={showConfirm ? 'Hide confirm' : 'Show confirm'}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary btn-block" disabled={loading || !token}>
              {loading ? (
                <span className="btn-loading-flex"><span className="spinner-sm"></span> Saving...</span>
              ) : (
                <span className="btn-flex"><Lock size={17} /> Set New Password</span>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Remember your password? <Link to="/login" className="auth-link">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};
