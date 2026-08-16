import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  AlertOctagon,
  Shield,
  MapPin,
  Filter,
} from 'lucide-react';
import { emergencyApi } from '../api/emergency';
import { parentsApi } from '../api/parents';
import type { EmergencyContact, Parent } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';

export const Emergency: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form
  const [parentId, setParentId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('Family Doctor');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'primary' | 'secondary' | 'doctor'>('primary');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [parentsData, contactsData] = await Promise.all([
        parentsApi.getAll(),
        emergencyApi.getAll(selectedParentId ? Number(selectedParentId) : undefined),
      ]);
      setParents(parentsData);
      setContacts(contactsData);
      if (parentsData.length > 0 && parentId === '') {
        setParentId(parentsData[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedParentId]);

  const openAddModal = () => {
    setEditingContact(null);
    if (parents.length > 0) setParentId(parents[0].id);
    setName('');
    setRelationshipType('Family Doctor');
    setPhone('');
    setLocation('');
    setPriority('primary');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setParentId(contact.parent_id);
    setName(contact.name);
    setRelationshipType(contact.relationship_type);
    setPhone(contact.phone);
    setLocation(contact.location || '');
    setPriority(contact.priority);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !relationshipType.trim() || !parentId) {
      setFormError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: Partial<EmergencyContact> = {
      parent_id: Number(parentId),
      name: name.trim(),
      relationship_type: relationshipType.trim(),
      phone: phone.trim(),
      location: location.trim() || null,
      priority,
    };

    try {
      if (editingContact) {
        await emergencyApi.update(editingContact.id, payload);
      } else {
        await emergencyApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save emergency contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this emergency contact?')) {
      try {
        await emergencyApi.delete(id);
        loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete contact.');
      }
    }
  };

  return (
    <div className="page-container">
      {/* Top Disclaimer Banner */}
      <div className="emergency-disclaimer-banner">
        <AlertOctagon size={22} className="disclaimer-icon" />
        <div className="disclaimer-text">
          <strong>Important Healthcare Disclaimer</strong>
          <p>
            ParentCare is a healthcare coordination tool and does not replace emergency services (such as 911 / 112 / 108) or professional medical advice. In a life-threatening crisis, please call your local emergency response immediately.
          </p>
        </div>
      </div>

      <div className="page-header-row">
        <div>
          <h2>Emergency SOS Directory</h2>
          <p className="page-subtitle">Direct one-tap dialing for primary doctors, local neighbors, caregivers, and hospital emergency lines.</p>
        </div>
        <button
          className="btn-danger"
          onClick={() => {
            if (parents.length === 0) {
              navigate('/parents');
            } else {
              openAddModal();
            }
          }}
        >
          <Plus size={17} /> Add Emergency Contact
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
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading emergency contacts..." />
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} color="var(--accent-rose)" />
          <p>{error}</p>
          <button className="btn-primary" onClick={loadData}>Retry</button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="empty-state-card">
          <Shield size={42} color="var(--accent-rose)" />
          <h3>No Emergency Contacts Added</h3>
          <p>Register nearby family doctors, neighbors, or caregivers for fast SOS dialing.</p>
          {parents.length > 0 ? (
            <button className="btn-danger" onClick={openAddModal}>
              <Plus size={17} /> Add First Contact
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/parents')}>
              <Plus size={17} /> Add Parent Profile First
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {contacts.map((contact) => (
            <div key={contact.id} className="emergency-card">
              <div className="emergency-card-top">
                <div className="emergency-avatar">
                  <Shield size={18} />
                </div>
                <div className="emergency-title-col">
                  <h3>{contact.name}</h3>
                  <span className={`priority-tag ${contact.priority}`}>
                    {contact.priority}
                  </span>
                </div>
              </div>

              <div className="emergency-card-body">
                <div className="contact-detail-row">
                  <span>Role: <strong>{contact.relationship_type}</strong></span>
                </div>
                <div className="contact-detail-row">
                  <span>For: <strong>{contact.parent_name || 'Parent'}</strong></span>
                </div>
                {contact.location && (
                  <div className="contact-detail-row">
                    <MapPin size={13} color="var(--palette-taupe)" /> <span>{contact.location}</span>
                  </div>
                )}
              </div>

              {/* 1-Tap SOS Direct Call Button */}
              <div className="emergency-action-section">
                <a href={`tel:${contact.phone}`} className="btn-sos-call-lg">
                  <PhoneCall size={16} />
                  <span>Call {contact.phone}</span>
                </a>
              </div>

              <div className="emergency-card-footer">
                <button
                  className="btn-icon-subtle"
                  title="Edit Contact"
                  onClick={() => openEditModal(contact)}
                >
                  <Edit2 size={15} /> Edit
                </button>
                <button
                  className="btn-icon-subtle text-danger"
                  title="Delete Contact"
                  onClick={() => handleDelete(contact.id)}
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
        title={editingContact ? `Edit Contact: ${editingContact.name}` : 'Add Emergency Contact'}
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
              <label>Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Arthur Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Role / Relationship *</label>
              <input
                type="text"
                required
                placeholder="e.g. Primary Cardiologist, Neighbor"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Priority Level *</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="primary">Primary (Immediate SOS)</option>
                <option value="secondary">Secondary</option>
                <option value="doctor">Doctor / Clinic</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Location / Proximity Notes</label>
            <input
              type="text"
              placeholder="e.g. 740 Evergreen Terrace (Next-door) / Suite 300 Plaza"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
            <button type="submit" className="btn-danger" disabled={submitting}>
              {submitting ? 'Saving...' : editingContact ? 'Save Changes' : 'Save Emergency Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
