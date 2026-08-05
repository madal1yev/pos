' POS Tizimi - Silent Auto-Start Script
' Kompyuter yoqilganda backendni avtomatik ishga tushiradi

Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c cd /d """ & scriptDir & "\.."" && pm2 start scripts\ecosystem.config.js && pm2 save", 0, False
