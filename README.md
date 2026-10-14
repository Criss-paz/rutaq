# RutaQ

Ruta más corta en la red vial del departamento de Quetzaltenango, Guatemala, con **Dijkstra** (método tabular animado) y **Floyd-Warshall**.
Proyecto de curso — Ingeniería en Sistemas, UMG.

> **Estado:** en desarrollo (ver [`docs/ESTADO.md`](docs/ESTADO.md)). URL pública: _pendiente de despliegue_.

## Funciones

- **F2** Árbol de rutas más cortas desde un municipio.
- **F3** Ruta más corta entre dos municipios (con empates).
- Tres formas de ver la solución: **tabla** paso a paso, **gráfica** sobre el mapa y **todas las rutas** posibles ordenadas.
- **Modo diseño** para crear y resolver grafos propios, con guardado en JSON.

## Correr localmente

Requiere Node.js 24.

```bash
npm install
npm run dev          # servidor de desarrollo
npm run ci           # lint + typecheck + pruebas + build
npm run e2e:install  # una vez: navegadores de Playwright
npm run e2e          # pruebas E2E (escritorio, iPhone, Android, iPad)
```

## Estructura

| Carpeta         | Contenido                                               |
| --------------- | ------------------------------------------------------- |
| `src/core/`     | Algoritmos puros en TypeScript (contrato en `types.ts`) |
| `src/store/`    | Estado global (Zustand)                                 |
| `src/ui/`       | Interfaz (React + React Flow + Tailwind)                |
| `src/data/`     | Dataset de Quetzaltenango y ejemplo de 6 nodos          |
| `scripts/`      | Regeneración reproducible del dataset                   |
| `verification/` | Comparación con networkx                                |
| `docs/`         | Estado, reportes de agentes, datos e informe            |

## Créditos

Cristopher Alexis Castellanos Paz — carné 2690245972.
Datos viales: © colaboradores de OpenStreetMap (ODbL), rutas calculadas con OSRM; validación con Google Maps.
