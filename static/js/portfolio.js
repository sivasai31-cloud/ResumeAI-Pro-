/* ==========================================================================
   PORTFOLIO BUILDER & EXPORTER MODULE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initPortfolioThemeSwitcher();
    initPortfolioResumeSwitcher();
    initPortfolioAboutAI();
    initPortfolioSave();
    initZIPExport();
});

function updatePortfolioPreview() {
    const iframe = document.getElementById('portfolio-preview-iframe');
    if (!iframe) return;

    const theme = document.getElementById('portfolio-theme-select')?.value || 'dark_glass';
    const resumeId = document.getElementById('portfolio-resume-select')?.value || '';
    const about = document.getElementById('portfolio-about-input')?.value || '';

    const currentSrc = new URL(iframe.src);
    currentSrc.searchParams.set('theme', theme);
    if (resumeId) {
        currentSrc.searchParams.set('resume_id', resumeId);
    } else {
        currentSrc.searchParams.delete('resume_id');
    }
    if (about) {
        currentSrc.searchParams.set('about', about);
    } else {
        currentSrc.searchParams.delete('about');
    }
    iframe.src = currentSrc.toString();
}

function initPortfolioThemeSwitcher() {
    const themeSelect = document.getElementById('portfolio-theme-select');
    if (!themeSelect) return;
    
    themeSelect.addEventListener('change', () => {
        updatePortfolioPreview();
        showToast(`Switched to ${themeSelect.value} portfolio theme!`, 'info');
    });
}

function initPortfolioResumeSwitcher() {
    const resumeSelect = document.getElementById('portfolio-resume-select');
    const aboutInput = document.getElementById('portfolio-about-input');
    if (resumeSelect) {
        resumeSelect.addEventListener('change', updatePortfolioPreview);
    }
    if (aboutInput) {
        aboutInput.addEventListener('input', updatePortfolioPreview);
    }
}

function initPortfolioAboutAI() {
    const aboutBtn = document.getElementById('generate-about-btn');
    const aboutInput = document.getElementById('portfolio-about-input');
    if (!aboutBtn || !aboutInput) return;

    aboutBtn.addEventListener('click', () => {
        const resumeSelect = document.getElementById('portfolio-resume-select');
        aboutBtn.disabled = true;
        aboutBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;

        fetch('/api/generate-portfolio-about', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                resume_id: resumeSelect?.value || null
            })
        })
        .then((res) => res.json())
        .then((data) => {
            aboutBtn.disabled = false;
            aboutBtn.innerHTML = `<i class="fas fa-magic"></i> Generate About with AI`;
            if (data.status === 'success') {
                aboutInput.value = data.about;
                aboutInput.dispatchEvent(new Event('input'));
                showToast('Portfolio About section generated with AI!', 'success');
            } else {
                showToast(data.error || 'Unable to generate About section.', 'error');
            }
        })
        .catch(() => {
            aboutBtn.disabled = false;
            aboutBtn.innerHTML = `<i class="fas fa-magic"></i> Generate About with AI`;
            showToast('Unable to generate About section.', 'error');
        });
    });
}

function initPortfolioSave() {
    const saveBtn = document.getElementById('save-portfolio-btn');
    if (!saveBtn) return;
    
    saveBtn.addEventListener('click', () => {
        const resumeSelect = document.getElementById('portfolio-resume-select');
        const titleInput = document.getElementById('portfolio-title-input');
        const themeSelect = document.getElementById('portfolio-theme-select');
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
        
        fetch('/api/portfolio/save', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                resume_id: resumeSelect?.value || null,
                title: titleInput?.value || 'My Portfolio',
                theme: themeSelect?.value || 'dark_glass'
            })
        })
        .then(res => res.json())
        .then(data => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fas fa-globe"></i> Save & Publish Portfolio`;
            if (data.status === 'success') {
                showToast('Portfolio configuration published!', 'success');
            }
        });
    });
}

function initZIPExport() {
    const zipBtn = document.getElementById('download-portfolio-zip-btn');
    if (!zipBtn) return;
    
    zipBtn.addEventListener('click', () => {
        const resumeSelect = document.getElementById('portfolio-resume-select');
        const themeSelect = document.getElementById('portfolio-theme-select');
        const aboutInput = document.getElementById('portfolio-about-input');

        zipBtn.disabled = true;
        zipBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Exporting...`;

        fetch('/api/portfolio/export-html', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                resume_id: resumeSelect?.value || null,
                theme: themeSelect?.value || 'dark_glass',
                about: aboutInput?.value || ''
            })
        })
        .then((res) => res.json())
        .then((data) => {
            zipBtn.disabled = false;
            zipBtn.innerHTML = `<i class="fas fa-file-archive"></i> Download ZIP Bundle`;
            if (data.status === 'success') {
                window.location.href = data.download_url;
                showToast('Standalone portfolio HTML exported.', 'success');
            } else {
                showToast(data.error || 'Unable to export portfolio.', 'error');
            }
        })
        .catch(() => {
            zipBtn.disabled = false;
            zipBtn.innerHTML = `<i class="fas fa-file-archive"></i> Download ZIP Bundle`;
            showToast('Unable to export portfolio.', 'error');
        });
    });
}
