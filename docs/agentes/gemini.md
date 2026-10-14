# Gemini — Datos reales e informe

**Ejecución:** Antigravity CLI con modelo Gemini 3.8 Flash. **Rama:** `feat/gemini-data` · **Carpetas propias:** `src/data/`, `scripts/`, `docs/datos/`, `docs/informe/`.
**Contrato:** tipos `Dataset`, `DatasetNode`, `DatasetEdge` y `GraphFile` en `src/core/types.ts` (v1, congelado).

## Encargo 1 — Dataset de Quetzaltenango (`src/data/quetzaltenango.json`, tipo `Dataset`)

Sigue **exactamente** la sección 3 del plan:

1. 24 municipios (verificar la lista contra INE/SEGEPLAN/Wikipedia). Ids de 3 letras en mayúscula, únicos y estables (p. ej. `QTZ`, `SAL`, `OLI`…); documenta la tabla id → municipio.
2. Coordenadas de la cabecera (Nominatim/Wikidata) con `fuente` por nodo.
3. Distancias por carretera con OSRM (`router.project-osrm.org/route/v1/driving/...`): km con 1 decimal y `geometry` = polyline codificada (precisión 5) **simplificada**. Respeta el límite de uso del servidor público (≤ 1 petición/s, con caché local de respuestas).
4. Criterio de arista directa: A–B existe si la ruta OSRM no pasa a < ~1 km de otra cabecera. Si la carretera sale del departamento (Costa Cuca/Coatepeque), se permite y se anota en `nota`.
5. `carretera` cuando se conozca (CA-1, CA-2, RN-…, ruta departamental).
6. Grafo **conexo**; ids de arista `ORIGEN-DESTINO` sin duplicados ni lazos; `km > 0`.
7. Script reproducible `scripts/build_dataset.py` (o `.ts`) que regenere el JSON; dependencias en `scripts/requirements.txt`.
8. `docs/datos/VALIDACION.md` con la tabla `arista | km OSRM | km Google Maps | diferencia % | fuente` — Antigravity aporta las mediciones de Google Maps (≥ 15 aristas, incluidas las 5 más largas, tolerancia ±10 %). Si una arista se sale de tolerancia: investigar, usar el valor de Google Maps (`km_google`) y documentar.
9. `docs/datos/METODOLOGIA.md`: fuentes, fecha de consulta, criterio de arista, decisiones.

## Encargo 2 — Ejemplo de 6 nodos

- `src/data/ejemplo6.json` (tipo `GraphFile`): nodos A–F, pesos enteros, con al menos un empate interesante y un nodo al que convenga llegar por un camino indirecto. Posiciones `x, y` legibles (nodos 132×44 px).
- `docs/informe/solucion_teorica.md`: resolución **a mano** con el método tabular desde A: matriz de adyacencia y tabla de iteraciones `distancia (predecesor)`, indicando en cada iteración la etiqueta mínima elegida, la columna tachada y las casillas actualizadas. Desempate: id menor. Termina con la tabla `Nodo | Distancia mínima | Ruta`.

## Encargo 3 — Informe (después de F2; se completa en F5 con capturas reales)

`docs/informe/` en Markdown, exportado luego a .docx y PDF. Portada UMG (Ingeniería en Sistemas, curso, catedrático en blanco, **Cristopher Alexis Castellanos Paz, carné 2690245972**, fecha) y el contenido de la sección 6 del plan (marco teórico, estructuras de datos, implementación, caso práctico, comparación teórica vs programa, análisis, limitaciones, conclusiones, manual de usuario, referencias).

## Criterio de aceptación (puerta F1)

JSON válido contra el tipo `Dataset`, 24 nodos, conexo, script reproducible, `METODOLOGIA.md` y solución teórica del ejemplo 6. No inventar ni estimar distancias: cada arista con su fuente.

---

## Reporte (lo llena Gemini)

### Hecho

- **Ronda 5 — Informe Final, Integración de Capturas Reales y Exportación Reproducible (.docx y .pdf):**
  - **Integración de Capturas Reales (Sección 5.3 de `INFORME.md`):** Se reemplazaron los 5 marcadores `[PENDIENTE: captura ...]` por 6 figuras con rutas relativas a `capturas/`, numeración consecutiva, subtítulos y descripciones objetivas fieles a las capturas PNG:
    - _Figura 1_ (`capturas/desktop-chrome-02-quetzaltenango.png`): Pantalla principal en navegador de escritorio con la red vial de 24 municipios y panel sincronizado.
    - _Figura 2_ (`capturas/iphone-13-02-quetzaltenango.png`): Adaptabilidad responsiva en dispositivo móvil (iPhone 13, 390 px de ancho) con menú contextual y hoja deslizable inferior.
    - _Figura 3_ (`capturas/desktop-chrome-05-tabla-s1.png`): Módulo tabular paso a paso de Dijkstra (S1) con 2 rutas óptimas empatadas en el grafo de control de 6 nodos y matriz de adyacencia.
    - _Figura 4_ (`capturas/desktop-chrome-07-floyd.png`): Matriz de distancias $D^{(1)}$ en Floyd-Warshall resaltando relajaciones en verde claro vía nodo intermedio A.
    - _Figura 5_ (`capturas/desktop-chrome-06-s3-todas-rutas.png`): Pestaña de Todas las Rutas (S3) entre Quetzaltenango y Coatepeque con cota de 5 000 rutas.
    - _Figura 6_ (`capturas/desktop-chrome-08-modo-diseno.png`): Modo interactivo de diseño y edición de redes (F4) con herramientas de vértices, aristas y advertencia de conexidad.
  - **Enlaces a Aplicación Desplegada y Repositorio:** Se incorporó la URL de producción (**https://criss-paz.github.io/rutaq/**) y el repositorio oficial (**https://github.com/Criss-paz/rutaq**) en la portada, introducción (Sección 1) y en el Manual de Usuario (Sección 11.1).
  - **Subsección de Pruebas de Aceptación en Producción (Sección 7.3):** Se redactó la subsección incorporando las métricas oficiales verificadas:
    - Pruebas E2E sobre URL en producción: 99 pasadas, 0 fallidas (9 omitidas deliberadamente por diseño al no aplicar indicador de escala en anchos móviles) en Desktop Chrome, iPhone 13, Pixel 7 e iPad.
    - Repetibilidad de pruebas E2E locales: 297/297 pruebas exitosas con `--repeat-each=3`.
    - Auditoría Lighthouse en móvil sobre producción: Rendimiento 95, Accesibilidad 95, Buenas Prácticas 100, SEO 100.
  - **Depuración de Afirmaciones no Respaldadas y Sintaxis:**
    - Erradicación de la palabra «indexado» en el informe y corrección de menciones no medidas de FPS en la Sección 8.3 por terminología respaldada sobre la fluidez de la interfaz mediante Web Workers.
    - Corrección de la errata tipográfica LaTeX `$u^_$` por `$u^*$` en el contraejemplo formal de Dijkstra (Sección 3.4).
    - Cero marcadores `PENDIENTE`: `Get-ChildItem docs/informe -File | Select-String -Pattern "PENDIENTE"` 100 % vacío.
  - **Exportación Automatizada y Reproducible (`scripts/exportar_informe.py`):**
    - Script en Python que integra `pypandoc_binary` (Pandoc 3.9) y `playwright` (Chromium headless local).
    - Generación de `docs/informe/INFORME.docx` (881.1 KB) con `--resource-path=docs/informe`, tabla de contenido `--toc`, ecuaciones matemáticas nativas y recursos incrustados.
    - Generación de `docs/informe/INFORME.pdf` (1106.3 KB, 29 páginas) mediante conversión a HTML autónomo (`--mathml --embed-resources --standalone`) e inyección de hoja de estilos de impresión optimizada (`PRINT_CSS` con márgenes Carta, tablas bordeadas, fórmulas MathML nítidas, encabezados y pie de página con conteo «Página X de 29»).
    - Se ajustaron las dimensiones de imágenes (`max-height: 360px; object-fit: contain`) evitando cortes entre páginas en capturas verticales como iPhone 13.
    - Se actualizó `scripts/requirements.txt` con las dependencias `pypandoc_binary>=1.14` y `playwright>=1.40.0`.
  - **Validaciones Técnicas:**
    - `npx prettier --check docs/informe` (100 % verde).
    - `npm run build` (build de producción de Vite exitoso en verde).
    - `npm test` (31 tests unitarios superados al 100 %).
- **Ronda 4 — Aplicación de la Validación Externa de Google Maps y Actualización Integral:**
  - **Transcripción exacta de mediciones (`docs/datos/validacion_google.csv`):** Se creó el archivo CSV transcribiendo con precisión las 20 mediciones de la tabla 5.1 de `docs/datos/VALIDACION.md` (`arista,km_google,via_google,fecha`).
  - **Actualización de `scripts/build_dataset.py`:** Se implementó la lectura de `validacion_google.csv` al final de la construcción de aristas. Se asignó `verificado_google = true` y `km_google` a las 20 aristas. Para las 7 aristas con discrepancia $> 10\,\%$ (`COL-PAL`, `CAN-HUI`, `SAL-ZUN`, `ESP-SAL`, `CAN-SAL`, `ALM-SAL` y `QTZ-ZUN`), se actualizó el peso de la red al valor de Google Maps ($km = km_{\text{Google}}$) y se incorporó en `nota` la leyenda `"Distancia de Google Maps (OSRM: X km, diferencia Y %)"`. Las 13 aristas dentro de tolerancia conservan su distancia OSRM, y las 35 restantes se mantienen sin cambios con `verificado_google = false` y `km_google = null`.
  - **Reproducibilidad y verificación diferencial:** Se regeneró el dataset dos veces consecutivas desde la caché offline, verificándose reproducibilidad determinista idéntica. Mediante `git diff` se constató que exactamente 20 aristas cambiaron en `src/data/quetzaltenango.json` (7 con ajuste de peso y 13 con atributos de validación), sin tocar ningún nodo ni metadato.
  - **Actualización documental (`METODOLOGIA.md` e `INFORME.md`):** Se redactó la Sección 6 en `docs/datos/METODOLOGIA.md` explicando el protocolo y resultados de la validación. En `docs/informe/INFORME.md`, se reemplazó el marcador `[PENDIENTE: resultado de la validación Google Maps]` por el resumen real en el Resumen Ejecutivo, y `[PENDIENTE: tabla de validación Google Maps]` por la tabla consolidada oficial y análisis técnico de causas en la Sección 6.4, preservando intactos los 5 marcadores de capturas.
  - **Verificación matemática con NetworkX (`verification/verify.py`):** Se ejecutó la verificación teórica completa contra NetworkX sobre los 648 pares (576 pares de Quetzaltenango + 72 del grafo de control), arrojando **100.0 % de coincidencia (648/648)** en `verification/resultados.csv` y `verification/reporte.md`. Se comprobó que las tres rutas de ejemplo citadas en el informe (`QTZ-COA` 59.9 km, `QTZ-ALM` 7.0 km, `QTZ-CAB` 41.7 km) mantienen sus trayectorias y kilometrajes intactos con sumas exactas de tramos.
  - **Validaciones técnicas:** `npm run ci`, `npm run format:check` y `python scripts/verify_dataset.py` aprobados al 100 % en verde.
- **Ronda 3 — Ajuste menor de datos y borrador completo del informe académico:**
  - **Tarea A — Ajuste de carretera en `scripts/build_dataset.py`:** Se refinó la función `derive_carretera_from_steps()` para descartar marcadores genéricos de OSRM (`'unknown'`, `'unnamed'`, `'sin nombre'`, `'none'`). Al regenerar el dataset desde la caché offline, la arista `CAJ-FLU` pasó de `carretera: "Unknown"` a `carretera: ""` sin afectar ninguna otra arista ni métrica topológica, confirmándose como el único cambio en `src/data/quetzaltenango.json` mediante `git diff --stat`.
  - **Tarea B — Redacción de `docs/informe/INFORME.md`:** Redacción íntegra y exhaustiva del informe técnico-académico en español siguiendo la estructura de la sección 6 del plan (`docs/PLAN.md`):
    - **Portada UMG:** Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación, campos en blanco para curso y catedrático, autor **Cristopher Alexis Castellanos Paz, carné 2690245972**, y fecha oficial (14 de octubre de 2026).
    - **Resumen ejecutivo e Introducción:** Contextualización del problema de optimización vial en el altiplano occidental guatemalteco y presentación de la plataforma interactiva RutaQ.
    - **Objetivos:** General y específicos (formulación matemática, construcción de dataset, arquitectura desacoplada y validación formal).
    - **Marco Teórico riguroso en LaTeX:** Grafos formales y representaciones computacionales; problema SSSP y APSP; algoritmo de Dijkstra (relajación, pseudocódigo, complejidad $O((V+E)\log V)$ con min-heap y justificación formal con contraejemplo paso a paso de 3 nodos demostrando el fallo ante pesos negativos); algoritmo de Floyd-Warshall (ecuación de recurrencia en programación dinámica, pseudocódigo, complejidad $\Theta(V^3)$ y detección de ciclos negativos); algoritmo de Yen para $K$ caminos más cortos sin lazos; y formulación de Stress Majorization (SMACOF) para proyección cartográfica en 2D.
    - **Estructuras de datos reales:** Detalle de las estructuras del código fuente (`Heap` binario con desempate léxico en `dijkstra.ts`, matrices bidimensionales `d` y `next` en `floyd.ts`, cola de caminos `PathHeap` en `yen.ts`, pila DFS en `allPaths.ts`, matriz Laplaciana en `layout.ts` y almacén reactivo Zustand + Zundo en `useAppStore.ts`).
    - **Desarrollo e implementación:** Arquitectura modular frontend (React 18 + TypeScript + Vite + Tailwind), lienzo interactivo Canvas (`CustomNode`, `CustomEdge`), cuatro modalidades de visualización (S1 tabular animada paso a paso, S2 gráfica con árbol SPT, S3 explorador de todas las rutas con Yen y Web Worker cancelable, y pestaña Floyd-Warshall) y Modo Diseño (F4).
    - **Caso práctico de Quetzaltenango:** Justificación geográfica, catálogo oficial de los 24 municipios (INE/SEGEPLAN), metodología objetiva de filtrado punto-segmento a 1.0 km sobre los 276 pares candidatos en OSRM (55 aristas aceptadas, 221 descartadas, grado medio 4.58, 100 % conexo) y detección geométrica por punto-en-polígono de rutas interdepartamentales.
    - **Comparación teórico vs. programa:** Validación analítica iteración por iteración del grafo de control de 6 nodos cotejado con `solucion_teorica.md` y verificado al 100 % por la prueba unitaria `tests/unit/store/teoria-ejemplo6.test.ts`. Verificación cruzada al 100.0 % contra NetworkX en los 576 pares de Quetzaltenango (`verification/reporte.md` y `verification/resultados.csv`) y desglose detallado de 3 casos reales (`QTZ-COA` 59.9 km, `QTZ-ALM` 7.0 km, `QTZ-CAB` 41.7 km).
    - **Análisis, limitaciones y conclusiones:** Comparativa asintótica y operativa Dijkstra vs. Floyd-Warshall, impacto de la orografía en distancias reales vs. euclidianas (subestimación del 47.9 % en línea recta hacia Coatepeque), escalabilidad mediante Web Workers, limitaciones del modelo estático y conclusiones técnicas.
    - **Manual de usuario y referencias APA 7:** Guía paso a paso de instalación y ejecución local (`npm install`, `npm run dev`), instrucciones de interacción y bibliografía científica verificable (Dijkstra 1959, Floyd 1962, Warshall 1962, Yen 1971, Cormen et al. 2022, Gansner et al. 2004, OSRM, OpenStreetMap, INE Guatemala).
- **Ronda 2 — Reescritura 100 % guiada por datos de `scripts/build_dataset.py` y `quetzaltenango.json`:**
  - Consulta de los 276 pares a OSRM con caché local, filtrado geométrico de aristas directas, generación de `docs/datos/aristas_descartadas.csv`, derivación de carreteras y detección punto-en-polígono de rutas interdepartamentales.
- **Ronda 1 (Aprobado):**
  - `src/data/ejemplo6.json` (tipo `GraphFile`) y `docs/informe/solucion_teorica.md` (resolución manual tabular paso a paso iteración por iteración).
- **Verificaciones técnicas superadas (Ronda 5):**
  - `npx prettier --check docs/informe docs/datos` (100 % limpio en verde).
  - `npm run typecheck` (tsc limpio con 0 errores).
  - `npm test` (4 suites de pruebas, 31 tests unitarios superados al 100 %).
  - `npm run build` (build de producción de Vite exitoso sin errores en 402 ms).
  - `python scripts/exportar_informe.py` (ejecución reproducible sin errores).

### Pendiente

- Ninguno. Todos los requerimientos del orquestador para la Fase 5 (informe final, integración de capturas, pruebas de aceptación, manual de usuario y exportación reproducible a Word y PDF) han sido completados al 100 %.

### Decisiones

1. **Ajuste de proporciones en figuras para PDF:** Se configuró una cota de altura máxima (`max-height: 360px; object-fit: contain;`) en la hoja de estilos de impresión para que las capturas de pantalla tomadas en dispositivos móviles (con relación de aspecto vertical como iPhone 13) encajen íntegramente en una sola página Carta junto con su pie y texto descriptivo, evitando fragmentaciones antiestéticas.
2. **Estructura académica y enlaces:** Se mantuvo la portada UMG y se agregaron de forma explícita la URL de despliegue y del repositorio tanto en la portada como en la introducción y el manual de usuario, permitiendo acceder al sistema tanto en su versión cloud como mediante clonado local.

### Dudas

- Ninguna duda técnica ni contractual. El informe final se encuentra completo, validado, formateado y exportado.
