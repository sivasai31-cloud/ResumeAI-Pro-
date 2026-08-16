def test_register_and_login(client):
    # Test Registration
    reg_payload = {
        "email": "child@example.com",
        "password": "Password123!",
        "full_name": "Alex Smith",
        "phone": "+1 555-0199",
        "role": "USER"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "child@example.com"
    assert data["user"]["role"] == "USER"

    # Test Duplicate Registration Prevention
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 400

    # Test Login
    login_payload = {
        "email": "child@example.com",
        "password": "Password123!"
    }
    res_login = client.post("/api/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]

    # Test Get Current User (/api/auth/me)
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["full_name"] == "Alex Smith"
