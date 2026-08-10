import os
import json
import io
import zipfile
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file, send_from_directory, make_response
from database import (
    init_db, create_user, verify_user, get_user_by_id, get_user_resumes,
    get_resume_by_id, save_resume, delete_resume, get_user_portfolio,
    save_portfolio, save_ats_report, get_user_ats_reports, get_admin_stats
)
from ai_helper import (
    ask_ai, generate_resume_summary, improve_experience, generate_cover_letter,
    generate_portfolio_about, copilot_reply, improve_summary, rewrite_bullet_points,
    generate_achievements, copilot_chat, generate_missing_requirements
)
from pdf_generator import generate_resume_pdf
from docx_generator import generate_resume_docx
from ats_analyzer import extract_text_from_pdf, extract_text_from_docx, analyze_resume_ats

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'resumeai-pro-super-secret-key-2026')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max file upload
GENERATED_DIR = os.path.join(os.path.dirname(__file__), 'generated')

# Initialize SQLite Database
with app.app_context():
    init_db()

# Helper decorator for login required
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please log in to access this feature.", "warning")
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


def _json_body():
    return request.get_json(silent=True) or {}


def _safe_json_load(value, default):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return value if value is not None else default


def _resume_payload(user_id, resume_id=None):
    resume = None
    if resume_id:
        try:
            resume = get_resume_by_id(int(resume_id), user_id)
        except (TypeError, ValueError):
            resume = None
    return resume


def _resume_context_fields(resume):
    if not resume:
        return {}, [], [], [], [], {}
    personal = _safe_json_load(resume.get('personal_info'), {})
    experience = _safe_json_load(resume.get('experience'), [])
    education = _safe_json_load(resume.get('education'), [])
    projects = _safe_json_load(resume.get('projects'), [])
    skills = _safe_json_load(resume.get('skills'), [])
    links = _safe_json_load(resume.get('social_links'), {})
    return personal, experience, education, projects, skills, links


def _portfolio_preview_context(user_id, resume_id=None, about_text=None):
    resumes = get_user_resumes(user_id)
    active_resume = None
    if resume_id:
        active_resume = next((item for item in resumes if str(item.get('id')) == str(resume_id)), None)
    if not active_resume and resumes:
        active_resume = resumes[0]

    personal, experience, education, projects, skills, links = _resume_context_fields(active_resume)
    if about_text is None:
        about_text = active_resume.get('summary', '') if active_resume else ''

    return {
        'resume': active_resume,
        'personal': personal,
        'experience': experience,
        'education': education,
        'projects': projects,
        'skills': skills,
        'links': links,
        'about_text': about_text,
    }


def _render_portfolio_export_html(user_id, resume_id=None, theme='dark_glass', about_text=None):
    context = _portfolio_preview_context(user_id, resume_id=resume_id, about_text=about_text)
    return render_template(
        'portfolio/export.html',
        theme=theme,
        **context,
    )


def _ensure_generated_dir():
    os.makedirs(GENERATED_DIR, exist_ok=True)
    return GENERATED_DIR

# Context processor for session user data
@app.context_processor
def inject_user():
    current_user = None
    if 'user_id' in session:
        current_user = get_user_by_id(session['user_id'])
    return dict(current_user=current_user)

# --- ROUTES ---

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = verify_user(username, password)
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            flash(f"Welcome back, {user['username']}!", "success")
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash("Invalid username/email or password.", "error")
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template('auth/register.html')

        user = create_user(username, email, password)
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            flash("Account created successfully! Welcome to ResumeAI Pro.", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("Username or email already exists.", "error")
    return render_template('auth/register.html')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        flash("Password reset instructions have been sent to your email (if registered).", "info")
        return redirect(url_for('login'))
    return render_template('auth/forgot_password.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for('landing'))

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    resumes = get_user_resumes(user_id)
    portfolio = get_user_portfolio(user_id)
    reports = get_user_ats_reports(user_id)
    
    # Calculate average ATS score
    avg_score = 85
    if resumes:
        avg_score = int(sum(r['ats_score'] for r in resumes) / len(resumes))
        
    return render_template(
        'dashboard/index.html',
        resumes=resumes,
        portfolio=portfolio,
        reports=reports,
        avg_score=avg_score
    )

@app.route('/admin')
@login_required
def admin():
    if session.get('role') != 'admin':
        flash("Access restricted to administrators.", "error")
        return redirect(url_for('dashboard'))
    stats = get_admin_stats()
    return render_template('dashboard/admin.html', stats=stats)

@app.route('/create')
@login_required
def create_resume():
    return redirect(url_for('builder'))

@app.route('/builder')
@app.route('/builder/<int:resume_id>')
@login_required
def builder(resume_id=None):
    user_id = session['user_id']
    resume_data = None
    if resume_id:
        resume_data = get_resume_by_id(resume_id, user_id)
        
    if not resume_data:
        # Default blank template structure
        resume_data = {
            "id": 0,
            "title": "My Futuristic Resume",
            "template_name": "modern",
            "personal_info": json.dumps({"fullName": session.get('username', 'Candidate Name'), "jobTitle": "Full-Stack Engineer", "email": "candidate@example.com", "phone": "+1 (555) 019-2834", "location": "San Francisco, CA"}),
            "summary": "Innovative engineer passionate about AI-driven applications, modern responsive UI, and cloud infrastructure.",
            "education": json.dumps([{"institution": "Tech University", "degree": "B.S. Computer Science", "startDate": "2019", "endDate": "2023", "gpa": "3.8"}]),
            "experience": json.dumps([{"company": "Apex Software", "position": "Software Engineer", "location": "San Francisco, CA", "startDate": "2023", "endDate": "Present", "bullets": "Spearheaded frontend redesign using modern framework, improving load speed by 40%.\nArchitected low-latency backend APIs."}]),
            "projects": json.dumps([{"name": "AI Portfolio Generator", "techStack": "Python, Flask, JavaScript", "description": "Automated single-page portfolio website generator from resume JSON.", "link": "https://github.com"}]),
            "skills": json.dumps(["Python", "Flask", "JavaScript", "React", "Docker", "SQL", "Git", "REST APIs"]),
            "certifications": json.dumps([{"name": "AWS Certified Solutions Architect", "issuer": "AWS", "year": "2024"}]),
            "languages": json.dumps([{"language": "English", "proficiency": "Native"}]),
            "social_links": json.dumps({"github": "https://github.com", "linkedin": "https://linkedin.com"}),
            "section_order": json.dumps(["personal","summary","experience","education","skills","projects","certifications","languages"]),
            "ats_score": 88
        }
    return render_template('builder/index.html', resume=resume_data)

@app.route('/api/save-resume', methods=['POST'])
@login_required
def api_save_resume():
    user_id = session['user_id']
    data = request.json or {}

    if not data and request.form:
        data = request.form.to_dict()

    project_names = request.form.getlist("project_name[]")
    project_techs = request.form.getlist("project_tech[]")
    project_descs = request.form.getlist("project_desc[]")
    if project_names or project_techs or project_descs:
        projects_list = []
        max_len = max(len(project_names), len(project_techs), len(project_descs))
        for i in range(max_len):
            name = project_names[i] if i < len(project_names) else ""
            tech = project_techs[i] if i < len(project_techs) else ""
            desc = project_descs[i] if i < len(project_descs) else ""
            if name or tech or desc:
                projects_list.append({"name": name, "techStack": tech, "description": desc})
        data['projects'] = projects_list

    if 'projects' in data and isinstance(data['projects'], str):
        try:
            data['projects'] = json.loads(data['projects'])
        except Exception:
            pass

    resume_id = data.get('id')
    if resume_id and int(resume_id) == 0:
        resume_id = None
        
    saved = save_resume(user_id, data, resume_id)
    return jsonify({"status": "success", "resume": saved})

@app.route('/api/delete-resume/<int:resume_id>', methods=['POST'])
@login_required
def api_delete_resume(resume_id):
    user_id = session['user_id']
    delete_resume(resume_id, user_id)
    return jsonify({"status": "success"})

@app.route('/download-resume/pdf/<int:resume_id>')
@login_required
def download_pdf(resume_id):
    user_id = session['user_id']
    resume_data = get_resume_by_id(resume_id, user_id)
    if not resume_data:
        flash("Resume not found.", "error")
        return redirect(url_for('dashboard'))
        
    pdf_bytes = generate_resume_pdf(resume_data)
    response = make_response(pdf_bytes)
    response.headers['Content-Type'] = 'application/pdf'
    filename = f"{resume_data['title'].replace(' ', '_')}.pdf"
    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

@app.route('/download-resume/docx/<int:resume_id>')
@login_required
def download_docx(resume_id):
    user_id = session['user_id']
    resume_data = get_resume_by_id(resume_id, user_id)
    if not resume_data:
        flash("Resume not found.", "error")
        return redirect(url_for('dashboard'))
        
    docx_bytes = generate_resume_docx(resume_data)
    response = make_response(docx_bytes)
    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    filename = f"{resume_data['title'].replace(' ', '_')}.docx"
    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response

@app.route('/ats')
@login_required
def ats_scanner():
    user_id = session['user_id']
    resumes = get_user_resumes(user_id)
    reports = get_user_ats_reports(user_id)
    return render_template('ats/index.html', resumes=resumes, reports=reports)

@app.route('/api/ats/scan', methods=['POST'])
@login_required
def api_ats_scan():
    user_id = session['user_id']
    resume_text = ""
    file_name = "Pasted_Resume_Text"
    
    job_title = request.form.get('job_title', 'Target Position')
    job_description = request.form.get('job_description', '')
    resume_id = request.form.get('resume_id')
    
    if resume_id and resume_id != '0':
        r = get_resume_by_id(int(resume_id), user_id)
        if r:
            file_name = r['title']
            p = json.loads(r['personal_info']) if isinstance(r['personal_info'], str) else r['personal_info']
            resume_text = f"{p.get('fullName','')} {p.get('jobTitle','')}\n{r.get('summary','')}\n{r.get('experience','')}\n{r.get('education','')}\n{r.get('skills','')}"
    elif 'file' in request.files and request.files['file'].filename:
        file = request.files['file']
        file_name = file.filename
        content = file.read()
        if file_name.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(content)
        elif file_name.lower().endswith('.docx'):
            resume_text = extract_text_from_docx(content)
        else:
            resume_text = content.decode('utf-8', errors='ignore')
    else:
        resume_text = request.form.get('resume_text', '')

    if not resume_text or len(resume_text.strip()) < 20:
        return jsonify({"status": "error", "message": "Could not extract text from file or text is empty."}), 400

    analysis = analyze_resume_ats(resume_text, job_description)
    
    report_id = save_ats_report(
        user_id,
        int(resume_id) if resume_id and resume_id != '0' else None,
        file_name,
        job_title,
        job_description,
        analysis['score'],
        analysis.get('matched', analysis.get('matched_keywords', [])),
        analysis.get('missing', analysis.get('missing_keywords', [])),
        analysis.get('feedback', analysis.get('recommendations', [])),
        analysis.get('recruiter_notes', ''),
        analysis['readability_score']
    )
    
    return jsonify({"status": "success", "report_id": report_id, "analysis": analysis})

@app.route('/ats/report/<int:report_id>')
@login_required
def ats_report(report_id):
    user_id = session['user_id']
    reports = get_user_ats_reports(user_id)
    report = next((r for r in reports if r['id'] == report_id), None)
    if not report:
        flash("Report not found.", "error")
        return redirect(url_for('ats_scanner'))
        
    return render_template('ats/report.html', report=report)

@app.route('/job-match')
@login_required
def job_match():
    user_id = session['user_id']
    resumes = get_user_resumes(user_id)
    return render_template('ats/index.html', resumes=resumes, is_job_match=True)

@app.route('/cover-letter')
@login_required
def cover_letter():
    user_id = session['user_id']
    resumes = get_user_resumes(user_id)
    return render_template('builder/cover_letter.html', resumes=resumes)

@app.route('/api/generate-cover-letter', methods=['POST'])
@login_required
def api_generate_cover_letter():
    try:
        user_id = session['user_id']
        data = _json_body()
        resume = _resume_payload(user_id, data.get('resume_id'))
        personal = _safe_json_load(resume.get('personal_info'), {}) if resume else {}

        name = data.get('name') or personal.get('fullName') or session.get('username', 'Candidate')
        role = data.get('role') or data.get('job_title') or personal.get('jobTitle') or 'Target Role'
        company = data.get('company') or data.get('company_name') or 'Tech Company'
        job_description = data.get('job_description', '')

        letter = generate_cover_letter(name, role, company, job_description)
        return jsonify({"status": "success", "cover_letter": letter})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/api/generate-summary', methods=['POST'])
@login_required
def api_generate_summary():
    try:
        user_id = session['user_id']
        data = _json_body()
        resume = _resume_payload(user_id, data.get('resume_id'))
        personal = _safe_json_load(resume.get('personal_info'), {}) if resume else {}
        skills = data.get('skills') or (_safe_json_load(resume.get('skills'), []) if resume else [])
        projects = data.get('projects') or (_safe_json_load(resume.get('projects'), []) if resume else [])
        name = data.get('name') or personal.get('fullName') or session.get('username', 'Candidate')
        role = data.get('role') or personal.get('jobTitle') or 'Software Engineer'

        summary = generate_resume_summary(name, role, skills, projects)
        return jsonify({"status": "success", "summary": summary})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/api/improve-experience', methods=['POST'])
@login_required
def api_improve_experience():
    try:
        user_id = session['user_id']
        data = _json_body()
        resume = _resume_payload(user_id, data.get('resume_id'))
        experience_text = data.get('text') or data.get('experience') or ''

        if not experience_text and resume:
            experience_blocks = _safe_json_load(resume.get('experience'), [])
            experience_text = "\n".join(
                block.get('bullets', '') if isinstance(block, dict) else str(block)
                for block in experience_blocks
            )

        improved = improve_experience(experience_text)
        return jsonify({"status": "success", "experience": improved})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/api/generate-portfolio-about', methods=['POST'])
@login_required
def api_generate_portfolio_about():
    try:
        user_id = session['user_id']
        data = _json_body()
        resume = _resume_payload(user_id, data.get('resume_id'))
        personal = _safe_json_load(resume.get('personal_info'), {}) if resume else {}
        skills = data.get('skills') or (_safe_json_load(resume.get('skills'), []) if resume else [])

        name = data.get('name') or personal.get('fullName') or session.get('username', 'Candidate')
        role = data.get('role') or personal.get('jobTitle') or 'Software Engineer'

        about = generate_portfolio_about(name, role, skills)
        return jsonify({"status": "success", "about": about})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/api/copilot', methods=['POST'])
@login_required
def api_copilot():
    try:
        data = _json_body()
        message = data.get('message') or data.get('prompt') or ''
        context = data.get('context', '')
        reply = copilot_reply(f"{context}\n\n{message}" if context else message)
        return jsonify({"status": "success", "reply": reply, "result": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.route('/portfolio')
@login_required
def portfolio_builder():
    user_id = session['user_id']
    resumes = get_user_resumes(user_id)
    portfolio = get_user_portfolio(user_id)
    return render_template('portfolio/builder.html', resumes=resumes, portfolio=portfolio)

@app.route('/portfolio/preview')
def portfolio_preview():
    user_id = request.args.get('user_id', type=int) or session.get('user_id', 1)
    theme = request.args.get('theme', 'dark_glass')
    resume_id = request.args.get('resume_id', type=int)
    about_text = request.args.get('about', '')

    context = _portfolio_preview_context(user_id, resume_id=resume_id, about_text=about_text)

    return render_template(
        'portfolio/preview.html',
        theme=theme,
        personal=context['personal'],
        resume=context['resume'],
        experience=context['experience'],
        education=context['education'],
        projects=context['projects'],
        skills=context['skills'],
        links=context['links'],
        about_text=context['about_text']
    )


@app.route('/portfolio/export/<path:filename>')
@login_required
def download_portfolio_export(filename):
    _ensure_generated_dir()
    return send_from_directory(GENERATED_DIR, filename, as_attachment=True)


@app.route('/api/portfolio/export-html', methods=['POST'])
@login_required
def api_export_portfolio_html():
    try:
        user_id = session['user_id']
        data = _json_body()
        resume_id = data.get('resume_id')
        theme = data.get('theme', 'dark_glass')
        about_text = data.get('about') or data.get('about_text')

        html_content = _render_portfolio_export_html(user_id, resume_id=resume_id, theme=theme, about_text=about_text)
        generated_dir = _ensure_generated_dir()
        filename = f"portfolio_{user_id}_{resume_id or 'latest'}.html"
        file_path = os.path.join(generated_dir, filename)

        with open(file_path, 'w', encoding='utf-8') as file_handle:
            file_handle.write(html_content)

        return jsonify({
            'status': 'success',
            'filename': filename,
            'download_url': url_for('download_portfolio_export', filename=filename)
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.route('/api/portfolio/save', methods=['POST'])
@login_required
def api_save_portfolio():
    user_id = session['user_id']
    data = request.json or {}
    resume_id = data.get('resume_id')
    title = data.get('title', 'My Portfolio')
    theme = data.get('theme', 'dark_glass')
    custom_domain = data.get('custom_domain', '')
    is_published = int(data.get('is_published', 1))
    
    saved = save_portfolio(user_id, resume_id, title, theme, custom_domain, is_published)
    return jsonify({"status": "success", "portfolio": saved})

@app.route('/api/portfolio/export-zip', methods=['POST'])
@login_required
def api_export_portfolio_zip():
    user_id = session['user_id']
    data = _json_body()
    resume_id = data.get('resume_id')
    theme = data.get('theme', 'dark_glass')
    about_text = data.get('about') or data.get('about_text')

    html_content = _render_portfolio_export_html(user_id, resume_id=resume_id, theme=theme, about_text=about_text)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr('index.html', html_content)
        zip_file.writestr('README.md', '# Personal Portfolio\n\nGenerated with ResumeAI Pro. Deploy to GitHub Pages or Netlify!')

    zip_buffer.seek(0)
    return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='portfolio_website.zip')

@app.route('/api/ai/assist', methods=['POST'])
@login_required
def api_ai_assist():
    try:
        data = _json_body()
        action = data.get('action')
        context = data.get('context', '')
        prompt = data.get('prompt', '')

        if action == 'improve_summary':
            res = improve_summary(context, data.get('job_title', 'Software Engineer'))
        elif action == 'rewrite_experience':
            res = rewrite_bullet_points(context, data.get('position', 'Engineer'))
        elif action == 'generate_achievements':
            res = generate_achievements(data.get('position', 'Engineer'), context)
        elif action == 'copilot_chat':
            res = copilot_chat(prompt, context)
        else:
            return jsonify({"error": "Invalid AI request action."}), 400

        return jsonify({"status": "success", "result": res})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route('/ai-test')
def ai_test():
    try:
        response_text = ask_ai("Return a short connectivity check that says the offline AI is working.", system="You reply with one short sentence.")
        return jsonify({"status": "success", "response": response_text})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.route('/api/generate-missing-requirements', methods=['POST'])
@login_required
def api_generate_missing_requirements():
    """Call Ollama to generate ATS-friendly content for the missing keywords."""
    try:
        data = _json_body()
        missing_keywords = data.get('missing_keywords', [])
        target_role = data.get('target_role', 'Software Engineer')

        if not missing_keywords:
            return jsonify({"error": "No missing keywords provided."}), 400

        result = generate_missing_requirements(missing_keywords, target_role)
        return jsonify({"status": "success", "content": result})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
