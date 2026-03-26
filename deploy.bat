@echo off
echo ========================================
echo   Deploying Cell Hardening Audit Updates
echo ========================================
echo.

cd "C:\Users\kmm00vx\OneDrive - Walmart Inc\Documents\puppy_workspace\flib-audit-netlify"

echo Adding files to Git...
git add .

echo.
set /p commit_msg="Enter commit message (what did you change?): "

echo.
echo Committing changes...
git commit -m "%commit_msg%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   ✅ DONE! Vercel will auto-deploy!
echo   Check https://vercel.com for status
echo ========================================
pause
