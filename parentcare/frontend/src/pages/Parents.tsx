import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { parentsApi } from '../api/parents';
import type { Parent } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';

export const Parents: React.FC = () => {
  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');

  const loadParents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parentsApi.getAll(search.trim() || undefined);
      setParents(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load parents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, [search]);

  const openAddModal = () => {
    setEditingParent(null);
    setName('');
    setDob('');
    setGender('Male');
    setPhone('');
    setEmail('');
    setAddress('');
    setBloodGroup('O+');
    setAllergies('');
    setEmergencyNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (parent: Parent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingParent(parent);
    setName(parent.name);
    setDob(parent.date_of_birth || '');
    setGender(parent.gender || 'Male');
    setPhone(parent.phone || '');
    setEmail(parent.email || '');
    setAddress(parent.address || '');
    setBloodGroup(parent.blood_group || 'O+');
    setAllergies(parent.allergies || '');
    setEmergencyNotes(parent.emergency_notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Parent full name is required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const payload: Partial<Parent> = {
      name: name.trim(),
      date_of_birth: dob || null,
      gender,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      blood_group: bloodGroup || null,
      allergies: allergies.trim() || null,
      emergency_notes: emergencyNotes.trim() || null,
    };

    try {
      if (editingParent) {
        await parentsApi.update(editingParent.id, payload);
      } else {
        await parentsApi.create(payload);
      }
      setIsModalOpen(false);
      loadParents();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save parent details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this parent profile and all related logs?')) {
      try {
        await parentsApi.delete(id);
        loadParents();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete parent.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Parents Directory</h2>
          <p className="page-subtitle">Manage medical profile, blood group, allergies, and contact information.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={17} /> Add Parent Profile
        </button>
      </div>

      {/* Filter / Search bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search by parent name, phone, or blood group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading parents directory..." />
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} color="var(--accent-rose)" />
          <p>{error}</p>
          <button className="btn-primary" onClick={loadParents}>Retry</button>
        </div>
      ) : parents.length === 0 ? (
        <div className="empty-state-card">
          <Users size={42} color="var(--palette-taupe)" />
          <h3>No Parents Added Yet</h3>
          <p>Register family members to coordinate their medication schedule, doctor visits, and emergency contacts.</p>
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={17} /> Add Parent
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {parents.map((parent) => (
            <div
              key={parent.id}
              className="parent-profile-card"
              onClick={() => navigate(`/parents/${parent.id}`)}
            >
              <div className="parent-card-header">
                <div className="parent-avatar-badge">
                  {parent.name.charAt(0).toUpperCase()}
                </div>
                <div className="parent-title-col">
                  <h3>{parent.name}</h3>
                  <div className="parent-meta-pill-row">
                    {parent.gender && <span className="badge-tag">{parent.gender}</span>}
                    {parent.blood_group && (
                      <span className="badge-tag tag-blood">
                        <Heart size={11} /> {parent.blood_group}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="parent-details-body">
                {parent.phone && (
                  <div className="detail-item-row">
                    <Phone size={14} color="var(--palette-taupe)" /> <span>{parent.phone}</span>
                  </div>
                )}
                {parent.email && (
                  <div className="detail-item-row">
                    <Mail size={14} color="var(--palette-taupe)" /> <span>{parent.email}</span>
                  </div>
                )}
                {parent.address && (
                  <div className="detail-item-row">
                    <MapPin size={14} color="var(--palette-taupe)" /> <span>{parent.address}</span>
                  </div>
                )}
                {parent.allergies && (
                  <div className="detail-item-row allergy-highlight">
                    <ShieldAlert size={14} />
                    <span><strong>Allergies:</strong> {parent.allergies}</span>
                  </div>
                )}
              </div>

              <div className="parent-card-footer">
                <div className="action-buttons-row">
                  <button
                    className="btn-icon-subtle"
                    title="Edit Parent"
                    onClick={(e) => openEditModal(parent, e)}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="btn-icon-subtle text-danger"
                    title="Delete Parent"
                    onClick={(e) => handleDelete(parent.id, e)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <span className="view-profile-link">
                  Profile <ChevronRight size={15} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParent ? `Edit ${editingParent.name}` : 'Add Parent Profile'}
      >
        {formError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Robert Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+1 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="form-group">
              <label>Known Allergies</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Shellfish"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Living Address</label>
            <input
              type="text"
              placeholder="Residential address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Emergency & Medical Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Mild hypertension history, pacemaker, mobility assistance"
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
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
              {submitting ? 'Saving...' : editingParent ? 'Save Changes' : 'Add Parent'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
