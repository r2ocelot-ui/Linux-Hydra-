/**
 * Vigila que llegue un "tick" desde el frontend al menos cada timeoutMs.
 * Si se pierde la señal de vida -> all-off + emite onSafeMode.
 *
 * R40 cambios:
 *  - No se arma hasta el primer tick (start() pone lastTickAt=0).
 *  - Timeout subido a 10s por defecto (más margen ante hiccups React + browser
 *    throttling al cambiar de pestaña, que provocaban falsas alarmas en R39).
 *  - Emite onSafeModeChange(active: bool) cuando ENTRA y cuando SALE de safe
 *    mode, para que el frontend pueda quitar el indicador rojo cuando los
 *    ticks vuelven (en R39 solo se notificaba la entrada).
 */
export class SafetyMonitor {
  constructor({ driver, timeoutMs = 10000, onSafeMode, onSafeModeChange } = {}) {
    this.driver = driver;
    this.timeoutMs = timeoutMs;
    this.onSafeMode = onSafeMode;
    this.onSafeModeChange = onSafeModeChange;
    this.lastTickAt = 0;
    this.timer = null;
    this.inSafeMode = false;
    this.armed = false;
  }

  recordTick() {
    const wasInSafeMode = this.inSafeMode;
    this.lastTickAt = Date.now();
    this.armed = true;
    if (wasInSafeMode) {
      this.inSafeMode = false;
      if (typeof this.onSafeModeChange === "function") {
        try { this.onSafeModeChange(false); } catch (e) {}
      }
    }
  }

  start() {
    // R40: NO ponemos lastTickAt = Date.now() aquí. El monitor queda inactivo
    // hasta que llegue el primer tick (recordTick() pone armed=true). Antes
    // saltaba safe-mode al arrancar el backend, antes de que el frontend
    // hubiera tenido tiempo de mandar nada.
    this.armed = false;
    this.lastTickAt = 0;
    if (this.timer) clearInterval(this.timer);
    const interval = Math.min(1000, Math.max(250, Math.floor(this.timeoutMs / 5)));
    this.timer = setInterval(() => this._check(), interval);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async _check() {
    if (!this.armed) return;       // R40: ignorar hasta que llegue al menos un tick
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
      if (typeof this.onSafeModeChange === "function") {
        try { this.onSafeModeChange(true); } catch (e) {}
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
  // R41 fix: SIGHUP es señal POSIX (Linux/macOS). En R40 la condición
  // estaba invertida y solo se registraba en Windows, donde NO existe →
  // el handler no se ejecutaba en ningún sistema. Ahora se registra en
  // todos los UNIX-like.
  if (process.platform !== "win32") {
    process.on("SIGHUP", () => shutdown("SIGHUP"));
  }
}
