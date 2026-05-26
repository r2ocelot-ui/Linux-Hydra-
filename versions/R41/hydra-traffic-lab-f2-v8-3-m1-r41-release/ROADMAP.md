# Roadmap Hydra Traffic Lab

Hydra Traffic Lab usa dos niveles de roadmap: versiones grandes del producto y revisiones practicas de la rama moderna.

## Roadmap general del producto

### V8.3 - Mapa de E/S DI/DO

- Mapa de entradas digitales DI para lazos, pulsadores, selector manual/auto y alarmas.
- Mapa de salidas digitales DO para opticas.
- Simulacion de modulo Advantech/PLC.

### V8.4 - Configuraciones, JSON y plantillas

- Importar y exportar configuraciones JSON.
- Varias configuraciones guardadas.
- Validacion avanzada de conflictos.
- Plantillas de cruce.

### V9 - Servicio local del regulador

- Servicio local para mini PC o nodo de cruce.
- Comunicacion MQTT/WebSocket.
- Lectura y escritura de E/S real de laboratorio.

### V10 - Programa de escritorio

- Version de escritorio para Windows.
- Version de escritorio para Linux.
- Empaquetado como EXE, AppImage o paquete deb.

## Roadmap de revisiones R

Las revisiones R son incrementales sobre `F2-V8.3-M1`.

### R22 - Limpieza visual y capas

- Limpiar cabecera, logo y textos.
- Corregir menu de usuario por encima del mapa.
- Corregir modal de acceso por encima del mapa.

### R23 - Proyectos y ciudades separados

- Separar proyectos por ciudad o entorno.
- Preparar seleccion/cambio de proyecto sin mezclar datos.

### R24 - Consolidacion R22/R23 y proyectos por ciudad

- Cerrar la limpieza visual que habia quedado repartida entre R22/R23.
- Implementar proyectos/ciudades separados.
- Mantener vista global para Superadministrador.
- Migrar el guardado anterior a `Proyecto local`.

### R25 - Permisos reales, Configuracion, Sistema y Eventos

- Aplicar permisos reales segun rol.
- Bloquear acciones no permitidas.
- Mostrar motivo claro si una accion requiere permisos.
- Mejorar la seccion Configuracion con resumen de permisos y guardado protegido.
- Mejorar la seccion Sistema con estado tecnico local y comprobacion protegida.
- Mejorar la seccion Eventos con resumen, bloqueos y ayuda contextual.

### R26 - Usuarios personales, permisos por ciudad y auditoria

- Separar persona de rol con usuarios locales, PIN demo y estado activo/inactivo.
- Asignar ciudades/proyectos permitidos por usuario.
- Separar `Administrar usuarios global` de `Administrar usuarios del proyecto`.
- Permitir que Administrador de ciudad gestione usuarios inferiores solo en su ciudad.
- Crear auditoria estructurada buscable por usuario, rol, ciudad, accion, categoria y resultado.

### R27 - Saneamiento, auditoria fina y panel Usuarios profesional

- Reparar la codificacion UTF-8 corrupta heredada del backup R26.
- Recategorizar 29 entradas de log que caian en `sistema` por defecto;
  ahora cada accion se etiqueta como `cruce`, `corredor`, `trafico`,
  `hardware`, `camara`, `permisos`, `guardado` o `sistema` segun el caso.
- Centralizar la verificacion de credenciales en `verifyCredentials()`
  como punto de extension para `bcrypt`/`argon2` cuando llegue el backend.
- Persistir la auditoria estructurada en `localStorage` propio
  (`hydraTrafficLab.f2.audit`) ademas de dentro del proyecto, asi
  sobrevive al cierre del navegador aunque no se haya guardado el proyecto.
- Anadir boton "Exportar JSON" en el panel de auditoria para descargar
  las entradas filtradas con metadatos (filtros aplicados, totales, version).
- Sustituir la cadena de `window.prompt()` del crear/editar usuario por
  `UserFormModal`: formulario unificado con validacion (PIN no vacio,
  usuario unico, no asignar rol igual o superior al propio, bloqueo del
  ultimo Superadministrador activo dentro del propio formulario).
- Anadir filtros de rol, ciudad y estado a la tabla de usuarios.
- Sustituir el ultimo `window.prompt()` (permisos extra por ciudad) por
  `PermissionsModal` con checkboxes; los permisos que el rol activo no
  puede conceder aparecen deshabilitados con explicacion en pantalla.

### R28 - Mapa de E/S DI/DO (simulacion Advantech/PLC)

- Anadir simulacion del modulo `Advantech ADAM-6052` con 16 entradas
  digitales (DI) y 16 salidas digitales (DO).
- `simulateCrossingIO(crossing, signal, settings)` deriva en vivo:
  - DI: lazos NS/EW desde `effectiveArrival`, pulsadores peatonales
    desde `pedestrianRequests`, selector manual/auto desde
    `operatorManual`/`localMode`, alarmas hardware (modulo E/S, detector
    de lazos, camaras, opticas, fuente 24V).
  - DO: por cada cabeza/optica, ON si la senal actual coincide con esa
    optica (rojo/ambar/verde/flecha/peaton).
- `IOMappingPanel` muestra el grid DI/DO en la seccion Dispositivos del
  cruce seleccionado, con contador de canales activos y ayuda contextual.
- Punto de extension para V9: el mismo modelo simulado pasara a leer/
  escribir E/S real de laboratorio cuando llegue el servicio local.

### R29 - Limpieza visual: descripciones por (?) y contadores unicos

- Cabecera del Centro de Control: eliminar la linea de subtitulo
  `"{Proyecto} - Centro de control - Usuario - Rol"`. Esa identidad ya
  vive en el menu de sesion (`SessionMenuR26`) y en el strip "Persona
  activa" del panel Usuarios.
- `SectionPage` acepta una nueva prop `help: string[]`. Cuando se
  recibe, renderiza un boton `(?)` `HelpButton` al lado del titulo en
  lugar del parrafo descriptivo siempre visible.
- Las 11 secciones (Mapa del sistema, Cruces, Corredores, Escenarios,
  Informes, Eventos, Dispositivos, Camaras, Configuracion, Usuarios,
  Sistema) pasan de `description` a `help` con tres a cinco pistas
  cada una, incluyendo recordatorios de permisos cuando aplica.
- Contadores duplicados eliminados: `${crossings.length} cruce(s)` en
  Mapa del sistema, en `LeafletMapView` y en `CorridorPanel`;
  `${corridorIds.length} seleccionado(s)` en Corredores y
  `${log.length} evento(s)` en Eventos.
- KPI canonico de cruces se mantiene en `SystemOverviewPanel`. Tags
  identitarios (nombre del cruce activo, persona/rol activos) tambien.

### R41 - QA exhaustivo de R40 + 2 bugs + 3 UX

Tras la entrega de R40 lance dos exploradores de QA (frontend +
backend) que revisaron exhaustivamente cada boton, slider, modal,
endpoint y handler. Frontend: 0 issues. Backend: 2 bugs reales + 2
cosmeticos. Tambien se aplicaron los 3 UX que el usuario habia
reportado al validar contra el modulo Waveshare real:

- safety.js: SIGHUP estaba registrado solo en win32 pero Windows NO
  soporta SIGHUP (POSIX-only). Resultado: handler nunca firmado en
  ningun sistema. Fix: registrar solo en !== "win32".
- server.js handleTick: tras flashRelay/setRelay el lastRelayState
  no se actualizaba inmediatamente; se confiaba en el polling (300ms)
  para refrescarlo. Si una fase apagaba un rele que se acababa de
  encender, el setRelay(false) explicito no se enviaba (el polling ya
  habia devuelto false) y el rele esperaba hasta 5s a expirar su
  flash watchdog. Para transiciones verde→rojo en trafico real eso es
  inaceptable. R41 actualiza lastRelayState = desiredRelayState.slice()
  tras el bucle y emite state al frontend. Verificado via WS: ticks
  Q1+Q4 → Q3+Q4 → Q1+Q6 → vacio reflejan inmediato en el broadcast.
- server.js polling: broadcast usa lastRelayState (consistencia).
- server.js cambio de modo: simulator.start()/stop() con try/catch y
  fault al cliente si falla.
- GeometryEditor.addGroup: al añadir grupo nuevo crea automaticamente
  su signal head (maniobra M) con el tipo de optica adecuado. Antes
  el usuario tenia que ir a "Maniobras semaforicas" y crearla a mano;
  era el bug que reporto al crear PA/PB en el cruce T.
- HardwarePanel: boton "Apagar todo" renombrado a "Apagar todos los
  reles" para no asustar.
- HardwarePanel: useEffect que detecta entradas Q→head huerfanas
  (heads que ya no existen tras borrar/cambiar grupos) y las limpia
  automaticamente, evitando que el envio de fases ignore silenciosa-
  mente los Qs.

Build verificado, backend smoke test OK, refs+useMemo+useEffect del
HardwarePanel respetados.

### R40 - Pulido tras validacion R39 con hardware real

Tras validar R39 contra el modulo Waveshare real (escuchando clics de
reles, ciclando fases V1+P2 / V2+P1), el usuario reporto 6 detalles
cosmeticos/UX. Esta revision los corrige todos sin tocar funcionalidad:

- safety.js: el watchdog no se arma hasta el primer tick (en R39
  disparaba safe-mode al arrancar, antes incluso de que el frontend se
  conectara).
- timeout safe-mode subido a 10s (de 3s); el de 3s era demasiado
  agresivo dadas las hiccups de React y el throttling del browser al
  cambiar de pestaña.
- backend emite cambio safe-mode tambien al SALIR (no solo al entrar),
  para que el indicador rojo del panel se quite cuando los ticks
  vuelven.
- hardware-client.js: reset de wsConnected/modbusConnected/inSafeMode/
  relays al perder el WebSocket. En R39 quedaban con el ultimo estado
  conocido (decian "Conectado" aunque el backend estuviera muerto).
- buildConflictPairs acepta tambien ped_green y green_arrow, no solo
  green vehicular. La matriz de conflictos del panel Hardware ya
  muestra los conflictos peatonales.
- main.jsx: el setInterval del bucle de fases ya no se recrea cada
  tick. Antes las deps incluian `tick`, lo que reiniciaba el interval
  cada segundo y generaba gaps con el throttling. Ahora se crea una
  sola vez (deps = solo `running`) y lee valores frescos via useRef.
- Build verificado sin errores. Smoke test backend OK: 7s sin ticks =
  0 alarmas safe-mode (en R39 hubieran salido 2-3).

### R39 - Integracion hardware Modbus (primer hardware real)

R39 es la primera revision que conecta Hydra Traffic Lab a hardware
fisico. Se anade un backend Node.js local (Express + WebSocket +
driver Modbus TCP propio) que actua de puente entre el frontend
(navegador) y el modulo Waveshare Modbus POE ETH Relay 30CH
(IP 192.168.1.44, puerto 502, Unit ID 1).

Cambios en el frontend (src/main.jsx):

- Nueva seccion "Hardware" en HYDRA_SECTIONS y en LeftSidebar (icono 🔌).
- normalizeHardwareConfig() y campo `hardware` en el esquema de
  proyecto (modbusEnabled, simulationMode, host/port/unitId, flashMs,
  mappings Q1-Q30 por cruce). Compatibilidad total con proyectos
  guardados antes de R39.
- HardwarePanel: status grid (backend, modulo, modo, control,
  safe-mode, last error), botones globales (Conectar/Desconectar/
  Apagar todo/Pasar a REAL-SIMULACION/Empezar-Detener envio),
  formulario de configuracion, grid de 30 botones "Probar" con LED
  visual en directo, editor de mapeo Q↔head+color por cruce con
  auto-rellenar, conflict matrix auto-derivada de geometry.conflicts
  + mapping, lista de alarmas servidor en directo via WebSocket.
- Hook useHardwareClient() (en src/hardware-client.js): WebSocket
  con auto-reconexion + REST. Funciones connect/disconnect/allOff/
  testRelay/setRelay/sendTick/sendSetConfig.
- buildTargetRelays(mapping, headStates) traduce el estado logico
  del cruce a un array de 30 booleans Q1-Q30.
- buildConflictPairs(geometry, mapping) deriva automaticamente la
  lista de pares Qx⨯Qy incompatibles para enviar al backend.
- Hook en el bucle de fases (setInterval) que, cuando modbusEnabled
  esta activo y hay mapping para el cruce activo, emite por WS un
  tick cada segundo con el targetRelays calculado.

Backend nuevo (versions/R39/backend/):

- server.js: Express HTTP en :3001 + WebSocket /ws + sirve frontend
  estatico desde ../public si existe (modo snapshot). 9 endpoints REST
  (health, config GET/POST, connect, disconnect, all-off, test-relay,
  relay, relays, audit).
- modbus-driver.js: cliente Modbus TCP propio (no modbus-serial) con
  MBAP correcto + extension Flash ON (0x05 sub-fn 0x02) y Flash OFF
  (sub-fn 0x04) de Waveshare. setRelay, flashRelay, cancelFlash,
  allOff, readState, connect, disconnect.
- modbus-simulator.js: servidor Modbus TCP falso que emula el
  modulo Waveshare (incluyendo Flash mode con auto-OFF tras T·100ms,
  comando all-off via address 0x00FF, Write Multiple Coils 0x0F).
- safety.js: SafetyMonitor con heartbeat watcher (si no llega tick
  en heartbeatTimeoutMs → all-off + alarma) + installShutdownHandlers
  (SIGINT/SIGTERM/SIGHUP con all-off automatico antes de exit).
- conflict-matrix.js: validacion previa de cada tick antes de
  escribir al modulo. Si dos Qs incompatibles intentan estar ON a la
  vez → all-off + alarma + audit critico.
- audit-log.js: log persistente JSONL diario en backend/audit/.
- config-default.json: defaults razonables (sim=true, flashMs=5000,
  heartbeatTimeoutMs=3000, pollIntervalMs=300, reconnectMs=5000).
- README.md con instrucciones, smoke test (paso) y arquitectura.

Snapshot compilado (versions/R39/cliente-r39-compilado/):

- public/ con frontend compilado (Vite build, ✓ built 291ms).
- backend/ con los 7 archivos .js + package.json + README, SIN
  node_modules (start.bat/sh los instala al primer arranque para no
  hinchar el repo con 634 ficheros).
- start.bat (Windows) y start.sh (Linux/macOS), ambos hacen
  npm install --omit=dev la primera vez y luego node server.js.
- README.md con instrucciones paso a paso para arrancar en Windows 10.

Seguridad multi-capa:

1. Watchdog interno del modulo (Flash mode): cada rele ON se manda
   con duracion 5 s. Si el backend muere, los reles se apagan solos.
2. Watchdog del backend (SafetyMonitor): si el frontend deja de
   mandar tick en 3 s, all-off automatico.
3. Conflict matrix: validacion previa server-side antes de escribir.
4. Reconciliacion al conectar: lee estado, si algo ON → all-off
   antes de empezar.
5. Shutdown handlers (SIGINT/SIGTERM): all-off + disconnect antes
   de exit.

Versionado: R39 sigue dentro de V8.3-M1. No se abre V9 todavia
(esa sera la fase de multi-cruce con broker MQTT).

Build verificado, smoke test del backend en simulador con curl OK
(test-relay, set-relay, all-off, audit log persistente, shutdown
limpio).

### R38.1 - Reparacion de camaras (cascada R39 completa + tile R36)

- Cuando se porto R39 al final de styles.css se copio SOLO el primer
  bloque de camaras (R39 ~4908-4973, cap 260px). Pero R39 encadena
  TRES bloques: el R36 (~5022-5121) hace max-width:none + 1fr + screen
  190, y el R39 (~5163-5260) hace repeat(3, minmax(250px, 1fr)) + gap
  26 + carousel padding 42 + pantalla 190 + arrows reposicionadas, con
  media-1180 -> 2 cols y media-820 -> 1 col. Solo gana la cascada el
  ultimo bloque, por eso las camaras de R39 son anchas creciendo a 1fr
  y no acotadas a 260. El primer puerto las hacia estrechas a 260 ->
  visualmente distinto a R39. Bug detectado.
- Fix: reemplazar el bloque appended por la cadena COMPLETA de R39
  (los 3 bloques camera-only + sus media queries). No se portan los
  selectores no-camara del bloque R39 (.hydra-main, .control-header,
  z-index session/modal/leaflet) porque chocan con el header-fix
  R35.2/R37 de R38.
- CameraPanel: cabecera pasa de HelpButton "?" a <h2> + <p> con la
  descripcion de R39 ("Vista simulada de camaras asociadas al cruce
  seleccionado. Flechas dentro del recuadro."). Empty-state pasa al
  formato R39 (<strong>Sin camaras anadidas</strong> + <span>explicacion</span>
  + <Button>+ Anadir primera camara</Button>).
- A peticion explicita del usuario, se RESTAURA el tile "+ Anadir
  camara" DENTRO del carousel (el que tenia R36 y se elimino en el
  commit anterior por intentar igualar R39 que no lo tiene). R38
  queda con TRES formas de anadir camara (cabecera + empty-state +
  tile in-track), como R36, pero con el sizing visual de R39.
- QA exhaustivo del programa (las ~7430 lineas de main.jsx): todas
  las secciones (Inicio, Mapa, Cruces, Coordinacion, Escenarios,
  Informes, Eventos, Dispositivos, Camaras, Configuracion, Usuarios,
  Sistema) renderizan su handler. Todos los botones envueltos en
  guardAction/PermissionButton. Sliders y selects funcionan. El bug
  del crash de geometria (R35) sigue arreglado. Ultimo Superadmin
  protegido. Timeout de inactividad funcional. Export JSON/CSV
  operativo. Sin handlers indefinidos en modales. Unicas anomalias:
  cosmeticas (main.jsx:7185 pasa argumento que openLogin ignora;
  main.jsx:4697 chequeo typeof === "function" redundante) - no rompen
  nada y se mantienen.
- Build verificado sin errores.

### R38 - 4 mejoras de UI (desde R37)

- Menu "Corredores" roto desde R33: el boton del nav decia "Corredores"
  pero la seccion se renombro a "Coordinacion" (HYDRA_SECTIONS + handler),
  asi que al pulsarlo ningun handler casaba y la seccion salia en blanco.
  Fix: el boton del menu pasa a "Coordinacion" (main.jsx:4573) y vuelve a
  renderizar su contenido.
- Camaras: portado literal el bloque final de R39 (su styles.css
  ~4908-4973) al final de styles.css con !important, igual que en R39.
  Ademas se corrige la estructura: R38 (de R33) metia un tile
  "+ Anadir camara" DENTRO del track como una .camera-contained-card
  mas; al tener poco contenido quedaba mas bajo que las camaras reales
  ("unas mas grandes que otras") y descuadraba los selectores :has()
  de R39 que cuentan tarjetas (1 camara + tile = 2 -> layout de 2). Fix:
  CameraPanel deja en el track SOLO camaras (como R39); el boton
  "+ Anadir camara" sigue en la cabecera y en el estado vacio. Asi los
  :has() funcionan: 1 camara = 1 caja 260px centrada, 2 = dos, 3+ =
  tres, todas iguales. No se toca el header-fix R35.2/R37 (ortogonal).
- Eventos: en LogPanel/AuditPanel los botones (Exportar JSON/CSV, Limpiar)
  se montaban sobre el titulo/descripcion porque .panel-header era flex
  sin wrap y el bloque de texto no encogia. Fix CSS no destructivo:
  .panel-header y .panel-tools con flex-wrap:wrap y el bloque de texto
  con min-width:0; flex:1 1 auto. En anchos amplios no cambia nada.
- Recuadros del Centro de Control: .target-control-grid usaba
  align-items:stretch y la tarjeta "Ajustes globales" (2 filas) es muy
  alta, asi que "Intervencion rapida" y "Resumen del sistema" se estiraban
  con mucho hueco. R38: align-items:start (las tarjetas se ajustan a su
  contenido) y las dos tarjetas pasan a apilarse en vertical a ancho
  completo debajo del bloque ajustes/selector/acciones. CSS-only,
  reversible.
- Build verificado sin errores.

### R37 - Ancho completo (como R39)

- El usuario observa que R36 se ve mas estrecho que R39: el menu y el
  contenido quedan encajados y centrados en pantallas anchas.
- Causa: en R35, para fijar la cabecera "Centro de Control", anadi un
  tope max-width:1780px + margin:0 auto en .hydra-shell (engloba menu +
  contenido). Eso centraba y encogia todo el conjunto.
- R37 quita ese tope: .hydra-shell { max-width:none; margin:0 } -> usa
  todo el ancho de la ventana, igual que R39.
- La cabecera sigue fija en todas las secciones porque lo que de verdad
  lo garantiza es .app.hydra-main sin recentrar (max-width:none) +
  scrollbar-gutter:stable, no el tope eliminado.
- Build verificado sin errores.

### R36 - QA + arreglo del crash de geometria

- Bug critico reproducible en R35: cambiar la Geometria en el panel
  "Control del cruce" llamaba onUpdateSelected("geometry", string) y
  guardaba geometry como texto; getSignal hacia geometry.phases.length
  -> TypeError -> RuntimeErrorBoundary (pantalla de error). Arreglado:
  el <select> usa onSetGeometry(selected.id, value), que ya existia y
  construye el objeto correcto con makeGeometry, ademas de registrar
  el cambio.
- normalizeCrossing nuevo: al cargar proyectos (normalizeProjectSnapshot)
  cada cruce se normaliza fundiendo con los defaults de makeCrossing y
  coaccionando geometry a objeto valido (makeGeometry) si llega como
  string/incompleto. Recupera a quien ya se quedo atascado en R35 con
  estado corrupto persistido y garantiza arrivals/cameras/queues. Esto
  neutraliza de raiz los demas crashes potenciales detectados en la
  auditoria (signal.activePhase, arrivals, cameras, phaseDurations) sin
  esparcir optional chaining por el render (no se anade defensa para
  escenarios ya imposibles).
- Barrido estatico de botones/acciones: onUpdateSelected solo recibe
  name (string) y offset (Number()), ningun handler pasa el evento
  crudo, todas las funciones envueltas en guardAction estan definidas.
- Build verificado sin errores. Servido en local (vite preview) y en
  GitHub Pages como r36.

### R35 - Reparaciones tras prueba R34

- Camaras del cruce: el track es un grid de 3 columnas que llenaba el
  100% (repeat(3, minmax(190px,1fr))), por eso el justify-content:center
  de R34 no centraba nada. Ahora columnas acotadas (minmax(180px,240px))
  + justify-content:center: el bloque de cards queda centrado con 1, 2
  o 3 camaras. Separacion vertical clara entre los pills de estado
  (Activa / Camara operativa / Salida libre) y los botones de accion
  (margin 14/16 px) para que no queden pegados.
- Cabecera "Centro de Control - Hydra Traffic Lab" en la MISMA posicion
  en todas las secciones. Causa raiz: .app.hydra-main heredaba de .app
  un max-width:1780 + margin:0 auto y se recentraba segun el ancho del
  contenido o la barra de scroll de cada seccion. El limite de ancho y
  el centrado pasan al contenedor exterior (.hydra-shell) y se anade
  scrollbar-gutter:stable; la columna interna ya no se recentra.
- Coordinacion: nuevo panel de presentacion/estado SIEMPRE visible que
  explica la funcion de la seccion y muestra el estado del corredor
  (numero de cruces, onda verde, modo enlazado, ciclo medio) aunque
  este vacio, con accesos directos para empezar con 4/5 cruces. Anchura
  del layout del corredor uniformada (columnas minmax(0,...)).
- Crear/editar usuario: PIN y contrasena ahora son dos campos separados.
  PIN solo numeros (se filtran no-digitos); contrasena libre (letras,
  numeros y simbolos) y opcional. El login tambien tiene los dos campos
  y verifyCredentials exige la contrasena solo si el usuario la tiene
  configurada (compatibilidad con cuentas previas, p. ej. PIN 9999).
- Dos versiones: fuente editable en versions/ (como hasta ahora) y
  paquete compilado para cliente. vite.config con sourcemap:false
  explicito y el workflow genera cliente-rXX.zip (solo dist minificado,
  sin codigo fuente) como artefacto descargable de la Action.

### R34 - Refinos tras prueba R33

- Centro de Control aun mas compacto: minmax(110px,1fr) y padding 5x7,
  permite 2 columnas hasta paneles de ~230 px. Breakpoint 1 col bajado
  a 480 px.
- Botones de Acciones rapidas: grid auto-fit minmax(105px,1fr) para que
  caben mas o hagan wrap. Componente Button ahora rellena title HTML
  con el children string si no se le pasa, asi salen tooltips nativos
  cuando hay texto truncado (Iniciar / + Anadir cruce / Optimizar...).
- Cards del corredor (Coordinacion) reducidas a 110-130 px con tipo
  mas condensada para evitar scroll horizontal.
- Coordinacion ahora hereda el mismo fix de anchura uniforme que
  Cruces; section-page-body con width 100% y min-width 0.
- Cards de Camaras del cruce centradas horizontalmente y pills inferiores
  (Activa / Camara operativa / Salida libre) con mas separacion (gap 8).
- Restaurado el boton "+ Anadir camara" en el header de Camaras (lo
  habia quitado en R33 por duplicado, el usuario prefiere mantenerlo).
  El tile del carousel sigue siendo la opcion principal.

### R33 - Compactacion y refinos visuales

- Centro de Control mas compacto: ajustes globales con grid auto-fit
  (entran 2 columnas hasta anchos de ~270 px), checkboxes con padding
  reducido, breakpoint de 1 columna bajado de 720 a 360 px. Acciones
  rapidas (Selector + Intervencion) ahora caben sin scroll en columnas
  laterales estrechas.
- Lateral derecho del dashboard 420 -> 360 px para dar mas aire al
  panel central donde viven los cruces seleccionados.
- Anchura uniforme entre tabs de Cruces (Control / Demanda / Hardware /
  Geometria): cruces-detail con width 100% y minmax(0, 1fr) en grids
  internos.
- Seccion "Corredores" renombrada a "Coordinacion" (termino tecnico
  estandar). El roleId/path internos no cambian; solo el nombre
  visible y el activeSection.
- Tile "+ Añadir camara" estilo Configuracion de Maniobras: botón
  grande con borde discontinuo, icono + grande y texto en mayusculas.
  Aparece como ultima posicion del carousel siempre, y como unico
  contenido cuando no hay camaras.

### R32 - Reparaciones tras prueba R31

- Bug del drag de marcadores Leaflet arreglado: useInactivityTimeout
  ya no causa re-render de la App en cada mousemove (lastActivity en
  useRef en lugar de useState).
- Mapa del sistema vuelve al layout de Inicio (mapa + Centro de Control
  + Cruces seleccionados), sin HUD flotante. Mismas dimensiones y
  separacion que Inicio.
- Login: input de usuario en texto (sin desplegable de cuentas
  precargadas). Mensaje de error generico para no revelar usuarios
  existentes.
- Cuenta por defecto renombrada a "Hydra System" con rol
  "Administrador del sistema" (antes "Superadministrador Hydra"). Rol
  superadmin renombrado en HYDRA_ROLES; permisos identicos.

### R31 - Layouts diferenciados por seccion

- Mapa del sistema: leaflet a pantalla completa con HUD flotante del cruce
  activo y atajo a Cruces.
- Cruces: split lista lateral (cambio rapido sin volver al mapa) + tabs
  Control / Demanda / Hardware y E/S / Geometria.
- Eventos: timeline cronologico con tarjetas por categoria y resultado;
  AuditPanel y LogPanel pasan a sidebar derecho.

### R30 - Borrar usuarios, sesion segura y refinos visuales

- **Eliminar usuarios** desde la tabla con jerarquia (`canManageTargetUser`)
  y bloqueos: no borrar al ultimo Superadministrador activo, no borrar la
  cuenta con sesion abierta.
- **Una sola cuenta por defecto** `superadmin@hydra` (PIN `9999`,
  `isDefaultAccount: true`). Las demas personas se crean desde el panel.
  Roles ya no se confunden con usuarios prellenados.
- **Eliminado el texto** "Minimapa limpio: iconos de semaforo/peaton..."
  del header del mapa operativo, sustituido por (?) coherente con R29.
- **`verifyCredentials(user, pin, password, pattern, totpCode)`** con
  firma final para multi-factor. En R30 solo el PIN se valida en cliente;
  los demas factores son stub hasta que llegue backend en V9. Modelo de
  usuario gana `requiresMFA` y `isDefaultAccount`.
- **Inactividad con avisos progresivos**: 5 min "faltan 10", 10 min
  "faltan 5", 14 min modal persistente con cuenta atras MM:SS, 15 min
  cierre y audita `acceso / cierre por inactividad`. Cualquier
  interaccion (raton/teclado/click/touch) resetea el timer.
- **`vite.config.js`** nuevo que inyecta `__BUILD_HASH__` (git short sha)
  y `__BUILD_DATE__` (ISO) en build time. Visibles en seccion Sistema
  para identificar la build exacta servida en el navegador.
- **Export auditoria CSV** ademas de JSON, con BOM UTF-8 y separador
  `;` para Excel.
- **Reset al detectar nueva revision**: dialogo al primer load si
  `localStorage.hydraTrafficLab.f2.lastVersion` no coincide con la
  version actual. Botones "Reset" o "Conservar". Solo durante desarrollo
  R-versions; se elimina en version final estable.

## Regla de versionado

- `V` indica version grande o hito tecnico del producto.
- `R` indica revision practica sobre la rama moderna actual.
- No se renumeran carpetas antiguas; desde R24 se corrige el camino documentado.
