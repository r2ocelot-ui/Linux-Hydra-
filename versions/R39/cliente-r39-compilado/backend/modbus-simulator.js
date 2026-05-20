import net from "node:net";

/**
 * Servidor TCP que emula el módulo Waveshare Modbus POE ETH Relay 30CH.
 * Soporta:
 *  - 0x01 Read Coils
 *  - 0x05 Write Single Coil (estándar + extensión Waveshare Flash ON/OFF)
 *  - 0x0F Write Multiple Coils
 *  - Dirección especial 0x00FF para "todos los relés"
 *  - Sub-función 0x02 (Flash ON) y 0x04 (Flash OFF) sobre 0x05
 *
 * Discriminador Flash: si el primer byte del payload de 0x05 es 0x02 o 0x04 lo
 * tratamos como sub-función Waveshare; si no, es write single coil estándar
 * (los addresses normales 0x0000-0x001D y 0x00FF empiezan con 0x00).
 */
export class ModbusRelaySimulator {
  constructor({ port = 1502, unitId = 1, channels = 30, host = "127.0.0.1" } = {}) {
    this.port = port;
    this.unitId = unitId;
    this.channels = channels;
    this.host = host;
    this.coils = new Array(channels).fill(false);
    this.flashTimers = new Array(channels).fill(null);
    this.server = null;
    this.listeners = new Set();
  }

  onStateChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  _notify() {
    for (const cb of this.listeners) {
      try { cb(this.coils.slice()); } catch (e) {}
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((sock) => this._handleClient(sock));
      this.server.on("error", reject);
      this.server.listen(this.port, this.host, () => resolve(this));
    });
  }

  async stop() {
    this._clearAllFlash();
    return new Promise((resolve) => {
      if (this.server) this.server.close(() => resolve());
      else resolve();
    });
  }

  _handleClient(sock) {
    let buf = Buffer.alloc(0);
    sock.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 8) {
        const length = buf.readUInt16BE(4);
        const frameLen = 6 + length;
        if (buf.length < frameLen) break;
        const frame = buf.subarray(0, frameLen);
        buf = buf.subarray(frameLen);
        const response = this._handleFrame(frame);
        if (response) sock.write(response);
      }
    });
    sock.on("error", () => {});
  }

  _handleFrame(frame) {
    const txId = frame.readUInt16BE(0);
    const protoId = frame.readUInt16BE(2);
    const unitId = frame.readUInt8(6);
    const fc = frame.readUInt8(7);
    const payload = frame.subarray(8);

    let respPayload;
    let exception = 0;
    try {
      switch (fc) {
        case 0x01: respPayload = this._readCoils(payload); break;
        case 0x05: respPayload = this._writeSingleCoil(payload); break;
        case 0x0F: respPayload = this._writeMultipleCoils(payload); break;
        default: exception = 0x01; // ILLEGAL FUNCTION
      }
    } catch (e) {
      exception = 0x04; // SERVER FAILURE
    }

    let pdu;
    if (exception) {
      pdu = Buffer.from([fc | 0x80, exception]);
    } else {
      pdu = Buffer.concat([Buffer.from([fc]), respPayload]);
    }

    const lengthField = 1 + pdu.length;
    const out = Buffer.alloc(7 + pdu.length);
    out.writeUInt16BE(txId, 0);
    out.writeUInt16BE(protoId, 2);
    out.writeUInt16BE(lengthField, 4);
    out.writeUInt8(unitId, 6);
    pdu.copy(out, 7);
    return out;
  }

  _readCoils(payload) {
    const startAddr = payload.readUInt16BE(0);
    const qty = payload.readUInt16BE(2);
    const byteCount = Math.ceil(qty / 8);
    const out = Buffer.alloc(byteCount + 1);
    out[0] = byteCount;
    for (let i = 0; i < qty; i++) {
      const idx = startAddr + i;
      if (idx >= 0 && idx < this.channels && this.coils[idx]) {
        out[1 + Math.floor(i / 8)] |= 1 << (i % 8);
      }
    }
    return out;
  }

  _writeSingleCoil(payload) {
    const firstByte = payload.readUInt8(0);

    // Extensión Waveshare: Flash ON (0x02) o Flash OFF (0x04)
    if (firstByte === 0x02 || firstByte === 0x04) {
      const coil = payload.readUInt8(1);
      const ticks = payload.readUInt16BE(2);
      const durationMs = ticks * 100;
      if (coil >= 0 && coil < this.channels) {
        this._clearFlash(coil);
        if (firstByte === 0x02) {
          this.coils[coil] = true;
          this.flashTimers[coil] = setTimeout(() => {
            this.coils[coil] = false;
            this.flashTimers[coil] = null;
            this._notify();
          }, durationMs);
        } else {
          this.coils[coil] = false;
        }
        this._notify();
      }
      return payload; // echo
    }

    // Write Single Coil estándar
    const addr = payload.readUInt16BE(0);
    const value = payload.readUInt16BE(2);
    if (addr === 0x00FF) {
      this._clearAllFlash();
      if (value === 0xFF00) this.coils.fill(true);
      else if (value === 0x0000) this.coils.fill(false);
      else if (value === 0x5500) this.coils = this.coils.map((c) => !c);
      this._notify();
    } else if (addr >= 0 && addr < this.channels) {
      this._clearFlash(addr);
      if (value === 0xFF00) this.coils[addr] = true;
      else if (value === 0x0000) this.coils[addr] = false;
      else if (value === 0x5500) this.coils[addr] = !this.coils[addr];
      this._notify();
    }
    return payload; // echo
  }

  _writeMultipleCoils(payload) {
    const startAddr = payload.readUInt16BE(0);
    const qty = payload.readUInt16BE(2);
    for (let i = 0; i < qty; i++) {
      const addr = startAddr + i;
      if (addr >= 0 && addr < this.channels) {
        const bit = (payload[5 + Math.floor(i / 8)] >> (i % 8)) & 1;
        this._clearFlash(addr);
        this.coils[addr] = !!bit;
      }
    }
    this._notify();
    const out = Buffer.alloc(4);
    out.writeUInt16BE(startAddr, 0);
    out.writeUInt16BE(qty, 2);
    return out;
  }

  _clearFlash(idx) {
    if (this.flashTimers[idx]) {
      clearTimeout(this.flashTimers[idx]);
      this.flashTimers[idx] = null;
    }
  }

  _clearAllFlash() {
    for (let i = 0; i < this.channels; i++) this._clearFlash(i);
  }

  getCoils() {
    return this.coils.slice();
  }
}
