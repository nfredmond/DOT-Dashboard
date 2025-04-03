@echo off
echo Fixing Next.js TypeScript types error...

REM Run the PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0fix-nextjs-types.ps1"

echo Done! Now you can run "npm run dev" or "npm run build" 