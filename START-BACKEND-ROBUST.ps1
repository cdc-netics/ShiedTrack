# Script mejorado para iniciar el backend de ShieldTrack
# Intenta iniciar MongoDB si no está corriendo y luego inicia el servidor

$ErrorActionPreference = "Stop"
$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path | Join-Path -ChildPath "backend"

Write-Host "🔍 Verificando si MongoDB está corriendo..." -ForegroundColor Cyan

# Verificar si MongoDB está disponible
$mongoRunning = $false
try {
    $mongoTest = @"
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
}).then(() => {
    console.log('MONGO_OK');
    mongoose.disconnect();
}).catch(() => {
    console.log('MONGO_FAILED');
});
"@
    
    $mongoTest | node -e "$(Read-Host)" 2>&1 | ForEach-Object {
        if ($_ -eq "MONGO_OK") {
            $mongoRunning = $true
        }
    }
} catch {
    $mongoRunning = $false
}

if (-not $mongoRunning) {
    Write-Host "❌ MongoDB no está disponible. Intentando iniciar..." -ForegroundColor Yellow
    
    # Intentar iniciar MongoDB como servicio de Windows
    try {
        $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
        if ($service -and $service.Status -ne "Running") {
            Write-Host "🚀 Iniciando servicio MongoDB..." -ForegroundColor Green
            Start-Service -Name "MongoDB"
            Start-Sleep -Seconds 3
            Write-Host "✅ MongoDB iniciado correctamente" -ForegroundColor Green
        } elseif ($service -and $service.Status -eq "Running") {
            Write-Host "✅ MongoDB ya está corriendo" -ForegroundColor Green
            $mongoRunning = $true
        }
    } catch {
        Write-Host "⚠️ No se pudo iniciar MongoDB como servicio: $_" -ForegroundColor Yellow
    }
    
    # Si MongoDB aún no está disponible, intentar ejecutar mongod directamente
    if (-not $mongoRunning) {
        try {
            Write-Host "🚀 Intentando ejecutar mongod directamente..." -ForegroundColor Green
            $mongoPath = "mongod"
            
            # Buscar mongod en ubicaciones comunes
            $commonPaths = @(
                "C:\Program Files\MongoDB\Server\*\bin\mongod.exe",
                "C:\Program Files (x86)\MongoDB\Server\*\bin\mongod.exe"
            )
            
            foreach ($path in $commonPaths) {
                $mongoExe = Get-Item -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($mongoExe) {
                    $mongoPath = $mongoExe.FullName
                    break
                }
            }
            
            # Crear directorio de datos si no existe
            $dataPath = "$backendPath\data\db"
            if (-not (Test-Path $dataPath)) {
                New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
            }
            
            $mongoProcess = Start-Process -FilePath $mongoPath `
                -ArgumentList "--dbpath `"$dataPath`"" `
                -NoNewWindow `
                -PassThru
            
            Write-Host "✅ MongoDB iniciado (PID: $($mongoProcess.Id))" -ForegroundColor Green
            Start-Sleep -Seconds 3
            $mongoRunning = $true
        } catch {
            Write-Host "⚠️ No se pudo iniciar MongoDB directamente: $_" -ForegroundColor Yellow
        }
    }
}

if (-not $mongoRunning) {
    Write-Host "⚠️ ADVERTENCIA: MongoDB no está disponible" -ForegroundColor Yellow
    Write-Host "El backend intentará conectarse automáticamente con reintentos..." -ForegroundColor Yellow
}

Write-Host "`n🏗️ Compilando backend..." -ForegroundColor Cyan
Set-Location $backendPath

# Instalar dependencias si es necesario
if (-not (Test-Path "$backendPath\node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Compilar TypeScript
Write-Host "⚙️ Compilando TypeScript..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la compilación" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Iniciando servidor backend..." -ForegroundColor Green
Write-Host "El backend reintentará conectarse a MongoDB automáticamente si es necesario" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

# Iniciar backend
node dist/main.js
