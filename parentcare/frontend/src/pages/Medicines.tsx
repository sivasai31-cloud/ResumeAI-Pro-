import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react';
import { medicinesApi } from '../api/medicines';
import { parentsApi } from '../api/parents';
import type { Medicine, Parent } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';

export const Medicines: React.FC = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [parentId, setParentId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'stopped'>('active');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [parentsData, medsData] = await Promise.all([
        parentsApi.getAll(),
        medicinesApi.getAll(
          selectedParentId ? Number(selectedParentId) : undefined,
          statusFilter || undefined
        ),
      ]);
      setParents(parentsData);
      setMedicines(medsData);
      if (parentsData.length > 0 && parentId === '') {
        setParentId(parentsData[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load medicines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedParentId, statusFilter]);

  const openAddModal = () => {
    setEditingMedicine(null);
    if (parents.length > 0) setParentId(parents[0].id);
    setName('');
    setDosage('');
    setFrequency('Once daily (morning)');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setInstructions('');
    setStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setParentId(med.parent_id);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setStartDate(med.start_date || '');
    setEndDate(med.end_date || '');
    setInstructions(med.instructions || '');
    setStatus(med.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !frequency.trim() || !parentId) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: Partial<Medicine> = {
      parent_id: Number(parentId),
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      instructions: instructions.trim() || null,
      status,
    };

    try {
      if (editingMedicine) {
        await medicinesApi.update(editingMedicine.id, payload);
      } else {
        await medicinesApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save medication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this medication schedule?')) {
      try {
        await medicinesApi.delete(id);
        loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete medication.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Medication Manager</h2>
          <p className="page-subtitle">Track prescription schedules, dosage timing, and course durations.</p>
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
          <Plus size={17} /> Add Medication
        </button>
      </div>

      {/* Filters Bar */}
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
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading medication records..." />
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} color="var(--accent-rose)" />
          <p>{error}</p>
          <button className="btn-primary" onClick={loadData}>Retry</button>
        </div>
      ) : medicines.length === 0 ? (
        <div className="empty-state-card">
          <Pill size={42} color="var(--palette-taupe)" />
          <h3>No Medications Recorded</h3>
          <p>Maintain an accurate log of daily doses, timings, and special medical instructions.</p>
          {parents.length > 0 ? (
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={17} /> Add First Medication
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/parents')}>
              <Plus size={17} /> Add Parent Profile First
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {medicines.map((med) => (
            <div key={med.id} className="medication-card">
              <div className="med-card-top">
                <div className="med-avatar-icon">
                  <Pill size={20} />
                </div>
                <div className="med-title-col">
                  <h3>{med.name}</h3>
                  <span className="med-parent-tag">For {med.parent_name || 'Parent'}</span>
                </div>
                <span className={`status-pill ${med.status}`}>{med.status}</span>
              </div>

              <div className="med-dosage-box">
                <div className="dosage-metric">
                  <span className="dosage-lbl">Dosage</span>
                  <span className="dosage-val">{med.dosage}</span>
                </div>
                <div className="dosage-metric">
                  <span className="dosage-lbl">Frequency</span>
                  <span className="dosage-val">{med.frequency}</span>
                </div>
              </div>

              <div className="med-meta-list">
                {med.start_date && (
                  <div className="med-meta-item">
                    <Calendar size={14} color="var(--palette-taupe)" />
                    <span>Course: {med.start_date} {med.end_date ? `to ${med.end_date}` : '(Ongoing)'}</span>
                  </div>
                )}
                {med.instructions && (
                  <div className="med-meta-item instructions-box">
                    <Clock size={14} color="var(--palette-charcoal)" />
                    <span>{med.instructions}</span>
                  </div>
                )}
              </div>

              <div className="med-card-actions">
                <button
                  className="btn-icon-subtle"
                  title="Edit Medication"
                  onClick={() => openEditModal(med)}
                >
                  <Edit2 size={15} /> Edit
                </button>
                <button
                  className="btn-icon-subtle text-danger"
                  title="Delete Medication"
                  onClick={() => handleDelete(med.id)}
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
        title={editingMedicine ? `Edit Medication: ${editingMedicine.name}` : 'Add New Medication'}
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

          <div className="form-group">
            <label>Medication / Drug Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Amlodipine, Metformin, Atorvastatin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Dosage *</label>
              <input
                type="text"
                required
                placeholder="e.g. 5mg, 500mg, 1 tablet"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Frequency *</label>
              <input
                type="text"
                required
                placeholder="e.g. Once daily after breakfast"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>

          <div className="form-group">
            <label>Doctor's Special Instructions</label>
            <textarea
              rows={3}
              placeholder="e.g. Take with a glass of water, monitor blood pressure."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
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
              {submitting ? 'Saving...' : editingMedicine ? 'Save Changes' : 'Add Medication'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
