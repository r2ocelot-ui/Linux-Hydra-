# Hydra Traffic Lab R39 — Snapshot compilado

Este es el paquete listo para usar de R39. Sirve el frontend de Hydra
Traffic Lab y el backend Modbus TCP en un único proceso Node.js.

## Requisitos

- **Node.js 20 o superior** instalado (https://nodejs.org).
- Conectividad de red al módulo Waveshare 30CH (`192.168.1.44:502`)
  *solo cuando uses modo REAL*. En modo SIMULACIÓN no hace falta.

## Cómo arrancar

### Windows 10 / 11

1. Doble click en `start.bat`.
2. La primera vez instala dependencias (1-2 minutos); las siguientes
   arranca al instante.
3. Abrir el navegador en **http://localhost:3001**.

### Linux / macOS / WSL

```bash
./start.sh
```

Si pide permiso de ejecución: `chmod +x start.sh`.

## Cómo usarlo

1. En la barra lateral, ir a la sección **Hardware**.
2. Por defecto arranca en **modo SIMULACIÓN**: todo funciona sin
   tocar el módulo real. Útil para validar la lógica.
3. Cuando quieras probar contra hardware real:
   - Pulsa **"Pasar a REAL"**.
   - Edita IP/puerto/Unit ID si hace falta y pulsa **"Guardar
     configuración"**.
   - Pulsa **"Conectar"**.
4. Pulsa **"Probar"** en cualquier de los 30 relés Q1-Q30 para
   verificar el cableado: el LED del módulo se enciende 500 ms.
5. Define el mapeo Q1-Q30 → semáforos del cruce activo (o pulsa
   **"Auto-rellenar"**). El sistema deduce automáticamente la matriz
   de conflictos.
6. Pulsa **"Empezar envío de fases"** y arranca la simulación del
   cruce → los relés cambian al ritmo de las fases.

## Seguridad

Tres capas independientes activas siempre:

- **Watchdog del módulo** (Flash mode): si el backend muere, los
  relés se apagan solos en 5 segundos.
- **Watchdog del backend**: si el frontend deja de mandar tick en
  3 segundos, all-off automático.
- **Conflict matrix**: si dos Qs incompatibles intentan estar ON a
  la vez → all-off + alarma + audit crítico.

Al cerrar el programa con Ctrl+C o cerrando la ventana, los relés
se apagan automáticamente.

## Estructura del paquete

```
cliente-r39-compilado/
├── start.bat              ← arranque Windows
├── start.sh               ← arranque Linux/macOS
├── README.md              ← este archivo
├── public/                ← frontend compilado (HTML + CSS + JS)
└── backend/               ← servidor Node.js
    ├── server.js
    ├── modbus-driver.js, modbus-simulator.js, conflict-matrix.js,
    │   safety.js, audit-log.js
    ├── config-default.json
    └── package.json
```

Los datos persistentes (configuración del usuario, log de auditoría)
se guardan en:

- `backend/config.json` — configuración modificada por el usuario.
- `backend/audit/audit-YYYY-MM-DD.jsonl` — log de auditoría server-side.
- localStorage del navegador — estado del proyecto Hydra (cruces,
  fases, usuarios).

## Si algo va mal

- **No abre el navegador**: revisar que `http://localhost:3001`
  responde. Si no, mirar la consola del backend para errores.
- **Backend no conecta al módulo**: hacer ping a `192.168.1.44` desde
  el mismo PC. Verificar que el PC esté en la misma red `192.168.1.x`.
- **Relés no responden**: verificar Unit ID (default 1, configurable
  desde la web del propio módulo).
- **Borrar config y empezar de cero**: borra `backend/config.json` y
  reinicia.
