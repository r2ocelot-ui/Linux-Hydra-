# Hydra Traffic Lab — F2-V8.3-M1-R42

R42 es la revisión que añade **timings peatonales realistas + doble
ámbar intermitente** al motor de fases, además de pulir los display
fixes acumulados.

## Cambios respecto a R41

### 🆕 Motor de fases — timings peatonales reales

1. **Parpadeo del peatón verde** los últimos `PED_FLASH_SEC = 5` segundos
   del verde de la fase. Es el aviso universal "termina el cruce".
2. **Clearance time peatonal**: los últimos `PED_CLEARANCE_SEC = 3`
   segundos del verde de la fase, el peatón está ya en rojo sólido.
   Así nunca queda nadie a medio cruzar cuando arrancan los coches
   perpendiculares.
3. La transición vehicular `AMBER` + `ALL_RED` sigue como en R41 (no
   se toca).

Ejemplo de timeline con una fase de 25s:
```
T=0   : V verde,  P verde sólido
T=17  : V verde,  P verde PARPADEANDO (5s)
T=22  : V verde,  P rojo (clearance, 3s)
T=25  : V ámbar,  P rojo  (transición AMBER, 4s)
T=29  : V rojo,   P rojo  (todo-rojo, 3s)
T=32  : siguiente fase
```

### 🆕 Doble ámbar intermitente (alternancia amber_1 ↔ amber_2)

Nuevo estado **"Doble ámbar (intermitente)"** seleccionable en el
dropdown de cada head en cada fase. Cuando un head con tipo de óptica
**S13_RAA** (Rojo + Ámbar_1 + Ámbar_2) recibe ese estado:

- Los dos ámbares se alternan a 1 Hz (cada segundo).
- Se usa para señales de "ceda paso" / incorporación a vía principal.
- En el editor de Geometría → Maniobras → Tipo de óptica eliges
  **S13_RAA**. En cada fase puedes elegir entre "Rojo", "Doble ámbar
  (intermitente)" u otros.

### 🔧 Display fixes acumulados

- **`lastError` se limpia automáticamente** cuando el polling vuelve
  a tener éxito. Antes un error transitorio (modbus timeout) se
  quedaba pegado en el panel aunque la conexión ya hubiera vuelto.
- **"Backend desconectado"** como mensaje amigable cuando se cae el
  WebSocket (en vez del técnico "Failed to fetch"). Cuando el backend
  vuelve, el primer state-broadcast con `lastError:""` lo limpia solo.

### 🛡 Preservado de R40 + R41

Todo lo de R40 y R41 sigue verificado y funcionando:
- Cambio de modo SIM↔REAL refleja estado real al instante.
- Safe-mode no dispara al arrancar; timeout 10s; salida emite cambio.
- WS reset al perder backend.
- handleTick actualiza lastRelayState inmediato → transiciones
  verde→rojo sin retardo.
- "Detener envío de fases" desarma el watchdog.
- Auto-crear maniobra al añadir grupo.
- Limpieza Q→head huérfano.
- Botón "Apagar todos los relés".

## Estructura (igual)

```
versions/R42/
├── README.md
├── hydra-traffic-lab-f2-v8-3-m1-r42-release/   FUENTE FRONTEND
├── backend/                                     FUENTE BACKEND
└── cliente-r42-compilado/                       SNAPSHOT
    ├── public/                                  (frontend compilado)
    ├── backend/                                 (sin node_modules)
    ├── start.bat                                (Windows)
    └── start.sh                                 (Linux/macOS)
```

## Cómo actualizar desde R41

1. Cierra PowerShell del R41.
2. Descomprime `cliente-r42-compilado` en carpeta nueva.
3. `cd backend && npm install --omit=dev --no-audit --no-fund` (1ª vez).
4. `node server.js` o doble click en `start.bat`.
5. Navegador en `http://localhost:3001` + **Ctrl+F5** (carga JS nuevo).

Tu configuración del cruce + mapeo Q1-Q30 + conflictos se conservan
(viven en localStorage del navegador, R42 los lee sin tocar nada).
