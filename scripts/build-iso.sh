#!/bin/bash
# build-iso.sh — Construye la ISO de Hydra OS usando live-build
# Uso: sudo bash scripts/build-iso.sh [--clean]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${REPO_ROOT}/build"
OUTPUT_ISO="${BUILD_DIR}/hydra-os-amd64.iso"
LOGFILE="${BUILD_DIR}/build.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script debe ejecutarse como root (sudo)."
        exit 1
    fi
}

check_deps() {
    local missing=()
    for dep in live-build debootstrap squashfs-tools xorriso grub-efi-amd64-bin; do
        if ! dpkg -s "$dep" &>/dev/null; then
            missing+=("$dep")
        fi
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
        info "Instalando dependencias faltantes: ${missing[*]}"
        apt-get update -q
        apt-get install -y "${missing[@]}"
    fi
}

copy_calamares_config() {
    info "Copiando configuración de Calamares al chroot..."
    local dest="${BUILD_DIR}/config/includes.chroot/etc/calamares.hydra"
    mkdir -p "$dest"
    cp -r "${REPO_ROOT}/calamares/." "$dest/"
}

copy_kde_config() {
    info "Copiando configuración KDE al skel del chroot..."
    local dest="${BUILD_DIR}/config/includes.chroot/etc/skel"
    mkdir -p "$dest"
    cp -r "${REPO_ROOT}/kde-config/skel/." "$dest/"
}

build() {
    info "Iniciando build de Hydra OS..."
    info "Log en: ${LOGFILE}"

    cd "$BUILD_DIR"
    lb clean 2>&1 | tee -a "$LOGFILE"
    lb config 2>&1 | tee -a "$LOGFILE"
    lb build 2>&1 | tee -a "$LOGFILE"

    if [[ -f "${BUILD_DIR}/hydra-os-amd64.hybrid.iso" ]]; then
        mv "${BUILD_DIR}/hydra-os-amd64.hybrid.iso" "$OUTPUT_ISO"
        info "ISO generada: ${OUTPUT_ISO}"
        info "Tamaño: $(du -sh "$OUTPUT_ISO" | cut -f1)"
    else
        error "No se encontró la ISO generada. Revisar ${LOGFILE}"
        exit 1
    fi
}

main() {
    check_root
    info "=== Hydra OS ISO Builder ==="
    info "Fecha: $(date)"

    if [[ "${1:-}" == "--clean" ]]; then
        info "Limpiando build anterior..."
        cd "$BUILD_DIR" && lb clean --purge
    fi

    check_deps
    copy_calamares_config
    copy_kde_config
    build

    info "=== Build completado ==="
}

main "$@"
