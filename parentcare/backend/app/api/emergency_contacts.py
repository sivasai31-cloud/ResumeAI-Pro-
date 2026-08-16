from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.models import EmergencyContact, Parent, User, UserRole, Notification, NotificationType
from app.schemas.schemas import EmergencyContactCreate, EmergencyContactUpdate, EmergencyContactResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/emergency-contacts", tags=["emergency-contacts"])

def format_contact_response(contact: EmergencyContact) -> EmergencyContactResponse:
    res = EmergencyContactResponse.model_validate(contact)
    res.parent_name = contact.parent.name if contact.parent else None
    return res

@router.get("", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(
    parent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EmergencyContact).join(Parent)
    if current_user.role != UserRole.ADMIN.value:
        if current_user.role == UserRole.PARENT.value:
            query = query.filter(or_(Parent.email == current_user.email, Parent.user_id == current_user.id))
        else:
            query = query.filter(Parent.user_id == current_user.id)
    
    if parent_id:
        query = query.filter(EmergencyContact.parent_id == parent_id)
    
    contacts = query.order_by(EmergencyContact.priority.asc(), EmergencyContact.created_at.desc()).all()
    return [format_contact_response(c) for c in contacts]

@router.post("", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    contact_in: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent = db.query(Parent).filter(Parent.id == contact_in.parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db_contact = EmergencyContact(
        parent_id=contact_in.parent_id,
        name=contact_in.name.strip(),
        relationship_type=contact_in.relationship_type.strip(),
        phone=contact_in.phone.strip(),
        location=contact_in.location,
        priority=contact_in.priority or "primary"
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)

    # Add notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Emergency Contact: {db_contact.name}",
        message=f"{db_contact.name} ({db_contact.relationship_type}) added as emergency contact for {parent.name}.",
        notification_type=NotificationType.EMERGENCY.value,
        link="/emergency-contacts"
    )
    db.add(notif)
    db.commit()

    return format_contact_response(db_contact)

@router.get("/{contact_id}", response_model=EmergencyContactResponse)
def get_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(EmergencyContact).join(Parent).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    if current_user.role != UserRole.ADMIN.value and contact.parent.user_id != current_user.id and contact.parent.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return format_contact_response(contact)

@router.put("/{contact_id}", response_model=EmergencyContactResponse)
def update_emergency_contact(
    contact_id: int,
    contact_in: EmergencyContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(EmergencyContact).join(Parent).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    if current_user.role != UserRole.ADMIN.value and contact.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    update_data = contact_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    return format_contact_response(contact)

@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(EmergencyContact).join(Parent).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    if current_user.role != UserRole.ADMIN.value and contact.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    db.delete(contact)
    db.commit()
    return None
