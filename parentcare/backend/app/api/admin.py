from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Parent, Medicine, Appointment, MedicalReport, UserRole, MedicineStatus
from app.schemas.schemas import AdminStatsResponse, UserResponse
from app.api.deps import get_current_active_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin)
):
    total_users = db.query(User).count()
    total_parents = db.query(Parent).count()
    total_active_medicines = db.query(Medicine).filter(Medicine.status == MedicineStatus.ACTIVE.value).count()
    total_appointments = db.query(Appointment).count()
    total_reports = db.query(MedicalReport).count()
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()

    return AdminStatsResponse(
        total_users=total_users,
        total_parents=total_parents,
        total_active_medicines=total_active_medicines,
        total_appointments=total_appointments,
        total_reports=total_reports,
        recent_users=[UserResponse.model_validate(u) for u in recent_users]
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: int,
    role: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    role_upper = role.upper().strip()
    if role_upper not in [r.value for r in UserRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified")
    
    user.role = role_upper
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    is_active: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate yourself")
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
