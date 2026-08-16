import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Filter,
} from 'lucide-react';
import { appointmentsApi } from '../api/appointments';
import { parentsApi } from '../api/parents';
import type { Appointment, Parent } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [parentId, setParentId] = useState<number | ''>('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [parentsData, aptsData] = await Promise.all([
        parentsApi.getAll(),
        appointmentsApi.getAll(
          selectedParentId ? Number(selectedParentId) : undefined,
          statusFilter || undefined
        ),
      ]);
      setParents(parentsData);
      setAppointments(aptsData);
      if (parentsData.length > 0 && parentId === '') {
        setParentId(parentsData[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedParentId, statusFilter]);

  const openAddModal = () => {
    setEditingAppointment(null);
    if (parents.length > 0) setParentId(parents[0].id);
    setDoctorName('');
    setHospitalClinic('');
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    setAppointmentTime('10:00');
    setPurpose('');
    setNotes('');
    setStatus('upcoming');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setParentId(apt.parent_id);
    setDoctorName(apt.doctor_name);
    setHospitalClinic(apt.hospital_clinic);
    setAppointmentDate(apt.appointment_date);
    setAppointmentTime(apt.appointment_time);
    setPurpose(apt.purpose || '');
    setNotes(apt.notes || '');
    setStatus(apt.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !hospitalClinic.trim() || !appointmentDate || !appointmentTime || !parentId) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: Partial<Appointment> = {
      parent_id: Number(parentId),
      doctor_name: doctorName.trim(),
      hospital_clinic: hospitalClinic.trim(),
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      purpose: purpose.trim() || null,
      notes: notes.trim() || null,
      status,
    };

    try {
      if (editingAppointment) {
        await appointmentsApi.update(editingAppointment.id, payload);
      } else {
        await appointmentsApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this doctor appointment?')) {
      try {
        await appointmentsApi.delete(id);
        loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete appointment.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Doctor Appointments</h2>
          <p className="page-subtitle">Schedule, coordinate, and review clinical consultations and follow-up visits.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            if (parents.length === 0) {
              navigate('/parents');
            } else {
              openAddModal();
            }
          }}
        >
          <Plus size={17} /> Schedule Appointment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="search-filter-bar">
        <div className="filter-controls-row">
          <div className="filter-group">
            <Filter size={15} />
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
            >
              <option value="">All Parents</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading appointment schedule..." />
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} color="var(--accent-rose)" />
          <p>{error}</p>
          <button className="btn-primary" onClick={loadData}>Retry</button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state-card">
          <Calendar size={42} color="var(--palette-taupe)" />
          <h3>No Appointments Scheduled</h3>
          <p>Organize doctor visits, clinic reviews, and follow-ups with medical notes.</p>
          {parents.length > 0 ? (
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={17} /> Schedule New Visit
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/parents')}>
              <Plus size={17} /> Add Parent Profile First
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {appointments.map((apt) => (
            <div key={apt.id} className="appointment-card">
              <div className="apt-header-strip">
                <div className="apt-badge-date">
                  <span className="apt-month">
                    {new Date(apt.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="apt-clock"><Clock size={12} /> {apt.appointment_time}</span>
                </div>
                <span className={`status-pill ${apt.status}`}>{apt.status}</span>
              </div>

              <div className="apt-details-main">
                <h3 className="apt-doc-title">{apt.doctor_name}</h3>
                <div className="apt-clinic-row">
                  <MapPin size={14} /> <span>{apt.hospital_clinic}</span>
                </div>
                <div className="apt-parent-row">
                  <User size={14} /> <span>For <strong>{apt.parent_name || 'Parent'}</strong></span>
                </div>
                {apt.purpose && (
                  <div className="apt-purpose-tag">
                    <strong>Purpose:</strong> {apt.purpose}
                  </div>
                )}
                {apt.notes && (
                  <p className="apt-notes-preview">Note: {apt.notes}</p>
                )}
              </div>

              <div className="apt-card-footer">
                <button
                  className="btn-icon-subtle"
                  title="Edit Appointment"
                  onClick={() => openEditModal(apt)}
                >
                  <Edit2 size={15} /> Edit
                </button>
                <button
                  className="btn-icon-subtle text-danger"
                  title="Delete Appointment"
                  onClick={() => handleDelete(apt.id)}
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppointment ? `Edit Appointment: ${editingAppointment.doctor_name}` : 'Schedule Doctor Visit'}
      >
        {formError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Parent *</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(Number(e.target.value))}
              required
            >
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Doctor's Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Robert Miller"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Hospital / Clinic Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Memorial Hospital"
                value={hospitalClinic}
                onChange={(e) => setHospitalClinic(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Appointment Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Appointment Time *</label>
              <input
                type="time"
                required
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Purpose of Visit</label>
              <input
                type="text"
                placeholder="e.g. Cardiology follow-up"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes / Questions for Doctor</label>
            <textarea
              rows={3}
              placeholder="e.g. Check blood sugar report, request medication refill"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingAppointment ? 'Save Changes' : 'Schedule Visit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
