import os
import re

import ollama


MODEL_NAME = os.environ.get("OLLAMA_MODEL", "llama3:latest")


def _normalize_text(value):
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        return ", ".join(str(item).strip() for item in value if str(item).strip())
    if isinstance(value, dict):
        return ", ".join(f"{key}: {val}" for key, val in value.items() if str(val).strip())
    return str(value).strip()


def _clean_response_text(text):
    cleaned = _normalize_text(text)
    cleaned = re.sub(r"^```(?:text)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)
    cleaned = cleaned.replace("\r\n", "\n").strip()
    lines = cleaned.split("\n")
    while lines and not lines[0].strip():
        lines.pop(0)
    if lines:
        first_line = lines[0].strip()
        if re.match(r"^(here(?:'s| is)|sure|certainly|of course|absolutely|below is|here is a|here is an)\b", first_line, flags=re.IGNORECASE):
            lines.pop(0)
            while lines and not lines[0].strip():
                lines.pop(0)
    cleaned = "\n".join(lines).strip()
    return cleaned


def _extract_message_content(response):
    if response is None:
        return ""
    if isinstance(response, dict):
        message = response.get("message") or {}
        if isinstance(message, dict):
            content = message.get("content", "")
        else:
            content = getattr(message, "content", "")
        if not content:
            content = response.get("response", "")
        return _clean_response_text(content)

    message = getattr(response, "message", None)
    if message is not None:
        return _clean_response_text(getattr(message, "content", ""))

    return _clean_response_text(getattr(response, "response", ""))


def ask_ai(prompt, system=None):
    messages = []
    if system:
        messages.append({"role": "system", "content": _clean_response_text(system)})
    messages.append({"role": "user", "content": _clean_response_text(prompt)})

    try:
        response = ollama.chat(model=MODEL_NAME, messages=messages)
    except Exception as exc:
        message = str(exc).lower()
        if any(token in message for token in ("connection", "refused", "unreachable", "ollama", "failed to connect")):
            raise RuntimeError("Ollama is not running or the llama3:latest model is unavailable.") from exc
        raise RuntimeError(f"Ollama request failed: {exc}") from exc

    content = _extract_message_content(response)
    if not content:
        raise RuntimeError("Ollama returned an empty response.")
    return content


def generate_resume_summary(name, role, skills, projects):
    prompt = (
        "Write a concise, ATS-friendly professional summary in plain text only. "
        "Use 2 to 4 sentences, keep it specific, and avoid markdown.\n\n"
        f"Name: {_normalize_text(name)}\n"
        f"Role: {_normalize_text(role)}\n"
        f"Skills: {_normalize_text(skills)}\n"
        f"Projects: {_normalize_text(projects)}"
    )
    system = "You are an expert resume writer. Return only polished summary text with no labels or bullet markers."
    return ask_ai(prompt, system=system)


def improve_experience(text):
    prompt = (
        "Rewrite the following resume experience content into stronger achievement-driven bullet points. "
        "Preserve important facts, add crisp action verbs, and return plain text only with one bullet per line.\n\n"
        f"Experience content:\n{_normalize_text(text)}"
    )
    system = "You are a senior resume editor. Return only the improved bullet text with no explanation."
    return ask_ai(prompt, system=system)


def generate_cover_letter(name, role, company, job_description):
    prompt = (
        "Draft a professional cover letter in plain text only. "
        "Use 3 to 4 short paragraphs, sound human, and keep it tailored to the job description.\n\n"
        f"Candidate Name: {_normalize_text(name)}\n"
        f"Target Role: {_normalize_text(role)}\n"
        f"Company: {_normalize_text(company)}\n"
        f"Job Description: {_normalize_text(job_description)}"
    )
    system = "You write polished cover letters for recruiters. Return only the final letter text."
    return ask_ai(prompt, system=system)


def generate_portfolio_about(name, role, skills):
    prompt = (
        "Write a short portfolio 'About Me' section in plain text only. "
        "Keep it first-person, confident, and concise.\n\n"
        f"Name: {_normalize_text(name)}\n"
        f"Role: {_normalize_text(role)}\n"
        f"Skills: {_normalize_text(skills)}"
    )
    system = "You are writing a polished portfolio bio. Return only the bio text without markdown."
    return ask_ai(prompt, system=system)


def copilot_reply(message):
    prompt = _normalize_text(message)
    system = (
        "You are ResumeAI Copilot, a concise offline career assistant. "
        "Answer directly, keep responses practical, and return plain text only."
    )
    return ask_ai(prompt, system=system)


def improve_summary(current_summary, job_title="Software Engineer"):
    prompt = (
        "Improve this professional summary for an ATS-focused resume. "
        "Return only the revised summary text.\n\n"
        f"Target Role: {_normalize_text(job_title)}\n"
        f"Current Summary: {_normalize_text(current_summary)}"
    )
    system = "You are an expert resume writer. Keep the response concise and polished."
    return ask_ai(prompt, system=system)


def rewrite_bullet_points(bullets_text, position="Engineer"):
    prompt = (
        "Rewrite these experience bullets into stronger achievement-focused bullets. "
        "Keep one bullet per line and return plain text only.\n\n"
        f"Role: {_normalize_text(position)}\n"
        f"Bullets:\n{_normalize_text(bullets_text)}"
    )
    system = "You improve resume bullets without adding commentary."
    return ask_ai(prompt, system=system)


def generate_achievements(position, skills=""):
    prompt = (
        "Generate three high-impact resume achievement bullets. Return plain text only, one bullet per line.\n\n"
        f"Position: {_normalize_text(position)}\n"
        f"Skills: {_normalize_text(skills)}"
    )
    system = "You are an ATS resume writer. Return only bullet text."
    return ask_ai(prompt, system=system)


def copilot_chat(user_prompt, resume_context=""):
    context = _normalize_text(resume_context)
    prompt = f"{context}\n\nUser request: {_normalize_text(user_prompt)}" if context else _normalize_text(user_prompt)
    return copilot_reply(prompt)


def generate_missing_requirements(missing_keywords, target_role="Software Engineer"):
    """Generate ATS-friendly resume bullets/skills that incorporate missing keywords."""
    keywords_text = _normalize_text(missing_keywords)
    role = _normalize_text(target_role) or "Software Engineer"
    prompt = (
        "You are an expert ATS resume consultant. A candidate's resume is missing the following keywords "
        "required for their target role. Generate concrete, ATS-friendly resume additions they can use.\n\n"
        f"Target Role: {role}\n"
        f"Missing Keywords: {keywords_text}\n\n"
        "Provide:\n"
        "1. A short Skills addition (comma-separated keywords to add to the skills section)\n"
        "2. Two to three strong experience bullets that naturally incorporate these missing keywords\n"
        "3. One concise professional summary sentence highlighting these skills\n\n"
        "Return plain text only. Use clear section labels: SKILLS:, BULLETS:, SUMMARY:"
    )
    system = (
        "You are a senior ATS resume writer. Return only the formatted resume content "
        "with no disclaimers, no preamble, and no markdown."
    )
    return ask_ai(prompt, system=system)
