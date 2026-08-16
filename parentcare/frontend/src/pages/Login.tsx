import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <HeartHandshake size={28} />
          </div>
          <h1>ParentCare</h1>
          <p className="auth-subtitle">Coordinated healthcare & daily peace of mind for your parents.</p>
        </div>

        {/* Auth mode toggle tabs */}
        <div className="search-filter-bar" style={{ padding: '0.35rem', justifyContent: 'center' }}>
          <button type="button" className="btn-filter-tab active" style={{ flex: 1, textAlign: 'center' }}>
            Sign In
          </button>
          <Link
            to="/register"
            className="btn-filter-tab"
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
          >
            Create Account
          </Link>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Forgot password?</Link>
            </div>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="btn-loading-flex">
                <span className="spinner-sm"></span> Signing in...
              </span>
            ) : (
              <span className="btn-flex">
                <LogIn size={17} /> Continue to Care Portal
              </span>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div style={{ background: 'rgba(209, 211, 221, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--palette-charcoal)', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sparkles size={14} color="var(--palette-taupe)" /> Quick Demo Access (1-Click Fill & Continue):
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => handleFillDemo('demo@parentcare.com', 'Demo123!')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              Demo User
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => handleFillDemo('admin@parentcare.com', 'Admin123!')}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              Admin Portal
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            First time using ParentCare?{' '}
            <Link to="/register" className="auth-link">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
