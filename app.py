import os
import re
import sqlite3
from flask import send_file
from reportlab.pdfgen import canvas
import io

from io import BytesIO
from xml.sax.saxutils import escape

from flask import (
    Flask,
    render_template,
    request,
    send_file,
    redirect,
    url_for,
    session,
    flash
)

from werkzeug.utils import secure_filename

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from pypdf import PdfReader
from docx import Document

# ==========================================
# FLASK APP
# ==========================================

app = Flask(__name__)
app.secret_key = "resumeai-pro-secret-key-2026"

BASE_DIR = os.path.abspath(
    os.path.dirname(__file__)
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["MAX_CONTENT_LENGTH"] = (
    5 * 1024 * 1024
)

ALLOWED_EXTENSIONS = {
    "pdf",
    "docx"
}


# ==========================================
# FILE VALIDATION
# ==========================================

def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(
            ".",
            1
        )[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ==========================================
# PDF TEXT EXTRACTION
# ==========================================

def extract_pdf_text(path):

    reader = PdfReader(path)

    text = ""

    for page in reader.pages:

        text += (
            page.extract_text() or ""
        ) + "\n"

    return text


# ==========================================
# DOCX TEXT EXTRACTION
# ==========================================

def extract_docx_text(path):

    document = Document(path)

    return "\n".join(
        paragraph.text
        for paragraph
        in document.paragraphs
    )


# ==========================================
# ATS ANALYSIS
# ==========================================

def analyze_resume(text):

    clean_text = text.lower()

    score = 0

    problems = []

    suggestions = []

    sections = {

        "Education": [
            "education",
            "academic"
        ],

        "Skills": [
            "skills",
            "technical skills"
        ],

        "Projects": [
            "projects",
            "project"
        ],

        "Experience": [
            "experience",
            "work experience",
            "internship"
        ]

    }


    # SECTION CHECK

    for section, keywords in sections.items():

        found = any(
            keyword in clean_text
            for keyword in keywords
        )

        if found:

            score += 10

        else:

            problems.append(
                f"{section} section not found."
            )

            suggestions.append(
                f"Add a clear {section} section."
            )


    # EMAIL CHECK

    email_pattern = (
        r"[\w\.-]+@[\w\.-]+\.\w+"
    )

    if re.search(
        email_pattern,
        text
    ):

        score += 10

    else:

        problems.append(
            "Email address not detected."
        )

        suggestions.append(
            "Add a professional email address."
        )


    # PHONE CHECK

    phone_pattern = (
        r"(?:\+91[\s-]?)?"
        r"[6-9](?:[\s-]?\d){9}"
    )

    if re.search(
        phone_pattern,
        text
    ):

        score += 10

    else:

        problems.append(
            "Phone number not detected."
        )

        suggestions.append(
            "Add a valid phone number."
        )


    # LINKEDIN CHECK

    if "linkedin" in clean_text:

        score += 5

    else:

        problems.append(
            "LinkedIn profile not detected."
        )

        suggestions.append(
            "Add your LinkedIn profile."
        )


    # GITHUB CHECK

    if "github" in clean_text:

        score += 5

    else:

        problems.append(
            "GitHub profile not detected."
        )

        suggestions.append(
            "Add GitHub for technical roles."
        )


    # ACTION VERBS

    action_verbs = [

        "developed",
        "built",
        "implemented",
        "designed",
        "improved",
        "optimized",
        "analyzed",
        "automated",
        "engineered",
        "managed",
        "led",
        "deployed"

    ]

    action_count = sum(

        1

        for verb in action_verbs

        if verb in clean_text

    )

    if action_count >= 3:

        score += 10

    else:

        problems.append(
            "Few strong action verbs detected."
        )

        suggestions.append(
            "Use Developed, Built, Implemented, "
            "Improved and Automated."
        )


    # MEASURABLE IMPACT

    impact_pattern = (

        r"\d+%|"

        r"\d+\+|"

        r"\d+\s*"

        r"(users|records|images|hours|"

        r"students|models|requests)"

    )

    if re.search(
        impact_pattern,
        clean_text
    ):

        score += 10

    else:

        problems.append(
            "No measurable achievements detected."
        )

        suggestions.append(
            "Add truthful numbers, percentages "
            "or measurable project impact."
        )


    # WORD COUNT

    word_count = len(
        text.split()
    )

    if 200 <= word_count <= 900:

        score += 10

    elif word_count < 200:

        problems.append(
            "Resume content appears too short."
        )

        suggestions.append(
            "Add relevant projects, education "
            "and technical details."
        )

    else:

        problems.append(
            "Resume may be too long."
        )

        suggestions.append(
            "Remove unnecessary or repeated content."
        )


    score = min(
        score,
        100
    )

    return (
        score,
        problems,
        suggestions,
        word_count
    )


# ==========================================
# JOB MATCH ANALYSIS
# ==========================================

def analyze_job_match(
    resume_text,
    job_description
):

    resume_text = resume_text.lower()

    job_description = (
        job_description.lower()
    )

    technical_skills = [

        "python",
        "java",
        "c++",
        "sql",

        "flask",
        "django",
        "fastapi",

        "machine learning",
        "deep learning",
        "artificial intelligence",

        "tensorflow",
        "pytorch",
        "keras",

        "pandas",
        "numpy",
        "scikit-learn",

        "html",
        "css",
        "javascript",
        "react",

        "git",
        "github",

        "docker",
        "kubernetes",

        "aws",
        "azure",

        "power bi",
        "tableau",

        "nlp",
        "computer vision"

    ]

    required_skills = []

    matched_skills = []

    missing_skills = []


    for skill in technical_skills:

        if skill in job_description:

            required_skills.append(
                skill
            )

            if skill in resume_text:

                matched_skills.append(
                    skill
                )

            else:

                missing_skills.append(
                    skill
                )


    if required_skills:

        job_match_score = round(

            (
                len(matched_skills)
                / len(required_skills)
            )

            * 100

        )

    else:

        job_match_score = 0


    return (
        job_match_score,
        matched_skills,
        missing_skills
    )


# ==========================================
# RESUME CORRECTION ENGINE
# ==========================================

def improve_resume_lines(text):

    corrections = []

    weak_phrases = {

        "worked on":
            "Developed and contributed to",

        "made":
            "Developed",

        "helped":
            "Contributed to",

        "did":
            "Executed",

        "created":
            "Designed and developed",

        "responsible for":
            "Managed and executed",

        "worked with":
            "Collaborated using",

        "used":
            "Implemented using"

    }

    lines = text.split("\n")


    for line in lines:

        clean_line = line.strip()

        if len(clean_line) < 15:

            continue


        lower_line = clean_line.lower()


        for weak, strong in weak_phrases.items():

            if weak in lower_line:

                improved = re.sub(

                    re.escape(weak),

                    strong,

                    clean_line,

                    flags=re.IGNORECASE

                )


                if improved != clean_line:

                    corrections.append({

                        "original":
                            clean_line,

                        "improved":
                            improved

                    })


                break


    return corrections[:10]


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ==========================================
# CREATE RESUME
# ==========================================

@app.route("/create")
def create_resume():

    return render_template(
        "builder/create_resume.html"
    )


# ==========================================
# PREVIEW
# ==========================================

@app.route("/preview")
def preview():

    return render_template(
        "builder/preview.html"
    )


# ==========================================
# DASHBOARD
# ==========================================

@app.route("/dashboard")
def dashboard():

    return render_template(
        "dashboard/dashboard.html"
    )


# ==========================================
# UPLOAD + ATS ANALYSIS
# ==========================================

@app.route(
    "/upload",
    methods=[
        "GET",
        "POST"
    ]
)
def upload_resume():

    if request.method == "POST":

        file = request.files.get(
            "resume"
        )

        job_description = (
            request.form.get(
                "job_description",
                ""
            ).strip()
        )


        if file is None:

            return render_template(

                "upload_resume.html",

                error=(
                    "Resume file was not received."
                )

            )


        if file.filename == "":

            return render_template(

                "upload_resume.html",

                error=(
                    "Please select your resume."
                )

            )


        if not allowed_file(
            file.filename
        ):

            return render_template(

                "upload_resume.html",

                error=(
                    "Only PDF and DOCX files "
                    "are supported."
                )

            )


        if not job_description:

            return render_template(

                "upload_resume.html",

                error=(
                    "Please paste the job description."
                )

            )


        filename = secure_filename(
            file.filename
        )


        file_path = os.path.join(

            app.config["UPLOAD_FOLDER"],

            filename

        )


        try:

            file.save(
                file_path
            )


            extension = filename.rsplit(

                ".",

                1

            )[1].lower()


            if extension == "pdf":

                text = extract_pdf_text(
                    file_path
                )

            else:

                text = extract_docx_text(
                    file_path
                )


            if not text.strip():

                return render_template(

                    "upload_resume.html",

                    error=(
                        "No readable text found. "
                        "Scanned image PDFs are "
                        "not supported yet."
                    )

                )


            (
                score,
                problems,
                suggestions,
                word_count

            ) = analyze_resume(
                text
            )


            (
                job_match_score,
                matched_skills,
                missing_skills

            ) = analyze_job_match(

                text,

                job_description

            )


            corrections = (
                improve_resume_lines(
                    text
                )
            )


            return render_template(

                "ats_result.html",

                score=score,

                job_match_score=(
                    job_match_score
                ),

                matched_skills=(
                    matched_skills
                ),

                missing_skills=(
                    missing_skills
                ),

                problems=problems,

                suggestions=suggestions,

                corrections=corrections,

                word_count=word_count,

                filename=filename

            )


        except Exception as error:

            print(
                "UPLOAD ERROR:",
                error
            )

            return render_template(

                "upload_resume.html",

                error=(
                    "Unable to analyze resume: "
                    f"{error}"
                )

            )


    return render_template(
        "upload_resume.html"
    )


# ==========================================
# DOWNLOAD RESUME PDF
# ==========================================

@app.route(
    "/download-resume",
    methods=["POST"]
)
def download_resume():

    full_name = request.form.get(
        "fullName",
        ""
    ).strip() or "Your Name"

    job_title = request.form.get(
        "jobTitle",
        ""
    ).strip()

    email = request.form.get(
        "email",
        ""
    ).strip()

    phone = request.form.get(
        "phone",
        ""
    ).strip()

    linkedin = request.form.get(
        "linkedin",
        ""
    ).strip()

    github = request.form.get(
        "github",
        ""
    ).strip()

    summary = request.form.get(
        "summary",
        ""
    ).strip()

    college = request.form.get(
        "college",
        ""
    ).strip()

    degree = request.form.get(
        "degree",
        ""
    ).strip()

    branch = request.form.get(
        "branch",
        ""
    ).strip()

    cgpa = request.form.get(
        "cgpa",
        ""
    ).strip()

    grad_year = request.form.get(
        "gradYear",
        ""
    ).strip()

    skills = request.form.get(
        "skills",
        ""
    ).strip()

    project_name = request.form.get(
        "projectName",
        ""
    ).strip()

    project_tech = request.form.get(
        "projectTech",
        ""
    ).strip()

    project_description = request.form.get(
        "projectDescription",
        ""
    ).strip()


    # ESCAPE USER TEXT FOR REPORTLAB

    full_name_pdf = escape(full_name)

    job_title_pdf = escape(job_title)

    email_pdf = escape(email)

    phone_pdf = escape(phone)

    linkedin_pdf = escape(linkedin)

    github_pdf = escape(github)

    summary_pdf = escape(summary)

    college_pdf = escape(college)

    degree_pdf = escape(degree)

    branch_pdf = escape(branch)

    cgpa_pdf = escape(cgpa)

    grad_year_pdf = escape(grad_year)

    skills_pdf = escape(skills)

    project_name_pdf = escape(
        project_name
    )

    project_tech_pdf = escape(
        project_tech
    )

    project_description_pdf = escape(
        project_description
    )


    buffer = BytesIO()


    document = SimpleDocTemplate(

        buffer,

        pagesize=A4,

        rightMargin=45,

        leftMargin=45,

        topMargin=40,

        bottomMargin=40

    )


    styles = getSampleStyleSheet()


    name_style = ParagraphStyle(

        "NameStyle",

        parent=styles["Heading1"],

        alignment=TA_CENTER,

        fontSize=22,

        leading=26,

        spaceAfter=5

    )


    title_style = ParagraphStyle(

        "TitleStyle",

        parent=styles["Normal"],

        alignment=TA_CENTER,

        fontSize=11,

        leading=15,

        spaceAfter=7

    )


    contact_style = ParagraphStyle(

        "ContactStyle",

        parent=styles["Normal"],

        alignment=TA_CENTER,

        fontSize=9,

        leading=14

    )


    section_style = ParagraphStyle(

        "SectionStyle",

        parent=styles["Heading2"],

        fontSize=12,

        leading=15,

        spaceBefore=12,

        spaceAfter=5

    )


    normal_style = ParagraphStyle(

        "ResumeNormal",

        parent=styles["Normal"],

        fontSize=10,

        leading=15

    )


    story = []


    # NAME

    story.append(

        Paragraph(

            full_name_pdf.upper(),

            name_style

        )

    )


    # JOB TITLE

    if job_title_pdf:

        story.append(

            Paragraph(

                job_title_pdf,

                title_style

            )

        )


    # CONTACT DETAILS

    contact_details = " | ".join(

        item

        for item in [

            email_pdf,

            phone_pdf,

            linkedin_pdf,

            github_pdf

        ]

        if item

    )


    if contact_details:

        story.append(

            Paragraph(

                contact_details,

                contact_style

            )

        )


    story.append(
        Spacer(
            1,
            10
        )
    )


    story.append(

        HRFlowable(

            width="100%",

            thickness=1

        )

    )


    # PROFESSIONAL SUMMARY

    if summary_pdf:

        story.append(

            Paragraph(

                "PROFESSIONAL SUMMARY",

                section_style

            )

        )


        story.append(

            Paragraph(

                summary_pdf,

                normal_style

            )

        )


    # EDUCATION

    if (
        college_pdf
        or degree_pdf
        or branch_pdf
        or cgpa_pdf
        or grad_year_pdf
    ):

        story.append(

            Paragraph(

                "EDUCATION",

                section_style

            )

        )


        if college_pdf:

            story.append(

                Paragraph(

                    f"<b>{college_pdf}</b>",

                    normal_style

                )

            )


        education_details = " | ".join(

            item

            for item in [

                degree_pdf,

                branch_pdf,

                (
                    f"CGPA: {cgpa_pdf}"
                    if cgpa_pdf
                    else ""
                ),

                grad_year_pdf

            ]

            if item

        )


        if education_details:

            story.append(

                Paragraph(

                    education_details,

                    normal_style

                )

            )


    # SKILLS

    if skills_pdf:

        story.append(

            Paragraph(

                "SKILLS",

                section_style

            )

        )


        story.append(

            Paragraph(

                skills_pdf,

                normal_style

            )

        )


    # PROJECTS

    if (
        project_name_pdf
        or project_tech_pdf
        or project_description_pdf
    ):

        story.append(

            Paragraph(

                "PROJECTS",

                section_style

            )

        )


        if project_name_pdf:

            story.append(

                Paragraph(

                    f"<b>{project_name_pdf}</b>",

                    normal_style

                )

            )


        if project_tech_pdf:

            story.append(

                Paragraph(

                    (
                        "<b>Technologies:</b> "
                        f"{project_tech_pdf}"
                    ),

                    normal_style

                )

            )


        if project_description_pdf:

            story.append(

                Paragraph(

                    project_description_pdf,

                    normal_style

                )

            )


    # BUILD PDF

    document.build(
        story
    )


    buffer.seek(0)


    safe_name = re.sub(

        r"[^a-zA-Z0-9_-]",

        "_",

        full_name

    ).strip("_")


    if not safe_name:

        safe_name = "Resume"


    return send_file(

        buffer,

        as_attachment=True,

        download_name=(
            f"{safe_name}_Resume.pdf"
        ),

        mimetype="application/pdf"

    )


# ==========================================
# ATS PAGE
# ==========================================

@app.route("/ats")
def ats():

    return render_template(
        "ats_checker.html"
    )


# ==========================================
# LOGIN
# ==========================================


# ==========================================
# LOGIN
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if "user_id" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        connection = get_db_connection()

        user = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        connection.close()

        if user and check_password_hash(
            user["password"],
            password
        ):
            session.clear()

            session["user_id"] = user["id"]
            session["user_name"] = user["full_name"]
            session["user_email"] = user["email"]

            return redirect(url_for("dashboard"))

        flash("Invalid email or password.", "error")

    return render_template("auth/login.html")


# ==========================================
# REGISTER
# ==========================================

@app.route("/register")
def register():

    return render_template(
        "auth/register.html"
    )


# ==========================================
# ABOUT
# ==========================================

@app.route("/about")
def about():

    return render_template(
        "about.html"
    )


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=True
    )