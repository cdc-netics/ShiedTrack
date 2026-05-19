# =========================================
# 🛡️ SHIELDTRACK - MASTER STARTUP SCRIPT
# =========================================

$ErrorActionPreference = "Stop"
$rootPath = $PSScriptRoot
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       🛡️  INICIANDO SHIELDTRACK 🛡️            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Limpiar procesos anteriores
Write-Host "🧹 Limpiando procesos de Node anteriores..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Verificar/Iniciar MongoDB
Write-Host "🔍 Verificando estado de MongoDB..." -ForegroundColor Cyan
$mongoRunning = $false

# Intento rápido de conexión
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("localhost", 27017)
    $mongoRunning = $true
    $tcp.Close()
    Write-Host "✅ MongoDB ya está corriendo." -ForegroundColor Green
} catch {
    $mongoRunning = $false
}

if (-not $mongoRunning) {
    Write-Host "❌ MongoDB no está disponible. Intentando iniciar..." -ForegroundColor Yellow
    
    # Intentar como servicio
    try {
        $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
        if ($service) {
            Write-Host "🚀 Iniciando servicio MongoDB..." -ForegroundColor Green
            Start-Service -Name "MongoDB"
            Start-Sleep -Seconds 5
            $mongoRunning = $true
        }
    } catch {}

    # Intentar directo si falla servicio
    if (-not $mongoRunning) {
        Write-Host "🚀 Intentando ejecutar mongod directamente..." -ForegroundColor Green
        $commonPaths = @(
            "C:\Program Files\MongoDB\Server\*\bin\mongod.exe",
            "C:\Program Files (x86)\MongoDB\Server\*\bin\mongod.exe"
        )
        foreach ($path in $commonPaths) {
            $mongoExe = Get-Item -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($mongoExe) {
                $dataPath = Join-Path $rootPath "data\db"
                if (-not (Test-Path $dataPath)) { New-Item -ItemType Directory -Force -Path $dataPath | Out-Null }
                Start-Process -FilePath $mongoExe.FullName -ArgumentList "--dbpath `"$dataPath`"" -WindowStyle Minimized
                Start-Sleep -Seconds 5
                $mongoRunning = $true
                break
            }
        }
    }
}

# 3. Iniciar Backend (Nueva Ventana)
Write-Host "📦 Iniciando Backend..." -ForegroundColor Green
$backendScript = @"
`$Host.UI.RawUI.WindowTitle = '🛡️ ShieldTrack - BACKEND'
cd '$backendPath'
Write-Host '--- ShieldTrack Backend ---' -ForegroundColor Cyan
if (-not (Test-Path 'node_modules')) { npm install }
node dist/main.js
Read-Host 'Presiona Enter para cerrar'
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

Start-Sleep -Seconds 5

# 4. Iniciar Frontend (Nueva Ventana)
Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Green
$frontendScript = @"
`$Host.UI.RawUI.WindowTitle = '🛡️ ShieldTrack - FRONTEND'
cd '$frontendPath'
Write-Host '--- ShieldTrack Frontend ---' -ForegroundColor Cyan
npm start
Read-Host 'Presiona Enter para cerrar'
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# 5. Verificación Final
Write-Host ""
Write-Host "⏳ Verificando disponibilidad de servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

$backendOk = $false
$frontendOk = $false

for ($i=1; $i -le 6; $i++) {
    if (-not $backendOk) { $backendOk = Test-NetConnection localhost -Port 3000 -WarningAction SilentlyContinue -InformationLevel Quiet }
    if (-not $frontendOk) { $frontendOk = Test-NetConnection localhost -Port 4200 -WarningAction SilentlyContinue -InformationLevel Quiet }
    if ($backendOk -and $frontendOk) { break }
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor White
if ($backendOk -and $frontendOk) {
    Write-Host " ✅ SISTEMA OPERATIVO" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:4200"
    Write-Host "   Backend:  http://localhost:3000"
} else {
    Write-Host " ⚠️ ALGUNOS SERVICIOS AÚN NO RESPONDEN" -ForegroundColor Yellow
    Write-Host "   Revisa las ventanas abiertas."
}
Write-Host "═══════════════════════════════════════════"
Write-Host ""
Write-Host "Presiona cualquier tecla para finalizar este script..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
