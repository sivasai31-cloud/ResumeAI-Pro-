from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.models import Medicine, Parent, User, UserRole, Notification, NotificationType
from app.schemas.schemas import MedicineCreate, MedicineUpdate, MedicineResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/medicines", tags=["medicines"])

def format_medicine_response(med: Medicine) -> MedicineResponse:
    res = MedicineResponse.model_validate(med)
    res.parent_name = med.parent.name if med.parent else None
    return res

@router.get("", response_model=List[MedicineResponse])
def get_medicines(
    parent_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Medicine).join(Parent)
    if current_user.role != UserRole.ADMIN.value:
        if current_user.role == UserRole.PARENT.value:
            query = query.filter(or_(Parent.email == current_user.email, Parent.user_id == current_user.id))
        else:
            query = query.filter(Parent.user_id == current_user.id)
    
    if parent_id:
        query = query.filter(Medicine.parent_id == parent_id)
    if status:
        query = query.filter(Medicine.status == status.lower())
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Medicine.name.ilike(s),
            Medicine.dosage.ilike(s),
            Medicine.frequency.ilike(s),
            Medicine.instructions.ilike(s)
        ))
    
    medicines = query.order_by(Medicine.created_at.desc()).all()
    return [format_medicine_response(m) for m in medicines]

@router.post("", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify parent belongs to current user
    parent = db.query(Parent).filter(Parent.id == med_in.parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db_med = Medicine(
        parent_id=med_in.parent_id,
        name=med_in.name.strip(),
        dosage=med_in.dosage.strip(),
        frequency=med_in.frequency.strip(),
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        instructions=med_in.instructions,
        status=med_in.status or "active"
    )
    db.add(db_med)
    db.commit()
    db.refresh(db_med)

    # Add reminder notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Medicine Scheduled: {db_med.name}",
        message=f"{db_med.name} ({db_med.dosage}) scheduled for {parent.name} - {db_med.frequency}.",
        notification_type=NotificationType.MEDICINE.value,
        link="/medicines"
    )
    db.add(notif)
    db.commit()

    return format_medicine_response(db_med)

@router.get("/{med_id}", response_model=MedicineResponse)
def get_medicine(
    med_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    med = db.query(Medicine).join(Parent).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    if current_user.role != UserRole.ADMIN.value and med.parent.user_id != current_user.id and med.parent.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return format_medicine_response(med)

@router.put("/{med_id}", response_model=MedicineResponse)
def update_medicine(
    med_id: int,
    med_in: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    med = db.query(Medicine).join(Parent).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    if current_user.role != UserRole.ADMIN.value and med.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = med_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(med, field, value)
    
    db.commit()
    db.refresh(med)
    return format_medicine_response(med)

@router.delete("/{med_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    med_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    med = db.query(Medicine).join(Parent).filter(Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    if current_user.role != UserRole.ADMIN.value and med.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(med)
    db.commit()
    return None
