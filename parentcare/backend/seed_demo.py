"""
ParentCare Safe Demo Data Seeder
Populates clearly fictional demo parents, medicines, appointments, and contacts for evaluation.
Does NOT run automatically in production.
"""
from datetime import datetime, timedelta
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    User,
    UserRole,
    Parent,
    Medicine,
    Appointment,
    EmergencyContact,
    Notification,
)

def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print(">> Seeding ParentCare demo dataset...")

        # 1. Demo User
        demo_user = db.query(User).filter(User.email == "demo@parentcare.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@parentcare.com",
                hashed_password=get_password_hash("Demo123!"),
                full_name="Sarah Jenkins",
                phone="+1 555-018-9234",
                role=UserRole.USER.value,
                is_active=True,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

        # 2. Demo Parents
        parent1 = db.query(Parent).filter(Parent.name == "Robert Jenkins (Father)", Parent.user_id == demo_user.id).first()
        if not parent1:
            parent1 = Parent(
                user_id=demo_user.id,
                name="Robert Jenkins (Father)",
                date_of_birth="1952-03-14",
                gender="Male",
                phone="+1 555-432-1001",
                email="robert.j@example.com",
                address="742 Evergreen Terrace, Springfield",
                blood_group="O+",
                allergies="Penicillin, Sulfa drugs",
                emergency_notes="History of mild hypertension, pacemaker implanted in 2021.",
            )
            db.add(parent1)

        parent2 = db.query(Parent).filter(Parent.name == "Eleanor Jenkins (Mother)", Parent.user_id == demo_user.id).first()
        if not parent2:
            parent2 = Parent(
                user_id=demo_user.id,
                name="Eleanor Jenkins (Mother)",
                date_of_birth="1956-07-22",
                gender="Female",
                phone="+1 555-432-1002",
                email="eleanor.j@example.com",
                address="742 Evergreen Terrace, Springfield",
                blood_group="A+",
                allergies="Aspirin, Shellfish",
                emergency_notes="Type 2 Diabetes, routine blood glucose tracking needed.",
            )
            db.add(parent2)

        db.commit()
        if parent1: db.refresh(parent1)
        if parent2: db.refresh(parent2)

        # 3. Medications
        if parent1:
            if not db.query(Medicine).filter(Medicine.parent_id == parent1.id).first():
                db.add_all([
                    Medicine(
                        parent_id=parent1.id,
                        name="Amlodipine Besylate",
                        dosage="5mg Tablet",
                        frequency="Once daily (Morning after breakfast)",
                        start_date="2026-01-01",
                        instructions="Take with water to control blood pressure.",
                        status="active",
                    ),
                    Medicine(
                        parent_id=parent1.id,
                        name="Atorvastatin",
                        dosage="20mg Tablet",
                        frequency="Once daily (Bedtime)",
                        start_date="2026-01-01",
                        instructions="Cholesterol management.",
                        status="active",
                    )
                ])

        if parent2:
            if not db.query(Medicine).filter(Medicine.parent_id == parent2.id).first():
                db.add_all([
                    Medicine(
                        parent_id=parent2.id,
                        name="Metformin HCl",
                        dosage="500mg ER Tablet",
                        frequency="Twice daily (With meals)",
                        start_date="2026-02-01",
                        instructions="Blood sugar control. Drink plenty of fluids.",
                        status="active",
                    )
                ])

        # 4. Doctor Appointments
        today = datetime.now()
        if parent1:
            if not db.query(Appointment).filter(Appointment.parent_id == parent1.id).first():
                db.add(
                    Appointment(
                        parent_id=parent1.id,
                        doctor_name="Dr. William Harris, MD",
                        hospital_clinic="Springfield Cardiology Center",
                        appointment_date=(today + timedelta(days=5)).strftime("%Y-%m-%d"),
                        appointment_time="10:30",
                        purpose="Bi-annual Pacemaker & Cardiac Rhythm Check",
                        notes="Bring recent ECG and blood pressure log sheet.",
                        status="upcoming",
                    )
                )

        if parent2:
            if not db.query(Appointment).filter(Appointment.parent_id == parent2.id).first():
                db.add(
                    Appointment(
                        parent_id=parent2.id,
                        doctor_name="Dr. Lisa Cuddy, MD",
                        hospital_clinic="Memorial Endocrinology Clinic",
                        appointment_date=(today + timedelta(days=12)).strftime("%Y-%m-%d"),
                        appointment_time="14:00",
                        purpose="HbA1c Diabetes Review & Dietary Assessment",
                        notes="Fast for 8 hours before appointment for lipid panel.",
                        status="upcoming",
                    )
                )

        # 5. Emergency Contacts
        if parent1:
            if not db.query(EmergencyContact).filter(EmergencyContact.parent_id == parent1.id).first():
                db.add_all([
                    EmergencyContact(
                        parent_id=parent1.id,
                        name="Dr. William Harris (Cardiologist)",
                        relationship_type="Primary Cardiologist",
                        phone="+1 555-911-0422",
                        location="Springfield Medical Plaza, Suite 300",
                        priority="doctor",
                    ),
                    EmergencyContact(
                        parent_id=parent1.id,
                        name="Arthur Pendelton",
                        relationship_type="Next-Door Neighbor",
                        phone="+1 555-321-7788",
                        location="740 Evergreen Terrace (Next door)",
                        priority="primary",
                    )
                ])

        # 6. Notifications
        if not db.query(Notification).filter(Notification.user_id == demo_user.id).first():
            db.add_all([
                Notification(
                    user_id=demo_user.id,
                    title="Medication Reminder",
                    message="Robert Jenkins: Amlodipine 5mg morning dosage scheduled.",
                    notification_type="reminder",
                    is_read=False,
                ),
                Notification(
                    user_id=demo_user.id,
                    title="Upcoming Cardiology Visit",
                    message="Dr. William Harris appointment coming up in 5 days.",
                    notification_type="alert",
                    is_read=False,
                )
            ])

        db.commit()
        print(">> Demo dataset successfully populated for demo@parentcare.com (Password: Demo123!)")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
