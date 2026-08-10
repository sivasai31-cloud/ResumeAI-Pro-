import sqlite3
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'resumeai.db')

def get_db_connection():
    db_dir = os.path.dirname(DB_PATH)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if os.path.exists(schema_path):
        with open(schema_path, 'r', encoding='utf-8') as f:
            conn.executescript(f.read())
    conn.commit()
    
    # Create demo admin and demo user if empty
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        demo_pass = generate_password_hash("password123")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("demouser", "demo@resumeai.pro", demo_pass, "user")
        )
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("admin", "admin@resumeai.pro", generate_password_hash("admin123"), "admin")
        )
        conn.commit()
        
        # Insert sample resume for demouser
        sample_personal = json.dumps({
            "fullName": "Alex Chen",
            "jobTitle": "Senior Full-Stack AI Engineer",
            "email": "alex.chen@example.com",
            "phone": "+1 (555) 234-5678",
            "location": "San Francisco, CA",
            "website": "https://alexchen.dev",
            "github": "https://github.com/alexchen",
            "linkedin": "https://linkedin.com/in/alexchen"
        })
        sample_summary = "Innovative Senior AI Engineer with 6+ years of experience architecting high-throughput full-stack web applications, scalable LLM integrations, and cloud infrastructure. Passionate about sleek UI/UX design and real-time distributed systems."
        sample_exp = json.dumps([
            {
                "company": "NeuralTech Systems",
                "position": "Lead AI Software Engineer",
                "location": "San Francisco, CA",
                "startDate": "2023-01",
                "endDate": "Present",
                "bullets": "Architected low-latency LLM inference pipeline reducing API response time by 42% across 2M daily queries.\nMentored a team of 8 engineers and introduced CI/CD workflows, improving deployment frequency by 3x."
            },
            {
                "company": "Apex Cloud Labs",
                "position": "Full-Stack Developer",
                "location": "Palo Alto, CA",
                "startDate": "2020-06",
                "endDate": "2022-12",
                "bullets": "Engineered responsive real-time analytics dashboard utilizing React, Python Flask, and WebSockets.\nOptimized PostgreSQL and Redis cache layers, boosting query performance by 65%."
            }
        ])
        sample_edu = json.dumps([
            {
                "institution": "Stanford University",
                "degree": "B.S. in Computer Science",
                "startDate": "2016-09",
                "endDate": "2020-05",
                "gpa": "3.92"
            }
        ])
        sample_skills = json.dumps([
            "Python", "Flask", "React", "TypeScript", "Node.js", "Docker", "PyTorch", "OpenAI / Gemini API", "PostgreSQL", "TailwindCSS / Vanilla CSS", "GraphQL", "AWS"
        ])
        sample_projects = json.dumps([
            {
                "name": "VisionAI Copilot",
                "techStack": "Python, Flask, PyTorch, React",
                "link": "https://github.com/alexchen/visionai",
                "description": "An open-source browser extension empowering users with instant web page synthesis and multimodal AI insights."
            }
        ])
        sample_certifications = json.dumps([
            {"name": "AWS Certified Solutions Architect", "issuer": "Amazon Web Services", "year": "2023"}
        ])
        sample_languages = json.dumps([
            {"language": "English", "proficiency": "Native"},
            {"language": "Mandarin", "proficiency": "Professional"}
        ])
        sample_links = json.dumps({
            "github": "https://github.com/alexchen",
            "linkedin": "https://linkedin.com/in/alexchen",
            "twitter": "https://twitter.com/alexchen_dev"
        })

        cursor.execute("""
            INSERT INTO resumes (user_id, title, template_name, personal_info, summary, education, experience, projects, skills, certifications, languages, social_links, ats_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (1, "Alex Chen - AI Engineer Resume", "modern", sample_personal, sample_summary, sample_edu, sample_exp, sample_projects, sample_skills, sample_certifications, sample_languages, sample_links, 92))
        
        resume_id = cursor.lastrowid
        
        # Create portfolio for demouser
        cursor.execute("""
            INSERT INTO portfolios (user_id, resume_id, title, theme, is_published, analytics_views)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (1, resume_id, "Alex Chen | Portfolio", "dark_glass", 1, 342))
        
        # Create initial ATS report
        cursor.execute("""
            INSERT INTO ats_reports (user_id, resume_id, file_name, job_title, job_description, score, matched_keywords, missing_keywords, recommendations, recruiter_notes, readability_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1, resume_id, "Alex_Chen_Resume.pdf", "Senior AI Engineer",
            "We are seeking a Senior AI Engineer skilled in Python, Flask, PyTorch, LLMs, Docker, AWS, and modern Web frameworks.",
            92,
            json.dumps(["Python", "Flask", "PyTorch", "LLMs", "Docker", "AWS", "Full-Stack"]),
            json.dumps(["Kubernetes", "CI/CD Security", "Vector DBs"]),
            json.dumps(["Add metrics to recent project bullets", "Highlight experience with Vector Databases like Pinecone/Qdrant"]),
            "Candidate exhibits strong impact metrics, clear technical skill progression, and clean section formatting suitable for top tech ATS screeners.",
            95
        ))
        
        conn.commit()
    conn.close()

# User Helpers
def create_user(username, email, password, role="user"):
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = generate_password_hash(password)
    try:
        cursor.execute("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                       (username, email, pwd_hash, role))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return get_user_by_id(user_id)
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_user_by_username(username):
    conn = get_db_connection()
    user = conn.cursor().execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_email(email):
    conn = get_db_connection()
    user = conn.cursor().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_id(user_id):
    conn = get_db_connection()
    user = conn.cursor().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None

def verify_user(username_or_email, password):
    user = get_user_by_username(username_or_email) or get_user_by_email(username_or_email)
    if user and check_password_hash(user['password_hash'], password):
        return user
    return None

# Resume Helpers
def get_user_resumes(user_id):
    conn = get_db_connection()
    resumes = conn.cursor().execute("SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in resumes]

def get_resume_by_id(resume_id, user_id=None):
    conn = get_db_connection()
    if user_id:
        r = conn.cursor().execute("SELECT * FROM resumes WHERE id = ? AND user_id = ?", (resume_id, user_id)).fetchone()
    else:
        r = conn.cursor().execute("SELECT * FROM resumes WHERE id = ?", (resume_id,)).fetchone()
    conn.close()
    return dict(r) if r else None

def save_resume(user_id, data, resume_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    title = data.get('title', 'Untitled Resume')
    template_name = data.get('template_name', 'ats_minimal')
    personal_info = json.dumps(data.get('personal_info', {}))
    summary = data.get('summary', '')
    education = json.dumps(data.get('education', []))
    experience = json.dumps(data.get('experience', []))
    projects = json.dumps(data.get('projects', []))
    skills = json.dumps(data.get('skills', []))
    certifications = json.dumps(data.get('certifications', []))
    languages = json.dumps(data.get('languages', []))
    social_links = json.dumps(data.get('social_links', {}))
    section_order = json.dumps(data.get('section_order', ["personal","summary","experience","education","skills","projects","certifications","languages"]))
    ats_score = int(data.get('ats_score', 85))

    if resume_id:
        cursor.execute("""
            UPDATE resumes
            SET title=?, template_name=?, personal_info=?, summary=?, education=?, experience=?,
                projects=?, skills=?, certifications=?, languages=?, social_links=?, section_order=?,
                ats_score=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND user_id=?
        """, (title, template_name, personal_info, summary, education, experience, projects, skills, certifications, languages, social_links, section_order, ats_score, resume_id, user_id))
        conn.commit()
        ret_id = resume_id
    else:
        cursor.execute("""
            INSERT INTO resumes (user_id, title, template_name, personal_info, summary, education, experience, projects, skills, certifications, languages, social_links, section_order, ats_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, title, template_name, personal_info, summary, education, experience, projects, skills, certifications, languages, social_links, section_order, ats_score))
        conn.commit()
        ret_id = cursor.lastrowid

    conn.close()
    return get_resume_by_id(ret_id, user_id)

def delete_resume(resume_id, user_id):
    conn = get_db_connection()
    conn.cursor().execute("DELETE FROM resumes WHERE id = ? AND user_id = ?", (resume_id, user_id))
    conn.commit()
    conn.close()

# Portfolio Helpers
def get_user_portfolio(user_id):
    conn = get_db_connection()
    p = conn.cursor().execute("SELECT * FROM portfolios WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,)).fetchone()
    conn.close()
    return dict(p) if p else None

def save_portfolio(user_id, resume_id, title, theme, custom_domain="", is_published=1):
    conn = get_db_connection()
    cursor = conn.cursor()
    existing = get_user_portfolio(user_id)
    if existing:
        cursor.execute("""
            UPDATE portfolios
            SET resume_id=?, title=?, theme=?, custom_domain=?, is_published=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND user_id=?
        """, (resume_id, title, theme, custom_domain, is_published, existing['id'], user_id))
        conn.commit()
        port_id = existing['id']
    else:
        cursor.execute("""
            INSERT INTO portfolios (user_id, resume_id, title, theme, custom_domain, is_published)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, resume_id, title, theme, custom_domain, is_published))
        conn.commit()
        port_id = cursor.lastrowid
    conn.close()
    return get_user_portfolio(user_id)

# ATS Reports Helpers
def save_ats_report(user_id, resume_id, file_name, job_title, job_description, score, matched_keywords, missing_keywords, recommendations, recruiter_notes="", readability_score=85):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ats_reports (user_id, resume_id, file_name, job_title, job_description, score, matched_keywords, missing_keywords, recommendations, recruiter_notes, readability_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, resume_id, file_name, job_title, job_description, score,
        json.dumps(matched_keywords), json.dumps(missing_keywords),
        json.dumps(recommendations), recruiter_notes, readability_score
    ))
    conn.commit()
    report_id = cursor.lastrowid
    conn.close()
    return report_id

def get_user_ats_reports(user_id):
    conn = get_db_connection()
    reports = conn.cursor().execute("SELECT * FROM ats_reports WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in reports]

def get_admin_stats():
    conn = get_db_connection()
    c = conn.cursor()
    total_users = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_resumes = c.execute("SELECT COUNT(*) FROM resumes").fetchone()[0]
    total_portfolios = c.execute("SELECT COUNT(*) FROM portfolios").fetchone()[0]
    total_ats_scans = c.execute("SELECT COUNT(*) FROM ats_reports").fetchone()[0]
    recent_users = [dict(u) for u in c.execute("SELECT id, username, email, role, created_at FROM users ORDER BY id DESC LIMIT 10").fetchall()]
    conn.close()
    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_portfolios": total_portfolios,
        "total_ats_scans": total_ats_scans,
        "recent_users": recent_users
    }
