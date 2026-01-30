# Script para iniciar MongoDB con privilegios de administrador
# Uso: .\start-mongo-admin.ps1

$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dataPath = "C:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\db"

# Verificar si ya está corriendo
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "✅ MongoDB ya está corriendo (PID: $($mongoProcess.Id))" -ForegroundColor Green
    exit 0
}

# Verificar si se está ejecutando como admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Elevando privilegios a Administrador..." -ForegroundColor Yellow
    
    # Re-ejecutar este script como admin
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments -WindowStyle Hidden
    
    Write-Host "✅ Script ejecutándose como Administrador en segundo plano" -ForegroundColor Green
    exit 0
}

# Ya somos admin, iniciar MongoDB
Write-Host "🚀 Iniciando MongoDB como Administrador..." -ForegroundColor Cyan

if (-not (Test-Path $mongoPath)) {
    Write-Host "❌ MongoDB no encontrado en: $mongoPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $dataPath)) {
    Write-Host "📁 Creando directorio de datos: $dataPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
}

# Iniciar MongoDB en ventana separada con Admin
$proc = Start-Process -FilePath $mongoPath `
    -ArgumentList "--dbpath `"$dataPath`" --bind_ip 127.0.0.1 --port 27017" `
    -WindowStyle Normal `
    -PassThru

if ($proc) {
    Write-Host "✅ MongoDB iniciado (PID: $($proc.Id))" -ForegroundColor Green
    Write-Host "📝 Para detener: taskkill /PID $($proc.Id) /F" -ForegroundColor Gray
} else {
    Write-Host "❌ Error al iniciar MongoDB" -ForegroundColor Red
    exit 1
}
