import net from "node:net";

const FC_READ_COILS = 0x01;
const FC_WRITE_SINGLE_COIL = 0x05;
const ALL_COILS_ADDR = 0x00FF;

/**
 * Cliente Modbus TCP para el módulo Waveshare 30CH.
 * Implementación propia (no modbus-serial) para soportar la extensión
 * Flash ON/OFF de Waveshare (sub-función 0x02/0x04 sobre función 0x05).
 *
 * Convención: relé N (1..30) ↔ coil address N-1.
 */
export class ModbusRelayDriver {
  constructor({
    host = "192.168.1.44",
    port = 502,
    unitId = 1,
    channels = 30,
    timeoutMs = 2000,
  } = {}) {
    this.host = host;
    this.port = port;
    this.unitId = unitId;
    this.channels = channels;
    this.timeoutMs = timeoutMs;
    this.socket = null;
    this.connected = false;
    this.txId = 0;
    this.pending = new Map();
    this.recvBuf = Buffer.alloc(0);
    this.onDisconnect = null;
  }

  configure({ host, port, unitId } = {}) {
    if (host !== undefined) this.host = host;
    if (port !== undefined) this.port = port;
    if (unitId !== undefined) this.unitId = unitId;
  }

  async connect() {
    if (this.connected && this.socket) return;
    await this.disconnect();
    return new Promise((resolve, reject) => {
      const sock = new net.Socket();
      sock.setNoDelay(true);
      let settled = false;
      const onErr = (err) => {
        if (settled) return;
        settled = true;
        try { sock.destroy(); } catch (e) {}
        reject(err);
      };
      sock.once("error", onErr);
      sock.once("connect", () => {
        if (settled) return;
        settled = true;
        sock.removeListener("error", onErr);
        this.socket = sock;
        this.connected = true;
        sock.on("data", (chunk) => this._handleData(chunk));
        sock.on("error", (err) => this._fail(err));
        sock.on("close", () => this._fail(new Error("connection closed")));
        resolve();
      });
      sock.connect(this.port, this.host);
    });
  }

  async disconnect() {
    const sock = this.socket;
    this.socket = null;
    this.connected = false;
    if (sock) {
      try { sock.destroy(); } catch (e) {}
    }
    this._rejectAllPending(new Error("disconnected"));
  }

  _fail(err) {
    if (!this.connected && !this.socket) return;
    this.connected = false;
    const sock = this.socket;
    this.socket = null;
    if (sock) { try { sock.destroy(); } catch (e) {} }
    this._rejectAllPending(err);
    if (typeof this.onDisconnect === "function") {
      try { this.onDisconnect(err); } catch (e) {}
    }
  }

  _rejectAllPending(err) {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  _handleData(chunk) {
    this.recvBuf = Buffer.concat([this.recvBuf, chunk]);
    while (this.recvBuf.length >= 8) {
      const length = this.recvBuf.readUInt16BE(4);
      const total = 6 + length;
      if (this.recvBuf.length < total) break;
      const frame = this.recvBuf.subarray(0, total);
      this.recvBuf = this.recvBuf.subarray(total);
      const txId = frame.readUInt16BE(0);
      const p = this.pending.get(txId);
      if (!p) continue;
      this.pending.delete(txId);
      clearTimeout(p.timer);
      const fc = frame.readUInt8(7);
      if (fc & 0x80) {
        const code = frame.readUInt8(8);
        p.reject(new Error(`Modbus exception fc=0x${fc.toString(16)} code=${code}`));
      } else {
        p.resolve(frame.subarray(8));
      }
    }
  }

  _nextTxId() {
    this.txId = (this.txId + 1) & 0xFFFF;
    if (this.txId === 0) this.txId = 1;
    return this.txId;
  }

  async _sendRequest(fc, payload) {
    if (!this.connected || !this.socket) throw new Error("not connected");
    const txId = this._nextTxId();
    const pdu = Buffer.concat([Buffer.from([fc]), payload]);
    const lengthField = 1 + pdu.length;
    const frame = Buffer.alloc(7 + pdu.length);
    frame.writeUInt16BE(txId, 0);
    frame.writeUInt16BE(0x0000, 2);
    frame.writeUInt16BE(lengthField, 4);
    frame.writeUInt8(this.unitId, 6);
    pdu.copy(frame, 7);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(txId);
        reject(new Error("modbus timeout"));
      }, this.timeoutMs);
      this.pending.set(txId, { resolve, reject, timer });
      try {
        this.socket.write(frame);
      } catch (e) {
        this.pending.delete(txId);
        clearTimeout(timer);
        reject(e);
      }
    });
  }

  _assertChannel(n) {
    if (!Number.isInteger(n) || n < 1 || n > this.channels) {
      throw new Error(`relay ${n} out of range (1..${this.channels})`);
    }
  }

  /** Enciende o apaga un relé sin temporizador. */
  async setRelay(n, on) {
    this._assertChannel(n);
    const payload = Buffer.alloc(4);
    payload.writeUInt16BE(n - 1, 0);
    payload.writeUInt16BE(on ? 0xFF00 : 0x0000, 2);
    await this._sendRequest(FC_WRITE_SINGLE_COIL, payload);
  }

  /**
   * Flash ON: el módulo enciende el relé y lo apaga solo tras durationMs.
   * Extensión propietaria Waveshare (sub-función 0x02 sobre función 0x05).
   * durationMs se redondea a múltiplo de 100 ms; rango 100ms..6553500ms.
   */
  async flashRelay(n, durationMs) {
    this._assertChannel(n);
    const ticks = Math.max(1, Math.min(0xFFFF, Math.round(durationMs / 100)));
    const payload = Buffer.alloc(4);
    payload.writeUInt8(0x02, 0);
    payload.writeUInt8(n - 1, 1);
    payload.writeUInt16BE(ticks, 2);
    await this._sendRequest(FC_WRITE_SINGLE_COIL, payload);
  }

  /** Cancela un flash activo (apaga el relé). */
  async cancelFlash(n) {
    this._assertChannel(n);
    const payload = Buffer.alloc(4);
    payload.writeUInt8(0x04, 0);
    payload.writeUInt8(n - 1, 1);
    payload.writeUInt16BE(0, 2);
    await this._sendRequest(FC_WRITE_SINGLE_COIL, payload);
  }

  /** Apaga TODOS los relés (comando de seguridad). */
  async allOff() {
    const payload = Buffer.alloc(4);
    payload.writeUInt16BE(ALL_COILS_ADDR, 0);
    payload.writeUInt16BE(0x0000, 2);
    await this._sendRequest(FC_WRITE_SINGLE_COIL, payload);
  }

  /** Lee el estado actual de los 30 relés. */
  async readState() {
    const payload = Buffer.alloc(4);
    payload.writeUInt16BE(0x0000, 0);
    payload.writeUInt16BE(this.channels, 2);
    const resp = await this._sendRequest(FC_READ_COILS, payload);
    const byteCount = resp.readUInt8(0);
    const states = new Array(this.channels).fill(false);
    for (let i = 0; i < this.channels; i++) {
      const byteIdx = Math.floor(i / 8);
      if (byteIdx + 1 <= byteCount) {
        states[i] = ((resp[1 + byteIdx] >> (i % 8)) & 1) === 1;
      }
    }
    return states;
  }
}
