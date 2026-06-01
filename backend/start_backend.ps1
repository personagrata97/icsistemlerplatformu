$env:Path = "C:\Users\sk36\.gemini\antigravity\scratch\tools\node-v20.11.0-win-x64;" + $env:Path
$env:PORT = 3001
$env:DATABASE_URL = "file:./dev.db"

Write-Host "Backend başlatılıyor..."
npm run start:dev
