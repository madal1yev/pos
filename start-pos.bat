@echo off
cd /d "C:\Users\SHAX\Desktop\pos"
pm2 start ecosystem.config.js
echo POS tizimi ishga tushdi!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
