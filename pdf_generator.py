import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_resume_pdf(resume_data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    template_name = resume_data.get('template_name', 'ats_minimal')
    personal = resume_data.get('personal_info', {})
    if isinstance(personal, str):
        try: personal = json.loads(personal)
        except: personal = {}
        
    summary = resume_data.get('summary', '')
    
    experience = resume_data.get('experience', [])
    if isinstance(experience, str):
        try: experience = json.loads(experience)
        except: experience = []
        
    education = resume_data.get('education', [])
    if isinstance(education, str):
        try: education = json.loads(education)
        except: education = []
        
    projects = resume_data.get('projects', [])
    if isinstance(projects, str):
        try: projects = json.loads(projects)
        except: projects = []
        
    skills = resume_data.get('skills', [])
    if isinstance(skills, str):
        try: skills = json.loads(skills)
        except: skills = []
        
    certifications = resume_data.get('certifications', [])
    if isinstance(certifications, str):
        try: certifications = json.loads(certifications)
        except: certifications = []
        
    languages = resume_data.get('languages', [])
    if isinstance(languages, str):
        try: languages = json.loads(languages)
        except: languages = []

    # Color Palette definitions per template
    if template_name == 'modern':
        primary_color = colors.HexColor('#2563EB') # Hyper Blue
        secondary_color = colors.HexColor('#7C3AED') # Electric Purple
        text_color = colors.HexColor('#1E293B')
        bg_bar = colors.HexColor('#F1F5F9')
    elif template_name == 'executive':
        primary_color = colors.HexColor('#0F172A') # Dark Slate
        secondary_color = colors.HexColor('#D97706') # Amber Gold accent
        text_color = colors.HexColor('#0F172A')
        bg_bar = colors.HexColor('#F8FAFC')
    elif template_name == 'developer_dark':
        primary_color = colors.HexColor('#06B6D4') # Neon Cyan
        secondary_color = colors.HexColor('#3B82F6')
        text_color = colors.HexColor('#0F172A')
        bg_bar = colors.HexColor('#E2E8F0')
    else: # ats_minimal
        primary_color = colors.HexColor('#1E293B')
        secondary_color = colors.HexColor('#475569')
        text_color = colors.HexColor('#0F172A')
        bg_bar = colors.HexColor('#FFFFFF')

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        alignment=TA_LEFT if template_name != 'executive' else TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=16,
        textColor=secondary_color,
        alignment=TA_LEFT if template_name != 'executive' else TA_CENTER
    )
    
    contact_style = ParagraphStyle(
        'ContactLine',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=TA_LEFT if template_name != 'executive' else TA_CENTER
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=text_color
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=text_color
    )
    
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_color,
        leftIndent=12
    )

    story = []
    
    # Header Section
    full_name = personal.get('fullName', 'Candidate Name')
    job_title = personal.get('jobTitle', '')
    phone = personal.get('phone', '')
    email = personal.get('email', '')
    location = personal.get('location', '')
    website = personal.get('website', '')
    
    story.append(Paragraph(full_name, title_style))
    if job_title:
        story.append(Paragraph(job_title, subtitle_style))
        
    contact_bits = [b for b in [email, phone, location, website] if b]
    if contact_bits:
        story.append(Spacer(1, 3))
        story.append(Paragraph(" • ".join(contact_bits), contact_style))
        
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
    
    # Summary Section
    if summary:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_heading))
        story.append(Paragraph(summary, body_style))
        story.append(Spacer(1, 6))

    # Experience Section
    if experience:
        story.append(Paragraph("WORK EXPERIENCE", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        for exp in experience:
            comp = exp.get('company', '')
            pos = exp.get('position', '')
            loc = exp.get('location', '')
            dates = f"{exp.get('startDate', '')} - {exp.get('endDate', 'Present')}"
            
            header_text = f"<b>{pos}</b> | {comp}"
            meta_text = f"<font color='#64748B'>{dates} | {loc}</font>"
            
            p_head = Paragraph(header_text, body_style)
            p_meta = Paragraph(meta_text, ParagraphStyle('Meta', parent=body_style, alignment=TA_RIGHT))
            
            t = Table([[p_head, p_meta]], colWidths=[380, 160])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ]))
            story.append(t)
            
            bullets_raw = exp.get('bullets', '')
            if bullets_raw:
                lines = [l.strip('-• ').strip() for l in bullets_raw.split('\n') if l.strip()]
                for l in lines:
                    story.append(Paragraph(f"• {l}", bullet_style))
            story.append(Spacer(1, 4))
            
    # Education Section
    if education:
        story.append(Paragraph("EDUCATION", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        for edu in education:
            inst = edu.get('institution', '')
            deg = edu.get('degree', '')
            dates = f"{edu.get('startDate', '')} - {edu.get('endDate', '')}"
            gpa = edu.get('gpa', '')
            
            h_text = f"<b>{deg}</b> - {inst}"
            m_text = f"<font color='#64748B'>{dates}{' | GPA: ' + gpa if gpa else ''}</font>"
            
            p1 = Paragraph(h_text, body_style)
            p2 = Paragraph(m_text, ParagraphStyle('MetaEdu', parent=body_style, alignment=TA_RIGHT))
            
            t = Table([[p1, p2]], colWidths=[380, 160])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
            story.append(Spacer(1, 4))

    # Projects Section
    if projects:
        story.append(Paragraph("KEY PROJECTS", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        for proj in projects:
            pname = proj.get('name', '')
            tech = proj.get('techStack', '')
            desc = proj.get('description', '')
            link = proj.get('link', '')
            
            story.append(Paragraph(f"<b>{pname}</b> {f'({tech})' if tech else ''}", body_style))
            if desc:
                story.append(Paragraph(desc, bullet_style))
            story.append(Spacer(1, 3))

    # Skills Section
    if skills:
        story.append(Paragraph("TECHNICAL SKILLS", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        if isinstance(skills, list):
            skills_str = ", ".join(skills)
        else:
            skills_str = str(skills)
        story.append(Paragraph(skills_str, body_style))
        story.append(Spacer(1, 6))

    # Certifications & Languages
    if certifications or languages:
        story.append(Paragraph("CERTIFICATIONS & LANGUAGES", section_heading))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        bits = []
        if certifications:
            for c in certifications:
                if isinstance(c, dict):
                    bits.append(f"<b>{c.get('name', '')}</b> ({c.get('issuer', '')})")
                else:
                    bits.append(str(c))
        if languages:
            for l in languages:
                if isinstance(l, dict):
                    bits.append(f"{l.get('language', '')}: {l.get('proficiency', '')}")
                else:
                    bits.append(str(l))
        story.append(Paragraph(" • ".join(bits), body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
