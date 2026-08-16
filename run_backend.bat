@echo off
echo Starting ParentCare FastAPI Backend on http://127.0.0.1:8000 ...
cd /d "%~dp0parentcare\backend"
if exist "..\..\.venv\Scripts\python.exe" (
    ..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
) else (
    python -m uvicorn app.main:app --reload --port 8000
)
pause
