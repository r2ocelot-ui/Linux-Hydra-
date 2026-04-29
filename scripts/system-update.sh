#!/bin/bash
# system-update.sh — Actualiza todo el sistema: apt, flatpak y firmware
# Uso: sudo bash scripts/system-update.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info() { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

if [[ $EUID -ne 0 ]]; then
    warn "Algunos pasos requieren root. Re-ejecutando con sudo..."
    exec sudo bash "$0" "$@"
fi

info "Actualizando repositorios APT..."
apt-get update -q

info "Actualizando paquetes del sistema..."
apt-get upgrade -y

info "Actualizando firmware (si aplica)..."
apt-get dist-upgrade -y

info "Limpiando paquetes huérfanos..."
apt-get autoremove --purge -y
apt-get clean

if command -v flatpak &>/dev/null; then
    info "Actualizando apps Flatpak..."
    flatpak update --noninteractive -y
fi

if command -v snap &>/dev/null; then
    info "Actualizando snaps..."
    snap refresh
fi

info "=== Sistema actualizado correctamente ==="
