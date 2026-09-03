@echo off
setlocal
echo ========================================================
echo Pushing Loan Approval Prediction System to GitHub
echo ========================================================
echo.

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    git remote add origin https://github.com/ayeshasiddiqua111111111-commits/Loan-Approval.git
) else (
    git remote set-url origin https://github.com/ayeshasiddiqua111111111-commits/Loan-Approval.git
)

echo Remote set to: https://github.com/ayeshasiddiqua111111111-commits/Loan-Approval.git
echo.
echo Pushing all files (including app, backend, and models) to GitHub...
echo (If a browser window appears, click "Authorize" or "Sign In")
echo.

git push -u --force origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! All files have been uploaded to GitHub!
    echo Now open vercel.com and redeploy your project.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo Push failed. If it asked to sign in, make sure you authorized GitHub.
    echo ========================================================
)

pause
