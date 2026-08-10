-- Database Schema for ResumeAI Pro

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL DEFAULT 'Untitled Resume',
    template_name VARCHAR(50) DEFAULT 'ats_minimal',
    personal_info TEXT DEFAULT '{}',
    summary TEXT DEFAULT '',
    education TEXT DEFAULT '[]',
    experience TEXT DEFAULT '[]',
    projects TEXT DEFAULT '[]',
    skills TEXT DEFAULT '[]',
    certifications TEXT DEFAULT '[]',
    languages TEXT DEFAULT '[]',
    social_links TEXT DEFAULT '{}',
    section_order TEXT DEFAULT '["personal","summary","experience","education","skills","projects","certifications","languages"]',
    ats_score INTEGER DEFAULT 85,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    title VARCHAR(150) NOT NULL DEFAULT 'My Portfolio',
    theme VARCHAR(50) DEFAULT 'dark_glass',
    custom_domain VARCHAR(100) DEFAULT '',
    is_published INTEGER DEFAULT 1,
    analytics_views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ats_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    file_name VARCHAR(255) DEFAULT '',
    job_title VARCHAR(150) DEFAULT 'Target Role',
    job_description TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    matched_keywords TEXT DEFAULT '[]',
    missing_keywords TEXT DEFAULT '[]',
    recommendations TEXT DEFAULT '[]',
    recruiter_notes TEXT DEFAULT '',
    readability_score INTEGER DEFAULT 90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    job_title VARCHAR(150) DEFAULT '',
    match_percentage INTEGER DEFAULT 0,
    matched_skills TEXT DEFAULT '[]',
    missing_skills TEXT DEFAULT '[]',
    learning_roadmap TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
