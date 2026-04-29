# Instalar Hydra OS

## Requisitos mínimos

| Componente | Mínimo | Recomendado |
|---|---|---|
| CPU | x86_64, 1.5 GHz | x86_64, 2+ GHz, 4+ núcleos |
| RAM | 2 GB | 8 GB |
| Disco | 20 GB | 50 GB+ SSD |
| GPU | Con soporte KMS | Dedicada con Vulkan |
| Conexión | — | Para actualizaciones post-instalación |

## Crear USB booteable

### En Linux

```bash
# Verificar la unidad USB con: lsblk
sudo dd if=hydra-os-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

### En Windows

Usar [Rufus](https://rufus.ie/) con modo GPT/UEFI.

### En macOS

```bash
diskutil list
sudo dd if=hydra-os-amd64.iso of=/dev/rdiskX bs=4m
```

## Proceso de instalación

1. **Arrancar desde el USB** — Configurar el BIOS/UEFI para arrancar desde USB
2. **Sesión live** — Se cargará el escritorio live de Hydra OS
3. **Iniciar el instalador** — Hacer doble clic en "Instalar Hydra OS" en el escritorio
4. **Bienvenida** — Seleccionar idioma de instalación
5. **Zona horaria** — Seleccionar región y ciudad
6. **Teclado** — Seleccionar disposición de teclado
7. **Particionado** — Elegir modo:
   - *Borrar disco* (recomendado para instalación limpia)
   - *Instalar junto a Windows* (dual boot)
   - *Manual* (usuarios avanzados)
8. **Usuario** — Crear nombre de usuario, contraseña y nombre del equipo
9. **Resumen** — Revisar configuración
10. **Instalación** — Esperar ~10-20 minutos
11. **Reiniciar** — Retirar el USB cuando se indique

## Post-instalación

Una vez reiniciado el sistema, ejecutar el script opcional de configuración:

```bash
bash ~/scripts/post-install.sh
```

Esto permite configurar:
- Flatpak / Flathub
- Drivers NVIDIA/AMD
- Proton-GE para gaming
- Zsh + Oh My Zsh

## Dual boot con Windows

Hydra OS detecta Windows automáticamente durante el particionado. Se creará una
entrada en GRUB para ambos sistemas. El tiempo de espera del menú GRUB es de 5
segundos por defecto.

**Importante**: Deshabilitar "Inicio rápido" en Windows antes de instalar.

## Solución de problemas

### El sistema no arranca después de instalar

- Verifica que el BIOS/UEFI no tiene Secure Boot activado (o usa el modo con shim)
- En UEFI: seleccionar "HydraOS" como entrada de arranque

### Pantalla negra después del login

- Presionar `Ctrl+Alt+F2` para acceder a una TTY
- Ejecutar `sudo bash /usr/share/hydra/scripts/setup-drivers.sh`

### Sin sonido

```bash
pulseaudio --kill
pulseaudio --start
```
