from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.models import Parent, Medicine, Appointment, MedicalReport, EmergencyContact, Notification, User, UserRole, MedicineStatus, AppointmentStatus
from app.schemas.schemas import DashboardOverviewResponse
from app.api.deps import get_current_user
from app.api.medicines import format_medicine_response
from app.api.appointments import format_appointment_response
from app.api.reports import format_report_response
from app.api.emergency_contacts import format_contact_response

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query parents belonging to current user (or all if admin)
    p_query = db.query(Parent)
    if current_user.role != UserRole.ADMIN.value:
        if current_user.role == UserRole.PARENT.value:
            p_query = p_query.filter(or_(Parent.email == current_user.email, Parent.user_id == current_user.id))
        else:
            p_query = p_query.filter(Parent.user_id == current_user.id)
    
    parents = p_query.all()
    parent_ids = [p.id for p in parents]

    if parent_id and parent_id in parent_ids:
        active_parent_ids = [parent_id]
    else:
        active_parent_ids = parent_ids

    total_parents = len(parents)

    if not active_parent_ids:
        unread_notifications_count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()
        return DashboardOverviewResponse(
            total_parents=total_parents,
            total_active_medicines=0,
            total_upcoming_appointments=0,
            total_reports=0,
            today_medicines=[],
            upcoming_appointments=[],
            recent_reports=[],
            emergency_contacts=[],
            unread_notifications_count=unread_notifications_count
        )

    # Active medicines
    active_meds = db.query(Medicine).filter(
        Medicine.parent_id.in_(active_parent_ids),
        Medicine.status == MedicineStatus.ACTIVE.value
    ).all()

    # Upcoming appointments
    upcoming_appts = db.query(Appointment).filter(
        Appointment.parent_id.in_(active_parent_ids),
        Appointment.status == AppointmentStatus.UPCOMING.value
    ).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).limit(5).all()

    # Total upcoming appointments count
    total_upcoming_appts = db.query(Appointment).filter(
        Appointment.parent_id.in_(active_parent_ids),
        Appointment.status == AppointmentStatus.UPCOMING.value
    ).count()

    # Recent reports
    recent_reports = db.query(MedicalReport).filter(
        MedicalReport.parent_id.in_(active_parent_ids)
    ).order_by(MedicalReport.created_at.desc()).limit(5).all()

    total_reports_count = db.query(MedicalReport).filter(
        MedicalReport.parent_id.in_(active_parent_ids)
    ).count()

    # Emergency contacts
    emergency_contacts = db.query(EmergencyContact).filter(
        EmergencyContact.parent_id.in_(active_parent_ids)
    ).order_by(EmergencyContact.priority.asc(), EmergencyContact.created_at.desc()).limit(6).all()

    # Unread notifications
    unread_notifications_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return DashboardOverviewResponse(
        total_parents=total_parents,
        total_active_medicines=len(active_meds),
        total_upcoming_appointments=total_upcoming_appts,
        total_reports=total_reports_count,
        today_medicines=[format_medicine_response(m) for m in active_meds],
        upcoming_appointments=[format_appointment_response(a) for a in upcoming_appts],
        recent_reports=[format_report_response(r) for r in recent_reports],
        emergency_contacts=[format_contact_response(c) for c in emergency_contacts],
        unread_notifications_count=unread_notifications_count
    )
