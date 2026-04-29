#!/bin/bash
# post-install.sh — Configuraciones opcionales post-instalación de Hydra OS
# Ejecutar como usuario normal (no root) después de instalar el sistema
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $*"; }
ask()   { echo -e "${CYAN}[?]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*" >&2; }

confirm() {
    ask "$1 [s/N]: "
    read -r answer
    [[ "$answer" =~ ^[sS]$ ]]
}

setup_flatpak() {
    info "Configurando Flatpak y Flathub..."
    sudo apt-get install -y flatpak plasma-discover-backend-flatpak
    flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
    info "Flatpak configurado. Reinicia la sesión para ver apps en Discover."
}

setup_nvidia() {
    info "Detectando GPU NVIDIA..."
    if lspci | grep -qi nvidia; then
        warn "GPU NVIDIA detectada."
        if confirm "¿Instalar driver NVIDIA propietario (recomendado para gaming)?"; then
            sudo apt-get install -y nvidia-driver nvidia-settings nvidia-smi
            sudo apt-get install -y libvulkan1 libvulkan1:i386
            info "Driver NVIDIA instalado. Reinicia el sistema."
        fi
    else
        info "No se detectó GPU NVIDIA."
    fi
}

setup_amd() {
    info "Detectando GPU AMD/Intel..."
    if lspci | grep -qiE "(amd|radeon|rx [0-9])"; then
        info "GPU AMD detectada. Los drivers AMDGPU ya están incluidos en el kernel."
        if confirm "¿Instalar ROCm (para cómputo GPU con AMD)?"; then
            warn "ROCm requiere descargar paquetes adicionales de AMD (~2 GB)."
            sudo apt-get install -y rocm-hip-libraries
        fi
    fi
}

setup_proton() {
    info "Configurando Proton GE para mejor compatibilidad de juegos..."
    if ! command -v steam &>/dev/null; then
        warn "Steam no está instalado. Instalando..."
        sudo apt-get install -y steam
    fi

    PROTON_DIR="${HOME}/.steam/root/compatibilitytools.d"
    mkdir -p "$PROTON_DIR"

    PROTON_VER="GE-Proton9-25"
    PROTON_URL="https://github.com/GloriousEggroll/proton-ge-custom/releases/download/${PROTON_VER}/${PROTON_VER}.tar.gz"

    if confirm "¿Descargar Proton-GE ${PROTON_VER}? (~500 MB)"; then
        wget -q --show-progress -O "/tmp/${PROTON_VER}.tar.gz" "$PROTON_URL"
        tar -xzf "/tmp/${PROTON_VER}.tar.gz" -C "$PROTON_DIR"
        rm "/tmp/${PROTON_VER}.tar.gz"
        info "Proton-GE instalado en ${PROTON_DIR}/${PROTON_VER}"
        info "Actívalo en Steam > Propiedades del juego > Compatibilidad."
    fi
}

setup_zsh() {
    if confirm "¿Instalar Zsh con Oh My Zsh (terminal mejorada)?"; then
        sudo apt-get install -y zsh
        sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
        chsh -s "$(which zsh)"
        info "Zsh instalado. Abre una nueva terminal para usarlo."
    fi
}

setup_timeshift() {
    info "Configurando Timeshift para copias de seguridad automáticas..."
    if ! dpkg -s timeshift &>/dev/null; then
        sudo apt-get install -y timeshift
    fi
    info "Abre Timeshift desde el menú de aplicaciones para configurar el primer snapshot."
}

print_summary() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}   Hydra OS — Post-instalación lista   ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo "  Pasos recomendados:"
    echo "  1. Reiniciar el sistema si instalaste drivers"
    echo "  2. Abrir Timeshift y crear un snapshot inicial"
    echo "  3. Ejecutar: sudo apt-get update && sudo apt-get upgrade"
    echo ""
}

main() {
    echo -e "${CYAN}"
    echo " _   _           _            ___  ____  "
    echo "| | | |_   _  __| |_ __ __ _ / _ \/ ___| "
    echo "| |_| | | | |/ _\` | '__/ _\` | | | \___ \ "
    echo "|  _  | |_| | (_| | | | (_| | |_| |___) |"
    echo "|_| |_|\__, |\__,_|_|  \__,_|\___/|____/ "
    echo "       |___/                              "
    echo -e "${NC}"
    echo "Script de configuración post-instalación"
    echo ""

    confirm "¿Configurar Flatpak/Flathub?" && setup_flatpak || true
    confirm "¿Verificar y configurar drivers GPU?" && { setup_nvidia; setup_amd; } || true
    confirm "¿Configurar gaming (Proton-GE)?" && setup_proton || true
    confirm "¿Instalar Zsh + Oh My Zsh?" && setup_zsh || true
    setup_timeshift

    print_summary
}

main "$@"
