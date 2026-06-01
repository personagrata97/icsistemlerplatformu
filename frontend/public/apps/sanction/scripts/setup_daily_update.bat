@echo off
REM Sanction Scanner - Gunluk Otomatik Guncelleme Kurulumu
REM Bu script Windows Task Scheduler'a gunluk gorev ekler

echo ===============================================
echo   Sanction Scanner Otomatik Guncelleme Kurulumu
echo ===============================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
set UPDATE_SCRIPT=%SCRIPT_DIR%daily_update.bat

echo Guncelleme scripti: %UPDATE_SCRIPT%
echo.
echo Bu kurulum, her gun saat 06:00'da otomatik veri guncellemesi yapacak.
echo.

REM Create scheduled task
schtasks /create /tn "SanctionScanner_DailyUpdate" /tr "%UPDATE_SCRIPT%" /sc daily /st 06:00 /ru "%USERNAME%" /f

if %ERRORLEVEL% equ 0 (
    echo.
    echo [BASARILI] Gorev zamanlayiciya eklendi!
    echo.
    echo Gorev Adi: SanctionScanner_DailyUpdate
    echo Calisma Zamani: Her gun 06:00
    echo.
    echo Gorevi kontrol etmek icin: schtasks /query /tn "SanctionScanner_DailyUpdate"
    echo Gorevi silmek icin: schtasks /delete /tn "SanctionScanner_DailyUpdate" /f
) else (
    echo.
    echo [HATA] Gorev eklenemedi. Yonetici olarak calistirmayi deneyin.
)

echo.
pause
