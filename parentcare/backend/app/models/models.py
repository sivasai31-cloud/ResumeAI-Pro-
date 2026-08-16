from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    USER = "USER"          # Adult child
    PARENT = "PARENT"      # Parent account
    ADMIN = "ADMIN"        # Administrator

class MedicineStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    STOPPED = "stopped"

class AppointmentStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ReportType(str, enum.Enum):
    PRESCRIPTION = "prescription"
    LAB_REPORT = "lab_report"
    MEDICAL_DOCUMENT = "medical_document"

class ContactPriority(str, enum.Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    TERTIARY = "tertiary"

class NotificationType(str, enum.Enum):
    MEDICINE = "medicine"
    APPOINTMENT = "appointment"
    SYSTEM = "system"
    EMERGENCY = "emergency"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    parents = relationship("Parent", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    uploaded_reports = relationship("MedicalReport", back_populates="uploader", cascade="all, delete-orphan")


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(20), nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_notes = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="parents")
    medicines = relationship("Medicine", back_populates="parent", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="parent", cascade="all, delete-orphan")
    reports = relationship("MedicalReport", back_populates="parent", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="parent", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)           # e.g., "500mg", "1 tablet"
    frequency = Column(String(100), nullable=False)        # e.g., "Twice a day", "After breakfast"
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    instructions = Column(Text, nullable=True)
    status = Column(String(50), default=MedicineStatus.ACTIVE.value, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    parent = relationship("Parent", back_populates="medicines")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_name = Column(String(255), nullable=False)
    hospital_clinic = Column(String(255), nullable=False)
    appointment_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    appointment_time = Column(String(50), nullable=False)  # HH:MM
    purpose = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default=AppointmentStatus.UPCOMING.value, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    parent = relationship("Parent", back_populates="appointments")


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id", ondelete="CASCADE"), nullable=False, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), default=ReportType.LAB_REPORT.value, nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    parent = relationship("Parent", back_populates="reports")
    uploader = relationship("User", back_populates="uploaded_reports")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    relationship_type = Column(String(100), nullable=False) # "Son", "Neighbor", "Doctor", "Caregiver"
    phone = Column(String(50), nullable=False)
    location = Column(String(255), nullable=True)
    priority = Column(String(50), default=ContactPriority.PRIMARY.value, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    parent = relationship("Parent", back_populates="emergency_contacts")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default=NotificationType.SYSTEM.value, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")
