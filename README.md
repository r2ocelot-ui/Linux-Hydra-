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

## Descargar la ISO

### Opción 1 — Releases oficiales (recomendado)

Ir a [Releases](https://github.com/r2ocelot-ui/Linux-Hydra-/releases) y
descargar `hydra-os-amd64.iso` de la última versión.

### Opción 2 — Última build automática

Cada commit en `main` o ramas `claude/*` genera una ISO automáticamente vía
GitHub Actions. Para descargarla:

1. Ir a la pestaña **Actions** del repositorio
2. Abrir el último workflow `Build Hydra OS ISO` que esté en verde
3. Bajar al final y descargar el artefacto `hydra-os-amd64-iso`

### Opción 3 — Construirla localmente

Requiere Debian Bookworm o Ubuntu con `live-build`:

```bash
sudo apt install live-build debootstrap squashfs-tools xorriso
git clone https://github.com/r2ocelot-ui/Linux-Hydra-
cd Linux-Hydra-
sudo bash scripts/build-iso.sh
```

La ISO resultante queda en `build/hydra-os-amd64.iso` (~3-4 GB).

## Instalar Hydra OS

1. **Quemar la ISO en un USB** (8 GB+):
   - Windows: [Rufus](https://rufus.ie) — modo GPT/UEFI
   - Mac/Linux: [Balena Etcher](https://etcher.balena.io) o `dd`
2. **Arrancar el PC desde el USB** (BIOS/UEFI: F2/F12/Del según fabricante)
3. **Probar en modo Live** o doble-clic en **"Instalar Hydra OS"**
4. **Calamares** te guía: idioma → teclado → disco → usuario → instalar
5. **Reiniciar** y retirar el USB cuando se indique

## Versión objetivo

**Hydra OS v1.0** — Nombre en clave: *Lernaean*

## Licencia

GPL-3.0 — Ver [LICENSE](LICENSE)
