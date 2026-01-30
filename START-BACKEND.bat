@echo off
echo ====================================
echo  ShieldTrack - Inicio Completo
echo ====================================
echo.

REM Verificar si MongoDB esta corriendo
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB ya esta corriendo
) else (
    echo [INFO] Iniciando MongoDB...
    start /MIN "" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "c:\Users\despinoza\OneDrive - synet spa\Hola\Proyectos\ShieldTrack\data\db" --port 27017
    echo [INFO] Esperando 8 segundos a que MongoDB este listo...
    timeout /t 8 /nobreak > nul
    echo [OK] MongoDB iniciado
)

echo.
echo [INFO] Iniciando backend NestJS...
cd /d "%~dp0backend"
call npm start

echo.
pause
