from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from app.models.models import User, UserRole, Notification, NotificationType
from app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user with email already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Normalize role
    role = user_in.role.upper() if user_in.role else UserRole.USER.value
    if role not in [r.value for r in UserRole]:
        role = UserRole.USER.value

    # Create new user
    db_user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        role=role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Add welcome notification
    welcome_notif = Notification(
        user_id=db_user.id,
        title="Welcome to ParentCare",
        message="Thank you for joining ParentCare! Start by adding your aging parent's profile.",
        notification_type=NotificationType.SYSTEM.value,
        link="/parents"
    )
    db.add(welcome_notif)
    db.commit()

    # Generate JWT token
    access_token = create_access_token(data={"sub": str(db_user.id), "email": db_user.email, "role": db_user.role})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(db_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name.strip()
    if user_update.phone is not None:
        current_user.phone = user_update.phone.strip()
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset link. In production, this would send an email.
    For development, the reset token is returned directly in the response."""
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()

    # Always return success to avoid leaking which emails are registered
    if not user or not user.is_active:
        return ForgotPasswordResponse(
            message="If that email is registered, a reset link has been sent.",
            reset_token=""
        )

    # Create a short-lived reset token (30 minutes)
    reset_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "type": "password_reset"},
        expires_delta=timedelta(minutes=30)
    )

    return ForgotPasswordResponse(
        message="If that email is registered, a reset link has been sent.",
        reset_token=reset_token
    )


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset the user's password using a valid reset token."""
    payload = decode_token(request.token)

    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link. Please request a new one."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account not found or deactivated."
        )

    user.hashed_password = get_password_hash(request.new_password)
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}
