# Hydra Traffic Lab — F2-V8.3-M1-R41

R41 es una **revisión de pulido fino** sobre R40 (que ya había pulido
R39 / integración hardware). Combina 2 bugs detectados por QA exhaustivo
de R40 + 3 mejoras UX que el usuario había reportado durante la prueba
del módulo Waveshare real.

## Cambios respecto a R40

### 🐛 Backend (`backend/`) — 2 fixes detectados por QA propio

1. **`safety.js`**: la condición de SIGHUP estaba **invertida**. En R40
   se registraba `if (process.platform === "win32")`, pero Windows NO
   soporta SIGHUP (es POSIX). En Linux/macOS, donde sí existe, el
   handler nunca se llegaba a registrar. Resultado: la señal nunca
   disparaba el shutdown limpio. R41 lo cambia a `!== "win32"`.

2. **`server.js` `handleTick`**: tras enviar `flashRelay`/`setRelay`,
   en R40 se dejaba `lastRelayState` sin actualizar y se confiaba en
   el polling (cada 300 ms) para refrescarlo. **Problema crítico para
   tráfico**: si una fase apagaba un relé que se acababa de encender
   en el tick anterior, el `setRelay(false)` explícito no se enviaba
   (porque el polling ya había devuelto `false`), y el relé se quedaba
   encendido hasta que su flash de 5 s expiraba. Eso es una transición
   verde→rojo de hasta 5 s, **inaceptable** en un cruce real. R41
   actualiza `lastRelayState` inmediatamente tras el bucle y emite
   broadcast WS con el nuevo state, así el frontend ve la transición
   sin latencia. **Verificado** vía WS: ticks Q1+Q4 → Q3+Q4 → Q1+Q6
   → vacío reflejan al instante en el state.

### 🎨 Cosméticos backend (mismo fichero)

- Polling broadcast usa `lastRelayState` (consistencia con el resto
  de broadcasts; antes usaba `state` que era la misma referencia pero
  inconsistente).
- Errores en `simulator.start()`/`simulator.stop()` durante cambio de
  modo ahora se reportan al cliente vía `broadcast({type:"fault",
  level:"simulator-start"})` en vez de tragarse silenciosamente.

### 🎯 Frontend (`src/main.jsx`) — 3 UX fixes reportados por el usuario

3. **`GeometryEditor.addGroup`** (~línea 3760): cuando se añade un
   grupo nuevo (peatonal, vehicular o cualquier otro), se crea
   **automáticamente** una maniobra (signal head) asociada con el
   tipo de óptica adecuado. Antes el usuario tenía que ir a "Maniobras
   semafóricas" y crearla a mano; si lo olvidaba, las fases no
   mostraban dropdown para ese grupo y el mapeo Q→head no podía
   referenciarlo. Era el bug que reportaste al crear PA/PB en el T.

4. **`HardwarePanel`**: botón **"Apagar todo"** → **"Apagar todos los
   relés"**. Cambio puramente de texto, sin lógica. El usuario
   reportó que la primera vez le sonó a "apagar el PC".

5. **`HardwarePanel` `useEffect` de limpieza**: detecta automáticamente
   entradas del mapeo Q→head que apuntan a heads inexistentes (porque
   se borró el grupo o cambió de tipo) y las elimina silenciosamente.
   En R40 quedaban entradas huérfanas y los Qs correspondientes no
   activaban nada al ejecutarse las fases.

## Estructura (igual que R40)

```
versions/R41/
├── README.md                                        ← este archivo
├── hydra-traffic-lab-f2-v8-3-m1-r41-release/        ← FUENTE FRONTEND (editable)
├── backend/                                          ← FUENTE BACKEND (editable)
└── cliente-r41-compilado/                            ← SNAPSHOT listo
    ├── public/                                       (frontend compilado)
    ├── backend/                                      (sin node_modules)
    ├── start.bat                                     (Windows)
    └── start.sh                                      (Linux/macOS)
```

## Cómo actualizar desde R40

1. Cierra la ventana de PowerShell de R40 (el backend antiguo).
2. Descomprime `cliente-r41-compilado` donde quieras.
3. Doble click en `start.bat` del R41.
4. Abrir el navegador en `http://localhost:3001`.
5. **Ctrl+F5** para forzar la recarga del JavaScript nuevo.

Tu configuración del cruce + mapeo Q1-Q30 + matriz de conflictos
siguen igual — todo eso vive en el localStorage del navegador.

## Próximas revisiones

- **R42**: timings peatonales realistas — parpadeo del peatón verde
  los últimos 3-5 s antes de pasar a rojo, clearance time todo-rojo
  antes del verde vehicular. Esto modifica el motor de fases en
  `getSignal()`, no es cosmético.
- **R43**: dashboard de auditoría Modbus en el panel Hardware
  (filtros + export), ahora solo accesible vía API.
