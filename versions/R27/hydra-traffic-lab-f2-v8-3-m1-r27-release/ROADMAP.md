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

## Regla de versionado

- `V` indica version grande o hito tecnico del producto.
- `R` indica revision practica sobre la rama moderna actual.
- No se renumeran carpetas antiguas; desde R24 se corrige el camino documentado.
