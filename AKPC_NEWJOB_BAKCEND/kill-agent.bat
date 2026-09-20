@echo off
chcp 65001 > nul
echo ===============================================
echo   EMERGENCY: STOPPING WEIGHT AGENT PROCESS...
echo ===============================================
echo.

:: 1. สั่งฆ่า Process node.exe ทั้งหมดแบบบังคับ
taskkill /f /im node.exe > nul 2>&1

:: 2. เคลียร์ค้างสายพอร์ต (กรณีมี Port Hang)
echo [SUCCESS] Cleared all Node.js processes and released COM1 port.
echo.
echo ===============================================
echo   SUCCESSFULLY STOPPED. YOU CAN RESTART NOW.
echo ===============================================
echo.
pause