# ResumeAI Pro — Futuristic AI Resume & Portfolio Platform

> **“Build Intelligent Resumes & Futuristic Portfolios with AI.”**

ResumeAI Pro is a next-generation, dark futuristic glassmorphic SaaS web application inspired by Apple Vision Pro UI, Tesla dashboard, Framer AI, Linear, and Cyberpunk HUD aesthetics. It equips job seekers and tech professionals with ATS score diagnostics, instant real-time resume building across 4 templates, Google Gemini AI integration, cover letter generation, recruiter simulation, and automated personal web portfolio generation with ZIP exports.

---

## 🚀 Key Features

* **Dark Futuristic Glassmorphism Design System**: 3D floating glass cards, aurora glow animations, canvas particle background, electric neon gradients, Space Grotesk + Poppins typography, and dark/light mode toggle.
* **3-Column Dashboard Layout**: Left Navigation Sidebar, Center Active Workspace, and Right Live Preview HUD & AI Copilot Drawer.
* **Multi-Step Live Resume Builder**: Instant real-time live preview synchronization, dynamic form field repetition, auto-save to SQLite DB and LocalStorage, section reordering, and keyboard shortcuts (`Ctrl+S` save, `Ctrl+P` preview).
* **4 Resume Templates**:
  1. *ATS Minimal*: Standard scannable single-column layout for maximum parser compatibility.
  2. *Modern*: Elegant dual-column layout with glowing accent sidebar.
  3. *Executive*: Refined serif accents with bold header block.
  4. *Developer Dark*: Cyberpunk terminal theme with code tag badges and tech stacks.
* **Multi-Format Export**: Download high-fidelity PDF documents using ReportLab or scannable Word documents (`.docx`).
* **ATS Scanner & Recruiter Simulator**: File drag-and-drop parser for PDF/DOCX uploads, 0-100 ATS score ring gauge animation, matched vs missing keyword heatmaps, and AI recruiter evaluation simulation.
* **AI Cover Letter Generator & JARVIS Copilot**: Tailor cover letters based on candidate resume data and target job description. Floating JARVIS AI drawer for quick advice.
* **Automated Web Portfolio Generator**: Converts candidate resume into a single-page responsive website with 4 customizable themes (*Dark Glassmorphism*, *Futuristic Cyber*, *Modern*, *Minimal*), live preview iframe, and standalone ZIP bundle download.
* **Admin Analytics Panel**: System statistics tracking total registered users, created resumes, generated portfolios, and ATS audit logs.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3 (Vanilla Dark Glassmorphism Design System), JavaScript (ES6+), FontAwesome 6, Google Fonts (Space Grotesk & Poppins).
* **Backend**: Python, Flask, Werkzeug Security (Password Hashing), Session Authentication.
* **Database**: SQLite3.
* **PDF Exporter**: ReportLab 4.x.
* **DOCX Exporter**: `python-docx`.
* **File Upload Parsing**: `pypdf` (PDF text extraction), `python-docx`.
* **AI Integration**: Google Gemini API (`google-generativeai`) with built-in intelligent fallback mode.

---

## ⚙️ Quickstart & Setup Instructions

### 1. Prerequisites
Ensure you have Python 3.9+ installed on your system.

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-username/ResumeAI-Pro.git
cd ResumeAI-Pro
pip install -r requirements.txt
```

### 3. Environment Variables (Optional for Gemini AI)
Set your Google Gemini API key to enable live LLM generation (if not set, the app seamlessly runs using built-in smart AI algorithms):
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your_gemini_api_key_here"

# Linux / macOS
export GEMINI_API_KEY="your_gemini_api_key_here"
```

### 4. Run Application
```bash
python app.py
```
Open your browser and navigate to: **`http://127.0.0.1:5000`**

### Demo Login Credentials:
* **User Account**: Username: `demouser` | Password: `password123`
* **Admin Account**: Username: `admin` | Password: `admin123`

---

## 📁 Project Structure

```text
ResumeAI-Pro/
├── app.py                      # Main Flask application & API routes
├── requirements.txt            # Python dependencies
├── database.py                 # SQLite database helper & CRUD queries
├── schema.sql                  # Database schema definitions
├── ai_helper.py                # Gemini API integration wrapper & offline fallbacks
├── pdf_generator.py            # ReportLab PDF renderer supporting 4 templates
├── docx_generator.py           # python-docx exporter
├── ats_analyzer.py             # PDF/DOCX file parser, ATS scoring & keyword heatmap
├── static/
│   ├── css/
│   │   ├── style.css           # Core Dark Glassmorphism Design System
│   │   ├── dashboard.css       # 3-Column Dashboard layout
│   │   ├── templates.css       # Resume preview templates styling
│   │   └── portfolio_themes.css# Portfolio themes styling
│   └── js/
│       ├── main.js             # Canvas particle background & toast notifications
│       ├── builder.js          # Multi-step resume builder & real-time live preview
│       ├── ats.js              # ATS analyzer drag-and-drop & score ring gauge
│       ├── ai_copilot.js       # Floating JARVIS AI drawer panel
│       └── portfolio.js        # Portfolio generator, preview & ZIP exporter
└── templates/
    ├── base.html               # Master layout
    ├── landing.html            # Landing page
    ├── auth/                   # Login, Register, Forgot Password
    ├── dashboard/              # 3-Column Dashboard & Admin Panel
    ├── builder/                # Resume Builder HUD & Cover Letter Generator
    ├── ats/                    # ATS Scanner & Diagnostic Report
    └── portfolio/              # Portfolio Builder & Live Preview
```
