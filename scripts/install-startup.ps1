# POS Tizimini Windows bilan avtomatik ishga tushirish
# BU SKRIPTNI ADMIN SIFATIDA ISHGA TUSHIRING (o'ng tugma -> Run as Administrator)
#
# Bu skript:
# 1. PM2 ni Windows service qilib o'rnatadi (24/7)
# 2. Windows boshlanganda POS tizimi avtomatik ishga tushadi
# 3. Backend doimiy ishlaydi

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🚀 POS TIZIMINI O'RNATISH" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# === 1. PM2 ni Windows service ga o'rnatish ===
Write-Host "[1/4] PM2 ni Windows Service ga o'rnatish..." -ForegroundColor Yellow

# npm global orqali pm2-windows-startup
$pm2Path = "C:\Users\SHAX\AppData\Roaming\npm\pm2.cmd"
if (-not (Test-Path $pm2Path)) {
    $pm2Path = "C:\Program Files\nodejs\pm2.cmd"
}

if (Test-Path $pm2Path) {
    Write-Host "  ✅ PM2 topildi" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ PM2 topilmadi, o'rnatilmoqda..." -ForegroundColor Yellow
    npm install -g pm2
}

# PM2 startup o'rnatish
Write-Host "  PM2 Windows startup o'rnatilmoqda..." -ForegroundColor Yellow
pm2-startup install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️ pm2-startup install ishlamadi, pm2 startup sinab ko'rilmoqda..." -ForegroundColor Yellow
    pm2 startup
}

# === 2. POS tizimini PM2 ga qo'shish ===
Write-Host "[2/4] POS tizimini PM2 ga qo'shish..." -ForegroundColor Yellow
Set-Location $PSScriptRoot

# Avval eski processlarni o'chiramiz
pm2 delete all

# POS backendni ishga tushirish
pm2 start scripts\ecosystem.config.js

# PM2 konfiguratsiyani saqlash (qayta ishga tushganda avtomatik)
pm2 save

Write-Host "  ✅ POS tizimi PM2 ga qo'shildi" -ForegroundColor Green

# === 3. Windows Task Scheduler ga qo'shish (PM2 service uchun) ===
Write-Host "[3/4] Windows Task Scheduler sozlanmoqda..." -ForegroundColor Yellow

$taskName = "POS Tizimi (PM2)"
$taskDescription = "POS tizimi avtomatik ishga tushadi"

# Eski taskni o'chirish
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$userName = $env:USERNAME
$pm2FullPath = "$env:USERPROFILE\AppData\Roaming\npm\pm2.cmd"
if (-not (Test-Path $pm2FullPath)) {
    $pm2FullPath = "pm2"
}
$action = New-ScheduledTaskAction -Execute "C:\Windows\System32\cmd.exe" -Argument "/c cd /d `"$PSScriptRoot`" && `"$pm2FullPath`" resurrect"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description $taskDescription `
    -User $userName `
    -RunLevel Highest `
    -Force

Write-Host "  ✅ Windows Task Scheduler ga qo'shildi" -ForegroundColor Green

# === 4. Local IP manzilini ko'rsatish ===
Write-Host "[4/4] Tarmoq sozlamalari tekshirilmoqda..." -ForegroundColor Yellow

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|Bluetooth|Virtual|VMware|Hyper-V|Docker" -and $_.PrefixOrigin -ne "WellKnown" } | Select-Object -First 1).IPAddress
if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match "192\.168\.|10\." } | Select-Object -First 1).IPAddress
}
if (-not $ip) {
    $ip = "192.168.x.x"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ O'RNATISH TUGADI!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📋 MA'LUMOTLAR:" -ForegroundColor White
Write-Host "  ─────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Server:      http://localhost:5000" -ForegroundColor White
Write-Host "  Telefon:     http://$($ip):5000" -ForegroundColor White
Write-Host "  Admin:       admin@pos.uz / admin123" -ForegroundColor White
Write-Host "  ─────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  📱 Telefoningizda WiFi orqali ulanish:" -ForegroundColor Yellow
Write-Host "  1. Telefon WiFi-ni yoqing" -ForegroundColor Yellow
Write-Host "  2. Brauzerga yozing: http://$($ip):5000" -ForegroundColor Cyan
Write-Host "  3. Login: admin@pos.uz / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  💡 Kompyuterni qayta ishga tushirsangiz ham," -ForegroundColor Green
Write-Host "     POS tizimi avtomatik ishga tushadi!" -ForegroundColor Green
Write-Host ""
Write-Host "  ⚠️ WiFi o'chsa, telefon ulanolmaydi!" -ForegroundColor Red
Write-Host "     (chunki local tarmoq orqali ishlaydi)" -ForegroundColor DarkRed
Write-Host ""
Write-Host "  🔧 Boshqarish uchun:" -ForegroundColor Gray
Write-Host "     pm2 status          - holatini ko'rish" -ForegroundColor Gray
Write-Host "     pm2 logs            - loglarni ko'rish" -ForegroundColor Gray
Write-Host "     pm2 restart all     - qayta ishga tushirish" -ForegroundColor Gray
Write-Host "     pm2 stop all        - to'xtatish" -ForegroundColor Gray
Write-Host ""
pause
