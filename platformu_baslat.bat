@echo off
echo ===================================================
echo Ic Sistemler Entegre Platformu Baslatiliyor...
echo ===================================================

echo.
echo [1/3] Docker Konteynerleri Ayaga Kaldiriliyor...
docker-compose up -d --build

echo.
echo [2/3] Backend Hazirliklarinin Tamamlanmasi Bekleniyor...
timeout /t 15

echo.
echo [3/3] Platform Erisime Aciliyor...
start http://localhost:3000

echo.
echo ===================================================
echo Platform Basariyla Baslatildi!
echo Giris Ekrani: http://localhost:3000
echo ===================================================
pause
