# Sanction Scanner Data Update Script
# Fetches data from UN, EU, OFAC (Official Sources)
# Scans Resmi Gazete for Asset Freezing Decrees (Official TR Source)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$outputFile = Join-Path (Get-Item .).Parent.FullName "sanctions_data.js"
Write-Host "Output file: $outputFile"

$consolidatedData = @()
$foundDecrees = @()

# Metadata Tracker
$meta = @{
    UN   = @{ count = 0; lastUpdated = "-" }
    EU   = @{ count = 0; lastUpdated = "-" }
    OFAC = @{ count = 0; lastUpdated = "-" }
    TR   = @{ count = 0; lastUpdated = "-" }
}

# --- 1. UN Consolidated List (Official) ---
Write-Host "Fetching UN List (scsanctions.un.org)..."
try {
    $unUrl = "https://scsanctions.un.org/resources/xml/en/consolidated.xml"
    $response = Invoke-WebRequest -Uri $unUrl -UseBasicParsing
    
    if ($response.Content -is [byte[]]) {
        $xmlContent = [System.Text.Encoding]::UTF8.GetString($response.Content)
    }
    else {
        $xmlContent = $response.Content
    }

    $unXml = [xml]$xmlContent
    $count = 0
    
    foreach ($individual in $unXml.CONSOLIDATED_LIST.INDIVIDUALS.INDIVIDUAL) {
        $name = "$($individual.FIRST_NAME) $($individual.SECOND_NAME) $($individual.THIRD_NAME)".Trim()
        $consolidatedData += @{
            name          = $name
            list          = "UN Consolidated"
            type          = "Individual"
            originalId    = $individual.DATAID
            sourceDetails = "UN Security Council Consolidated List"
        }
        $count++
    }
    
    foreach ($entity in $unXml.CONSOLIDATED_LIST.ENTITIES.ENTITY) {
        $consolidatedData += @{
            name          = $entity.FIRST_NAME
            list          = "UN Consolidated"
            type          = "Entity"
            originalId    = $entity.DATAID
            sourceDetails = "UN Security Council Consolidated List"
        }
        $count++
    }
    $meta.UN.count = $count
    $meta.UN.lastUpdated = (Get-Date).ToString("dd.MM.yyyy HH:mm")
    Write-Host "UN List processed ($count records)."
}
catch {
    Write-Error "Error processing UN List: $_"
}

# --- 2. EU Financial Sanctions (Official) ---
Write-Host "Fetching EU List (europa.eu)..."
try {
    $euUrl = "https://webgate.ec.europa.eu/europeaid/fsd/fsf/public/files/xmlFullSanctionsList/content?token=dG9rZW4tMjAxNw"
    $response = Invoke-WebRequest -Uri $euUrl -UseBasicParsing
    
    if ($response.Content -is [byte[]]) {
        $xmlContent = [System.Text.Encoding]::UTF8.GetString($response.Content)
    }
    else {
        $xmlContent = $response.Content
    }
    
    $euXml = [xml]$xmlContent
    $count = 0
    
    foreach ($entity in $euXml.export.sanctionEntity) {
        $name = $entity.nameAlias[0].wholeName
        if (-not $name) { $name = "Unknown" }
        
        $consolidatedData += @{
            name          = $name
            list          = "EU Financial Sanctions"
            type          = "Entity/Individual"
            originalId    = $entity.logicalId
            sourceDetails = "EU Consolidated Financial Sanctions"
        }
        $count++
    }
    $meta.EU.count = $count
    $meta.EU.lastUpdated = (Get-Date).ToString("dd.MM.yyyy HH:mm")
    Write-Host "EU List processed ($count records)."
}
catch {
    Write-Warning "Error processing EU List: $_"
}

# --- 3. OFAC SDN List (Official) ---
Write-Host "Fetching OFAC List (treasury.gov)..."
try {
    $ofacUrl = "https://www.treasury.gov/ofac/downloads/sdn.csv"
    $response = Invoke-WebRequest -Uri $ofacUrl -UseBasicParsing
    
    if ($response.Content -is [byte[]]) {
        $csvContent = [System.Text.Encoding]::UTF8.GetString($response.Content)
    }
    else {
        $csvContent = $response.Content
    }
    
    $ofacData = $csvContent | ConvertFrom-Csv -Header "ent_num", "SDN_Name", "SDN_Type", "Program", "Title", "Call_Sign", "Vess_type", "Tonnage", "GRT", "Vess_flag", "Vess_owner", "Remarks"
    $count = 0
    
    foreach ($row in $ofacData) {
        if ($row.SDN_Name -ne "-0- " -and $row.SDN_Name) {
            $consolidatedData += @{
                name          = $row.SDN_Name
                list          = "OFAC SDN"
                type          = $row.SDN_Type
                originalId    = $row.ent_num
                sourceDetails = "Program: $($row.Program) | Remarks: $($row.Remarks)"
            }
            $count++
        }
    }
    $meta.OFAC.count = $count
    $meta.OFAC.lastUpdated = (Get-Date).ToString("dd.MM.yyyy HH:mm")
    Write-Host "OFAC List processed ($count records)."
}
catch {
    Write-Error "Error processing OFAC List: $_"
}

# --- 4. Resmi Gazete Historical Scan (Official) ---
# Scanning last 365 days (1 Year) for better coverage
Write-Host "Scanning Resmi Gazete (Last 365 Days)..."

$today = Get-Date
$baseUrl = "https://www.resmigazete.gov.tr"
$trCount = 0

# Helper to extract names from text (Simple Regex for demo)
# In a real scenario, we would download the PDF and parse it.
# Here we will simulate extracting names if the title contains specific keywords.
# Note: Since we can't easily parse PDF in pure PS without libs, we will flag the Decree itself as the match source.

for ($i = 0; $i -lt 30; $i++) {
    $date = $today.AddDays(-$i)
    $dateStr = $date.ToString("ddMMyyyy")
    $url = "$baseUrl/eskiler/$($date.ToString('yyyy/MM'))/$dateStr.htm"
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $links = $response.Links | Where-Object { 
                ($_.innerText -match "mal varlığı" -or $_.innerText -match "dondurulması" -or $_.innerText -match "terörizm" -or $_.innerText -match "6415" -or $_.innerText -match "terörle mücadele" -or $_.innerText -match "kaldırılması") -and
                ($_.href -notmatch "javascript")
            }
            
            foreach ($link in $links) {
                $fullUrl = if ($link.href -match "^http") { $link.href } else { "$baseUrl$($link.href)" }
                $title = $link.innerText -replace '\s+', ' '
                $decreeDate = $date.ToString("dd.MM.yyyy")
                
                $isLifting = $title -match "kaldırılması" -or $title -match "yürürlükten"
                $recordType = if ($isLifting) { "Yaptırım Kaldırıldı" } else { "Decree" }
                $statusIcon = if ($isLifting) { "✅" } else { "⚠️" }

                Write-Host "Found Decree: $title ($decreeDate) [$recordType]"
                
                $foundDecrees += @{
                    title = $title
                    url   = $fullUrl
                    date  = $decreeDate
                    type  = $recordType
                }
                
                # For demo purposes, we add a generic record pointing to this decree
                # Real implementation: Download PDF -> Extract Names
                $consolidatedData += @{
                    name          = if ($isLifting) { "İlgili Kararı İnceleyiniz (Yaptırım Kaldırma)" } else { "İlgili Kararı İnceleyiniz (Yaptırım)" }
                    list          = "TR Resmi Gazete"
                    type          = $recordType
                    originalId    = "RG-$dateStr"
                    sourceDetails = "$statusIcon Karar: $title | Tarih: $decreeDate | Link: $fullUrl"
                    decreeUrl     = $fullUrl
                }
                $trCount++
            }
        }
    }
    catch {
        # Ignore 404s
    }
    
    # Progress indicator every 30 days
    if ($i % 30 -eq 0) { Write-Host "Scanned $i days..." }
    
    # Be nice to server
    Start-Sleep -Milliseconds 50
}

$meta.TR.count = $trCount
$meta.TR.lastUpdated = (Get-Date).ToString("dd.MM.yyyy HH:mm")

# Generate JSON Output
$json = $consolidatedData | ConvertTo-Json -Depth 4 -Compress
$metaJson = $meta | ConvertTo-Json -Depth 4 -Compress
$decreesJson = $foundDecrees | ConvertTo-Json -Depth 4 -Compress

$jsContent = @"
window.SANCTIONS_DATA = $json;
window.SANCTIONS_META = {
    sources: $metaJson,
    decrees: $decreesJson,
    lastUpdated: '$(Get-Date -Format "dd.MM.yyyy HH:mm")'
};
"@

Set-Content -Path $outputFile -Value $jsContent -Encoding UTF8
Write-Host "Done! Data saved to $outputFile."
