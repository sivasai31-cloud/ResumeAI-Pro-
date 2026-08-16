import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Pill,
  Calendar,
  FileText,
  PhoneCall,
  Plus,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Shield,
  User,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import type { DashboardOverview } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await dashboardApi.getOverview();
      setData(overview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your care dashboard..." />;
  }

  if (error) {
    return (
      <div className="error-card">
        <AlertTriangle size={32} color="var(--accent-rose)" />
        <h2>Dashboard Unavailable</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={loadDashboard}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Editorial Dashboard Hero */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>ParentCare Overview</h1>
          <p>
            Centralized health coordination, daily medicine adherence, clinic visits, and emergency contacts.
          </p>
        </div>
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => navigate('/parents')}>
            <Plus size={18} /> Manage Parents
          </button>
          <button className="btn-hero-sos" onClick={() => navigate('/emergency')}>
            <PhoneCall size={18} /> Emergency SOS
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => navigate('/parents')}>
          <div className="metric-icon-box bg-dark">
            <Users size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{data?.total_parents || 0}</span>
            <span className="metric-label">Registered Parents</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/medicines')}>
          <div className="metric-icon-box bg-charcoal">
            <Pill size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{data?.total_active_medicines || 0}</span>
            <span className="metric-label">Active Prescriptions</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/appointments')}>
          <div className="metric-icon-box bg-taupe">
            <Calendar size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{data?.total_upcoming_appointments || 0}</span>
            <span className="metric-label">Upcoming Visits</span>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/reports')}>
          <div className="metric-icon-box bg-steel">
            <FileText size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{data?.total_reports || 0}</span>
            <span className="metric-label">Medical Records</span>
          </div>
        </div>
      </div>

      {/* Main Asymmetrical Columns Section */}
      <div className="dashboard-columns-grid">
        {/* Left Column: Today's Schedule & Appointments */}
        <div className="dashboard-column">
          {/* Active Medicines Schedule */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title-flex">
                <Pill size={18} color="var(--palette-dark)" />
                <h3>Today's Medication Schedule</h3>
              </div>
              <Link to="/medicines" className="panel-link">
                View all <ArrowRight size={15} />
              </Link>
            </div>

            <div className="panel-body">
              {!data?.today_medicines || data.today_medicines.length === 0 ? (
                <div className="empty-state-box">
                  <Pill size={32} color="var(--palette-taupe)" />
                  <p>No active medications scheduled for today.</p>
                  <button className="btn-secondary btn-sm" onClick={() => navigate('/medicines')}>
                    + Add Medication
                  </button>
                </div>
              ) : (
                <div className="items-list">
                  {data.today_medicines.map((med) => (
                    <div key={med.id} className="schedule-item">
                      <div className="schedule-badge">
                        <Pill size={18} />
                      </div>
                      <div className="schedule-info">
                        <div className="schedule-title-row">
                          <strong className="med-name">{med.name}</strong>
                          <span className="med-dosage-tag">{med.dosage}</span>
                        </div>
                        <div className="schedule-sub-row">
                          <span>{med.parent_name || 'Parent'}</span>
                          <span>• {med.frequency}</span>
                        </div>
                        {med.instructions && (
                          <div className="schedule-notes">{med.instructions}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Doctor Appointments */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title-flex">
                <Calendar size={18} color="var(--palette-dark)" />
                <h3>Upcoming Doctor Appointments</h3>
              </div>
              <Link to="/appointments" className="panel-link">
                View all <ArrowRight size={15} />
              </Link>
            </div>

            <div className="panel-body">
              {!data?.upcoming_appointments || data.upcoming_appointments.length === 0 ? (
                <div className="empty-state-box">
                  <Calendar size={32} color="var(--palette-taupe)" />
                  <p>No upcoming clinical appointments scheduled.</p>
                  <button className="btn-secondary btn-sm" onClick={() => navigate('/appointments')}>
                    + Schedule Appointment
                  </button>
                </div>
              ) : (
                <div className="items-list">
                  {data.upcoming_appointments.map((apt) => (
                    <div key={apt.id} className="appointment-card-item">
                      <div className="apt-date-badge">
                        <span className="apt-day">
                          {new Date(apt.appointment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="apt-time">{apt.appointment_time}</span>
                      </div>
                      <div className="apt-info">
                        <strong className="apt-doctor">{apt.doctor_name}</strong>
                        <div className="apt-meta-row">
                          <span><MapPin size={13} /> {apt.hospital_clinic}</span>
                          <span><User size={13} /> {apt.parent_name || 'Parent'}</span>
                        </div>
                        {apt.purpose && <p className="apt-purpose">{apt.purpose}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: SOS Emergency & Recent Reports */}
        <div className="dashboard-column">
          {/* SOS Quick Contacts */}
          <div className="panel-card" style={{ borderColor: 'rgba(225, 29, 72, 0.25)' }}>
            <div className="panel-header">
              <div className="panel-title-flex">
                <PhoneCall size={18} color="var(--accent-rose)" />
                <h3>Emergency Contacts</h3>
              </div>
              <Link to="/emergency" className="panel-link" style={{ color: 'var(--accent-rose)' }}>
                Directory <ArrowRight size={15} />
              </Link>
            </div>

            <div className="panel-body">
              {!data?.emergency_contacts || data.emergency_contacts.length === 0 ? (
                <div className="empty-state-box">
                  <Shield size={32} color="var(--palette-taupe)" />
                  <p>No emergency contacts added yet.</p>
                  <button className="btn-danger btn-sm" onClick={() => navigate('/emergency')}>
                    + Add Emergency Contact
                  </button>
                </div>
              ) : (
                <div className="emergency-quick-list">
                  {data.emergency_contacts.map((contact) => (
                    <div key={contact.id} className="sos-contact-card">
                      <div className="sos-contact-info">
                        <div className="sos-name-row">
                          <strong>{contact.name}</strong>
                          <span className={`priority-tag ${contact.priority}`}>
                            {contact.priority}
                          </span>
                        </div>
                        <div className="sos-rel-text">
                          {contact.relationship_type} • For {contact.parent_name || 'Parent'}
                        </div>
                      </div>
                      <a href={`tel:${contact.phone}`} className="btn-call-action" title="Call Now">
                        <PhoneCall size={14} />
                        <span>{contact.phone}</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Medical Reports */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title-flex">
                <FileText size={18} color="var(--palette-dark)" />
                <h3>Recent Medical Reports</h3>
              </div>
              <Link to="/reports" className="panel-link">
                View all <ArrowRight size={15} />
              </Link>
            </div>

            <div className="panel-body">
              {!data?.recent_reports || data.recent_reports.length === 0 ? (
                <div className="empty-state-box">
                  <FileText size={32} color="var(--palette-taupe)" />
                  <p>No medical reports uploaded yet.</p>
                  <button className="btn-secondary btn-sm" onClick={() => navigate('/reports')}>
                    + Upload Report
                  </button>
                </div>
              ) : (
                <div className="items-list">
                  {data.recent_reports.map((report) => (
                    <div key={report.id} className="report-item-row">
                      <div className="report-icon-tag">
                        <FileText size={17} />
                      </div>
                      <div className="report-info-col">
                        <strong className="report-title">{report.title}</strong>
                        <div className="report-meta">
                          <span className="report-type-badge">{report.report_type.replace('_', ' ')}</span>
                          <span>{report.parent_name || 'Parent'}</span>
                          <span><Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
