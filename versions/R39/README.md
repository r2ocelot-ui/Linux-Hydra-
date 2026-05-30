# Hydra Traffic Lab — F2-V8.3-M1-R39

R39 es la primera revisión que **integra hardware real**: el frontend
de Hydra Traffic Lab habla con un módulo Waveshare Modbus POE ETH
Relay 30CH a través de un backend local Node.js.

## Estructura

```
versions/R39/
├── README.md                                        ← este archivo
├── hydra-traffic-lab-f2-v8-3-m1-r39-release/        ← FUENTE FRONTEND (editable)
│   └── src/  package.json  index.html  vite.config.js …
├── backend/                                          ← FUENTE BACKEND (editable, Node.js)
│   ├── server.js, modbus-driver.js, modbus-simulator.js,
│   │   conflict-matrix.js, safety.js, audit-log.js
│   ├── config-default.json
│   ├── package.json
│   └── README.md
└── cliente-r39-compilado/                            ← SNAPSHOT (frontend + backend listos)
    ├── public/                                       (frontend compilado por Vite)
    ├── backend/                                      (con node_modules incluidas)
    ├── start.bat                                     (Windows: doble click)
    └── start.sh                                      (Linux/macOS)
```

## Cuál es cuál

| Carpeta | Para qué | Cómo se usa |
|---|---|---|
| `hydra-traffic-lab-…-release/` | **Desarrollo del frontend** | `npm install && npm run dev` (Vite en puerto 5173) |
| `backend/` | **Desarrollo del backend** | `npm install && node server.js --sim` |
| `cliente-r39-compilado/` | **Entrega para cliente / pruebas con hardware** | Doble click en `start.bat` (Windows) o `./start.sh` (Linux). Sirve frontend + backend en puerto 3001. |

## Cómo probar end-to-end (Windows 10)

1. Instalar Node.js 20+ desde https://nodejs.org.
2. Copiar `cliente-r39-compilado/` a una carpeta local.
3. Doble click en `start.bat`.
4. Abrir navegador en `http://localhost:3001`.
5. Ir a la sección **Hardware**:
   - Toggle "Modo simulación" ON → todo en local, sin tocar el módulo real.
   - Toggle "Modo simulación" OFF → conecta a `192.168.1.44:502`.
6. Pulsar "Conectar" → debe poner "Conectado" en verde.
7. Pulsar "Probar Q1" → escuchas un clic del relé del canal 1 del módulo.
8. Pulsar "Apagar todo" → todos los relés OFF.
9. Mapear Q1-Q30 a los heads del cruce activo (Q1=verde principal,
   Q2=ámbar principal, …) en la tabla del panel.
10. Arrancar la simulación de fases del cruce → los relés del módulo
    cambian al ritmo de las fases.

## Hardware

- **Módulo**: Waveshare Modbus POE ETH Relay 30CH (IP `192.168.1.44`, puerto `502`).
- **Fuente**: Mean Well 240W 24V.
- **LEDs**: ópticas semafóricas 24V (uno por cada salida Q usada).

## Seguridad integrada (resumen)

Tres capas independientes:

1. **Watchdog interno del módulo** (por canal): cada relé encendido
   se manda con duración 5 s; si el backend no rearma, el módulo
   apaga solo.
2. **Watchdog del backend**: si el frontend deja de mandar tick en
   3 s, all-off automático.
3. **Conflict matrix**: cualquier intento de encender 2 Qs
   incompatibles a la vez aborta el tick y manda all-off + alarma
   en pantalla + entrada audit crítica.

Más detalles del backend en `backend/README.md`.

## Versionado

R39 sigue dentro de V8.3-M1, igual que R38. La próxima versión mayor
(V9) se abrirá cuando empiece la fase de servicio multi-cruce con
MQTT/broker central.
