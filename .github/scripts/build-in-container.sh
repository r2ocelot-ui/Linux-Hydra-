#!/bin/bash
# Ejecutado dentro de un contenedor debian:bookworm --privileged
# por GitHub Actions. No invocar directamente.
set -uxo pipefail
export DEBIAN_FRONTEND=noninteractive
export LC_ALL=C

step() { echo -e "\n\033[1;36m═══ $* ═══\033[0m\n"; }
err()  { echo -e "\n\033[1;31m✗ $*\033[0m\n" >&2; }

# ──────────────────────────────────────────────
step "Estado inicial del contenedor"
df -h / || true
awk '/MemTotal|MemAvailable/ {print}' /proc/meminfo || true
nproc || true
cat /etc/debian_version || true

# ──────────────────────────────────────────────
step "Configurando repositorios Debian"
cat > /etc/apt/sources.list << 'SOURCES'
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
SOURCES

apt-get update -q || { err "apt-get update falló"; exit 1; }

# ──────────────────────────────────────────────
step "Instalando dependencias de live-build"
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
    debian-archive-keyring \
    ca-certificates \
    rsync \
    wget \
    git \
    procps \
    coreutils \
    findutils || { err "instalación de dependencias falló"; exit 1; }

dpkg -l live-build | tail -1
which lb && lb --version || true

# ──────────────────────────────────────────────
step "Preparando includes del chroot"
mkdir -p build/config/includes.chroot/etc/calamares.hydra
cp -r calamares/. build/config/includes.chroot/etc/calamares.hydra/

mkdir -p build/config/includes.chroot/etc/skel
cp -r kde-config/skel/. build/config/includes.chroot/etc/skel/

ls -la build/config/package-lists/
echo "Espacio antes del build:"
df -h /

# ──────────────────────────────────────────────
step "Ejecutando lb clean"
cd build
lb clean --purge 2>&1 || true

step "Ejecutando lb config"
if ! lb config 2>&1 | tee config.log; then
    err "lb config falló"
    cat config.log
    exit 1
fi

step "Ejecutando lb build (puede tardar 30-60 min)"
# No abortamos por exit code de lb build — verificamos que la ISO se haya
# generado al final (a veces lb build sale con códigos raros pero la ISO existe)
lb build 2>&1 | tee build.log
LB_EXIT=${PIPESTATUS[0]}

echo ""
echo "lb build terminó con código: $LB_EXIT"
echo "Espacio tras el build:"
df -h /

# ──────────────────────────────────────────────
step "Buscando ISO generada"
ls -la *.iso *.img 2>/dev/null || true

ISO=$(find . -maxdepth 2 -name "*.iso" -type f 2>/dev/null | head -1)

if [[ -z "$ISO" ]]; then
    err "No se generó ninguna ISO. lb build exit code: $LB_EXIT"
    echo ""
    echo "═══ ÚLTIMAS 300 LÍNEAS DEL BUILD.LOG ═══"
    tail -300 build.log 2>/dev/null || echo "(sin build.log)"
    echo ""
    echo "═══ LISTA DE ARCHIVOS GENERADOS ═══"
    ls -la
    exit 1
fi

step "ISO encontrada: $ISO"
mv "$ISO" hydra-os-amd64.iso
ls -lh hydra-os-amd64.iso

sha256sum hydra-os-amd64.iso > hydra-os-amd64.iso.sha256
md5sum    hydra-os-amd64.iso > hydra-os-amd64.iso.md5

step "BUILD COMPLETADO"
cat hydra-os-amd64.iso.sha256
