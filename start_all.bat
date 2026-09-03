@echo off
echo ========================================================
echo Launching Loan Approval Prediction System
echo Backend: FastAPI on http://127.0.0.1:8000
echo Frontend: Next.js on http://localhost:3000
echo ========================================================
start "Loan Approval Backend" "%~dp0run_backend.bat"
timeout /t 2 /nobreak >nul
start "Loan Approval Frontend" "%~dp0run_frontend.bat"
echo System services started in dedicated windows.
