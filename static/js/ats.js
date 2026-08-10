/* ==========================================================================
   ATS SCANNER & RECRUITER SIMULATOR INTERACTION
   ========================================================================== */

// Module-level state to share between functions
let _lastMissingKeywords = [];
let _lastJobTitle = 'Software Engineer';

document.addEventListener('DOMContentLoaded', () => {
    initDropZone();
    initScanButton();
    initAIOptimizer();
});

/* ------------------------------------------------------------------
   Drop Zone
------------------------------------------------------------------ */
function initDropZone() {
    const dropZone = document.getElementById('ats-drop-zone');
    const fileInput = document.getElementById('ats-file-input');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--neon-cyan)';
        dropZone.style.background = 'rgba(6, 182, 212, 0.1)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border-glass)';
        dropZone.style.background = 'var(--bg-glass-input)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-glass)';
        dropZone.style.background = 'var(--bg-glass-input)';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            document.getElementById('file-name-display').textContent = `Uploaded: ${fileInput.files[0].name}`;
            showToast(`File selected: ${fileInput.files[0].name}`, 'info');
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            document.getElementById('file-name-display').textContent = `Uploaded: ${fileInput.files[0].name}`;
        }
    });
}

/* ------------------------------------------------------------------
   Scan Button
------------------------------------------------------------------ */
function initScanButton() {
    const scanBtn = document.getElementById('run-ats-scan-btn');
    if (!scanBtn) return;

    scanBtn.addEventListener('click', () => {
        const formData = new FormData();
        const fileInput = document.getElementById('ats-file-input');
        const resumeSelect = document.getElementById('ats-resume-select');
        const jobTitle = document.getElementById('ats-job-title')?.value || 'Target Position';
        const jobDesc = document.getElementById('ats-job-desc')?.value || '';

        if (fileInput && fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        } else if (resumeSelect && resumeSelect.value !== '0') {
            formData.append('resume_id', resumeSelect.value);
        } else {
            showToast('Please select a saved resume or upload a PDF/DOCX file.', 'warning');
            return;
        }

        formData.append('job_title', jobTitle);
        formData.append('job_description', jobDesc);

        // Cache job title for AI generation
        _lastJobTitle = jobTitle || 'Software Engineer';

        scanBtn.disabled = true;
        scanBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Analyzing Resume with AI...`;

        fetch('/api/ats/scan', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                scanBtn.disabled = false;
                scanBtn.innerHTML = `<i class="fas fa-microchip"></i> Run Deep ATS Analysis`;
                if (data.status === 'success') {
                    showToast('ATS Scan complete!', 'success');
                    displayATSResults(data.analysis);
                } else {
                    showToast(data.message || 'ATS Scan failed', 'error');
                }
            })
            .catch(err => {
                scanBtn.disabled = false;
                scanBtn.innerHTML = `<i class="fas fa-microchip"></i> Run Deep ATS Analysis`;
                console.error('Scan error:', err);
                showToast('Failed to connect to ATS scanner engine.', 'error');
            });
    });
}

/* ------------------------------------------------------------------
   Display Results
------------------------------------------------------------------ */
function displayATSResults(analysis) {
    const resultsContainer = document.getElementById('ats-results-display');
    if (!resultsContainer) return;

    resultsContainer.style.display = 'block';

    // Score ring
    const scoreVal = analysis.score || 85;
    const scoreText = document.getElementById('ats-score-text');
    if (scoreText) scoreText.textContent = `${scoreVal}%`;
    const circle = document.querySelector('.progress-ring-circle');
    if (circle) {
        circle.style.strokeDashoffset = 326 - (326 * scoreVal) / 100;
    }

    const matchedKeywords = analysis.matched || analysis.matched_keywords || [];
    const missingKeywords = analysis.missing || analysis.missing_keywords || [];
    const feedbackItems = analysis.feedback || analysis.recommendations || [];

    // Matched keywords
    const matchedEl = document.getElementById('matched-keywords-list');
    if (matchedEl) {
        matchedEl.innerHTML = matchedKeywords.map(k =>
            `<span class="badge-neon badge-success" style="margin:4px;"><i class="fas fa-check"></i> ${k}</span>`
        ).join('');
    }

    // Missing keywords
    const missingEl = document.getElementById('missing-keywords-list');
    if (missingEl) {
        missingEl.innerHTML = missingKeywords.map(k =>
            `<span class="badge-neon badge-warning" style="margin:4px;"><i class="fas fa-times"></i> ${k}</span>`
        ).join('');
    }

    // Recommendations
    const recsEl = document.getElementById('recommendations-list');
    if (recsEl) {
        recsEl.innerHTML = feedbackItems.map(r =>
            `<li style="margin-bottom:8px;"><i class="fas fa-lightbulb" style="color:var(--neon-cyan); margin-right:8px;"></i> ${r}</li>`
        ).join('');
    }

    // AI feedback
    const aiFeedbackEl = document.getElementById('ai-feedback-list');
    if (aiFeedbackEl) {
        const recruiterLines = (analysis.recruiter_notes || '').split('\n').map(l => l.trim()).filter(Boolean);
        aiFeedbackEl.innerHTML = recruiterLines.map(r =>
            `<li style="margin-bottom:8px;"><i class="fas fa-robot" style="color:var(--neon-cyan); margin-right:8px;"></i> ${r}</li>`
        ).join('');
    }

    // Recruiter notes
    const recNotesEl = document.getElementById('recruiter-notes-box');
    if (recNotesEl) {
        recNotesEl.textContent = analysis.recruiter_notes || 'Scannability check passed.';
    }

    // AI Optimizer panel — show only when there are missing keywords
    _lastMissingKeywords = missingKeywords;
    const aiPanel = document.getElementById('ai-optimizer-panel');
    if (aiPanel) {
        if (missingKeywords.length > 0) {
            aiPanel.style.display = 'block';
            // Reset output area for fresh scan
            const outputWrapper = document.getElementById('ai-output-wrapper');
            const outputArea = document.getElementById('ai-generated-output');
            if (outputWrapper) outputWrapper.style.display = 'none';
            if (outputArea) outputArea.value = '';
        } else {
            aiPanel.style.display = 'none';
        }
    }
}

/* ------------------------------------------------------------------
   AI Optimizer: Generate → Apply → Copy
------------------------------------------------------------------ */
function initAIOptimizer() {
    const generateBtn = document.getElementById('generate-missing-btn');
    const applyBtn    = document.getElementById('apply-to-builder-btn');
    const copyBtn     = document.getElementById('copy-ai-output-btn');

    // Generate button
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            if (!_lastMissingKeywords || _lastMissingKeywords.length === 0) {
                showToast('Run an ATS scan first to identify missing keywords.', 'warning');
                return;
            }

            generateBtn.disabled = true;
            generateBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Generating with Ollama...`;

            fetch('/api/generate-missing-requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    missing_keywords: _lastMissingKeywords,
                    target_role: _lastJobTitle
                })
            })
            .then(res => res.json())
            .then(data => {
                generateBtn.disabled = false;
                generateBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles"></i> ✨ Generate with AI`;

                if (data.status === 'success') {
                    const outputWrapper = document.getElementById('ai-output-wrapper');
                    const outputArea    = document.getElementById('ai-generated-output');
                    if (outputWrapper) outputWrapper.style.display = 'block';
                    if (outputArea) {
                        outputArea.value = data.content || '';
                        outputWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    showToast('AI suggestions generated! Edit and apply to your builder.', 'success');
                } else {
                    showToast(data.error || 'AI generation failed. Is Ollama running?', 'error');
                }
            })
            .catch(err => {
                generateBtn.disabled = false;
                generateBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles"></i> ✨ Generate with AI`;
                console.error('AI generation error:', err);
                showToast('Failed to reach AI engine. Make sure Ollama is running.', 'error');
            });
        });
    }

    // Apply to Builder button
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const outputArea = document.getElementById('ai-generated-output');
            const content = outputArea ? outputArea.value.trim() : '';
            if (!content) {
                showToast('Generate AI suggestions first before applying.', 'warning');
                return;
            }
            try {
                localStorage.setItem('ats_ai_suggestions', JSON.stringify({
                    content: content,
                    role: _lastJobTitle,
                    missing_keywords: _lastMissingKeywords,
                    timestamp: Date.now()
                }));
                showToast('Suggestions saved! Opening Resume Builder...', 'success');
                setTimeout(() => { window.location.href = '/builder'; }, 800);
            } catch (e) {
                showToast('Could not save to localStorage. Please copy manually.', 'error');
            }
        });
    }

    // Copy button
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const outputArea = document.getElementById('ai-generated-output');
            if (!outputArea || !outputArea.value) {
                showToast('Nothing to copy yet.', 'warning');
                return;
            }
            navigator.clipboard.writeText(outputArea.value)
                .then(() => showToast('Copied to clipboard!', 'success'))
                .catch(() => {
                    outputArea.select();
                    document.execCommand('copy');
                    showToast('Copied!', 'success');
                });
        });
    }
}
