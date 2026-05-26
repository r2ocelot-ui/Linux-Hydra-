import express from "express";
import { WebSocketServer } from "ws";
import { promises as fs } from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

import { ModbusRelayDriver } from "./modbus-driver.js";
import { ModbusRelaySimulator } from "./modbus-simulator.js";
import { SafetyMonitor, installShutdownHandlers } from "./safety.js";
import { ConflictMatrix } from "./conflict-matrix.js";
import { appendAudit, readRecent } from "./audit-log.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "config.json");
const CONFIG_DEFAULT_PATH = path.join(__dirname, "config-default.json");

async function loadConfig() {
  try {
    return JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
  } catch (e) {
    const def = JSON.parse(await fs.readFile(CONFIG_DEFAULT_PATH, "utf8"));
    return def;
  }
}

async function saveConfig(cfg) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

async function main() {
  const config = await loadConfig();
  const args = process.argv.slice(2);
  if (args.includes("--sim")) config.modbus.simulationMode = true;
  if (args.includes("--real")) config.modbus.simulationMode = false;

  // ============ Simulador (si toca) ============
  let simulator = null;
  if (config.modbus.simulationMode) {
    simulator = new ModbusRelaySimulator({ port: 1502, channels: config.modbus.channels || 30 });
    await simulator.start();
    console.log(`[server] simulador Modbus escuchando en 127.0.0.1:1502`);
  }

  // ============ Driver ============
  const driver = new ModbusRelayDriver({
    host: config.modbus.simulationMode ? "127.0.0.1" : config.modbus.host,
    port: config.modbus.simulationMode ? 1502 : config.modbus.port,
    unitId: config.modbus.unitId,
    channels: config.modbus.channels || 30,
    timeoutMs: config.modbus.requestTimeoutMs || 2000,
  });

  // ============ Conflict matrix ============
  const conflictMatrix = new ConflictMatrix(config.conflictPairs || []);

  // ============ Estado ============
  let lastRelayState = new Array(30).fill(false);
  let desiredRelayState = new Array(30).fill(false);
  let lastError = "";
  let pollingTimer = null;
  let reconnectTimer = null;

  // ============ Helpers ============
  function broadcast(message) {
    const json = JSON.stringify(message);
    if (!wss) return;
    for (const c of wss.clients) {
      if (c.readyState === 1) {
        try { c.send(json); } catch (e) {}
      }
    }
  }

  async function tryConnect() {
    try {
      await driver.connect();
      console.log(`[server] driver conectado a ${driver.host}:${driver.port}`);
      lastError = "";
      try {
        const state = await driver.readState();
        if (state.some(Boolean)) {
          console.log("[server] reconciliación: relés ON detectados, forzando all-off");
          await driver.allOff();
        }
        lastRelayState = new Array(30).fill(false);
      } catch (e) {
        console.warn("[server] reconciliación falló:", e.message);
      }
      startPolling();
      broadcast({ type: "state", relays: lastRelayState, connected: true, lastError: "", inSafeMode: safety.inSafeMode });
      appendAudit({ category: "hardware", action: "connected", target: `${driver.host}:${driver.port}`, result: "ok" });
    } catch (e) {
      lastError = e.message;
      console.warn("[server] conexión falló:", e.message);
      broadcast({ type: "state", relays: lastRelayState, connected: false, lastError, inSafeMode: safety.inSafeMode });
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    const delay = config.modbus.reconnectMs || 5000;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      tryConnect();
    }, delay);
  }

  function startPolling() {
    stopPolling();
    pollingTimer = setInterval(async () => {
      if (!driver.connected) return;
      try {
        const state = await driver.readState();
        const changed = state.some((v, i) => v !== lastRelayState[i]);
        lastRelayState = state;
        if (changed) {
          // R41: usar lastRelayState para consistencia con el resto de
          // broadcasts (era cosmético; misma referencia).
          broadcast({ type: "state", relays: lastRelayState, connected: true, lastError: "", inSafeMode: safety.inSafeMode });
        }
      } catch (e) {
        lastError = e.message;
      }
    }, config.modbus.pollIntervalMs || 300);
  }

  function stopPolling() {
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = null;
  }

  driver.onDisconnect = (err) => {
    console.warn("[server] driver desconectado:", err?.message || err);
    lastError = err?.message || "disconnected";
    broadcast({ type: "state", relays: lastRelayState, connected: false, lastError, inSafeMode: safety.inSafeMode });
    appendAudit({ category: "hardware", action: "disconnected", result: "fault", detail: lastError });
    stopPolling();
    scheduleReconnect();
  };

  // ============ Safety ============
  const safety = new SafetyMonitor({
    driver,
    timeoutMs: config.modbus.heartbeatTimeoutMs || 10000,
    onSafeMode: (info) => {
      console.warn(`[safety] safe-mode activado (${info.reason}, ${info.elapsedMs}ms sin tick) → all-off`);
      broadcast({ type: "fault", level: "safe-mode", message: `heartbeat-timeout (${info.elapsedMs}ms): all-off aplicado` });
      appendAudit({ category: "hardware", action: "safe-mode-triggered", result: "all-off-applied", detail: info });
    },
    onSafeModeChange: (active) => {
      // R40: emite state cuando ENTRA y cuando SALE de safe-mode para que el
      // frontend pueda quitar el indicador rojo cuando los ticks vuelven.
      broadcast({ type: "state", relays: lastRelayState, connected: driver.connected, lastError, inSafeMode: active });
      if (!active) {
        console.log("[safety] safe-mode desactivado (ticks restaurados)");
      }
    },
  });

  // ============ Express ============
  const app = express();
  app.use(express.json({ limit: "256kb" }));

  // Servir frontend estático si existe (modo snapshot)
  const publicDir = path.join(__dirname, "..", "public");
  try {
    await fs.access(publicDir);
    app.use(express.static(publicDir));
    console.log(`[server] sirviendo frontend desde ${publicDir}`);
  } catch (e) {
    console.log(`[server] sin public/, modo API-only (frontend servido por vite dev)`);
  }

  app.get("/api/health", (req, res) => {
    res.json({
      connected: driver.connected,
      simulationMode: config.modbus.simulationMode,
      uptime: process.uptime(),
      lastError,
      inSafeMode: safety.inSafeMode,
      channels: 30,
    });
  });

  app.get("/api/config", (req, res) => {
    res.json(config);
  });

  app.post("/api/config", async (req, res) => {
    try {
      const incoming = req.body || {};
      let modeChanged = false;
      if (incoming.modbus) {
        const wasSimMode = config.modbus.simulationMode;
        Object.assign(config.modbus, incoming.modbus);
        // si cambia modo simulación, hace falta reiniciar driver
        if (incoming.modbus.simulationMode !== undefined && incoming.modbus.simulationMode !== wasSimMode) {
          modeChanged = true;
          await driver.disconnect();
          // R40 patch: emitir state inmediato tras disconnect para que el
          // frontend NO se quede con "Conectado" stale mientras reconectamos
          broadcast({ type: "state", relays: lastRelayState, connected: false, lastError: "", inSafeMode: safety.inSafeMode });
          if (config.modbus.simulationMode) {
            if (!simulator) {
              try {
                simulator = new ModbusRelaySimulator({ port: 1502, channels: config.modbus.channels || 30 });
                await simulator.start();
              } catch (e) {
                // R41 fix: reportar fallo del simulador al cliente
                simulator = null;
                lastError = `simulador no arrancó: ${e.message}`;
                broadcast({ type: "fault", level: "simulator-start", message: lastError });
              }
            }
            driver.configure({ host: "127.0.0.1", port: 1502 });
          } else {
            if (simulator) {
              try {
                await simulator.stop();
              } catch (e) {
                broadcast({ type: "fault", level: "simulator-stop", message: `simulador no se detuvo limpiamente: ${e.message}` });
              }
              simulator = null;
            }
            driver.configure({ host: config.modbus.host, port: config.modbus.port });
          }
        } else {
          driver.configure({
            host: config.modbus.simulationMode ? "127.0.0.1" : config.modbus.host,
            port: config.modbus.simulationMode ? 1502 : config.modbus.port,
            unitId: config.modbus.unitId,
          });
        }
      }
      if (Array.isArray(incoming.conflictPairs)) {
        config.conflictPairs = incoming.conflictPairs;
        conflictMatrix.setPairs(incoming.conflictPairs);
      }
      await saveConfig(config);
      appendAudit({ category: "hardware", action: "config-update", result: "ok", detail: incoming });
      // R40 patch: tras cambio de modo, reconectar automáticamente al nuevo
      // destino (simulador o módulo real). En R39/R40 el usuario tenía que
      // pulsar "Conectar" a mano, dejando el driver desconectado y la píldora
      // del panel en estado stale. Ahora tras tryConnect() se emite state
      // fresca con el resultado real (connected:true o false + lastError).
      if (modeChanged) {
        // No await aquí: que la respuesta del POST no espere el handshake TCP
        setImmediate(() => tryConnect().catch(() => {}));
      }
      res.json({ ok: true, config });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post("/api/connect", async (req, res) => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    await tryConnect();
    res.json({ ok: driver.connected, connected: driver.connected, error: lastError });
  });

  app.post("/api/disconnect", async (req, res) => {
    try {
      if (driver.connected) {
        await driver.allOff();
        await driver.disconnect();
      }
      stopPolling();
      appendAudit({ category: "hardware", action: "manual-disconnect", result: "ok" });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post("/api/all-off", async (req, res) => {
    try {
      if (driver.connected) await driver.allOff();
      desiredRelayState.fill(false);
      lastRelayState.fill(false);
      broadcast({ type: "state", relays: lastRelayState, connected: driver.connected, lastError, inSafeMode: safety.inSafeMode });
      appendAudit({ category: "hardware", action: "all-off", result: "ok", detail: "manual" });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post("/api/test-relay/:n", async (req, res) => {
    const n = parseInt(req.params.n, 10);
    const durationMs = parseInt(req.body?.durationMs, 10) || 500;
    if (!Number.isInteger(n) || n < 1 || n > 30) return res.status(400).json({ ok: false, error: "n fuera de rango (1-30)" });
    try {
      if (!driver.connected) throw new Error("driver no conectado");
      await driver.flashRelay(n, durationMs);
      appendAudit({ category: "hardware", action: "test-relay", target: `Q${n}`, result: "ok", detail: { durationMs } });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post("/api/relay/:n", async (req, res) => {
    const n = parseInt(req.params.n, 10);
    const { on = false, durationMs } = req.body || {};
    if (!Number.isInteger(n) || n < 1 || n > 30) return res.status(400).json({ ok: false, error: "n fuera de rango (1-30)" });
    try {
      if (!driver.connected) throw new Error("driver no conectado");
      if (durationMs) await driver.flashRelay(n, durationMs);
      else await driver.setRelay(n, !!on);
      appendAudit({ category: "hardware", action: "set-relay", target: `Q${n}`, result: "ok", detail: { on, durationMs } });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get("/api/relays", async (req, res) => {
    try {
      if (!driver.connected) return res.json({ relays: lastRelayState, connected: false });
      const state = await driver.readState();
      lastRelayState = state;
      res.json({ relays: state, connected: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/audit", async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;
    res.json({ entries: await readRecent(limit) });
  });

  // ============ HTTP + WebSocket ============
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({
      type: "state",
      relays: lastRelayState,
      connected: driver.connected,
      lastError,
      inSafeMode: safety.inSafeMode,
    }));
    ws.on("message", async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
      if (msg.type === "tick") {
        safety.recordTick();
        await handleTick(msg);
      } else if (msg.type === "set-config" && msg.config) {
        if (Array.isArray(msg.config.conflictPairs)) {
          config.conflictPairs = msg.config.conflictPairs;
          conflictMatrix.setPairs(msg.config.conflictPairs);
        }
      }
    });
  });

  async function handleTick({ crossingId, targetRelays }) {
    if (!Array.isArray(targetRelays) || targetRelays.length !== 30) return;
    desiredRelayState = targetRelays.map(Boolean);

    const onSet = [];
    for (let i = 0; i < 30; i++) if (desiredRelayState[i]) onSet.push(i + 1);
    const { ok, conflicts } = conflictMatrix.validate(onSet);
    if (!ok) {
      try {
        if (driver.connected) await driver.allOff();
        lastRelayState.fill(false);
      } catch (e) {}
      broadcast({
        type: "fault",
        level: "conflict",
        message: `conflicto: Q${conflicts.map((p) => p.join("+Q")).join(", Q")} no pueden estar ON juntos`,
        conflicts,
      });
      appendAudit({ category: "hardware", action: "conflict-detected", result: "all-off-applied", detail: { crossingId, conflicts } });
      return;
    }

    if (!driver.connected) return;
    const flashMs = config.modbus.flashMs || 5000;
    let anyChange = false;
    for (let i = 0; i < 30; i++) {
      const n = i + 1;
      if (desiredRelayState[i]) {
        try { await driver.flashRelay(n, flashMs); } catch (e) {}
        if (!lastRelayState[i]) anyChange = true;
      } else if (lastRelayState[i]) {
        try { await driver.setRelay(n, false); } catch (e) {}
        anyChange = true;
      }
    }
    // R41 fix: actualizar lastRelayState inmediatamente con el estado
    // deseado, en lugar de esperar al polling (300ms). Esto evita un gap
    // donde el siguiente tick podría no enviar un setRelay(false) sobre
    // un relé que se acaba de encender, dejándolo encendido hasta que
    // expire su flashMs (5 s) — retardo inaceptable para transiciones
    // verde→rojo en tráfico real. También emite el state al frontend
    // para que la UI refleje la transición sin esperar al polling.
    lastRelayState = desiredRelayState.slice();
    if (anyChange) {
      broadcast({ type: "state", relays: lastRelayState, connected: driver.connected, lastError: "", inSafeMode: safety.inSafeMode });
    }
  }

  // ============ Arranque ============
  await tryConnect();
  safety.start();
  installShutdownHandlers({ driver, simulator });

  const port = config.server?.port || 3001;
  const host = config.server?.host || "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`[server] Hydra Modbus Backend en ${host}:${port}`);
    console.log(`[server] WebSocket en ws://localhost:${port}/ws`);
    console.log(`[server] Modo: ${config.modbus.simulationMode ? "SIMULACIÓN" : `REAL (${driver.host}:${driver.port})`}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal:", err);
  process.exit(1);
});
