# Hydra Traffic Lab — F2-V8.3-M1-R43

R43 es la revisión que **corrige el congelado del doble ámbar
intermitente** durante las transiciones de fase y conserva todo lo
añadido en R42 (timings peatonales reales + display fixes).

## Cambio principal respecto a R42

### 🐛 Fix — Doble ámbar intermitente ahora es continuo

En R42 el estado `double_amber` solo alternaba `amber_1 ↔ amber_2`
mientras el `stage` de la fase activa era `green`. Durante los ~7s de
transición entre fases (4s `AMBER` + 3s `ALL_RED`) el motor caía a
`headStateFromGroupState` y dejaba la maniobra congelada en `amber_1`
fijo. En un ciclo típico de 4 fases × 60s = ~10% del tiempo el aviso
permanecía sin parpadear, lo que rompe el patrón de un aviso
permanente (ceda paso, salida de fábrica, paso peatonal).

R43 mueve la comprobación de `double_amber` **fuera** del
`if (stage === "green")` para que la alternancia se aplique en
**cualquier stage** (green, amber, allRed). El head solo necesita
tener `amber_1` y `amber_2` entre sus ópticas y el estado pedido
en la fase ha de ser `Doble ámbar (intermitente)`.

Resultado: destello ininterrumpido a 1 Hz durante el 100% del ciclo
del cruce, sin importar qué fase esté activa.

Cambio único en `versions/R43/.../src/main.jsx` (función que calcula
`headStates`, alrededor de la línea 1972-2004). Comentario `R43:` en
el bloque modificado para trazabilidad.

## 🛡 Preservado de R42 + R41 + R40

Todo lo de R42 sigue verificado y funcionando:

- **Parpadeo del peatón verde** los últimos `PED_FLASH_SEC = 5` segundos
  del verde de la fase (aviso "termina el cruce").
- **Clearance time peatonal**: los últimos `PED_CLEARANCE_SEC = 3`
  segundos del verde, el peatón ya en rojo sólido.
- **Transición vehicular** `AMBER` + `ALL_RED` sin cambios.
- Nuevo estado **"Doble ámbar (intermitente)"** en el dropdown de cada
  head en cada fase (ahora con destello continuo gracias al fix).
- **`lastError`** se limpia automáticamente al volver el polling.
- **"Backend desconectado"** como mensaje amigable cuando se cae el WS.

Y todo lo de R40 + R41:
- Cambio de modo SIM↔REAL refleja estado real al instante.
- Safe-mode no dispara al arrancar; timeout 10s; salida emite cambio.
- WS reset al perder backend.
- `handleTick` actualiza `lastRelayState` inmediato (verde→rojo sin retardo).
- "Detener envío de fases" desarma el watchdog.
- Auto-crear maniobra al añadir grupo.
- Limpieza Q→head huérfano.
- Botón "Apagar todos los relés".

## Estructura (igual que R42)

```
versions/R43/
├── README.md
├── hydra-traffic-lab-f2-v8-3-m1-r43-release/   FUENTE FRONTEND
├── backend/                                     FUENTE BACKEND
└── cliente-r43-compilado/                       SNAPSHOT
    ├── public/                                  (frontend compilado)
    ├── backend/                                 (sin node_modules)
    ├── start.bat                                (Windows)
    └── start.sh                                 (Linux/macOS)
```

## Cómo actualizar desde R42

1. Cierra PowerShell del R42.
2. Descomprime `cliente-r43-compilado` en carpeta nueva.
3. `cd backend && npm install --omit=dev --no-audit --no-fund` (1ª vez).
4. `node server.js` o doble click en `start.bat`.
5. Navegador en `http://localhost:3001` + **Ctrl+F5** (carga JS nuevo).

Tu configuración del cruce + mapeo Q1-Q30 + conflictos se conservan
(viven en localStorage del navegador, R43 los lee sin tocar nada).

## Verificación rápida del fix

Si tienes una maniobra con tipo de óptica **S12** (ámbar/ámbar) y
estado **"Doble ámbar (intermitente)"** en cada fase:

- En R42: la maniobra se congela ~7s entre cada fase.
- En R43: la maniobra parpadea 1 Hz durante todo el ciclo, sin pausas.

Mismo comportamiento se aplica a maniobras **S13_RAA** cuando el
estado es `double_amber`.
