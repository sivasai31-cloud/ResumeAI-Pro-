import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role: 'USER',
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
          <h1>Create Account</h1>
          <p className="auth-subtitle">Register to manage your parents' prescriptions, visits & emergencies.</p>
        </div>

        {/* Auth mode toggle tabs */}
        <div className="search-filter-bar" style={{ padding: '0.35rem', justifyContent: 'center' }}>
          <Link
            to="/login"
            className="btn-filter-tab"
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
          >
            Sign In
          </Link>
          <button type="button" className="btn-filter-tab active" style={{ flex: 1, textAlign: 'center' }}>
            Create Account
          </button>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Your Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="e.g. Sarah Connor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              id="phone"
              type="tel"
              placeholder="+1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm</label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="Re-enter"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? (
              <span className="btn-loading-flex">
                <span className="spinner-sm"></span> Creating Account...
              </span>
            ) : (
              <span className="btn-flex">
                <UserPlus size={17} /> Complete Registration
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
