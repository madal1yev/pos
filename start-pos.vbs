' POS Tizimi - Silent Auto-Start Script
' Kompyuter yoqilganda botni avtomatik ishga tushiradi

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c cd /d ""C:\Users\SHAX\Desktop\pos"" && pm2 start ecosystem.config.js && pm2 save", 0, False
