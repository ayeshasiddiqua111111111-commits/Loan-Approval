@echo off
setlocal
echo ========================================================
echo Pushing Loan Approval Prediction System to GitHub
echo ========================================================
echo.

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo Enter your GitHub Repository URL (e.g. https://github.com/username/loan-approval.git):
    set /p REPO_URL="URL: "
    git remote add origin %REPO_URL%
) else (
    echo Existing remote origin found.
)

echo.
echo Pushing main branch to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Your project has been pushed to GitHub!
    echo You can now go to vercel.com and import this repository.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo Push failed. Please check your GitHub URL or login.
    echo ========================================================
)

pause
