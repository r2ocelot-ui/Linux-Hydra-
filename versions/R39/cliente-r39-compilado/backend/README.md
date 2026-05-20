# Hydra Modbus Backend — R39

Servidor Node.js que hace de puente entre el frontend de Hydra Traffic
Lab (navegador) y el módulo Waveshare Modbus POE ETH Relay 30CH.

## Requisitos

- Node.js 20 o superior (https://nodejs.org).

## Instalación

```bash
cd backend
npm install
```

## Arranque

**Modo simulación** (sin hardware real, para desarrollo o pruebas):

```bash
node server.js --sim
```

**Modo real** (contra el módulo en `192.168.1.44:502`):

```bash
node server.js --real
```

**Modo según `config.json`** (se respeta lo guardado por el frontend):

```bash
node server.js
```

Por defecto escucha en `0.0.0.0:3001` (HTTP + WebSocket `/ws`).

## Endpoints REST

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Estado: conectado, modo, uptime, último error |
| GET | `/api/config` | Configuración actual |
| POST | `/api/config` | Actualiza configuración (persiste en `config.json`) |
| POST | `/api/connect` | Conecta al módulo |
| POST | `/api/disconnect` | Apaga todo y desconecta |
| POST | `/api/all-off` | Apaga los 30 relés (seguridad) |
| POST | `/api/test-relay/:n` | Flash relé N (1-30) por `durationMs` (default 500 ms) |
| POST | `/api/relay/:n` | `{on: bool}` o `{durationMs}` para flash |
| GET | `/api/relays` | Estado actual `[bool × 30]` |
| GET | `/api/audit` | Últimas N entradas del log (`?limit=100`) |

## WebSocket `ws://localhost:3001/ws`

**Cliente → servidor** cada ~1 s mientras simula fases:

```json
{ "type": "tick", "crossingId": "A", "targetRelays": [false, true, false, ...] }
```

`targetRelays` = array de 30 booleans (Q1..Q30) con el estado deseado.

**Cliente → servidor** para actualizar matriz de conflictos:

```json
{ "type": "set-config", "config": { "conflictPairs": [[3, 6], [3, 8]] } }
```

**Servidor → cliente**:

```json
{ "type": "state", "relays": [...], "connected": true, "lastError": "" }
{ "type": "fault", "level": "conflict", "message": "...", "conflicts": [...] }
{ "type": "fault", "level": "safe-mode", "message": "..." }
```

## Seguridad

- **Watchdog distribuido**: cada relé encendido se manda con `flashRelay(n, flashMs)`
  (default 5000 ms). El módulo apaga automáticamente si no se rearma. El servidor
  re-arma en cada tick recibido. Si el frontend o el servidor se cuelgan, los
  relés se apagan solos.
- **Heartbeat-timeout server-side**: si no llega tick en `heartbeatTimeoutMs`
  (default 3000 ms), el servidor manda `all-off` automáticamente.
- **Conflict matrix**: antes de aplicar cualquier tick se valida que ningún
  par de Qs incompatibles esté en ON simultáneamente. Si lo está → all-off
  + alarma + audit.
- **Reconciliación al arrancar**: lee estado actual del módulo, si algo
  está ON → all-off antes de empezar.
- **Shutdown limpio**: SIGINT/SIGTERM/SIGHUP → all-off + disconnect antes
  de salir.

## Auditoría

Cada comando se escribe en `backend/audit/audit-YYYY-MM-DD.jsonl` (append-only).
Una línea por evento, formato JSON:

```json
{"ts":"2026-05-20T18:00:00.000Z","category":"hardware","action":"test-relay","target":"Q5","result":"ok","detail":{"durationMs":800}}
```

## Configuración

Al arrancar carga `config.json` (si existe) o cae a `config-default.json`.
Cualquier `POST /api/config` actualiza y persiste en `config.json`.

Campos relevantes:

- `modbus.simulationMode`: true = simulador interno; false = módulo real.
- `modbus.host`, `modbus.port`, `modbus.unitId`: parámetros del módulo real.
- `modbus.flashMs`: duración del comando Flash ON (watchdog por canal).
- `modbus.heartbeatTimeoutMs`: timeout sin tick → safe mode.
- `modbus.pollIntervalMs`: cada cuánto se lee el estado del módulo.
- `conflictPairs`: array `[[Qa, Qb], ...]` de pares incompatibles.

## Smoke test rápido

```bash
node server.js --sim &
curl http://localhost:3001/api/health
curl -X POST -H "Content-Type: application/json" -d '{"durationMs":500}' http://localhost:3001/api/test-relay/1
curl http://localhost:3001/api/relays
curl -X POST http://localhost:3001/api/all-off
```
