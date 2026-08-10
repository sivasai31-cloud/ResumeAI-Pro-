/* ==========================================================================
   RESUME BUILDER & LIVE PREVIEW ENGINE
   ========================================================================== */

let currentResumeState = {};
let autoSaveTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('builder-form-container')) return;
    
    initFormStepNav();
    loadResumeDataFromDOM();
    initDynamicProjects();
    bindLivePreviewInputs();
    initTemplateSelector();
    initSaveButton();
    renderLivePreview();
});

function loadResumeDataFromDOM() {
    const rawDataEl = document.getElementById('initial-resume-json');
    if (rawDataEl) {
        try {
            currentResumeState = JSON.parse(rawDataEl.textContent);
            if (typeof currentResumeState.projects === 'string') {
                try { currentResumeState.projects = JSON.parse(currentResumeState.projects); } catch(e){}
            }
        } catch(e) {
            console.error('Error parsing initial resume JSON:', e);
        }
    }
}

function initFormStepNav() {
    const btns = document.querySelectorAll('.step-btn');
    const sections = document.querySelectorAll('.form-section-block');
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = btn.getAttribute('data-step');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            sections.forEach(sec => {
                if (sec.id === `section-${targetStep}`) {
                    sec.style.display = 'block';
                } else {
                    sec.style.display = 'none';
                }
            });
        });
    });
}

function initDynamicProjects() {
    const addBtn = document.getElementById('addProjectBtn');
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const currentCards = container.querySelectorAll('.project-card');
            if (currentCards.length >= 10) {
                if (typeof showToast === 'function') showToast('Maximum 10 projects allowed.', 'warning');
                return;
            }
            addProjectCard();
        });
    }

    const initialProjects = currentResumeState.projects || [];
    container.innerHTML = '';
    if (Array.isArray(initialProjects) && initialProjects.length > 0) {
        initialProjects.forEach(proj => addProjectCard(proj));
    } else {
        addProjectCard();
    }
}

function addProjectCard(data = {}) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    const currentCards = container.querySelectorAll('.project-card');
    if (currentCards.length >= 10) {
        if (typeof showToast === 'function') showToast('Maximum 10 projects allowed.', 'warning');
        return;
    }

    const card = document.createElement('div');
    card.className = 'glass-card project-card form-group';
    card.innerHTML = `
        <div class="project-header">
            <span class="project-title-text">
                <i class="fas fa-code-branch"></i> <span class="project-num-label">Project</span>
            </span>
            <button type="button" class="remove-project-btn">
                <i class="fas fa-trash-alt"></i> Remove
            </button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <input type="text" name="project_name[]" class="form-control proj-name" placeholder="Project Name" value="${(data.name || '').replace(/"/g, '&quot;')}">
            <input type="text" name="project_tech[]" class="form-control proj-techStack" placeholder="Technologies Used (e.g. Python, React)" value="${(data.techStack || '').replace(/"/g, '&quot;')}">
        </div>
        <textarea name="project_desc[]" class="form-control proj-description" style="margin-top:10px;" placeholder="Short description of the project and your role...">${data.description || ''}</textarea>
    `;

    const removeBtn = card.querySelector('.remove-project-btn');
    removeBtn.addEventListener('click', () => {
        card.classList.add('project-card-leaving');
        setTimeout(() => {
            card.remove();
            updateProjectNumbers();
            syncStateFromInputs();
            renderLivePreview();
            triggerAutoSaveDebounce();
        }, 220);
    });

    container.appendChild(card);
    updateProjectNumbers();
    bindLivePreviewInputs();
    syncStateFromInputs();
    renderLivePreview();
}

function updateProjectNumbers() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    const cards = container.querySelectorAll('.project-card');
    cards.forEach((card, idx) => {
        const label = card.querySelector('.project-num-label');
        if (label) {
            label.textContent = `Project ${idx + 1}`;
        }
    });
}

function bindLivePreviewInputs() {
    const inputs = document.querySelectorAll('#builder-form-container input, #builder-form-container textarea, #builder-form-container select');
    inputs.forEach(input => {
        input.oninput = () => {
            syncStateFromInputs();
            renderLivePreview();
            triggerAutoSaveDebounce();
        };
    });
}

function syncStateFromInputs() {
    currentResumeState.title = document.getElementById('resume-title-input')?.value || 'My Resume';
    currentResumeState.template_name = document.getElementById('template-select')?.value || 'modern';
    
    currentResumeState.personal_info = {
        fullName: document.getElementById('p-fullName')?.value || '',
        jobTitle: document.getElementById('p-jobTitle')?.value || '',
        email: document.getElementById('p-email')?.value || '',
        phone: document.getElementById('p-phone')?.value || '',
        location: document.getElementById('p-location')?.value || '',
        website: document.getElementById('p-website')?.value || '',
        github: document.getElementById('p-github')?.value || '',
        linkedin: document.getElementById('p-linkedin')?.value || ''
    };
    
    currentResumeState.summary = document.getElementById('summary-input')?.value || '';
    
    // Skills
    const skillsRaw = document.getElementById('skills-input')?.value || '';
    currentResumeState.skills = skillsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    // Experience Array
    const expBlocks = document.querySelectorAll('.experience-item-block');
    let exps = [];
    expBlocks.forEach(block => {
        exps.push({
            company: block.querySelector('.exp-company')?.value || '',
            position: block.querySelector('.exp-position')?.value || '',
            location: block.querySelector('.exp-location')?.value || '',
            startDate: block.querySelector('.exp-startDate')?.value || '',
            endDate: block.querySelector('.exp-endDate')?.value || '',
            bullets: block.querySelector('.exp-bullets')?.value || ''
        });
    });
    currentResumeState.experience = exps;

    // Education Array
    const eduBlocks = document.querySelectorAll('.education-item-block');
    let edus = [];
    eduBlocks.forEach(block => {
        edus.push({
            institution: block.querySelector('.edu-institution')?.value || '',
            degree: block.querySelector('.edu-degree')?.value || '',
            startDate: block.querySelector('.edu-startDate')?.value || '',
            endDate: block.querySelector('.edu-endDate')?.value || '',
            gpa: block.querySelector('.edu-gpa')?.value || ''
        });
    });
    currentResumeState.education = edus;

    // Projects Array
    const projBlocks = document.querySelectorAll('#projectsContainer .project-card, .project-item-block');
    let projs = [];
    projBlocks.forEach(block => {
        const nameVal = block.querySelector('.proj-name')?.value || block.querySelector('[name="project_name[]"]')?.value || '';
        const techVal = block.querySelector('.proj-techStack')?.value || block.querySelector('[name="project_tech[]"]')?.value || '';
        const descVal = block.querySelector('.proj-description')?.value || block.querySelector('[name="project_desc[]"]')?.value || '';
        const linkVal = block.querySelector('.proj-link')?.value || '';
        if (nameVal || techVal || descVal) {
            projs.push({
                name: nameVal,
                techStack: techVal,
                link: linkVal,
                description: descVal
            });
        }
    });
    currentResumeState.projects = projs;
}

function renderLivePreview() {
    const previewContainer = document.getElementById('live-resume-paper');
    if (!previewContainer) return;
    
    const tName = currentResumeState.template_name || 'modern';
    previewContainer.className = `resume-paper tmpl-${tName}`;
    
    const p = currentResumeState.personal_info || {};
    const sum = currentResumeState.summary || '';
    const exps = currentResumeState.experience || [];
    const edus = currentResumeState.education || [];
    const projs = currentResumeState.projects || [];
    const skills = currentResumeState.skills || [];

    let html = '';

    // Header
    if (tName === 'modern') {
        html += `
            <div class="modern-header">
                <h1>${p.fullName || 'Candidate Name'}</h1>
                <p style="font-weight:600; font-size:1.1rem; color:#F8FAFC;">${p.jobTitle || ''}</p>
                <p style="font-size:0.8rem; color:#94A3B8; margin-top:4px;">
                    ${[p.email, p.phone, p.location, p.website].filter(Boolean).join(' • ')}
                </p>
            </div>
        `;
    } else if (tName === 'executive') {
        html += `
            <div class="exec-header">
                <h1>${p.fullName || 'Candidate Name'}</h1>
                <p style="font-style:italic; font-size:1rem; color:#475569;">${p.jobTitle || ''}</p>
                <p style="font-size:0.8rem; color:#64748B; margin-top:4px;">
                    ${[p.email, p.phone, p.location, p.website].filter(Boolean).join(' • ')}
                </p>
            </div>
        `;
    } else if (tName === 'developer_dark') {
        html += `
            <div style="border-bottom: 2px solid #06B6D4; padding-bottom: 10px; margin-bottom: 14px;">
                <h1>&gt; ${p.fullName || 'Candidate Name'}</h1>
                <p style="color:#EC4899; font-weight:600;">[ ${p.jobTitle || 'Developer'} ]</p>
                <p style="font-size:0.8rem; color:#94A3B8;">${[p.email, p.phone, p.location].filter(Boolean).join(' | ')}</p>
            </div>
        `;
    } else { // ats_minimal
        html += `
            <div style="border-bottom: 1.5px solid #0F172A; padding-bottom: 8px; margin-bottom: 12px;">
                <h1>${p.fullName || 'Candidate Name'}</h1>
                <p style="font-weight:600; color:#2563EB;">${p.jobTitle || ''}</p>
                <p style="font-size:0.8rem; color:#475569;">${[p.email, p.phone, p.location].filter(Boolean).join(' | ')}</p>
            </div>
        `;
    }

    // Summary
    if (sum) {
        html += `
            <div class="resume-section">
                <h2>Professional Summary</h2>
                <p>${sum}</p>
            </div>
        `;
    }

    // Experience
    if (exps.length > 0) {
        html += `<div class="resume-section"><h2>Work Experience</h2>`;
        exps.forEach(exp => {
            const bullets = (exp.bullets || '').split('\n').filter(b => b.trim());
            html += `
                <div class="exp-item">
                    <div class="exp-head">
                        <span>${exp.position || 'Position'} — ${exp.company || 'Company'}</span>
                        <span style="font-weight:normal; font-size:0.8rem; color:#64748B;">${exp.startDate || ''} - ${exp.endDate || 'Present'}</span>
                    </div>
                    <div class="exp-sub">${exp.location || ''}</div>
                    ${bullets.length > 0 ? `<ul class="bullet-list">${bullets.map(b => `<li>${b.replace(/^[-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
                </div>
            `;
        });
        html += `</div>`;
    }

    // Education
    if (edus.length > 0) {
        html += `<div class="resume-section"><h2>Education</h2>`;
        edus.forEach(edu => {
            html += `
                <div class="edu-item">
                    <div class="exp-head">
                        <span>${edu.degree || 'Degree'} — ${edu.institution || 'University'}</span>
                        <span style="font-weight:normal; font-size:0.8rem; color:#64748B;">${edu.startDate || ''} - ${edu.endDate || ''}</span>
                    </div>
                    ${edu.gpa ? `<div class="exp-sub">GPA: ${edu.gpa}</div>` : ''}
                </div>
            `;
        });
        html += `</div>`;
    }

    // Projects
    if (projs.length > 0) {
        html += `<div class="resume-section"><h2>Projects</h2>`;
        projs.forEach(proj => {
            html += `
                <div class="proj-item">
                    <div style="font-weight:600;">${proj.name || 'Project Name'} ${proj.techStack ? `<span style="font-weight:normal; font-size:0.8rem; color:#7C3AED;">(${proj.techStack})</span>` : ''}</div>
                    ${proj.description ? `<p style="font-size:0.82rem; margin-top:2px;">${proj.description}</p>` : ''}
                </div>
            `;
        });
        html += `</div>`;
    }

    // Skills
    if (skills.length > 0) {
        html += `<div class="resume-section"><h2>Technical Skills</h2>`;
        if (tName === 'developer_dark') {
            html += `<div>${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>`;
        } else {
            html += `<p>${skills.join(', ')}</p>`;
        }
        html += `</div>`;
    }

    previewContainer.innerHTML = html;
}

function initTemplateSelector() {
    const select = document.getElementById('template-select');
    if (!select) return;
    select.addEventListener('change', () => {
        currentResumeState.template_name = select.value;
        renderLivePreview();
    });
}

function triggerAutoSaveDebounce() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveResumeToBackend(true);
    }, 2000);
}

function initSaveButton() {
    const saveBtn = document.getElementById('save-resume-btn');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', () => {
        saveResumeToBackend(false);
    });
}

function saveResumeToBackend(isSilent = false) {
    syncStateFromInputs();
    fetch('/api/save-resume', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(currentResumeState)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            currentResumeState.id = data.resume.id;
            if (!isSilent) showToast('Resume saved successfully!', 'success');
        }
    })
    .catch(err => console.error('Save error:', err));
}

// Dynamic Block Adders
function addExperienceBlock() {
    const container = document.getElementById('experience-blocks-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'glass-card experience-item-block form-group';
    div.style.padding = '16px';
    div.style.marginTop = '12px';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="color:var(--neon-cyan);">Work Experience Item</h4>
            <button type="button" class="btn-glass btn-sm" onclick="this.parentElement.parentElement.remove(); syncStateFromInputs(); renderLivePreview();"><i class="fas fa-trash"></i></button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <input type="text" class="form-control exp-position" placeholder="Job Title (e.g. Senior Developer)">
            <input type="text" class="form-control exp-company" placeholder="Company Name">
            <input type="text" class="form-control exp-startDate" placeholder="Start Date (e.g. 2022)">
            <input type="text" class="form-control exp-endDate" placeholder="End Date (or Present)">
        </div>
        <textarea class="form-control exp-bullets" style="margin-top:8px;" placeholder="Bullet achievements (one per line)..."></textarea>
    `;
    container.appendChild(div);
    bindLivePreviewInputs();
}

function addEducationBlock() {
    const container = document.getElementById('education-blocks-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'glass-card education-item-block form-group';
    div.style.padding = '16px';
    div.style.marginTop = '12px';
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="color:var(--neon-cyan);">Education Item</h4>
            <button type="button" class="btn-glass btn-sm" onclick="this.parentElement.parentElement.remove(); syncStateFromInputs(); renderLivePreview();"><i class="fas fa-trash"></i></button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <input type="text" class="form-control edu-institution" placeholder="University / School">
            <input type="text" class="form-control edu-degree" placeholder="Degree (e.g. B.S. CS)">
            <input type="text" class="form-control edu-startDate" placeholder="Start Year">
            <input type="text" class="form-control edu-endDate" placeholder="Graduation Year">
        </div>
    `;
    container.appendChild(div);
    bindLivePreviewInputs();
}
