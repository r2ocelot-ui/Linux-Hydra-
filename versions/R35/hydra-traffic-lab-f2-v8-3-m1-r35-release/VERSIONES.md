# Versiones Hydra Traffic Lab

## Versiones generales

- V1: fases basicas.
- V2: lazos, camara virtual y colas.
- V3: multi-cruce remoto/local.
- V4: diagnostico hardware y opticas.
- V5: mapa interactivo.
- V6: sincronizacion visible.
- V7: selector manual/automatico desde regulador.
- V8.1: mapa Leaflet/OpenStreetMap operativo.
- V8.2: editor de geometria, grupos luminosos, fases e incompatibilidades.
- V8.3: grupos operativos, maniobras, estados independientes y fases configurables.

## Rama moderna F2-V8.3-M1

Las revisiones `R` son cierres practicos de interfaz, navegacion, usuarios, proyectos y control sobre `F2-V8.3-M1`.

- F2-V8.3-M1-R20: menu lateral funcional por secciones; Inicio queda como pantalla completa.
- F2-V8.3-M1-R21: usuarios/roles, acceso local por PIN, menu de sesion y revision de botones sin accion.
- F2-V8.3-M1-R22: limpieza de cabecera, logo, textos y menu de usuario sobre mapa.
- F2-V8.3-M1-R23: proyectos/ciudades separados en roadmap; parte de la limpieza visual quedo fisicamente en esta carpeta.
- F2-V8.3-M1-R24: consolida R22/R23 e implementa proyectos/ciudades separados.
- F2-V8.3-M1-R25: permisos reales por rol; Configuracion, Sistema y Eventos quedan mejorados con ayuda contextual.
- F2-V8.3-M1-R26: usuarios personales, permisos por ciudad/proyecto y auditoria estructurada buscable.
- F2-V8.3-M1-R27: saneamiento R26 (encoding UTF-8, recategorizacion de 29 logs, verifyCredentials como punto de extension, auditoria persistente en localStorage propio con export JSON, UserFormModal sin prompts, filtros rol/ciudad/estado en panel Usuarios y PermissionsModal con checkboxes).
- F2-V8.3-M1-R28: Mapa de E/S DI/DO simulado (Advantech ADAM-6052 con 16 DI / 16 DO; lazos, pulsadores, selector, alarmas y opticas en tiempo real). Hito tecnico V8.3 en simulacion, listo para extender a E/S real en V9.
- F2-V8.3-M1-R29: limpieza visual transversal. Cabecera sin subtitulo redundante, descripciones siempre visibles sustituidas por boton (?) `HelpButton` con pistas + recordatorios de permisos en las 11 secciones, contadores duplicados retirados (Mapa del sistema, LeafletMapView, CorridorPanel, Corredores, Eventos). KPI canonico de cruces y tags identitarios se mantienen.
- F2-V8.3-M1-R30: borrar usuarios con jerarquia y bloqueos, cuenta unica por defecto `superadmin@hydra`, eliminado el ultimo texto descriptivo "Minimapa limpio…" del mapa operativo, `verifyCredentials` extendido para multi-factor (stub hasta V9) con `requiresMFA`, inactividad con avisos progresivos a 5/10/14 min + cierre a 15 min, `vite.config.js` inyecta build hash y fecha, export CSV de auditoria, dialogo "Reset/Conservar" al detectar nueva revision.
- F2-V8.3-M1-R31: layouts diferenciados (Mapa pantalla completa con HUD, Cruces con lista+tabs, Eventos como timeline con sidebar). Resto de secciones siguen patron R29 hasta validar.
- F2-V8.3-M1-R32: arreglos tras R31. Drag de marcadores funciona (hook de inactividad ya no causa re-render por movimiento). Mapa del sistema vuelve al layout de Inicio. Login con input manual de usuario. Cuenta default "Hydra System" / rol "Administrador del sistema".
- F2-V8.3-M1-R33: Centro de Control mas compacto (Acciones rapidas visibles), lateral derecho 360 px, tabs de Cruces con misma anchura, seccion Corredores renombrada a Coordinacion, tile + Añadir camara estilo Maniobras.
- F2-V8.3-M1-R34: refinos tras R33. Centro de Control mas compacto (110px), tooltips nativos en Acciones rapidas, cards corredor reducidas, Coordinacion con anchura uniforme, cards camara centradas y boton + en header restaurado.
- F2-V8.3-M1-R35: reparaciones tras R34. Camaras realmente centradas (track con columnas acotadas) y pills separados de los botones; cabecera "Centro de Control" en la misma posicion en todas las secciones (max-width/centrado movido a .hydra-shell + scrollbar-gutter); Coordinacion con panel de presentacion/estado siempre visible; crear/editar/login con PIN numerico y contrasena separados; entrega doble: fuente en versions/ + cliente-rXX.zip compilado sin fuente (sourcemap:false) como artefacto de la Action.

## Notas

- No se renumeran carpetas antiguas.
- R24 corrige el descuadre entre roadmap y carpetas fisicas.
- Desde R24, el seguimiento correcto es: roadmap general para hitos grandes y roadmap R para revisiones practicas.
