# ShieldTrack - Script de Inicio Completo
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " ShieldTrack - Inicio Completo" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dbPath = "c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\db"

# Verificar si MongoDB esta corriendo
$mongoRunning = Get-Process -Name mongod -ErrorAction SilentlyContinue

if ($mongoRunning) {
    Write-Host "[OK] MongoDB ya esta corriendo (PID: $($mongoRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "[INFO] Iniciando MongoDB..." -ForegroundColor Yellow
    
    if (Test-Path $mongoPath) {
        Start-Process -FilePath $mongoPath -ArgumentList "--dbpath `"$dbPath`" --port 27017" -WindowStyle Minimized
        Write-Host "[INFO] Esperando 8 segundos a que MongoDB este listo..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
        Write-Host "[OK] MongoDB iniciado" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No se encontro MongoDB en: $mongoPath" -ForegroundColor Red
        Write-Host "        Instala MongoDB 8.2 o ajusta la ruta" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "[INFO] Iniciando backend NestJS..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
node dist/main.js

Write-Host ""
pause
