# Hydra Traffic Lab — F2-V8.3-M1-R38

Esta carpeta `versions/R38/` contiene la **doble entrega** de la
revisión R38 (incluye R38.1 cascada cámaras + R38.2 centrado tile):

## Estructura

```
versions/R38/
├── README.md                                          ← este archivo
├── hydra-traffic-lab-f2-v8-3-m1-r38-release/          ← FUENTE EDITABLE
│   ├── src/                                           (código React/Vite)
│   ├── package.json, package-lock.json, vite.config.js
│   ├── index.html, README.md, ROADMAP.md, VERSIONES.md
│   └── (sin dist/ ni node_modules/, se generan al compilar)
└── cliente-r38-compilado/                             ← COMPILADO PARA CLIENTE
    ├── index.html                                     (HTML entry)
    └── assets/                                        (JS minificado + CSS + avatar)
```

## Cuál es cuál

| Carpeta | Para qué | Qué contiene | Cómo se usa |
|---|---|---|---|
| `hydra-traffic-lab-f2-v8-3-m1-r38-release/` | **Desarrollo / edición** | Código fuente React/Vite con `src/main.jsx`, `src/styles.css`, configuración y dependencias. Lo que se modifica para sacar la próxima revisión. | `npm install` y luego `npm run dev` o `npm run build`. |
| `cliente-r38-compilado/` | **Entrega al cliente** | Build minificado de Vite. Solo `index.html` + `assets/` (JS + CSS + imágenes). Sin sourcemap, sin código fuente. | Servir como sitio estático desde cualquier servidor (Apache, nginx, GitHub Pages, etc.) o abrir el `index.html` desde un mini servidor local. |

## También en GitHub Pages

El mismo `cliente-r38-compilado/` (regenerado por el workflow
`.github/workflows/deploy-pages.yml` en cada push a `main`/PR) se
publica automáticamente en:

**https://r2ocelot-ui.github.io/Linux-Hydra-/r38/**

Y se sube además como artefacto descargable de la Action bajo el
nombre `clientes-compilados` (con todos los `cliente-rXX.zip`).

## Convención general

A partir de R38 (y retroactivo en futuras revisiones que toquen) la
carpeta `versions/RXX/` siempre contendrá DOS entregas:

- `versions/RXX/hydra-traffic-lab-f2-v8-3-m1-rxx-release/` → fuente editable.
- `versions/RXX/cliente-rxx-compilado/` → compilado para cliente.
