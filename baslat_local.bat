@echo off
set "NODE_PATH=C:\Users\sk36\.gemini\antigravity\scratch\tools\node-v20.11.0-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

echo ===================================================
echo Ic Sistemler Platformu (Local) Baslatiliyor...
echo ===================================================

echo [1/4] Veritabani Senkronize Ediliyor...
cd backend
call npx prisma db push --accept-data-loss
call npx prisma generate
cd ..

echo [2/4] Backend Baslatiliyor (Port: 3001)...
start "ICSISTEMLER - Backend" cmd /k "title ICSISTEMLER - Backend && set PATH=%NODE_PATH%;%PATH% && cd backend && npm run start:dev"

echo [3/4] Frontend Baslatiliyor (Port: 3010)...
start "Frontend Server" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd frontend && npm run dev"

echo.
echo [4/4] Tarayici Aciliyor...
echo Sistemler hazirlaniyor, lutfen bekleyin (10 saniye)...
timeout /t 10 >nul
start chrome http://localhost:3010/login

echo.
echo ===================================================
echo ISLEM TAMAM!
echo Giris Bilgileri: admin / password
echo Eger hatali bir durum varsa sayfada Cikis Yap butonunu kullanin.
echo ===================================================
echo.
pause
