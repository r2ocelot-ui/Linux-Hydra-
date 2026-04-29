#!/bin/bash
# setup-gaming.sh — Configura el entorno de gaming completo
# Incluye Steam, Lutris, MangoHud, GameMode y optimizaciones
# Uso: bash scripts/setup-gaming.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info() { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
step() { echo -e "${CYAN}[→]${NC} $*"; }

step "Habilitando arquitectura i386 para Steam y Wine..."
sudo dpkg --add-architecture i386
sudo apt-get update -q

step "Instalando Steam..."
sudo apt-get install -y steam steam-devices

step "Instalando Lutris..."
sudo apt-get install -y lutris

step "Instalando Wine..."
sudo apt-get install -y wine wine64 wine32 winetricks

step "Instalando MangoHud..."
sudo apt-get install -y mangohud mangohud:i386 goverlay

step "Instalando GameMode..."
sudo apt-get install -y gamemode libgamemode0 libgamemodeauto0

step "Instalando Vulkan..."
sudo apt-get install -y vulkan-tools mesa-vulkan-drivers mesa-vulkan-drivers:i386

step "Instalando herramientas de GPU..."
sudo apt-get install -y mesa-utils vainfo vdpauinfo

step "Instalando Discord..."
sudo apt-get install -y discord || {
    warn "Discord no está en repos. Descargando .deb oficial..."
    wget -q --show-progress "https://discord.com/api/download?platform=linux&format=deb" -O /tmp/discord.deb
    sudo dpkg -i /tmp/discord.deb || sudo apt-get install -fy
    rm /tmp/discord.deb
}

step "Instalando RetroArch..."
sudo apt-get install -y retroarch libretro-core-info

step "Configurando límites del sistema para gaming..."
sudo tee /etc/security/limits.d/99-gaming.conf > /dev/null << 'EOF'
*    soft    nofile    1048576
*    hard    nofile    1048576
*    soft    memlock   unlimited
*    hard    memlock   unlimited
EOF

sudo tee /etc/sysctl.d/99-hydra-gaming.conf > /dev/null << 'EOF'
vm.swappiness = 10
vm.max_map_count = 2147483642
kernel.sched_autogroup_enabled = 0
EOF

sudo sysctl --system -q

step "Añadiendo usuario al grupo gamemode..."
sudo usermod -aG gamemode "$USER" || true

info "=== Entorno gaming configurado ==="
echo ""
echo "  Steam:    Busca en el menú de aplicaciones o ejecuta 'steam'"
echo "  Lutris:   'lutris' en terminal o menú"
echo "  MangoHud: Prefija tu juego con 'mangohud %command%' en Steam"
echo "  GameMode: Prefija con 'gamemoderun %command%' en Steam"
echo ""
warn "Reinicia la sesión para aplicar cambios de grupo y sysctl."
