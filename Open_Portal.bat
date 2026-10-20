@echo off
title NEXORA ACADEMY - Student Admission & Fee Portal
echo ===================================================================
echo     NEXORA ACADEMY - STUDENT ADMISSION & FEE MANAGEMENT PORTAL
echo ===================================================================
echo.
echo Opening Student Admission & Fee Portal in your default browser...
start "" "%~dp0Student_Admission_Portal.html"
start http://localhost:5173
npm run dev
pause
