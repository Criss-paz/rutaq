# RutaQ

Ruta más corta en la red vial del departamento de Quetzaltenango, Guatemala, con **Dijkstra** (método tabular animado) y **Floyd-Warshall**.
Proyecto de curso — Ingeniería en Sistemas, UMG.

**Aplicación en línea:** https://criss-paz.github.io/rutaq/ — funciona en computadora, tableta y celular.

## Qué hace

| Función                    | Descripción                                                                                                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mapa de Quetzaltenango** | Los 24 municipios del departamento y las 55 carreteras que los conectan directamente, con distancias reales en km.                                                                                                                                                      |
| **Árbol de rutas (F2)**    | Elige un municipio y se resalta el árbol de caminos más cortos hacia todos los demás, con la distancia a cada uno.                                                                                                                                                      |
| **Ruta más corta (F3)**    | Elige origen y destino: se marca la ruta mínima y su distancia. Si hay empate se muestran todas las rutas empatadas; si no hay conexión, se indica.                                                                                                                     |
| **Tabla (S1)**             | El método tabular de Dijkstra visto en clase, paso a paso: matriz de adyacencia, etiquetas `distancia (predecesor)`, casilla mínima, columnas tachadas y casillas actualizadas. Reproducir, pausar, avanzar, retroceder, ir al final y velocidad. Formato configurable. |
| **Gráfica (S2)**           | El mapa se sincroniza con la tabla: nodo actual, nodos permanentes y aristas evaluadas en cada paso.                                                                                                                                                                    |
| **Todas las rutas (S3)**   | Todos los caminos simples entre dos municipios, ordenados por distancia (⭐ la más corta). Si son demasiados, se muestran los K más cortos con el algoritmo de Yen. Corre en segundo plano, se puede cancelar y exportar a CSV.                                         |
| **Floyd**                  | Las matrices D⁽ᵏ⁾ de Floyd-Warshall, resaltando las casillas que mejoran en cada k.                                                                                                                                                                                     |
| **Modo diseño (F4)**       | Crea tu propio mapa: agrega, mueve, renombra y redimensiona nodos; conecta carreteras y edita pesos; deshacer/rehacer; guardar y cargar JSON; exportar PNG; autoguardado.                                                                                               |
| **Formas de arista (F5)**  | Recta, curva, arco, ortogonal y ortogonal redondeada; automáticas o elegidas a mano.                                                                                                                                                                                    |
| **Escala (F6)**            | Detecta el rango de los pesos (1–100, 1–1 000, …) y sugiere una distribución de nodos proporcional a las distancias (stress majorization), con su error de ajuste.                                                                                                      |

## Uso rápido

1. Abre la aplicación. El modo **Quetzaltenango** muestra el mapa real.
2. Pulsa **Árbol (F2)** o **Ruta (F3)** y elige los municipios en los selectores (o toca los nodos).
3. Revisa la solución en las pestañas **Tabla**, **Gráfica**, **Todas las rutas** y **Floyd**.
4. En **Diseño** puedes partir del ejemplo de 6 nodos o de un mapa vacío y construir tu propio grafo.

## Correr localmente

Requiere Node.js 24.

```bash
npm install
npm run dev          # servidor de desarrollo
npm run ci           # lint + typecheck + pruebas unitarias + build
npm run e2e:install  # una vez: navegadores de Playwright
npm run e2e          # pruebas E2E en escritorio, iPhone 13, Pixel 7 e iPad
BASE_URL=https://criss-paz.github.io/rutaq/ npm run e2e   # E2E contra la versión publicada
```

## Datos y verificación

- **Regenerar el dataset** (usa la caché incluida en `scripts/cache/`, no necesita red):

  ```bash
  python -m venv .venv && .venv/Scripts/pip install -r scripts/requirements.txt   # en Linux/macOS: .venv/bin/pip
  .venv/Scripts/python scripts/build_dataset.py
  ```

  Metodología completa en [`docs/datos/METODOLOGIA.md`](docs/datos/METODOLOGIA.md); validación con Google Maps en
  [`docs/datos/VALIDACION.md`](docs/datos/VALIDACION.md).

- **Comparar con networkx** (todos los pares de Quetzaltenango y el ejemplo de 6 nodos; debe dar 100 %):

  ```bash
  .venv/Scripts/pip install -r verification/requirements.txt
  .venv/Scripts/python verification/verify.py
  ```

## Estructura

| Carpeta         | Contenido                                                  |
| --------------- | ---------------------------------------------------------- |
| `src/core/`     | Algoritmos puros en TypeScript (contrato en `types.ts`)    |
| `src/store/`    | Estado global (Zustand + deshacer/rehacer)                 |
| `src/ui/`       | Interfaz (React + React Flow + Tailwind)                   |
| `src/data/`     | Dataset de Quetzaltenango y ejemplo de 6 nodos             |
| `scripts/`      | Construcción reproducible del dataset                      |
| `verification/` | Comparación con networkx                                   |
| `tests/`        | Pruebas unitarias (Vitest + fast-check) y E2E (Playwright) |
| `docs/`         | Plan, estado, datos e informe                              |

## Créditos

Cristopher Alexis Castellanos Paz — carné 2690245972.

Datos viales: © colaboradores de OpenStreetMap (ODbL); coordenadas con Nominatim; distancias con OSRM; validación
con Google Maps.
