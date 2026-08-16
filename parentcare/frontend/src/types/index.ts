export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'USER' | 'ADMIN' | 'PARENT';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Parent {
  id: number;
  user_id: number;
  name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  blood_group?: string | null;
  allergies?: string | null;
  emergency_notes?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: number;
  parent_id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date?: string | null;
  end_date?: string | null;
  instructions?: string | null;
  status: 'active' | 'completed' | 'stopped';
  created_at: string;
  updated_at: string;
  parent_name?: string;
}

export interface Appointment {
  id: number;
  parent_id: number;
  doctor_name: string;
  hospital_clinic: string;
  appointment_date: string;
  appointment_time: string;
  purpose?: string | null;
  notes?: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  parent_name?: string;
}

export interface MedicalReport {
  id: number;
  parent_id: number;
  uploader_id: number;
  title: string;
  report_type: 'lab_report' | 'prescription' | 'scan' | 'discharge_summary' | 'other';
  file_path: string;
  original_filename: string;
  file_size?: number | null;
  mime_type?: string | null;
  notes?: string | null;
  created_at: string;
  parent_name?: string;
}

export interface EmergencyContact {
  id: number;
  parent_id: number;
  name: string;
  relationship_type: string;
  phone: string;
  location?: string | null;
  priority: 'primary' | 'secondary' | 'doctor';
  created_at: string;
  updated_at: string;
  parent_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'reminder' | 'alert' | 'system';
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardOverview {
  total_parents: number;
  total_active_medicines: number;
  total_upcoming_appointments: number;
  total_reports: number;
  today_medicines: Medicine[];
  upcoming_appointments: Appointment[];
  recent_reports: MedicalReport[];
  emergency_contacts: EmergencyContact[];
  unread_notifications_count: number;
}

export interface AdminStats {
  total_users: number;
  total_parents: number;
  total_active_medicines: number;
  total_appointments: number;
  total_reports: number;
  recent_users: User[];
}
