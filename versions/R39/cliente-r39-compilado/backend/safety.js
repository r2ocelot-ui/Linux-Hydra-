/**
 * Vigila que llegue un "tick" desde el frontend al menos cada timeoutMs.
 * Si se pierde la señal de vida -> all-off + emite onSafeMode.
 */
export class SafetyMonitor {
  constructor({ driver, timeoutMs = 3000, onSafeMode } = {}) {
    this.driver = driver;
    this.timeoutMs = timeoutMs;
    this.onSafeMode = onSafeMode;
    this.lastTickAt = 0;
    this.timer = null;
    this.inSafeMode = false;
  }

  recordTick() {
    this.lastTickAt = Date.now();
    if (this.inSafeMode) this.inSafeMode = false;
  }

  start() {
    this.lastTickAt = Date.now();
    if (this.timer) clearInterval(this.timer);
    const interval = Math.min(500, Math.max(100, Math.floor(this.timeoutMs / 2)));
    this.timer = setInterval(() => this._check(), interval);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async _check() {
    if (this.inSafeMode) return;
    const elapsed = Date.now() - this.lastTickAt;
    if (elapsed > this.timeoutMs) {
      this.inSafeMode = true;
      try {
        if (this.driver?.connected) await this.driver.allOff();
      } catch (e) {}
      if (typeof this.onSafeMode === "function") {
        try { this.onSafeMode({ reason: "tick-timeout", elapsedMs: elapsed }); } catch (e) {}
      }
    }
  }
}

/**
 * Registra handlers para SIGINT/SIGTERM que apagan los relés antes de salir.
 * Indispensable para no dejar LEDs encendidos al cerrar el backend.
 */
export function installShutdownHandlers({ driver, simulator, onShutdown } = {}) {
  let already = false;
  const shutdown = async (signal) => {
    if (already) return;
    already = true;
    console.log(`[safety] ${signal} recibido, apagando relés y cerrando...`);
    try {
      if (driver?.connected) {
        await driver.allOff();
        await driver.disconnect();
      }
    } catch (e) {
      console.error("[safety] error en all-off:", e.message);
    }
    try {
      if (simulator) await simulator.stop();
    } catch (e) {}
    if (typeof onShutdown === "function") {
      try { await onShutdown(); } catch (e) {}
    }
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  if (process.platform === "win32") {
    process.on("SIGHUP", () => shutdown("SIGHUP"));
  }
}
