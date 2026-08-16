import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, UserRole
from app.api import auth, parents, medicines, appointments, reports, emergency_contacts, notifications, dashboard, admin

# Path to the React production build
STATIC_DIR = Path(__file__).resolve().parent.parent / "static" / "dist"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)

    # Seed default users
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@parentcare.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@parentcare.com",
                hashed_password=get_password_hash("Admin123!"),
                full_name="ParentCare Admin",
                phone="+1 800-555-0199",
                role=UserRole.ADMIN.value,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(">> [SEED] Default admin created: admin@parentcare.com / Admin123!")

        demo_user = db.query(User).filter(User.email == "demo@parentcare.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@parentcare.com",
                hashed_password=get_password_hash("Demo123!"),
                full_name="Sarah Jenkins",
                phone="+1 555-018-9234",
                role=UserRole.USER.value,
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print(">> [SEED] Demo user created: demo@parentcare.com / Demo123!")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS — only needed when running frontend separately (dev mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.29.123:5173",
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "https://192.168.29.123:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:3000",
        "https://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://localhost:4173",
        "https://127.0.0.1:4173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers (must be registered BEFORE static file catch-all) ──
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(parents.router, prefix=settings.API_V1_STR)
app.include_router(medicines.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(emergency_contacts.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

# ── Serve React Frontend ──
if STATIC_DIR.exists():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    # SPA catch-all: serve index.html for every non-API route
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index = STATIC_DIR / "index.html"
        return FileResponse(str(index))
else:
    # Fallback health check when frontend isn't built yet
    @app.get("/")
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "status": "healthy",
            "version": "1.0.0",
            "docs": f"{settings.API_V1_STR}/docs",
            "note": "Frontend not built yet. Run: cd frontend && npm run build"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
