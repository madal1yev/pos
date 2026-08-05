@echo off
title POS Tizimi
cd /d "%~dp0.."

:: Local IP ni aniqlash (faqat WiFi/ethernet - 192.168.x.x yoki 10.x.x.x)
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /r "IPv4.*192\.168\."') do set IP=%%i
if "%IP%"=="" for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /r "IPv4.*10\."') do set IP=%%i
if "%IP%"=="" for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /r "IPv4.*[0-9]\.[0-9]"') do set IP=%%i
set IP=%IP: =%

echo ============================================
echo     🚀 POS TIZIMI ISHGA TUSHMOQDA...
echo ============================================
echo.

:: PM2 orqali backendni ishga tushirish (background)
pm2 start scripts\ecosystem.config.js

:: PM2 configuratsiyani saqlash (qayta ishga tushganda tiklash uchun)
pm2 save

echo.
echo ============================================
echo     ✅ POS TIZIMI ISHGA TUSHDI!
echo ============================================
echo.
echo   Lokal:    http://localhost:5000
echo   Tarmoq:   http://%IP%:5000
echo.
echo   📱 Telefoningizdan ulanish:
echo   http://%IP%:5000
echo.
echo   Admin:    admin@pos.uz / admin123
echo.
echo   💡 WiFi orqali telefoningiz bilan ulaning!
echo   ⚠️  WiFi o'chsa, telefon ulanolmaydi (local tarmoq)
echo ============================================
echo.
echo   PM2 boshqarish:
echo     pm2 status    - holati
echo     pm2 logs      - loglar
echo     pm2 stop all  - to'xtatish
echo.
pause
