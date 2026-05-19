# Hardware previsto

## Flujo de E/S

PC / mini PC -> módulo E/S -> relé/SSR/driver -> óptica LED 24V.

El PC no alimenta directamente las ópticas. El PC manda una orden lógica; la fuente 24V alimenta la carga mediante la etapa de salida.

## Entradas típicas

- DI1: lazo parada.
- DI2: lazo medio.
- DI3: lazo largo.
- DI4: pulsador peatón.
- DI5: selector manual/auto.
- DI6: puerta armario.
- DI7: fallo fuente.
- DI8: modo mantenimiento.

## Salidas típicas

- DO1: grupo V1 rojo.
- DO2: grupo V1 ámbar.
- DO3: grupo V1 verde.
- DO4-DOx: grupos adicionales.
