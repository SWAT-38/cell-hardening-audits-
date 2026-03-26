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
echo   Opening fresh page in 3 seconds...
echo ========================================

timeout /t 3 /nobreak >nul

echo Opening browser...
start "" "https://cell-hardening-audits.vercel.app/"

echo.
echo ✅ Fresh page opened!
echo Wait ~1 minute for Vercel deployment to complete.
echo.
pause
