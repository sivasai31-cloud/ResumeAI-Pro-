import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/auth';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSubmitted(true);
      if (res.reset_token) setResetToken(res.reset_token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
          <h1>Reset Password</h1>
          <p className="auth-subtitle">Enter your registered email and we will send you a reset link.</p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="alert-success">
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>If that email is registered, a reset link has been sent. Check your inbox.</span>
            </div>
            {resetToken && (
              <div style={{ background: 'rgba(209,211,221,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--palette-charcoal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dev Mode Reset Link</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--palette-taupe)', lineHeight: 1.5 }}>In production this would be emailed. Click below to reset your password:</p>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="btn-primary"
                  style={{ marginTop: '0.25rem', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-full)' }}
                >
                  Open Reset Link
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fp-email">Email Address</label>
              <input
                id="fp-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading ? (
                <span className="btn-loading-flex"><span className="spinner-sm"></span> Sending...</span>
              ) : (
                <span className="btn-flex"><Mail size={17} /> Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
