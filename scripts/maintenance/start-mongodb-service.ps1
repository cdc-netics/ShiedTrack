# Script para iniciar el servicio MongoDB
# Se auto-eleva a ADMINISTRADOR si es necesario

# Verificar admin y AUTO-ELEVARSE si es necesario
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "🔐 Solicitando permisos de ADMINISTRADOR..." -ForegroundColor Yellow
    
    # Re-ejecutar como admin
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments -Wait
    
    exit 0
}

Write-Host "🚀 Iniciando servicio MongoDB..." -ForegroundColor Cyan

$service = Get-Service MongoDB -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "❌ Servicio MongoDB no instalado" -ForegroundColor Red
    Write-Host "📝 Ejecuta: .\install-mongodb-service.ps1" -ForegroundColor Yellow
    exit 1
}

if ($service.Status -eq 'Running') {
    Write-Host "✅ MongoDB ya está corriendo" -ForegroundColor Green
    exit 0
}

Start-Service MongoDB
Start-Sleep -Seconds 2

$service = Get-Service MongoDB
if ($service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "✅✅✅ MongoDB INICIADO ✅✅✅" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Error al iniciar servicio" -ForegroundColor Red
    Write-Host "Estado: $($service.Status)" -ForegroundColor Yellow
}
