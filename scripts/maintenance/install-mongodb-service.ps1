# Script para instalar MongoDB como servicio de Windows
# Se auto-eleva a ADMINISTRADOR si es necesario

$rootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dataPath = Join-Path $rootPath "data\db"
$logPath = Join-Path $rootPath "data\logs"
$configPath = Join-Path $rootPath "mongod.cfg"

# Verificar admin y AUTO-ELEVARSE si es necesario
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "🔐 Solicitando permisos de ADMINISTRADOR..." -ForegroundColor Yellow
    Write-Host "   (Acepta el UAC que aparecerá)" -ForegroundColor Cyan
    
    # Re-ejecutar como admin
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments -Wait
    
    # Esperar a que termine
    Write-Host "✅ Script ejecutado con privilegios" -ForegroundColor Green
    exit 0
}

Write-Host "🔧 Instalando MongoDB como Servicio de Windows..." -ForegroundColor Cyan

# Crear directorios
if (-not (Test-Path $dataPath)) {
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
    Write-Host "✅ Directorio de datos creado" -ForegroundColor Green
}

if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
    Write-Host "✅ Directorio de logs creado" -ForegroundColor Green
}

# Crear archivo de configuración
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
Write-Host "✅ Archivo de configuración creado" -ForegroundColor Green

# Verificar si el servicio ya existe
$existingService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "⚠️  Servicio MongoDB ya existe, reconfigurando..." -ForegroundColor Yellow
    Stop-Service -Name MongoDB -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # Eliminar servicio existente
    & sc.exe delete MongoDB
    Start-Sleep -Seconds 2
    Write-Host "✅ Servicio anterior eliminado" -ForegroundColor Green
}

# Instalar como servicio usando sc.exe (más control que --install)
Write-Host "📦 Creando servicio MongoDB..." -ForegroundColor Cyan
$binPath = "`"$mongoPath`" --config `"$configPath`" --service"
& sc.exe create MongoDB binPath= $binPath DisplayName= "MongoDB ShieldTrack" start= auto

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Servicio creado correctamente" -ForegroundColor Green
    
    # Iniciar el servicio
    Write-Host "🚀 Iniciando servicio..." -ForegroundColor Cyan
    Start-Service -Name MongoDB
    
    Start-Sleep -Seconds 3
    $status = Get-Service -Name MongoDB
    
    if ($status.Status -eq 'Running') {
        Write-Host "" -ForegroundColor Green
        Write-Host "✅✅✅ MongoDB INSTALADO Y CORRIENDO ✅✅✅" -ForegroundColor Green
        Write-Host "" -ForegroundColor Green
        Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
        Write-Host "   Start-Service MongoDB   # Iniciar" -ForegroundColor Gray
        Write-Host "   Stop-Service MongoDB    # Detener" -ForegroundColor Gray
        Write-Host "   Restart-Service MongoDB # Reiniciar" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Servicio instalado pero no está corriendo" -ForegroundColor Yellow
        Write-Host "   Estado: $($status.Status)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Error al instalar servicio (Código: $LASTEXITCODE)" -ForegroundColor Red
}
