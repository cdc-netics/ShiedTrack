# Script para iniciar backend con verificacion automatica de MongoDB
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ShieldTrack Backend - Inicio Automatico" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dbPath = "c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\db"
$mongoPort = 27017

# Funcion para verificar si MongoDB esta corriendo
function Test-MongoRunning {
    $mongoProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "[OK] MongoDB ya esta corriendo (PID: $($mongoProcess.Id))" -ForegroundColor Green
        return $true
    }
    return $false
}

# Funcion para verificar si MongoDB responde en el puerto
function Test-MongoConnection {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $mongoPort)
        $tcpClient.Close()
        return $true
    } catch {
        return $false
    }
}

# Verificar y crear directorio de datos si no existe
if (-not (Test-Path $dbPath)) {
    Write-Host "[INFO] Creando directorio de datos..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $dbPath | Out-Null
}

# Verificar si MongoDB esta corriendo
if (-not (Test-MongoRunning)) {
    Write-Host "[INFO] MongoDB no esta corriendo. Iniciando..." -ForegroundColor Yellow
    
    if (-not (Test-Path $mongoPath)) {
        Write-Host "[ERROR] Mongod no encontrado en $mongoPath" -ForegroundColor Red
        Write-Host "        Instala MongoDB o ajusta la ruta en este script" -ForegroundColor Red
        exit 1
    }
    
    # Iniciar MongoDB
    Start-Process -FilePath $mongoPath -ArgumentList "--dbpath `"$dbPath`" --port $mongoPort" -WindowStyle Minimized
    
    # Esperar a que MongoDB este listo
    Write-Host "[INFO] Esperando a que MongoDB este listo..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempts = 0
    $ready = $false
    
    while (-not $ready -and $attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 1
        $attempts++
        
        if (Test-MongoConnection) {
            $ready = $true
            Write-Host "[OK] MongoDB esta listo y respondiendo" -ForegroundColor Green
        } else {
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    }
    
    if (-not $ready) {
        Write-Host ""
        Write-Host "[ERROR] MongoDB no respondio despues de 30 segundos" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
} else {
    # Verificar que este respondiendo
    if (Test-MongoConnection) {
        Write-Host "[OK] MongoDB esta corriendo y respondiendo" -ForegroundColor Green
    } else {
        Write-Host "[WARN] MongoDB esta corriendo pero no responde en puerto $mongoPort" -ForegroundColor Yellow
        Write-Host "       Esperando..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

# Iniciar backend
Write-Host ""
Write-Host "[INFO] Iniciando backend NestJS..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Ejecutar nest start
nest start
