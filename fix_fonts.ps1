$file = "c:\Users\sk36\.gemini\antigravity\scratch\icsistemler-platformu\frontend\app\audit\staff\[id]\ozgecmis\page.tsx"
$content = [System.IO.File]::ReadAllText($file)
$content = $content -replace 'text-\[13px\]', 'text-[14px]'
$content = $content -replace 'text-\[12px\]', 'text-[13px]'
$content = $content -replace 'text-\[11px\]', 'text-[12px]'
$content = $content -replace 'text-\[10px\]', 'text-[11px]'
$content = $content -replace 'text-\[9px\]', 'text-[10px]'
$content = $content -replace 'text-\[8px\]', 'text-[9px]'
[System.IO.File]::WriteAllText($file, $content)
Write-Host "Done - all pixel font sizes increased by 1px"
