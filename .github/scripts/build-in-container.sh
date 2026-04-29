#!/bin/bash
# Ejecutado dentro de un contenedor debian:bookworm --privileged
# por GitHub Actions. No invocar directamente.
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

log() { echo -e "\n\033[1;36m=== $* ===\033[0m\n"; }

# ──────────────────────────────────────────────
# 1. Repositorios Debian Bookworm
# ──────────────────────────────────────────────
log "Configurando repositorios"
cat > /etc/apt/sources.list << 'SOURCES'
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
SOURCES

apt-get update -q

# ──────────────────────────────────────────────
# 2. Dependencias de build
# ──────────────────────────────────────────────
log "Instalando dependencias de live-build"
apt-get install -y --no-install-recommends \
    live-build \
    debootstrap \
    squashfs-tools \
    xorriso \
    grub-efi-amd64-bin \
    grub-pc-bin \
    syslinux-common \
    isolinux \
    mtools \
    dosfstools \
    binutils \
    ca-certificates \
    rsync \
    wget \
    git

# ──────────────────────────────────────────────
# 3. Copiar config de Calamares y KDE al chroot
# ──────────────────────────────────────────────
log "Preparando includes del chroot"
mkdir -p build/config/includes.chroot/etc/calamares.hydra
cp -r calamares/. build/config/includes.chroot/etc/calamares.hydra/

mkdir -p build/config/includes.chroot/etc/skel
cp -r kde-config/skel/. build/config/includes.chroot/etc/skel/

# ──────────────────────────────────────────────
# 4. Build
# ──────────────────────────────────────────────
log "Iniciando live-build"
cd build
lb clean --purge 2>/dev/null || true
lb config
lb build 2>&1 | tee build.log

# ──────────────────────────────────────────────
# 5. Localizar y renombrar ISO
# ──────────────────────────────────────────────
log "Finalizando ISO"
ISO=$(find . -maxdepth 1 -name "*.iso" | head -1)
if [[ -z "$ISO" ]]; then
    echo "ERROR: no se generó ninguna ISO. Últimas 150 líneas del log:"
    tail -150 build.log
    exit 1
fi

mv "$ISO" hydra-os-amd64.iso
ls -lh hydra-os-amd64.iso

sha256sum hydra-os-amd64.iso > hydra-os-amd64.iso.sha256
md5sum    hydra-os-amd64.iso > hydra-os-amd64.iso.md5

log "ISO generada correctamente"
cat hydra-os-amd64.iso.sha256
