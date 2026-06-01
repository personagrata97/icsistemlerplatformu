$env:Path = "C:\Users\sk36\.gemini\antigravity\scratch\tools\node-v20.11.0-win-x64;" + $env:Path
$env:PORT = 3000

Write-Host "Frontend başlatılıyor..."
npm run dev
