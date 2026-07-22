# POS tizimini Windows boshlanganda avtomatik ishga tushirish
# Bu skriptni ADMIN sifatida ishga tushiring!

$taskName = "POS Tizimi (PM2)"
$taskDescription = "POS tizimini va Telegram botlarni avtomatik ishga tushirish"
$scriptPath = "C:\Users\SHAX\Desktop\pos\start-pos.bat"
$userName = "SHAX"

# O'chirish (agar mavjud bo'lsa)
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Task yaratish
$action = New-ScheduledTaskAction -Execute "$scriptPath" -WorkingDirectory "C:\Users\SHAX\Desktop\pos"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userName
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description $taskDescription `
    -User $userName `
    -RunLevel Limited

Write-Host "✅ Windows Task Scheduler ga qo'shildi: $taskName"
Write-Host "   Kompyuter qayta ishga tushganda avtomatik ishga tushadi."
