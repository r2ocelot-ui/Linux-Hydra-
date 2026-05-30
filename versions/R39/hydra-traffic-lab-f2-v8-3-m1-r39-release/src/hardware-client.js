import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook que conecta con el backend Hydra Modbus (server.js).
 * - WebSocket /ws para estado en tiempo real + envío de ticks.
 * - REST /api/* para acciones puntuales (connect, all-off, test, config).
 * - Reconexión automática del WS.
 *
 * baseUrl vacío = mismo origen (cuando el backend sirve también el frontend
 * en modo snapshot). Si el frontend corre en vite dev (5173) y el backend
 * en 3001, pasar "http://localhost:3001".
 */
export function useHardwareClient(baseUrl = "") {
  const [wsConnected, setWsConnected] = useState(false);
  const [modbusConnected, setModbusConnected] = useState(false);
  const [relays, setRelays] = useState(() => new Array(30).fill(false));
  const [lastError, setLastError] = useState("");
  const [inSafeMode, setInSafeMode] = useState(false);
  const [faults, setFaults] = useState([]);
  const [simulationMode, setSimulationMode] = useState(true);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const apiBase = baseUrl || "";
  const wsUrl = (() => {
    if (typeof window === "undefined") return "";
    if (baseUrl) return baseUrl.replace(/^http/, "ws") + "/ws";
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  })();

  const connectWs = useCallback(() => {
    if (typeof window === "undefined") return;
    if (wsRef.current) {
      const state = wsRef.current.readyState;
      if (state === 0 || state === 1) return; // CONNECTING or OPEN
    }
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        if (!mountedRef.current) return;
        setWsConnected(true);
      };
      ws.onclose = () => {
        if (!mountedRef.current) return;
        setWsConnected(false);
        wsRef.current = null;
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWs();
          }, 2000);
        }
      };
      ws.onerror = () => {};
      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        let msg;
        try { msg = JSON.parse(evt.data); } catch (e) { return; }
        if (msg.type === "state") {
          if (Array.isArray(msg.relays)) setRelays(msg.relays);
          setModbusConnected(!!msg.connected);
          if (msg.lastError !== undefined) setLastError(msg.lastError || "");
          if (msg.inSafeMode !== undefined) setInSafeMode(!!msg.inSafeMode);
        } else if (msg.type === "fault") {
          setFaults((prev) => [{ at: Date.now(), ...msg }, ...prev].slice(0, 40));
        }
      };
    } catch (e) {
      if (!reconnectTimerRef.current) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connectWs();
        }, 2000);
      }
    }
  }, [wsUrl]);

  useEffect(() => {
    mountedRef.current = true;
    connectWs();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
    };
  }, [connectWs]);

  const callApi = useCallback(async (path, method = "GET", body) => {
    try {
      const resp = await fetch(apiBase + path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      return data;
    } catch (e) {
      setLastError(e.message);
      throw e;
    }
  }, [apiBase]);

  const connect = useCallback(() => callApi("/api/connect", "POST"), [callApi]);
  const disconnect = useCallback(() => callApi("/api/disconnect", "POST"), [callApi]);
  const allOff = useCallback(() => callApi("/api/all-off", "POST"), [callApi]);
  const testRelay = useCallback((n, durationMs = 500) =>
    callApi(`/api/test-relay/${n}`, "POST", { durationMs }), [callApi]);
  const setRelayApi = useCallback((n, on, durationMs) =>
    callApi(`/api/relay/${n}`, "POST", { on, durationMs }), [callApi]);
  const getHealth = useCallback(() => callApi("/api/health"), [callApi]);
  const getConfig = useCallback(() => callApi("/api/config"), [callApi]);
  const updateConfig = useCallback(async (cfg) => {
    const out = await callApi("/api/config", "POST", cfg);
    if (out?.config?.modbus) setSimulationMode(!!out.config.modbus.simulationMode);
    return out;
  }, [callApi]);
  const getAudit = useCallback((limit = 50) =>
    callApi(`/api/audit?limit=${limit}`), [callApi]);

  /** Envía un tick por WS con el array deseado de 30 booleans. */
  const sendTick = useCallback((crossingId, targetRelays) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    try {
      wsRef.current.send(JSON.stringify({ type: "tick", crossingId, targetRelays }));
    } catch (e) {}
  }, []);

  /** Envía actualización de matriz de conflictos por WS. */
  const sendSetConfig = useCallback((config) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    try {
      wsRef.current.send(JSON.stringify({ type: "set-config", config }));
    } catch (e) {}
  }, []);

  // Carga inicial del estado simulationMode al conectarse
  useEffect(() => {
    if (!wsConnected) return;
    getHealth().then((h) => {
      if (h && h.simulationMode !== undefined) setSimulationMode(!!h.simulationMode);
    }).catch(() => {});
  }, [wsConnected, getHealth]);

  return {
    wsConnected, modbusConnected, relays, lastError, inSafeMode, faults, simulationMode,
    connect, disconnect, allOff, testRelay, setRelay: setRelayApi,
    updateConfig, getConfig, getHealth, getAudit,
    sendTick, sendSetConfig,
    setFaults,
  };
}

/**
 * Traduce el estado lógico de un cruce a un array de 30 booleans Q1..Q30
 * según el mapping declarado por el usuario en la config del proyecto.
 *
 * mapping shape (en project.hardware.mappings[crossingId]):
 *   {
 *     "Q1": { headId: "M1", color: "red" },   // (1-indexed key como string)
 *     "Q2": { headId: "M1", color: "amber" },
 *     ...
 *   }
 *
 * headStates: objeto {headId: colorActual} producido por getSignal().
 * Devuelve array length 30 de booleans.
 */
export function buildTargetRelays(mapping, headStates) {
  const out = new Array(30).fill(false);
  if (!mapping || !headStates) return out;
  for (let q = 1; q <= 30; q++) {
    const map = mapping[`Q${q}`];
    if (!map || !map.headId || !map.color) continue;
    const state = headStates[map.headId];
    if (!state) continue;
    if (state === map.color) out[q - 1] = true;
  }
  return out;
}

/**
 * Calcula los pares conflictivos a partir de geometry.conflicts (lista de
 * grupos incompatibles, p.ej. ["V1","V2"]) y el mapping Q→{head,color}.
 *
 * Para cada par de grupos incompatibles, busca todas las Qs que se encienden
 * en "green" para heads de cada grupo y emite los pares conflictivos.
 */
export function buildConflictPairs(geometry, mapping) {
  if (!geometry?.conflicts || !geometry?.signalHeads || !mapping) return [];
  const headToGroup = {};
  for (const head of geometry.signalHeads) headToGroup[head.id] = head.movement;
  const greenQsByGroup = {};
  for (let q = 1; q <= 30; q++) {
    const m = mapping[`Q${q}`];
    if (!m || !m.headId || !m.color) continue;
    if (m.color !== "green") continue;
    const group = headToGroup[m.headId];
    if (!group) continue;
    (greenQsByGroup[group] ||= []).push(q);
  }
  const pairs = [];
  for (const [groupA, groupB] of geometry.conflicts) {
    const aList = greenQsByGroup[groupA] || [];
    const bList = greenQsByGroup[groupB] || [];
    for (const a of aList) for (const b of bList) {
      if (a !== b) pairs.push([Math.min(a, b), Math.max(a, b)]);
    }
  }
  // Dedup
  const seen = new Set();
  const dedup = [];
  for (const [a, b] of pairs) {
    const k = `${a}-${b}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push([a, b]);
  }
  return dedup;
}
