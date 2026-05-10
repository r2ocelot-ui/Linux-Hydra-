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
