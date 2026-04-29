# Contribuir a Hydra OS

## Formas de contribuir

- Reportar bugs en [Issues](https://github.com/r2ocelot-ui/linux-hydra-/issues)
- Proponer nuevas funcionalidades
- Mejorar documentación
- Testear la ISO en hardware real y reportar compatibilidad
- Añadir/mejorar scripts
- Crear temas o configuraciones de escritorio

## Convenciones

### Ramas

- `main` — rama estable, solo releases
- `develop` — desarrollo activo
- `feature/<nombre>` — nuevas funcionalidades
- `fix/<nombre>` — correcciones de bugs

### Commits

Usar prefijos:
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formato sin impacto funcional
- `chore:` tareas de mantenimiento

Ejemplo:
```
feat: añadir soporte para driver RTL8821CE en setup-drivers.sh
```

### Scripts

- Bash con `set -euo pipefail`
- Colores para mensajes: verde info, amarillo advertencia, rojo error
- Comentarios solo donde la lógica no sea obvia
- Verificar si el usuario es root cuando sea necesario

## Testing

Antes de enviar un PR, verificar:

1. El script no tiene errores de sintaxis: `bash -n script.sh`
2. La configuración de Calamares es válida: `calamares --check`
3. La lista de paquetes existe en los repos: `apt-cache show <paquete>`

## Reportar compatibilidad de hardware

Al reportar un issue de hardware, incluir:

```bash
inxi -Faz
lspci -k
lsusb
dmesg | grep -iE "error|warn|fail" | tail -30
```
