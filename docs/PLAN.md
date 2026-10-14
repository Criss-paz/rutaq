# PLAN MAESTRO — Proyecto "RutaQ"

Ruta más corta en la red vial del departamento de Quetzaltenango (Dijkstra / Floyd-Warshall).
Documento de referencia para todos los agentes. Los contratos de código viven en `src/core/types.ts` y `src/store/types.ts`;
el estado del proyecto en `docs/ESTADO.md`; cada encargo en `docs/agentes/<agente>.md`.

## 0. Roles y reglas

| Agente                                  | Rol                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Claude Code                             | Arquitecto, orquestador, integrador, revisor, QA final y despliegue                                            |
| Codex                                   | Algoritmos (Dijkstra, Floyd-Warshall, enumeración de rutas, escalado), pruebas unitarias, verificación teórica |
| Gemini (vía Antigravity, modelo Gemini) | Dataset REAL de Quetzaltenango, documentación e informe académico                                              |
| Antigravity                             | UI/UX, editor de grafos, responsive, verificación en navegador (Google Maps) y E2E                             |

Reglas no negociables:

1. El orquestador define y congela los contratos. Ningún agente cambia un contrato sin aprobación.
2. Cada agente trabaja en su rama/worktree y solo toca sus carpetas (ver `docs/ESTADO.md`). El orquestador integra en `main`.
3. Datos reales y trazables: ninguna distancia se inventa ni se estima "a ojo". Cada arista lleva su fuente.
4. Nada está terminado hasta cumplir la Definición de Terminado (sección 9).
5. Credenciales: ningún agente escribe contraseñas ni crea cuentas.
6. Todo texto visible de la app y el informe va en español.
7. Commits pequeños y descriptivos en español (`feat(core): dijkstra con pasos para tabla`).

## 1. Contexto académico

Programa que resuelve un problema de redes aplicando el algoritmo correspondiente y demostrando su funcionamiento en un caso práctico.
Problema: **ruta más corta** (Dijkstra principal, Floyd-Warshall complemento/comparación).
Objetivos: formulación matemática; traducción a código; estructuras de datos para redes, nodos, arcos y costos; validación con pruebas y datos de ejemplo; análisis y comparación con la solución teórica.
Entregables: programa funcional gráfico con entrada/salida; comparación teórico vs programa; informe.

## 2. Requerimientos funcionales

### F1 — Mapa de Quetzaltenango

- Nodos: los 24 municipios (cabecera de cada uno). Aristas: carreteras que conectan **directamente** dos municipios. Peso: km reales por carretera.
- No dirigido, conexo, pesos positivos. Nodos ubicados según lat/lon proyectada.

### F2 — Árbol de rutas más cortas desde un nodo

Seleccionar un nodo → Dijkstra → árbol de caminos más cortos resaltado (resto atenuado), cada nodo con su distancia acumulada.

### F3 — Ruta más corta entre dos nodos

Inicial y final → ruta más corta marcada con su distancia. Empates: se informan y se muestran todas. Sin conexión: "No existe ruta entre X y Y".

### Tres formas de mostrar la solución (F2 y F3)

**S1 — Forma tabulada (método visto en clase)**, animada paso a paso:

1. Matriz de adyacencia (pesos; `∞` o `—` si no conectan).
2. Tabla de iteraciones: columnas = nodos, filas = iteraciones; casilla = `distancia (predecesor)`, p. ej. `12 (B)`.
3. En cada iteración: se elige la etiqueta temporal mínima (se resalta, se vuelve permanente); animación de enfoque al nodo; se tacha su columna; se actualizan vecinos `d(v) = min(d(v), d(u) + w(u,v))` resaltando en otro color las casillas que cambiaron.
4. Controles: anterior / siguiente / reproducir / pausa / ir al final, y velocidad.
5. Al final: `Nodo | Distancia mínima | Ruta`.
6. Pestaña Floyd-Warshall con matrices `D⁽ᵏ⁾` por cada k, resaltando casillas que mejoran.

> El formato del catedrático puede variar: la tabla es configurable (mostrar/ocultar adyacencia, formato de etiqueta, tachado por columna o fila).

**S2 — Forma gráfica:** F2 árbol resaltado; F3 ruta resaltada (color, grosor, animación) con distancia total. Sincronizada con S1 paso a paso.

**S3 — Todas las rutas (F3):** todos los caminos simples ordenados por distancia, ⭐ en la más corta; filas `#`, secuencia, tramos, distancia, diferencia vs. la más corta; tocar fila = resaltar en el grafo.
Rendimiento obligatorio: Web Worker cancelable; si el total ≤ límite (5 000 configurable) se listan todos; si no, Yen (K más cortos, orden exacto) con aviso "Se encontraron más de N rutas; mostrando las K más cortas". Lista virtualizada y exportar CSV.

### F4 — Modo diseño

Crear, mover, renombrar, redimensionar nodos; crear aristas arrastrando; editar peso; borrar (borrar nodo borra sus aristas).
Validaciones: peso > 0, sin lazos, sin duplicadas (ofrecer editar la existente). Resolver con F2, F3 y S1–S3.
Extras: deshacer/rehacer, guardar/cargar JSON, autoguardado local, exportar PNG, plantillas (ejemplo de 6 nodos y Quetzaltenango).

### F5 — Tipos de aristas

Recta, curva (bezier), arco, ortogonal (step), ortogonal redondeada (smoothstep). Automático (recta por defecto; curva/arco si se enciman o atraviesan un nodo) o manual por arista o todas (`shapeAuto = false` hasta "volver a automático"). Etiqueta de peso siempre legible.

### F6 — Escala automática

Detectar magnitud `10^ceil(log10(peso_máx))` y mostrarla; `px por unidad` para que la arista mediana mida ~160 px; botón "Aplicar distribución sugerida" con stress majorization (objetivo = distancias de camino más corto); mostrar error de ajuste (%) y aclarar que no todos los pesos son representables en 2D. Sugerencia opcional; opción "mantener proporción" al arrastrar.

### F7 — En línea y en cualquier dispositivo

URL pública. Responsive real: en celular el panel es hoja inferior deslizable; pellizcar/arrastrar/mantener presionado; sin scroll horizontal; botones ≥ 44 px. Tema claro/oscuro.

### Extra opcional

Vista geográfica Leaflet + OpenStreetMap con el trazo real de las carreteras.

## 3. Datos reales de Quetzaltenango

### 3.1 Los 24 municipios (verificar con INE/SEGEPLAN/Wikipedia)

Quetzaltenango, Salcajá, Olintepeque, San Carlos Sija, Sibilia, Cabricán, Cajolá, San Miguel Sigüilá, San Juan Ostuncalco, San Mateo, Concepción Chiquirichapa, San Martín Sacatepéquez, Almolonga, Cantel, Huitán, Zunil, Colomba Costa Cuca, San Francisco La Unión, El Palmar, Coatepeque, Génova, Flores Costa Cuca, La Esperanza, Palestina de Los Altos.

### 3.2 Método obligatorio

1. Coordenadas de cada cabecera (OSM/Nominatim o Wikipedia/Wikidata), con fuente.
2. Distancia por carretera con OSRM (`router.project-osrm.org/route/v1/driving/...`) u OpenRouteService: km con 1 decimal y geometría simplificada.
3. Arista directa A–B si la ruta más corta no pasa a menos de ~1 km de la cabecera de otro municipio.
4. Si la carretera sale temporalmente del departamento (Costa Cuca/Coatepeque), se permite y se anota en `nota`.
5. Registrar nombre de la carretera (CA-1, CA-2, RN-…, departamental) cuando se conozca.
6. Validación con Google Maps (Antigravity, navegador): ≥ 15 aristas incluidas las 5 más largas, tolerancia ±10 %; fuera de tolerancia → investigar, usar el valor de Google Maps y documentar.
7. Grafo conexo.
8. Script reproducible `/scripts/build_dataset.py` o `.ts`.

### 3.3 Formato `src/data/quetzaltenango.json`

Tipo `Dataset` de `src/core/types.ts` (`meta`, `nodes[] {id,label,lat,lon,fuente}`, `edges[] {id,source,target,km,carretera,fuente,verificado_google,km_google,nota,geometry}`).
Además `docs/datos/VALIDACION.md`: `arista | km OSRM | km Google Maps | diferencia % | fuente`.

## 4. Stack

TypeScript · React 18 + Vite · React Flow (@xyflow/react) · Zustand + zundo · Tailwind · Web Worker (Comlink) · @tanstack/react-virtual · stress majorization propio · Leaflet (extra) · Vitest + fast-check · Playwright · Python + networkx · GitHub Pages/Vercel · GitHub Actions. 100 % frontend.

## 6. Delegación (resumen; detalle en `docs/agentes/`)

- **Codex:** `graph.ts`, `dijkstra.ts` (min-heap, pasos, desempate por id), `tabular.ts`, `floyd.ts`, `allPaths.ts` + `yen.ts` + `worker.ts`, `scale.ts` + `layout.ts` + `edgeShape.ts`; pruebas unitarias y de propiedades (≥ 500 grafos), verificación networkx al 100 %, cobertura ≥ 90 %.
- **Gemini:** dataset (sección 3), `ejemplo6.json`, solución a mano del ejemplo de 6 nodos, informe completo (portada UMG: Ingeniería en Sistemas, curso, catedrático en blanco, **Cristopher Alexis Castellanos Paz, carné 2690245972**, fecha; introducción, objetivos, marco teórico con formulación, pseudocódigo, complejidad y por qué Dijkstra exige pesos no negativos; estructuras de datos; implementación; caso práctico; comparación teórico vs programa; análisis, limitaciones, conclusiones; manual de usuario; referencias), exportado a .docx y PDF.
- **Antigravity:** layout con pestañas Tabla | Gráfica | Todas las rutas | Floyd; nodos y aristas personalizados; tabla S1 animada y configurable; lista S3 virtualizada; controles F6; responsive y accesible; validación Google Maps; E2E en Desktop Chrome, iPhone 13, Pixel 7, iPad con capturas.

## 7. Fases

F0 Base (Claude Code) → F1 Paralelo (Codex, Gemini, Antigravity) → F2 Integración → F3 QA → F4 Despliegue → F5 Informe.
Si una puerta falla, la tarea vuelve al responsable con el error exacto.

## 8. Pruebas obligatorias

- lint, typecheck, test, build sin errores.
- Dijkstra == Floyd == fuerza bruta en ≥ 500 grafos aleatorios.
- networkx vs programa: 100 % en todos los pares de Quetzaltenango y en el ejemplo de 6 nodos.
- Solución a mano del informe == tabla S1 del programa, iteración por iteración.
- S3 en Quetzaltenango: UI no se congela; cancelar funciona; primera ruta = Dijkstra.
- Modo diseño completo (crear, mover, redimensionar, renombrar, conectar, forma, borrar, deshacer, guardar/cargar).
- Validaciones con mensajes claros, sin errores de consola.
- Escala: 1–100, 1–1 000, 1–10 000 detectadas; sugerencia de layout aplicable.
- E2E en los 4 dispositivos contra la URL desplegada.
- Lighthouse móvil: rendimiento ≥ 85, accesibilidad ≥ 90.
- Sin errores en consola.

## 9. Definición de terminado

Sección 8 completa; app en línea en celular, tablet y PC; F1–F7 con S1–S3; dataset real validado; informe .docx + PDF; README completo; `docs/ESTADO.md` sin pendientes.

## 10. Protocolo

Cada agente actualiza `docs/agentes/<agente>.md` (hecho / pendiente / decisiones / dudas). Dudas de contrato → orquestador. Nada entra a `main` sin pruebas en verde.
