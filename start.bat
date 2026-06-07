@echo off
echo ========================================
echo   Ishxona Boshqaruv Tizimi
echo ========================================

echo.
echo [1/2] Backend ishga tushirilmoqda...
start "Backend" cmd /k "cd /d C:\Users\Acer\Desktop\kiro\backend && npm install && npm run dev"

echo.
echo [2/2] Frontend ishga tushirilmoqda...
start "Frontend" cmd /k "cd /d C:\Users\Acer\Desktop\kiro\frontend && npm install && npm run dev"

echo.
echo ========================================
echo   Tayyor bo'lgach brauzerda oching:
echo   http://localhost:3000
echo   Login: admin  ^|  Parol: admin123
echo ========================================
pause
