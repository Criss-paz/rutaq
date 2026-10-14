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

- **Ronda 2 — Reescritura 100 % guiada por datos de `scripts/build_dataset.py` y `quetzaltenango.json`:**
  - **Eliminación de datos manuales:** Se eliminó por completo la lista estática `EDGES_DEF` y cualquier nombre de carretera o nota narrativa escrita a mano.
  - **Consulta exhaustiva de candidatas:** Se consultaron los 276 pares de municipios ($\binom{24}{2}$) a OSRM con `?overview=full&geometries=polyline&steps=true`, respetando el límite $\le 1\text{ req/s}$ con User-Agent `RutaQ-proyecto-academico` y caché persistente en `scripts/cache/osrm/`.
  - **Criterio de arista directa (calculado):** Se implementó la verificación punto-segmento Haversine de cada ruta contra las 24 cabeceras municipales. Un par $A-B$ es arista directa si no pasa a menos de $1.0\text{ km}$ de ningún otro municipio intermedio.
  - **Generación de `docs/datos/aristas_descartadas.csv`:** Registro estructurado de los 221 pares descartados, documentando origen, destino, municipio intermedio interceptor y distancia mínima observada.
  - **Grafo conexo de 55 aristas:** 55 aristas directas aceptadas, 24 nodos, pesos $km > 0$, grafo 100 % conexo verificado mediante recorrido BFS y `networkx`.
  - **`carretera` derivada de datos:** Obtenida exclusivamente sumando distancias de los códigos `ref` de los `steps` de OSRM (p. ej. `RN-1 / RN-1B`, `CITO 180`, `CA-2 OCC`), o `name` si no hay `ref`, o `""` si OSRM no provee información. Cero códigos inventados.
  - **`nota` calculada por punto-en-polígono:** Se descargó y almacenó en caché el polígono departamental oficial de Quetzaltenango (`scripts/cache/nominatim/departamento_quetzaltenango.json`, 3 003 vértices). Se evalúa cada vértice de la ruta; si sale del polígono, se asigna `"La ruta sale del departamento de Quetzaltenango"`, caso contrario `""`.
  - **Reproducibilidad y determinismo offline:** `python scripts/build_dataset.py` se ejecuta sin conexión utilizando únicamente la caché y produce de forma idéntica byte a byte (`sha256`) el dataset `src/data/quetzaltenango.json`.
  - **Actualización documental:** `docs/datos/METODOLOGIA.md` actualizada con métricas y fórmulas exactas; `docs/datos/VALIDACION.md` actualizada con el top 5 de aristas más largas (`FCC-ZUN` 70.9 km, `PAL-SMA` 70.0 km, `COL-PAL` 60.5 km, `COA-PAL` 58.4 km, `PAL-ZUN` 57.2 km) y 15 adicionales (total 20 aristas prioritarias) para la medición en Google Maps por Antigravity.
- **Ronda 1 (Aprobado):**
  - `src/data/ejemplo6.json` (tipo `GraphFile`) y `docs/informe/solucion_teorica.md` (resolución manual tabular paso a paso iteración por iteración).
- **Verificaciones técnicas superadas:**
  - `python scripts/build_dataset.py` (ejecutado dos veces con hash idéntico).
  - `python scripts/verify_dataset.py` (integridad topológica y de contratos superada al 100 %).
  - `npm run lint` (0 advertencias, 0 errores).
  - `npm run typecheck` (tsc limpio contra `CoreApi` y `Dataset`).
  - `npm run test` (pruebas unitarias en verde).
  - `npm run build` (build de Vite exitoso sin errores de empaquetado).
  - `npx prettier --check docs/datos docs/informe src/data scripts` en verde.

### Pendiente

- **Encargo 3 — Informe académico:** Redacción del informe final en `docs/informe/` y exportación a .docx y PDF tras la integración (F2) y con capturas de pantalla reales de la aplicación (F5), conforme a la planificación.
- **Validación con Google Maps:** Toma de medidas en Google Maps por parte del agente Antigravity (mediante navegador automatizado) para completar `km_google` en las aristas prioritarias de `docs/datos/VALIDACION.md`.

### Decisiones

1. **Umbral de intermediación de 1.0 km:** Implementado con proyección local cartográfica y distancia Haversine punto-segmento. Filtró con alta fidelidad las vías que cruzan centros urbanos intermedios (descartando 221 rutas indirectas) preservando la conexidad de los 24 municipios con 55 aristas directas.
2. **Punto-en-polígono para notas:** Basado en el polígono oficial del departamento extraído de Nominatim (OSM 214710). Elimina cualquier nota subjetiva o narrativa: solo hechos geométricamente comprobados.
3. **Nomenclatura vial de OSM:** Se descartaron todas las etiquetas sintéticas `RD-QUE-xx` que no figuraban en los datos oficiales de OSM/MICIVI, reemplazándolas por los atributos `ref` y `name` reales de OSRM.

### Dudas

- Ninguna duda contractual. Los archivos generados se acoplan con total fidelidad a `src/core/types.ts` y `src/store/dataset.ts`.
