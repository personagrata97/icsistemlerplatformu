@echo off
cd /d "%~dp0"
echo Sanction Scanner Veri Guncellemesi Baslatiliyor...
powershell -ExecutionPolicy Bypass -File "update_data.ps1"
echo Guncelleme Tamamlandi. Pencereyi kapatabilirsiniz.
timeout /t 5
