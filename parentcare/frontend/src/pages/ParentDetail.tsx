import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Heart,
  ShieldAlert,
  FileText,
  Pill,
  Calendar,
  PhoneCall,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { parentsApi } from '../api/parents';
import { medicinesApi } from '../api/medicines';
import { appointmentsApi } from '../api/appointments';
import { reportsApi } from '../api/reports';
import { emergencyApi } from '../api/emergency';
import type { Parent, Medicine, Appointment, MedicalReport, EmergencyContact } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ParentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const parentId = Number(id);

  const [parent, setParent] = useState<Parent | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (isNaN(parentId)) {
      setError('Invalid parent ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [parentData, medsData, aptsData, reportsData, contactsData] = await Promise.all([
        parentsApi.getById(parentId),
        medicinesApi.getAll(parentId),
        appointmentsApi.getAll(parentId),
        reportsApi.getAll(parentId),
        emergencyApi.getAll(parentId),
      ]);

      setParent(parentData);
      setMedicines(medsData);
      setAppointments(aptsData);
      setReports(reportsData);
      setEmergencyContacts(contactsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load parent profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [parentId]);

  if (loading) {
    return <LoadingSpinner message="Loading parent profile..." />;
  }

  if (error || !parent) {
    return (
      <div className="error-card">
        <AlertTriangle size={32} color="var(--accent-rose)" />
        <h2>Parent Profile Not Found</h2>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/parents')}>
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ alignItems: 'center' }}>
        <button className="btn-secondary btn-sm" onClick={() => navigate('/parents')}>
          <ArrowLeft size={15} /> Back to Directory
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="parent-hero-profile">
        <div className="parent-hero-avatar">
          {parent.name.charAt(0).toUpperCase()}
        </div>
        <div className="parent-hero-info">
          <h1>{parent.name}</h1>
          <div className="parent-meta-badges">
            {parent.gender && <span className="badge-tag">{parent.gender}</span>}
            {parent.blood_group && (
              <span className="badge-tag tag-blood">
                <Heart size={12} /> Blood Group: {parent.blood_group}
              </span>
            )}
            {parent.date_of_birth && (
              <span className="badge-tag">DOB: {parent.date_of_birth}</span>
            )}
          </div>
          <div className="parent-contact-links">
            {parent.phone && (
              <a href={`tel:${parent.phone}`} className="contact-chip">
                <Phone size={13} /> {parent.phone}
              </a>
            )}
            {parent.email && (
              <a href={`mailto:${parent.email}`} className="contact-chip">
                <Mail size={13} /> {parent.email}
              </a>
            )}
            {parent.address && (
              <span className="contact-chip">
                <MapPin size={13} /> {parent.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Allergies & Emergency Notes Banner */}
      {(parent.allergies || parent.emergency_notes) && (
        <div className="medical-alert-banner">
          {parent.allergies && (
            <div className="alert-item">
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Known Allergies:</strong>
                <p>{parent.allergies}</p>
              </div>
            </div>
          )}
          {parent.emergency_notes && (
            <div className="alert-item">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Emergency & Clinical Notes:</strong>
                <p>{parent.emergency_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sections Grid */}
      <div className="parent-sections-grid">
        {/* Active Medications */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-flex">
              <Pill size={18} color="var(--palette-dark)" />
              <h3>Prescriptions ({medicines.length})</h3>
            </div>
            <Link to="/medicines" className="btn-secondary btn-sm">
              <Plus size={14} /> Add
            </Link>
          </div>
          <div className="panel-body">
            {medicines.length === 0 ? (
              <p style={{ color: 'var(--palette-taupe)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.88rem' }}>
                No active medications recorded for {parent.name}.
              </p>
            ) : (
              <div className="items-list">
                {medicines.map((med) => (
                  <div key={med.id} className="schedule-item">
                    <div className="schedule-badge">
                      <Pill size={16} />
                    </div>
                    <div className="schedule-info">
                      <div className="schedule-title-row">
                        <strong className="med-name">{med.name}</strong>
                        <span className="med-dosage-tag">{med.dosage}</span>
                      </div>
                      <div className="schedule-sub-row">
                        <span>{med.frequency}</span>
                        <span className={`status-pill ${med.status}`}>{med.status}</span>
                      </div>
                      {med.instructions && <div className="schedule-notes">{med.instructions}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Doctor Appointments */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-flex">
              <Calendar size={18} color="var(--palette-dark)" />
              <h3>Doctor Visits ({appointments.length})</h3>
            </div>
            <Link to="/appointments" className="btn-secondary btn-sm">
              <Plus size={14} /> Schedule
            </Link>
          </div>
          <div className="panel-body">
            {appointments.length === 0 ? (
              <p style={{ color: 'var(--palette-taupe)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.88rem' }}>
                No appointments scheduled for {parent.name}.
              </p>
            ) : (
              <div className="items-list">
                {appointments.map((apt) => (
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
                        <span className={`status-pill ${apt.status}`}>{apt.status}</span>
                      </div>
                      {apt.purpose && <p className="apt-purpose">{apt.purpose}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Medical Reports */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-flex">
              <FileText size={18} color="var(--palette-dark)" />
              <h3>Medical Records ({reports.length})</h3>
            </div>
            <Link to="/reports" className="btn-secondary btn-sm">
              <Plus size={14} /> Upload
            </Link>
          </div>
          <div className="panel-body">
            {reports.length === 0 ? (
              <p style={{ color: 'var(--palette-taupe)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.88rem' }}>
                No medical reports uploaded.
              </p>
            ) : (
              <div className="items-list">
                {reports.map((report) => (
                  <div key={report.id} className="report-item-row">
                    <div className="report-icon-tag">
                      <FileText size={16} />
                    </div>
                    <div className="report-info-col">
                      <strong className="report-title">{report.title}</strong>
                      <div className="report-meta">
                        <span className="report-type-badge">{report.report_type.replace('_', ' ')}</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-flex">
              <PhoneCall size={18} color="var(--accent-rose)" />
              <h3>Emergency Contacts ({emergencyContacts.length})</h3>
            </div>
            <Link to="/emergency" className="btn-danger btn-sm">
              <Plus size={14} /> Add SOS
            </Link>
          </div>
          <div className="panel-body">
            {emergencyContacts.length === 0 ? (
              <p style={{ color: 'var(--palette-taupe)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.88rem' }}>
                No emergency contacts registered.
              </p>
            ) : (
              <div className="emergency-quick-list">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="sos-contact-card">
                    <div className="sos-contact-info">
                      <div className="sos-name-row">
                        <strong>{contact.name}</strong>
                        <span className={`priority-tag ${contact.priority}`}>
                          {contact.priority}
                        </span>
                      </div>
                      <div className="sos-rel-text">{contact.relationship_type}</div>
                    </div>
                    <a href={`tel:${contact.phone}`} className="btn-call-action">
                      <PhoneCall size={13} /> {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
