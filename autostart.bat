@echo off
cd /d C:\Users\Acer\Desktop\kiro\backend
start "" /min cmd /c "npm run dev"
timeout /t 3 /nobreak >nul
cd /d C:\Users\Acer\Desktop\kiro\frontend
start "" /min cmd /c "npm run dev"
