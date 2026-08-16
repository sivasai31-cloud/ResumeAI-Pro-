from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.models import Appointment, Parent, User, UserRole, Notification, NotificationType
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/appointments", tags=["appointments"])

def format_appointment_response(appt: Appointment) -> AppointmentResponse:
    res = AppointmentResponse.model_validate(appt)
    res.parent_name = appt.parent.name if appt.parent else None
    return res

@router.get("", response_model=List[AppointmentResponse])
def get_appointments(
    parent_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Appointment).join(Parent)
    if current_user.role != UserRole.ADMIN.value:
        if current_user.role == UserRole.PARENT.value:
            query = query.filter(or_(Parent.email == current_user.email, Parent.user_id == current_user.id))
        else:
            query = query.filter(Parent.user_id == current_user.id)
    
    if parent_id:
        query = query.filter(Appointment.parent_id == parent_id)
    if status:
        query = query.filter(Appointment.status == status.lower())
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Appointment.doctor_name.ilike(s),
            Appointment.hospital_clinic.ilike(s),
            Appointment.purpose.ilike(s),
            Appointment.notes.ilike(s)
        ))
    
    appts = query.order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).all()
    return [format_appointment_response(a) for a in appts]

@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent = db.query(Parent).filter(Parent.id == appt_in.parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db_appt = Appointment(
        parent_id=appt_in.parent_id,
        doctor_name=appt_in.doctor_name.strip(),
        hospital_clinic=appt_in.hospital_clinic.strip(),
        appointment_date=appt_in.appointment_date,
        appointment_time=appt_in.appointment_time,
        purpose=appt_in.purpose,
        notes=appt_in.notes,
        status=appt_in.status or "upcoming"
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)

    # Add notification for upcoming appointment
    notif = Notification(
        user_id=current_user.id,
        title=f"Appointment Booked: Dr. {db_appt.doctor_name}",
        message=f"Appointment for {parent.name} on {db_appt.appointment_date} at {db_appt.appointment_time} at {db_appt.hospital_clinic}.",
        notification_type=NotificationType.APPOINTMENT.value,
        link="/appointments"
    )
    db.add(notif)
    db.commit()

    return format_appointment_response(db_appt)

@router.get("/{appt_id}", response_model=AppointmentResponse)
def get_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = db.query(Appointment).join(Parent).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if current_user.role != UserRole.ADMIN.value and appt.parent.user_id != current_user.id and appt.parent.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return format_appointment_response(appt)

@router.put("/{appt_id}", response_model=AppointmentResponse)
def update_appointment(
    appt_id: int,
    appt_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = db.query(Appointment).join(Parent).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if current_user.role != UserRole.ADMIN.value and appt.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = appt_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appt, field, value)
    
    db.commit()
    db.refresh(appt)
    return format_appointment_response(appt)

@router.delete("/{appt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = db.query(Appointment).join(Parent).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if current_user.role != UserRole.ADMIN.value and appt.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(appt)
    db.commit()
    return None
