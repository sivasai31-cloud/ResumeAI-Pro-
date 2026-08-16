def test_parent_crud(client):
    # Register user
    reg_res = client.post("/api/auth/register", json={
        "email": "sarah@example.com",
        "password": "Password123!",
        "full_name": "Sarah Connor",
        "role": "USER"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Parent
    parent_payload = {
        "name": "Robert Connor",
        "date_of_birth": "1954-04-12",
        "gender": "Male",
        "phone": "+1 555-4321",
        "blood_group": "O+",
        "allergies": "Penicillin",
        "emergency_notes": "High blood pressure history"
    }
    create_res = client.post("/api/parents", json=parent_payload, headers=headers)
    assert create_res.status_code == 201
    parent_data = create_res.json()
    assert parent_data["name"] == "Robert Connor"
    parent_id = parent_data["id"]

    # Get Parents List
    list_res = client.get("/api/parents", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Update Parent
    update_res = client.put(f"/api/parents/{parent_id}", json={"allergies": "Penicillin, Peanuts"}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["allergies"] == "Penicillin, Peanuts"

    # Delete Parent
    del_res = client.delete(f"/api/parents/{parent_id}", headers=headers)
    assert del_res.status_code == 204
