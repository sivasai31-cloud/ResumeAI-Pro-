from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.models import Parent, User, UserRole, Medicine, Appointment, MedicalReport, EmergencyContact, Notification, NotificationType
from app.schemas.schemas import ParentCreate, ParentUpdate, ParentResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/parents", tags=["parents"])

@router.get("", response_model=List[ParentResponse])
def get_parents(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Parent)
    if current_user.role != UserRole.ADMIN.value:
        # If parent role, might match parent email or linked child
        if current_user.role == UserRole.PARENT.value:
            query = query.filter(or_(Parent.email == current_user.email, Parent.user_id == current_user.id))
        else:
            query = query.filter(Parent.user_id == current_user.id)
    
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Parent.name.ilike(s),
            Parent.phone.ilike(s),
            Parent.blood_group.ilike(s),
            Parent.allergies.ilike(s),
            Parent.address.ilike(s)
        ))
    
    return query.order_by(Parent.created_at.desc()).all()

@router.post("", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
def create_parent(
    parent_in: ParentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_parent = Parent(
        user_id=current_user.id,
        name=parent_in.name.strip(),
        date_of_birth=parent_in.date_of_birth,
        gender=parent_in.gender,
        phone=parent_in.phone,
        email=parent_in.email.lower().strip() if parent_in.email else None,
        address=parent_in.address,
        blood_group=parent_in.blood_group,
        allergies=parent_in.allergies,
        emergency_notes=parent_in.emergency_notes,
        avatar_url=parent_in.avatar_url
    )
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)

    # Trigger notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Parent Added: {db_parent.name}",
        message=f"You successfully created the care profile for {db_parent.name}.",
        notification_type=NotificationType.SYSTEM.value,
        link=f"/parents/{db_parent.id}"
    )
    db.add(notif)
    db.commit()

    return db_parent

@router.get("/{parent_id}", response_model=ParentResponse)
def get_parent(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id and parent.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return parent

@router.put("/{parent_id}", response_model=ParentResponse)
def update_parent(
    parent_id: int,
    parent_in: ParentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = parent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(parent, field, value)
    
    db.commit()
    db.refresh(parent)
    return parent

@router.delete("/{parent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parent(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(parent)
    db.commit()
    return None
