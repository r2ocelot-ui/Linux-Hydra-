@echo off
REM Hydra Traffic Lab R39 — arranque en Windows
REM Requiere Node.js 20+ instalado (https://nodejs.org).

cd /d "%~dp0backend"

REM Instalar dependencias la primera vez
if not exist "node_modules" (
    echo Primera ejecucion: instalando dependencias (1-2 minutos)...
    call npm install --omit=dev --no-audit --no-fund
    if errorlevel 1 (
        echo Error instalando dependencias. Revisa que Node.js este instalado.
        pause
        exit /b 1
    )
)

echo.
echo ====================================================
echo  Hydra Traffic Lab R39 - arrancando backend...
echo ====================================================
echo.
echo Abre el navegador en:  http://localhost:3001
echo.
echo Para parar el servidor: cierra esta ventana o pulsa Ctrl+C.
echo.

node server.js
