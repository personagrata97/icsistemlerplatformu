@echo off
chcp 65001 >nul
echo ================================================
echo   Sanction Scanner - Yerel Sunucu Başlatıcı
echo ================================================
echo.
echo Sunucu başlatılıyor...
echo.
echo ^>^> Tarayıcınızda şu adresi açın:
echo    http://localhost:8080
echo.
echo ^>^> Sunucuyu durdurmak için Ctrl+C tuşlarına basın.
echo.
echo ================================================
echo.
cd /d "%~dp0"
py -m http.server 8080
