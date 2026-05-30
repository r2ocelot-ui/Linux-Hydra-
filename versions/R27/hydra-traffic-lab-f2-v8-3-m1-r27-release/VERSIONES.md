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
- F2-V8.3-M1-R27: saneamiento R26 (encoding UTF-8, recategorizacion de 29 logs, verifyCredentials como punto de extension, auditoria persistente en localStorage propio con export JSON, UserFormModal sin prompts y filtros rol/ciudad/estado en panel Usuarios).

## Notas

- No se renumeran carpetas antiguas.
- R24 corrige el descuadre entre roadmap y carpetas fisicas.
- Desde R24, el seguimiento correcto es: roadmap general para hitos grandes y roadmap R para revisiones practicas.
