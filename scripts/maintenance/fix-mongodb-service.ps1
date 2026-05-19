# Script de instalación LIMPIA de MongoDB como servicio
# FUERZA eliminación del servicio anterior y crea uno nuevo

# Auto-elevarse a admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "🔐 Solicitando permisos de ADMINISTRADOR..." -ForegroundColor Yellow
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments -Wait
    exit 0
}

$rootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dataPath = Join-Path $rootPath "data\db"
$logPath = Join-Path $rootPath "data\logs"
$configPath = Join-Path $rootPath "mongod.cfg"

Write-Host "🧹 Limpieza completa del servicio MongoDB..." -ForegroundColor Cyan

# 1. Detener servicio si existe
Stop-Service -Name MongoDB -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Eliminar servicio
& sc.exe delete MongoDB 2>&1 | Out-Null
Start-Sleep -Seconds 2

# 3. Matar cualquier proceso mongod
Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host "✅ Limpieza completada" -ForegroundColor Green

# 4. Crear directorios
if (-not (Test-Path $dataPath)) {
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
}
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
}

# 5. Crear archivo de configuración
$configContent = @"
systemLog:
  destination: file
  path: $logPath\mongod.log
  logAppend: true
storage:
  dbPath: $dataPath
net:
  bindIp: 127.0.0.1
  port: 27017
"@
Set-Content -Path $configPath -Value $configContent
Write-Host "✅ Configuración creada: $configPath" -ForegroundColor Green

# 6. Crear servicio con sc.exe
Write-Host "📦 Creando servicio MongoDB..." -ForegroundColor Cyan
$binPath = "`"$mongoPath`" --config `"$configPath`" --service"
& sc.exe create MongoDB binPath= $binPath DisplayName= "MongoDB ShieldTrack" start= auto

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error creando servicio (código $LASTEXITCODE)" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Servicio creado" -ForegroundColor Green
Start-Sleep -Seconds 2

# 7. Iniciar servicio
Write-Host "🚀 Iniciando servicio..." -ForegroundColor Cyan
& net start MongoDB

Start-Sleep -Seconds 3

# 8. Verificar
$service = Get-Service MongoDB -ErrorAction SilentlyContinue
if ($service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "✅✅✅ MONGODB INSTALADO Y CORRIENDO ✅✅✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
    Write-Host "   net start MongoDB" -ForegroundColor Gray
    Write-Host "   net stop MongoDB" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  Servicio instalado pero no está corriendo" -ForegroundColor Yellow
    Write-Host "Ver log en: $logPath\mongod.log" -ForegroundColor Yellow
}

pause
