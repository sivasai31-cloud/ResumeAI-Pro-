# ParentCare — Family Healthcare Coordination Platform

ParentCare is a full-stack healthcare coordination platform designed for individuals who live away from their aging parents. It streamlines medication schedules, doctor appointments, medical reports vault, emergency contacts, and one-tap SOS dialing.

---

## Key Features

- **Care Dashboard**: Real-time overview of daily medication schedules, upcoming appointments, emergency contacts, and medical alerts.
- **Parent Management**: Comprehensive medical profile tracking including blood groups, known allergies, emergency notes, and contact details.
- **Medication Manager**: Course tracking, dosage frequency, instructions, and status (active, completed, stopped).
- **Doctor Appointments**: Consultation scheduling, clinic location mapping, status tracking, and doctor notes.
- **Medical Records Vault**: Secure uploads and downloads for laboratory tests, prescriptions, radiology scans, and discharge summaries.
- **Emergency SOS & 1-Tap Calling**: Priority-based directory (Primary, Secondary, Doctor) with direct `tel:` dialing.
- **Notification Center**: System reminders for daily medications and upcoming clinical appointments.
- **Role-Based Access Control & Admin Portal**: Multi-role security (`USER`, `ADMIN`, `PARENT`) and account management.

---

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Lucide React, Modern CSS (Responsive Design, CSS Custom Properties).
- **Backend**: FastAPI, SQLAlchemy ORM, Pydantic V2, PyJWT, Bcrypt, Python-Multipart.
- **Database**: SQLite (local development / testing) / PostgreSQL (production ready).

---

## Project Structure

```
parentcare/
├── backend/
│   ├── app/
│   │   ├── api/             # REST API routers (auth, parents, medicines, appointments, reports, etc.)
│   │   ├── core/            # Config, security, database session setup
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic V2 schemas
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Pytest automated test suites
│   ├── requirements.txt     # Python dependencies
│   └── seed_demo.py         # Optional demo data seeder
└── frontend/
    ├── src/
    │   ├── api/             # Centralized API client & endpoint modules
    │   ├── components/      # Reusable UI components (Sidebar, Navbar, Modal, Layout, etc.)
    │   ├── context/         # AuthContext & state management
    │   ├── pages/           # Pages (Dashboard, Parents, Medicines, Appointments, Reports, Emergency, Admin, Profile)
    │   ├── types/           # TypeScript interfaces
    │   ├── App.tsx          # Router configuration
    │   └── index.css        # Modern design system & styles
    ├── package.json
    └── vite.config.ts
```

---

## Environment Variables

### Backend (`backend/.env` or environment):
```env
PROJECT_NAME="ParentCare"
SECRET_KEY="parentcare_super_secret_jwt_key_2026_secure_hash"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL="sqlite:///./parentcare.db"
UPLOAD_DIR="./uploads"
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL="http://localhost:8000/api"
```

---

## Getting Started Locally

### 1. Backend Setup
```bash
cd parentcare/backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# (Optional) Seed demo data
python seed_demo.py

# Start Backend server:
uvicorn app.main:app --reload --port 8000
```
Backend API interactive docs: `http://localhost:8000/api/docs`

### 2. Frontend Setup
```bash
cd parentcare/frontend
npm install
npm run dev
```
Frontend development server: `http://localhost:5173`

---

## Demo Credentials (from seeder)

| Role | Email | Password |
|---|---|---|
| **Demo User** | `demo@parentcare.com` | `Demo123!` |
| **Administrator** | `admin@parentcare.com` | `Admin123!` |

---

## Automated Testing

Run the full backend test suite:
```bash
cd parentcare/backend
pytest
```

Run frontend production build test:
```bash
cd parentcare/frontend
npm run build
```

---

## Healthcare Disclaimer

> **Important Notice:** ParentCare is a healthcare coordination and record tracking tool. It does **not** replace professional medical advice, diagnosis, or national emergency services (e.g., 911, 112, 108). In case of a medical emergency, immediately contact your local emergency response services.
