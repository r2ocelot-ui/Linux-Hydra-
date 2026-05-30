#!/usr/bin/env bash
# Hydra Traffic Lab R43 — arranque en Linux/macOS
# Requiere Node.js 20+ instalado.

set -e
cd "$(dirname "$0")/backend"

# Instalar dependencias la primera vez
if [ ! -d "node_modules" ]; then
    echo "Primera ejecución: instalando dependencias (1-2 minutos)..."
    npm install --omit=dev --no-audit --no-fund
fi

echo
echo "===================================================="
echo " Hydra Traffic Lab R43 - arrancando backend..."
echo "===================================================="
echo
echo "Abre el navegador en:  http://localhost:3001"
echo
echo "Para parar el servidor: pulsa Ctrl+C."
echo

exec node server.js
