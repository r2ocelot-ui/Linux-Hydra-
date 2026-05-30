# Hydra Traffic Lab V8.3-P4-R2 · arranque y errores

## Arranque recomendado

```powershell
cd "$env:USERPROFILE\Downloads"
Expand-Archive .\Hydra_Traffic_Lab_V8_3_P4_R2_Release.zip -DestinationPath .\Hydra_Traffic_Lab_V8_3_P4_R2_Release -Force
cd .\Hydra_Traffic_Lab_V8_3_P4_R2_Release\hydra-traffic-lab-v8-3-p4-r2-release
npm install
npm run dev
```

## Reparaciones de esta revisión

- Dependencias fijadas, no `latest`:
  - vite 8.0.10
  - react 19.2.5
  - react-dom 19.2.5
  - leaflet 1.9.4
  - react-leaflet 5.0.0
- Exportar JSON ahora no rompe si el navegador bloquea el portapapeles.
- Las acciones rápidas tienen protección por si alguna función no llega por props.
- Versión visible limpiada a V8.3-P4-R2.

## Si vuelve a fallar

Copia o captura el texto de la pantalla de diagnóstico.
La línea más útil suele empezar por `ReferenceError`, `TypeError` o `SyntaxError`.
