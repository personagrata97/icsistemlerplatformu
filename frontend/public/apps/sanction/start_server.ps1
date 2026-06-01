# Sanction Scanner - PowerShell Yerel Sunucu Başlatıcı
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Sanction Scanner - Yerel Sunucu Başlatıcı" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sunucu başlatılıyor..." -ForegroundColor Green
Write-Host ""
Write-Host ">> Tarayıcınızda şu adresi açın:" -ForegroundColor Yellow
Write-Host "   http://localhost:8080" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host ">> Sunucuyu durdurmak için Ctrl+C tuşlarına basın." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
py -m http.server 8080
