/* ==========================================================================
   AI COPILOT FLOATING DRAWER & AI ASSISTANT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initCopilotDrawer();
    initAIActionButtons();
});

function initCopilotDrawer() {
    const trigger = document.getElementById('ai-copilot-trigger');
    const drawer = document.getElementById('ai-copilot-drawer');
    const closeBtn = document.getElementById('close-copilot-btn');
    
    if (trigger && drawer) {
        trigger.addEventListener('click', () => {
            drawer.classList.toggle('open');
        });
    }
    
    if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('open');
        });
    }
    
    const sendBtn = document.getElementById('copilot-send-btn');
    const chatInput = document.getElementById('copilot-input');
    
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', () => handleCopilotSubmit());
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleCopilotSubmit();
        });
    }
}

function handleCopilotSubmit() {
    const input = document.getElementById('copilot-input');
    const msgList = document.getElementById('copilot-messages');
    if (!input || !msgList || !input.value.trim()) return;
    
    const userText = input.value.trim();
    input.value = '';
    
    // Append User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user-msg';
    userDiv.style.cssText = 'align-self:flex-end; background:rgba(37,99,235,0.3); border:1px solid rgba(37,99,235,0.5); padding:10px 14px; border-radius:12px; margin-bottom:10px; max-width:85%; font-size:0.88rem;';
    userDiv.textContent = userText;
    msgList.appendChild(userDiv);
    msgList.scrollTop = msgList.scrollHeight;

    // Append Typing Indicator
    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-msg ai-msg';
    aiDiv.style.cssText = 'align-self:flex-start; background:rgba(255,255,255,0.05); border:1px solid var(--border-glass); padding:10px 14px; border-radius:12px; margin-bottom:10px; max-width:85%; font-size:0.88rem;';
    aiDiv.innerHTML = `<i class="fas fa-robot text-gradient" style="margin-right:6px;"></i> <i class="fas fa-ellipsis-h fa-pulse"></i> JARVIS thinking...`;
    msgList.appendChild(aiDiv);
    msgList.scrollTop = msgList.scrollHeight;

    fetch('/api/copilot', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            message: userText,
            context: JSON.stringify(window.currentResumeState || {})
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const reply = data.reply || data.result || '';
            aiDiv.innerHTML = `<i class="fas fa-robot text-gradient" style="margin-right:6px;"></i> ${reply.replace(/\n/g, '<br>')}`;
        } else {
            aiDiv.textContent = data.error || 'JARVIS could not process your request.';
        }
        msgList.scrollTop = msgList.scrollHeight;
    })
    .catch(err => {
        aiDiv.textContent = 'Error connecting to AI Copilot engine.';
    });
}

function initAIActionButtons() {
    const summaryBtn = document.getElementById('ai-generate-summary-btn');
    if (summaryBtn) {
        summaryBtn.addEventListener('click', () => {
            const summaryInput = document.getElementById('summary-input');
            if (!summaryInput) return;

            const skillsInput = document.getElementById('skills-input');
            const projectBlocks = document.querySelectorAll('.project-item-block');
            const projects = Array.from(projectBlocks).map((block) => ({
                name: block.querySelector('.proj-name')?.value || '',
                techStack: block.querySelector('.proj-techStack')?.value || '',
                description: block.querySelector('.proj-description')?.value || ''
            }));

            summaryBtn.disabled = true;
            summaryBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;

            fetch('/api/generate-summary', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    resume_id: window.currentResumeState?.id || null,
                    name: document.getElementById('p-fullName')?.value || window.currentResumeState?.personal_info?.fullName || '',
                    role: document.getElementById('p-jobTitle')?.value || window.currentResumeState?.personal_info?.jobTitle || 'Software Engineer',
                    skills: skillsInput?.value || '',
                    projects: projects
                })
            })
            .then((res) => res.json())
            .then((data) => {
                summaryBtn.disabled = false;
                summaryBtn.innerHTML = `<i class="fas fa-magic"></i> Generate with AI`;
                if (data.status === 'success') {
                    summaryInput.value = data.summary;
                    summaryInput.dispatchEvent(new Event('input'));
                    showToast('Summary generated with AI!', 'success');
                } else {
                    showToast(data.error || 'Unable to generate summary.', 'error');
                }
            })
            .catch(() => {
                summaryBtn.disabled = false;
                summaryBtn.innerHTML = `<i class="fas fa-magic"></i> Generate with AI`;
                showToast('Unable to generate summary.', 'error');
            });
        });
    }

    const experienceBtn = document.getElementById('ai-improve-exp-btn');
    if (experienceBtn) {
        experienceBtn.addEventListener('click', () => {
            const expBulletEls = Array.from(document.querySelectorAll('.exp-bullets'));
            let activeBullets = expBulletEls.find(el => el === document.activeElement || el.value.trim());
            if (!activeBullets && expBulletEls.length > 0) {
                activeBullets = expBulletEls[0];
            }

            if (!activeBullets || !activeBullets.value.trim()) {
                showToast('Please enter some experience text to improve.', 'warning');
                return;
            }

            experienceBtn.disabled = true;
            experienceBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Improving...`;

            fetch('/api/improve-experience', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    resume_id: window.currentResumeState?.id || null,
                    text: activeBullets.value,
                    role: document.getElementById('p-jobTitle')?.value || 'Engineer'
                })
            })
            .then((res) => res.json())
            .then((data) => {
                experienceBtn.disabled = false;
                experienceBtn.innerHTML = `<i class="fas fa-bolt"></i> Improve with AI`;
                if (data.status === 'success') {
                    activeBullets.value = data.experience;
                    activeBullets.dispatchEvent(new Event('input'));
                    showToast('Experience bullets improved with AI!', 'success');
                } else {
                    showToast(data.error || 'Unable to improve experience.', 'error');
                }
            })
            .catch(() => {
                experienceBtn.disabled = false;
                experienceBtn.innerHTML = `<i class="fas fa-bolt"></i> Improve with AI`;
                showToast('Unable to improve experience.', 'error');
            });
        });
    }
}

// Make handleCopilotSubmit available globally for quick-action buttons
window.handleCopilotSubmit = handleCopilotSubmit;

