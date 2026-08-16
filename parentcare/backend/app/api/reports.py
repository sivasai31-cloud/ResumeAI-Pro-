import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.config import settings
from app.core.database import get_db
from app.models.models import MedicalReport, Parent, User, UserRole, Notification, NotificationType
from app.schemas.schemas import MedicalReportResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".txt"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB

def format_report_response(report: MedicalReport) -> MedicalReportResponse:
    res = MedicalReportResponse.model_validate(report)
    res.parent_name = report.parent.name if report.parent else None
    return res

@router.get("", response_model=List[MedicalReportResponse])
def get_reports(
    parent_id: Optional[int] = None,
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicalReport).join(Parent)
    if current_user.role != UserRole.ADMIN.value:
        if current_user.role == UserRole.PARENT.value:
            query = query.filter(or_(Parent.email == current_user.email, Parent.user_id == current_user.id))
        else:
            query = query.filter(Parent.user_id == current_user.id)
    
    if parent_id:
        query = query.filter(MedicalReport.parent_id == parent_id)
    if report_type:
        query = query.filter(MedicalReport.report_type == report_type.lower())
    
    reports = query.order_by(MedicalReport.created_at.desc()).all()
    return [format_report_response(r) for r in reports]

@router.post("", response_model=MedicalReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    parent_id: int = Form(...),
    title: str = Form(...),
    report_type: str = Form("lab_report"),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    if current_user.role != UserRole.ADMIN.value and parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # File validation
    filename = file.filename or "document.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension {ext} not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique safe storage name
    unique_filename = f"{uuid.uuid4().hex}_{os.path.basename(filename)}"
    file_disk_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save file contents securely
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum 15MB limit"
        )
    
    with open(file_disk_path, "wb") as f:
        f.write(content)
    
    db_report = MedicalReport(
        parent_id=parent_id,
        uploader_id=current_user.id,
        title=title.strip(),
        report_type=report_type.lower(),
        file_path=unique_filename,
        original_filename=filename,
        file_size=len(content),
        mime_type=file.content_type,
        notes=notes
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Add notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Report Uploaded: {db_report.title}",
        message=f"{db_report.report_type.replace('_', ' ').title()} document added for {parent.name}.",
        notification_type=NotificationType.SYSTEM.value,
        link="/reports"
    )
    db.add(notif)
    db.commit()

    return format_report_response(db_report)

@router.get("/{report_id}/file")
def download_report_file(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(MedicalReport).join(Parent).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if current_user.role != UserRole.ADMIN.value and report.parent.user_id != current_user.id and report.parent.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    disk_path = os.path.join(settings.UPLOAD_DIR, report.file_path)
    if not os.path.exists(disk_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file missing on disk")
    
    return FileResponse(
        path=disk_path,
        filename=report.original_filename,
        media_type=report.mime_type or "application/octet-stream"
    )

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(MedicalReport).join(Parent).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if current_user.role != UserRole.ADMIN.value and report.parent.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    # Remove file from disk
    disk_path = os.path.join(settings.UPLOAD_DIR, report.file_path)
    if os.path.exists(disk_path):
        try:
            os.remove(disk_path)
        except OSError:
            pass
    
    db.delete(report)
    db.commit()
    return None
