import io

def test_full_workflow_and_endpoints(client):
    # 1. Register & Login
    reg_res = client.post("/api/auth/register", json={
        "email": "janedoe@example.com",
        "password": "Password123!",
        "full_name": "Jane Doe",
        "role": "USER"
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /me endpoint
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "janedoe@example.com"

    # 2. Add Parent
    parent_res = client.post("/api/parents", json={
        "name": "Martha Doe",
        "date_of_birth": "1958-05-15",
        "gender": "Female",
        "blood_group": "A+",
        "allergies": "Aspirin"
    }, headers=headers)
    assert parent_res.status_code == 201
    parent_id = parent_res.json()["id"]

    # 3. Add Medicine
    med_res = client.post("/api/medicines", json={
        "parent_id": parent_id,
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "start_date": "2026-01-01",
        "status": "active"
    }, headers=headers)
    assert med_res.status_code == 201
    med_id = med_res.json()["id"]

    # List medicines
    meds_list = client.get(f"/api/medicines?parent_id={parent_id}", headers=headers)
    assert meds_list.status_code == 200
    assert len(meds_list.json()) == 1

    # 4. Add Appointment
    apt_res = client.post("/api/appointments", json={
        "parent_id": parent_id,
        "doctor_name": "Dr. Smith",
        "hospital_clinic": "City Health Hospital",
        "appointment_date": "2026-09-10",
        "appointment_time": "10:30",
        "purpose": "Quarterly checkup",
        "status": "upcoming"
    }, headers=headers)
    assert apt_res.status_code == 201
    apt_id = apt_res.json()["id"]

    # 5. Add Emergency Contact
    contact_res = client.post("/api/emergency-contacts", json={
        "parent_id": parent_id,
        "name": "Uncle Bob",
        "relationship_type": "Brother",
        "phone": "+1 555-9876",
        "location": "Downtown",
        "priority": "primary"
    }, headers=headers)
    assert contact_res.status_code == 201

    # 6. Upload Medical Report
    file_content = b"%PDF-1.4 Mock PDF Test File"
    upload_res = client.post(
        "/api/reports",
        data={
            "parent_id": parent_id,
            "title": "Routine Blood Test",
            "report_type": "lab_report",
            "notes": "Normal levels"
        },
        files={"file": ("report.pdf", io.BytesIO(file_content), "application/pdf")},
        headers=headers
    )
    assert upload_res.status_code == 201
    report_id = upload_res.json()["id"]

    # 7. Test Dashboard Overview
    dash_res = client.get("/api/dashboard/overview", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_parents"] == 1
    assert dash_data["total_active_medicines"] == 1
    assert dash_data["total_upcoming_appointments"] == 1
    assert dash_data["total_reports"] == 1

    # 8. Test Notifications
    notif_res = client.get("/api/notifications", headers=headers)
    assert notif_res.status_code == 200
