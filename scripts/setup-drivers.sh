#!/bin/bash
# setup-drivers.sh — Detecta hardware y sugiere/instala drivers
# Uso: sudo bash scripts/setup-drivers.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

if [[ $EUID -ne 0 ]]; then
    error "Ejecutar como root: sudo bash $0"
    exit 1
fi

apt-get update -q

detect_gpu() {
    info "=== Detección de GPU ==="
    local gpu_info
    gpu_info=$(lspci | grep -iE "vga|3d|display")
    echo "$gpu_info"

    if echo "$gpu_info" | grep -qi nvidia; then
        warn "GPU NVIDIA detectada."
        NVIDIA_ID=$(lspci -n | grep -i "10de" | head -1 | awk '{print $3}' | cut -d: -f2)
        info "PCI ID: ${NVIDIA_ID}"

        # Detectar generación para elegir driver correcto
        if apt-cache show nvidia-driver &>/dev/null; then
            info "Instalando nvidia-driver (recomendado)..."
            apt-get install -y nvidia-driver nvidia-settings
            apt-get install -y nvidia-driver:i386 || true
        fi

    elif echo "$gpu_info" | grep -qiE "amd|radeon|rv[0-9]"; then
        info "GPU AMD detectada — usando driver amdgpu (incluido en kernel)"
        apt-get install -y firmware-amd-graphics libgl1-mesa-dri libvulkan1 vulkan-tools
        apt-get install -y libgl1-mesa-dri:i386 libvulkan1:i386 || true

    elif echo "$gpu_info" | grep -qi intel; then
        info "GPU Intel detectada — usando driver i915 (incluido en kernel)"
        apt-get install -y intel-media-va-driver i965-va-driver libvulkan1 vulkan-tools
        apt-get install -y intel-media-va-driver:i386 || true
    fi
}

detect_wifi() {
    info "=== Detección de WiFi ==="
    local wifi_info
    wifi_info=$(lspci | grep -i network || lsusb | grep -i wireless || echo "")

    if [[ -z "$wifi_info" ]]; then
        info "No se detectó adaptador WiFi PCI/USB."
        return
    fi

    echo "$wifi_info"

    if echo "$wifi_info" | grep -qi broadcom; then
        warn "Adaptador Broadcom detectado — instalando driver b43/broadcom-sta"
        apt-get install -y broadcom-sta-dkms
        modprobe wl || true
    elif echo "$wifi_info" | grep -qi "realtek"; then
        info "Realtek — firmware ya incluido (firmware-realtek)"
    elif echo "$wifi_info" | grep -qi "intel"; then
        info "Intel WiFi — firmware ya incluido (firmware-iwlwifi)"
    fi
}

detect_bluetooth() {
    info "=== Bluetooth ==="
    if hciconfig 2>/dev/null | grep -q hci; then
        info "Bluetooth detectado."
        systemctl enable bluetooth
        systemctl start bluetooth
    fi
}

detect_touchpad() {
    info "=== Touchpad/Trackpad ==="
    if lsmod | grep -qi "synaptics\|elan\|i2c_hid"; then
        info "Touchpad detectado — instalando libinput"
        apt-get install -y xserver-xorg-input-libinput
    fi
}

main() {
    info "=== Hydra OS — Configuración de Drivers ==="
    detect_gpu
    detect_wifi
    detect_bluetooth
    detect_touchpad
    info "=== Drivers configurados. Reinicia el sistema. ==="
}

main "$@"
