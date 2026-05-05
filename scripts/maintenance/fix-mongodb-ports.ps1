# Script para LIBERAR puertos reservados por Hyper-V y permitir MongoDB
# Requiere permisos de administrador

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "🔐 Solicitando permisos de ADMINISTRADOR..." -ForegroundColor Yellow
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments -Wait
    exit 0
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  REPARADOR DE PUERTOS MONGO DB" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detener WinNAT
Write-Host "1️⃣  Deteniendo WinNAT..." -ForegroundColor Yellow
net stop winnat 2>&1 | Out-Null
Write-Host "✅ WinNAT detenido" -ForegroundColor Green

# 2. Reservar puerto 27017 para MongoDB
Write-Host "2️⃣  Reservando puerto 27017 para MongoDB..." -ForegroundColor Yellow
netsh int ipv4 add excludedportrange protocol=tcp startport=27017 numberofports=1 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Puerto 27017 reservado para MongoDB" -ForegroundColor Green
} else {
    Write-Host "⚠️  Puerto ya estaba reservado o hubo un problema" -ForegroundColor Yellow
}

# 3. Reservar puerto 27018 también por las dudas
Write-Host "3️⃣  Reservando puerto 27018 (backup)..." -ForegroundColor Yellow
netsh int ipv4 add excludedportrange protocol=tcp startport=27018 numberofports=1 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Puerto 27018 reservado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Puerto ya estaba reservado" -ForegroundColor Yellow
}

# 4. Reiniciar WinNAT
Write-Host "4️⃣  Reiniciando WinNAT..." -ForegroundColor Yellow
net start winnat 2>&1 | Out-Null
Write-Host "✅ WinNAT reiniciado" -ForegroundColor Green

Write-Host ""
Write-Host "✅✅✅ REPARACIÓN COMPLETADA ✅✅✅" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Ahora puedes iniciar MongoDB con:" -ForegroundColor Cyan
Write-Host "   .\start-mongodb-service.ps1" -ForegroundColor White
Write-Host ""
Write-Host "O manualmente:" -ForegroundColor Cyan
Write-Host "   mongod --dbpath .\data\db" -ForegroundColor White
Write-Host ""

pause
