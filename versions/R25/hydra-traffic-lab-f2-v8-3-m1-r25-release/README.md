# Hydra Traffic Lab F2-V8.3-M1-R25

Version de consolidacion de la rama moderna `F2-V8.3-M1`.

## Novedades R25

- Mantiene la consolidacion R24: cabecera limpia, logo Hydra, proyectos/ciudades y ventanas sobre el mapa.
- Aplica permisos reales por rol en acciones de mapa, control, corredores, camaras, hardware, guardado y eventos.
- Los botones no permitidos quedan marcados y registran aviso si se intenta usarlos.
- Mejora Configuracion con resumen de permisos, ayuda contextual y guardado protegido.
- Mejora Sistema con resumen tecnico local y comprobacion protegida.
- Mejora Eventos con resumen de incidencias, bloqueos por permisos y ayuda contextual.
- Cambia `Referencia visible` por `ID del cruce` en la ficha del cruce.

## Ejecutar

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5186
```

URL:

```text
http://127.0.0.1:5186/
```

Proyecto educativo/de laboratorio. No conectar a infraestructura real.
