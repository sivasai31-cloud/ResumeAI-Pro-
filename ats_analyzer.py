import io
import re

from docx import Document
from pypdf import PdfReader

from ai_helper import ask_ai

try:
    import textstat
except Exception:  # pragma: no cover - optional dependency fallback
    textstat = None


COMMON_TECH_KEYWORDS = [
    "python", "javascript", "typescript", "react", "node.js", "flask", "django",
    "docker", "kubernetes", "aws", "azure", "gcp", "sql", "postgresql", "mongodb",
    "redis", "rest api", "graphql", "ci/cd", "git", "linux", "agile", "scrum",
    "html5", "css3", "tailwind", "unit testing", "pytorch", "tensorflow", "llm",
    "openai", "gemini", "microservices", "system design", "devops", "cloud", "security",
    "machine learning", "deep learning", "data analysis", "data visualization", "full stack",
    "cross functional", "project management", "test automation", "performance tuning"
]

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is",
    "it", "its", "of", "on", "or", "our", "that", "the", "their", "to", "was", "were",
    "with", "without", "within", "this", "these", "those", "will", "can", "should", "you",
    "your", "we", "they", "who", "what", "where", "when", "why", "how", "using", "use",
    "used", "able", "across", "about", "also", "more", "most", "must", "per", "role", "team",
    "teams", "work", "working", "experience", "years", "year", "candidate", "responsibilities"
}

SECTION_KEYWORDS = {
    "education": ["education", "academic background", "university", "coursework"],
    "experience": ["experience", "work experience", "professional experience", "employment history"],
    "skills": ["skills", "technical skills", "core competencies", "technologies"],
    "projects": ["projects", "selected projects", "personal projects", "portfolio"],
}

ACTION_VERBS = [
    "spearheaded", "architected", "engineered", "optimized", "orchestrated",
    "developed", "designed", "implemented", "managed", "delivered", "increased",
    "decreased", "reduced", "boosted", "launched", "directed", "built", "accelerated",
    "analyzed", "created", "coordinated", "automated", "improved", "introduced", "streamlined"
]

def extract_text_from_pdf(pdf_file_bytes):
    try:
        reader = PdfReader(io.BytesIO(pdf_file_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t: text += t + "\n"
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def extract_text_from_docx(docx_file_bytes):
    try:
        doc = Document(io.BytesIO(docx_file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""

def _dedupe_preserve_order(items):
    seen = set()
    deduped = []
    for item in items:
        key = item.lower().strip()
        if key and key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped


def _normalize_keyword(keyword):
    keyword = keyword.replace(".js", "js").replace("/", " ")
    keyword = re.sub(r"\s+", " ", keyword)
    return keyword.strip()


def _keyword_display(keyword):
    normalized = keyword.replace("ci cd", "CI/CD")
    normalized = normalized.replace("rest api", "REST API")
    normalized = normalized.replace("llm", "LLM")
    normalized = normalized.replace("gcp", "GCP")
    normalized = normalized.replace("aws", "AWS")
    normalized = normalized.replace("sql", "SQL")
    return normalized.title() if normalized == keyword else normalized


def _extract_job_keywords(job_description):
    text = (job_description or "").lower()
    keywords = []

    for phrase in COMMON_TECH_KEYWORDS:
        if phrase in text:
            keywords.append(_normalize_keyword(phrase))

    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#./-]{1,}", text)
    for token in tokens:
        cleaned = _normalize_keyword(token)
        if len(cleaned) < 3 or cleaned in STOPWORDS:
            continue
        if cleaned not in keywords:
            keywords.append(cleaned)

    if not keywords:
        keywords = [_normalize_keyword(item) for item in COMMON_TECH_KEYWORDS[:15]]

    return _dedupe_preserve_order(keywords)


def _has_section(resume_text, section_name):
    section_terms = SECTION_KEYWORDS.get(section_name, [])
    lowered = resume_text.lower()
    return any(term in lowered for term in section_terms)


def _score_readability_and_length(resume_text):
    word_count = len(re.findall(r"\b\w+\b", resume_text))
    if textstat is not None:
        try:
            readability_raw = textstat.flesch_reading_ease(resume_text)
        except Exception:
            readability_raw = 60
    else:
        readability_raw = 60

    readability_score = 10 if readability_raw >= 70 else 8 if readability_raw >= 55 else 6 if readability_raw >= 40 else 4

    if 350 <= word_count <= 900:
        length_score = 10
    elif 250 <= word_count <= 1200:
        length_score = 8
    elif 150 <= word_count <= 1500:
        length_score = 6
    else:
        length_score = 4

    return readability_score, length_score, word_count, readability_raw


def analyze_resume_ats(resume_text, job_description=""):
    resume_lower = (resume_text or "").lower()
    job_keywords = _extract_job_keywords(job_description)

    matched_keywords = []
    missing_keywords = []
    for keyword in job_keywords:
        pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
        if re.search(pattern, resume_lower):
            matched_keywords.append(_keyword_display(keyword))
        else:
            missing_keywords.append(_keyword_display(keyword))

    matched_keywords = _dedupe_preserve_order(matched_keywords)
    missing_keywords = _dedupe_preserve_order(missing_keywords)

    total_keywords = max(len(job_keywords), 1)
    keyword_match_ratio = len(matched_keywords) / total_keywords
    keyword_score = min(int(round(keyword_match_ratio * 45)), 45)

    sections_found = {
        section: _has_section(resume_text, section)
        for section in ("education", "experience", "skills", "projects")
    }
    section_score = sum(5 for found in sections_found.values() if found)

    verb_hits = []
    for verb in ACTION_VERBS:
        pattern = r"(?:^|\n|[•\-*]\s*)" + re.escape(verb) + r"\b"
        if re.search(pattern, resume_lower):
            verb_hits.append(verb)
    verb_score = min(len(verb_hits) * 4, 20)

    readability_score, length_score, word_count, readability_raw = _score_readability_and_length(resume_text)

    metric_matches = re.findall(r"\b\d+(?:\.\d+)?%\b|\$\d+(?:,\d{3})*(?:\.\d+)?|\b\d+\+?\s*(?:years?|months?)\b", resume_lower)
    metrics_score = 10 if len(metric_matches) >= 3 else 7 if len(metric_matches) >= 2 else 4 if len(metric_matches) == 1 else 2

    raw_score = keyword_score + section_score + verb_score + readability_score + length_score + metrics_score
    final_score = max(0, min(int(round(raw_score)), 100))

    feedback = []
    if missing_keywords:
        feedback.append(f"Add missing keywords where they are truthful and relevant: {', '.join(missing_keywords[:5])}.")
    if len(verb_hits) < 3:
        feedback.append("Start more bullets with strong action verbs such as Spearheaded, Optimized, and Implemented.")
    if not sections_found["projects"]:
        feedback.append("Add a Projects section if you have portfolio work that matches the role.")
    if not sections_found["skills"]:
        feedback.append("Make sure your Skills section is present and easy for ATS scanners to parse.")
    if metrics_score < 7:
        feedback.append("Add more quantified outcomes, percentages, and scale indicators to your bullet points.")
    if length_score < 8:
        feedback.append("Keep the resume to a readable one- or two-page length with balanced density.")
    if readability_score < 8:
        feedback.append("Simplify dense sentences so the document is easier for recruiters to scan quickly.")

    if not feedback:
        feedback.append("The resume shows strong ATS alignment, section clarity, and scannable structure.")

    ai_feedback = []
    recruiter_notes = ""
    try:
        ai_prompt = (
            "Write recruiter-style improvement suggestions for this ATS analysis. "
            "Return 3 to 5 short bullets only, no preamble.\n\n"
            f"Score: {final_score}\n"
            f"Matched Keywords: {', '.join(matched_keywords) if matched_keywords else 'None'}\n"
            f"Missing Keywords: {', '.join(missing_keywords) if missing_keywords else 'None'}\n"
            f"Sections Found: {', '.join(section for section, found in sections_found.items() if found) or 'None'}\n"
            f"Action Verbs: {', '.join(verb_hits) if verb_hits else 'None'}\n"
            f"Word Count: {word_count}\n"
            f"Readability: {readability_raw}"
        )
        ai_response = ask_ai(
            ai_prompt,
            system="You are a senior recruiter. Return concise, practical ATS improvement bullets only."
        )
        ai_feedback = [
            line.strip("-• \t")
            for line in re.split(r"\n+", ai_response)
            if line.strip()
        ]
        recruiter_notes = "\n".join(ai_feedback)
    except Exception:
        recruiter_notes = (
            f"Recruiter view: the resume is scoring at {final_score}% with strong keyword coverage and section structure."
        )

    if ai_feedback:
        feedback.extend(ai_feedback)

    return {
        "score": final_score,
        "matched": matched_keywords,
        "missing": missing_keywords,
        "feedback": feedback,
        "recruiter_notes": recruiter_notes,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "recommendations": feedback,
        "readability_score": max(0, min(int(readability_raw if readability_raw > 0 else 60), 100)),
    }
