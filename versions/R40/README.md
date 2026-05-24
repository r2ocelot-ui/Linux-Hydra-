# Hydra Traffic Lab — F2-V8.3-M1-R40

R40 es una **revisión de pulido** sobre R39 (integración hardware
Modbus). Corrige 6 bugs cosméticos/UX que reportó el usuario al validar
contra el módulo Waveshare 30CH real:

## Cambios respecto a R39

### 🐛 Backend (`backend/`)

1. **Safe-mode no se arma hasta el primer tick** (`safety.js`). En R39
   disparaba al arrancar el backend, antes incluso de que el frontend
   hubiera tenido tiempo de conectarse y mandar ticks → falsas alarmas
   `heartbeat-timeout` en los logs nada más arrancar.

2. **Timeout safe-mode subido de 3s → 10s** (`config-default.json` +
   default en `safety.js`). El de 3s era demasiado agresivo: cualquier
   hiccup de React o cambio de pestaña del navegador (que throttlea el
   `setInterval` del frontend) generaba alarmas. 10s da margen razonable
   sin perder seguridad.

3. **Backend emite cambio de safe-mode tanto entrando como saliendo**
   (`safety.js` + `server.js`). En R39 solo notificaba la entrada → el
   indicador rojo en el panel Hardware se quedaba pegado para siempre.
   Ahora también notifica la salida → el indicador se quita solo cuando
   los ticks vuelven.

### 🐛 Frontend (`src/hardware-client.js`)

4. **Reset de estado al perder el WebSocket** — `wsConnected`,
   `modbusConnected`, `inSafeMode` y `relays` se resetean a "desconocido"
   cuando el WS se cae. En R39 quedaban con el último estado conocido
   (decían "Conectado" aunque el backend estuviera muerto).

5. **`buildConflictPairs` detecta también ópticas peatonales** (y
   flechas verdes). En R39 solo buscaba `color === "green"` → la matriz
   de conflictos en Hardware se quedaba corta y no mostraba conflictos
   peatonales aunque existieran en el cruce.

### 🐛 Frontend (`src/main.jsx`)

6. **El `setInterval` del bucle de fases ya no se recrea cada tick**.
   En R39 las deps del `useEffect` incluían `tick`, lo que reiniciaba
   el interval cada segundo y generaba gaps con el browser throttling.
   Ahora se crea una sola vez (deps = solo `running`) y lee valores
   frescos vía `useRef`.

## Estructura (igual que R39)

```
versions/R40/
├── README.md                                        ← este archivo
├── hydra-traffic-lab-f2-v8-3-m1-r40-release/        ← FUENTE FRONTEND (editable)
├── backend/                                          ← FUENTE BACKEND (editable)
└── cliente-r40-compilado/                            ← SNAPSHOT listo para uso
    ├── public/                                       (frontend compilado)
    ├── backend/                                      (sin node_modules, los instala start)
    ├── start.bat                                     (Windows)
    └── start.sh                                      (Linux/macOS)
```

## Cómo actualizar desde R39

1. Para de usar `start.bat` del R39 (cierra la ventana del backend).
2. Descomprime `cliente-r40-compilado` donde quieras (puede convivir
   con R39).
3. Doble click en `start.bat` del R40.
4. Abre el navegador en `http://localhost:3001`.

Tu configuración del cruce y mapeo Q1-Q30 los lleva el **navegador**
(localStorage), no el backend. Así que al abrir R40 en el mismo
navegador, los datos siguen ahí. No tienes que rehacer nada.

## Próximas revisiones planeadas

- **R41 (UX)**: añadir grupo peatonal auto-crea su maniobra (M),
  renombrar botón "Apagar todo" → "Apagar todos los relés", limpieza
  automática de mapeos Q→head huérfanos al borrar heads.

- **R42 (feature)**: timings peatonales realistas — parpadeo del peatón
  verde antes de pasar a rojo + tiempo de clearance todo-rojo antes
  del siguiente verde vehicular.
