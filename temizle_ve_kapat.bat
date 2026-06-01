@echo off
echo ===================================================
echo TUM SISTEM TEMIZLENIYOR...
echo ===================================================
echo Lutfen bu dosyaya SAG TIKLAYIP "Yonetici olarak calistir" deyin.
echo Yoksa "Erisim engellendi" hatasi alabilirsiniz.
echo.
echo Acik kalan tum Node.js (backend/frontend) islemleri kapatiliyor...
taskkill /f /im node.exe || echo HATA: Yonetici izni gerekiyor! Lutfen yonetici olarak calistirin.
echo.
echo ===================================================
echo TEMIZLIK TAMAMLANDI!
echo ===================================================
echo.
echo Simdi 'baslat_local.bat' dosyasina tiklayip sistemi sifirdan acabilirsin.
echo.
pause
