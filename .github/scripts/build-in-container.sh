#!/bin/bash
# Ejecutado dentro de un contenedor debian:bookworm --privileged
# por GitHub Actions. No invocar directamente.
set -uxo pipefail
export DEBIAN_FRONTEND=noninteractive
export LC_ALL=C

step() { echo -e "\n\033[1;36m═══ $* ═══\033[0m\n"; }
err()  { echo -e "\n\033[1;31m✗ $*\033[0m\n" >&2; }

trap 'err "FALLO en línea $LINENO. Espacio actual:"; df -h / 2>/dev/null; exit 1' ERR

# ──────────────────────────────────────────────
step "Estado inicial del contenedor"
df -h /
free -h
nproc
cat /etc/debian_version

# ──────────────────────────────────────────────
step "Configurando repositorios Debian"
cat > /etc/apt/sources.list << 'SOURCES'
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
SOURCES

apt-get update -q

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
    git

dpkg -l live-build | tail -1

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
lb config 2>&1 | tee config.log

step "Ejecutando lb build (puede tardar 30-60 min)"
# pipefail desactivado aquí: lb build puede salir con códigos raros
# que no son fallos críticos si la ISO se generó
set +e
lb build 2>&1 | tee build.log
LB_EXIT=$?
set -e

echo "lb build terminó con código: $LB_EXIT"
echo "Espacio tras el build:"
df -h /

# ──────────────────────────────────────────────
step "Buscando ISO generada"
ls -la *.iso *.img 2>/dev/null || true

ISO=$(find . -maxdepth 2 -name "*.iso" -type f 2>/dev/null | head -1)

if [[ -z "$ISO" ]]; then
    err "No se generó ninguna ISO. Volcado de error:"
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
