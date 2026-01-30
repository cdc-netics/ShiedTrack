$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dbPath = "c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\db"
$logPath = "c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\mongod.log"

if (-not (Test-Path $mongoPath)) {
    Write-Host "Error: Mongod executable not found at $mongoPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $dbPath)) {
    New-Item -ItemType Directory -Force -Path $dbPath
}

Write-Host "Starting MongoDB..." -ForegroundColor Green
Start-Process -FilePath $mongoPath -ArgumentList "--dbpath `"$dbPath`" --port 27017" -WindowStyle Minimized

Write-Host "MongoDB started in background (minimized window)." -ForegroundColor Green
Start-Sleep -Seconds 5
