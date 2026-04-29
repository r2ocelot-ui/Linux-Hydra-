# Hydra OS

Distribución Linux basada en Debian Bookworm con KDE Plasma, estilo Windows,
orientada a usuarios normales, gaming, ofimática y workstation.

## Características principales

- Base **Debian 12 Bookworm** (estable)
- Escritorio **KDE Plasma 5** preconfigurado con apariencia Windows
- Instalador gráfico **Calamares**
- Apps esenciales preinstaladas (Firefox, LibreOffice, VLC, etc.)
- Soporte para gaming: Steam, Lutris, Proton, MangoHud
- Drivers multimedia y hardware listos desde el primer arranque
- Actualizaciones de seguridad automáticas

## Estructura del repositorio

```
Linux-Hydra-/
├── build/              # Configuración live-build para generar la ISO
│   ├── auto/           # Scripts de automatización de live-build
│   └── config/         # Listas de paquetes, hooks e includes
├── calamares/          # Configuración del instalador Calamares
│   ├── branding/       # Marca visual del instalador
│   └── modules/        # Módulos de instalación
├── kde-config/         # Configuración KDE Plasma (tema Windows)
│   ├── plasma/         # Look & feel, plasmoids
│   └── skel/           # Archivos de perfil de usuario por defecto
├── scripts/            # Scripts de mantenimiento y post-instalación
├── themes/             # Temas GTK/Qt
└── docs/               # Documentación
```

## Construir la ISO

Requiere Debian Bookworm con `live-build` instalado.

```bash
# Instalar dependencias
sudo apt install live-build calamares debootstrap squashfs-tools xorriso

# Clonar el repositorio
git clone https://github.com/r2ocelot-ui/linux-hydra-
cd linux-hydra-

# Construir la ISO (requiere ~10 GB de espacio y conexión a internet)
cd build
sudo bash ../scripts/build-iso.sh
```

La ISO resultante quedará en `build/hydra-os-amd64.iso`.

## Versión objetivo

**Hydra OS v1.0** — Nombre en clave: *Lernaean*

## Licencia

GPL-3.0 — Ver [LICENSE](LICENSE)
