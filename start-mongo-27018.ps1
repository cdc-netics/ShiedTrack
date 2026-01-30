# Script para ejecutar MongoDB en PUERTO 27018 con MÁXIMOS PRIVILEGIOS
# Auto-eleva y crea tarea programada para mantener MongoDB corriendo

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "🔐 Solicitando permisos de ADMINISTRADOR..." -ForegroundColor Yellow
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments
    exit 0
}

$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$configPath = "C:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\mongod.cfg"

Write-Host "🚀 Iniciando MongoDB en PUERTO 27018 con privilegios máximos..." -ForegroundColor Cyan

# Matar instancias anteriores
Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Iniciar en ventana separada con START
Start-Process -FilePath $mongoPath `
    -ArgumentList "--config `"$configPath`"" `
    -WindowStyle Normal `
    -Verb RunAs

Start-Sleep -Seconds 5

# Verificar
$proc = Get-Process mongod -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host ""
    Write-Host "✅✅✅ MONGODB CORRIENDO (PID: $($proc.Id)) ✅✅✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 IMPORTANTE: Actualiza el backend para usar:" -ForegroundColor Yellow
    Write-Host "   MONGO_URI=mongodb://localhost:27018/shieldtrack" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "❌ Error - MongoDB no está corriendo" -ForegroundColor Red
    Write-Host "Ver log en: C:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\logs\mongod.log" -ForegroundColor Yellow
}

pause
