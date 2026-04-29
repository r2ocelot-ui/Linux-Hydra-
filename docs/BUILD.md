# Construir la ISO de Hydra OS

## Requisitos del sistema de build

- OS: Debian 12 Bookworm (recomendado) o Ubuntu 22.04+
- Espacio en disco: mínimo 20 GB libres
- RAM: mínimo 4 GB
- Conexión a internet estable
- Permisos de root (sudo)

## Dependencias

```bash
sudo apt-get install -y \
    live-build \
    debootstrap \
    squashfs-tools \
    xorriso \
    grub-efi-amd64-bin \
    grub-pc-bin \
    syslinux-common \
    isolinux \
    calamares
```

## Pasos para construir

### Build completo (primera vez)

```bash
git clone https://github.com/r2ocelot-ui/linux-hydra-
cd linux-hydra-
sudo bash scripts/build-iso.sh
```

### Rebuild limpio

```bash
sudo bash scripts/build-iso.sh --clean
```

### Build manual paso a paso

```bash
cd build/
sudo lb clean
sudo lb config
sudo lb build
```

## Estructura del build

| Directorio | Descripción |
|---|---|
| `build/auto/` | Scripts de automatización de live-build |
| `build/config/package-lists/` | Listas de paquetes APT a instalar |
| `build/config/hooks/normal/` | Scripts ejecutados dentro del chroot |
| `build/config/includes.chroot/` | Archivos copiados directamente al sistema |

## Personalizar paquetes

Editar los archivos en `build/config/package-lists/`:

- `base.list.chroot` — kernel, firmware, herramientas base
- `kde.list.chroot` — KDE Plasma y apps del escritorio
- `apps.list.chroot` — aplicaciones de usuario
- `gaming.list.chroot` — Steam, Lutris, Wine, etc.
- `workstation.list.chroot` — herramientas de desarrollo

## Tiempos estimados de build

| Conexión | Tiempo aproximado |
|---|---|
| 100 Mbps | ~45 minutos |
| 500 Mbps | ~20 minutos |
| 1 Gbps   | ~12 minutos |

(Depende también de la CPU y velocidad del disco)

## Resultado

La ISO se genera en `build/hydra-os-amd64.iso` (~3-4 GB).

### Verificar la ISO

```bash
md5sum build/hydra-os-amd64.iso
sha256sum build/hydra-os-amd64.iso
```

### Crear USB booteable

```bash
# Reemplazar /dev/sdX con tu USB (verificar con lsblk)
sudo dd if=build/hydra-os-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync

# Alternativa con herramienta gráfica: KDE ISO Image Writer
```
