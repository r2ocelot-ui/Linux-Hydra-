# Hydra Traffic Lab F2-V8.3-M1-R26

Revision local de laboratorio sobre la rama moderna `F2-V8.3-M1`.

## Novedades R26

- Se separa persona de rol: cada usuario tiene nombre, usuario, rol, PIN demo, ciudades asignadas y estado activo/inactivo.
- La cabecera muestra persona activa, rol y ciudad/proyecto activo.
- Se mantiene compatibilidad con sesiones antiguas por rol, convirtiendolas a usuario demo.
- `Superadministrador` ve todas las ciudades y puede administrar usuarios globales.
- `Administrador de ciudad` gestiona usuarios inferiores dentro de sus ciudades asignadas mediante `Administrar usuarios del proyecto`.
- Eventos incorpora auditoria estructurada con busqueda por texto, categoria y resultado.
- Las acciones de acceso, permisos, usuarios, bloqueos y cambios relevantes quedan registradas localmente.

## Ejecutar

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5187
```

URL:

```text
http://127.0.0.1:5187/
```

Proyecto educativo/de laboratorio. No conectar a infraestructura real.
