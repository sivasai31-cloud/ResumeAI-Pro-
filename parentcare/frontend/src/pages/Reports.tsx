import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  Clock,
  User,
  Filter,
  File,
  Plus,
} from 'lucide-react';
import { reportsApi } from '../api/reports';
import { parentsApi } from '../api/parents';
import type { MedicalReport, Parent } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';

const ALLOWED_TYPES = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE_MB = 15;

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form
  const [parentId, setParentId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('lab_report');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [parentsData, reportsData] = await Promise.all([
        parentsApi.getAll(),
        reportsApi.getAll(
          selectedParentId ? Number(selectedParentId) : undefined,
          reportTypeFilter || undefined
        ),
      ]);
      setParents(parentsData);
      setReports(reportsData);
      if (parentsData.length > 0 && parentId === '') {
        setParentId(parentsData[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedParentId, reportTypeFilter]);

  const openUploadModal = () => {
    if (parents.length > 0) setParentId(parents[0].id);
    setTitle('');
    setReportType('lab_report');
    setNotes('');
    setSelectedFile(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        setUploadError(`Invalid file format. Allowed: ${ALLOWED_TYPES.join(', ')}`);
        setSelectedFile(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(`File is too large. Maximum size allowed is ${MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId || !title.trim() || !selectedFile) {
      setUploadError('Please select parent, provide title, and attach a valid file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('parent_id', parentId.toString());
    formData.append('title', title.trim());
    formData.append('report_type', reportType);
    if (notes.trim()) formData.append('notes', notes.trim());
    formData.append('file', selectedFile);

    try {
      await reportsApi.upload(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this medical report?')) {
      try {
        await reportsApi.delete(id);
        loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete report.');
      }
    }
  };

  const handleDownload = (id: number) => {
    const token = localStorage.getItem('parentcare_token');
    const url = reportsApi.getDownloadUrl(id);
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `report_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        alert('Could not download file: ' + err.message);
      });
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Medical Records Vault</h2>
          <p className="page-subtitle">Safely store and review laboratory tests, prescriptions, radiology scans, and summaries.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            if (parents.length === 0) {
              navigate('/parents');
            } else {
              openUploadModal();
            }
          }}
        >
          <Upload size={17} /> Upload Medical Record
        </button>
      </div>

      {/* Filter / Search Bar */}
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
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="lab_report">Lab Report</option>
              <option value="prescription">Prescription</option>
              <option value="scan">Scan / Imaging</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading medical records..." />
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} color="var(--accent-rose)" />
          <p>{error}</p>
          <button className="btn-primary" onClick={loadData}>Retry</button>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state-card">
          <FileText size={42} color="var(--palette-taupe)" />
          <h3>No Medical Records Uploaded</h3>
          <p>Keep pathology tests, doctor notes, and imaging reports accessible anywhere.</p>
          {parents.length > 0 ? (
            <button className="btn-primary" onClick={openUploadModal}>
              <Upload size={17} /> Upload First Document
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/parents')}>
              <Plus size={17} /> Add Parent Profile First
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-doc-card">
              <div className="report-card-top">
                <div className="report-type-badge-icon">
                  <FileText size={20} />
                </div>
                <div className="report-title-col">
                  <h3>{report.title}</h3>
                  <span className="report-meta-chip">
                    {report.report_type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="report-body-meta">
                <div className="report-meta-item">
                  <User size={14} color="var(--palette-taupe)" /> <span>For <strong>{report.parent_name || 'Parent'}</strong></span>
                </div>
                <div className="report-meta-item">
                  <Clock size={14} color="var(--palette-taupe)" /> <span>Uploaded: {new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <div className="report-meta-item">
                  <File size={14} color="var(--palette-taupe)" /> <span>File: {report.original_filename} ({formatFileSize(report.file_size)})</span>
                </div>
                {report.notes && (
                  <div className="report-notes-box">
                    <span>{report.notes}</span>
                  </div>
                )}
              </div>

              <div className="report-card-actions">
                <button
                  className="btn-secondary btn-sm"
                  title="Download Document"
                  onClick={() => handleDownload(report.id)}
                >
                  <Download size={14} /> Download
                </button>
                <button
                  className="btn-icon-subtle text-danger"
                  title="Delete Report"
                  onClick={() => handleDelete(report.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Medical Document"
      >
        {uploadError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="modal-form">
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
            <label>Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Report Type *</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="lab_report">Lab Report</option>
              <option value="prescription">Prescription</option>
              <option value="scan">Scan / Imaging</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Attach Document File (PDF, Images, DOC up to 15MB) *</label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
              onChange={handleFileChange}
            />
          </div>

          <div className="form-group">
            <label>Summary / Physician Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Normal blood sugar, doctor recommended follow-up in 3 months."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
