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

- **Encargo 1 — Dataset de Quetzaltenango (`src/data/quetzaltenango.json`, tipo `Dataset`):**
  - Verificación oficial de los 24 municipios contra catálogos del INE y SEGEPLAN. Asignación de 24 identificadores únicos, estables y de 3 letras mayúsculas (`QTZ`, `SAL`, `OLI`, `SIJ`, `SIB`, `CAB`, `CAJ`, `SIG`, `OST`, `MAT`, `CCH`, `SMA`, `ALM`, `CAN`, `HUI`, `ZUN`, `COL`, `FLU`, `PAL`, `COA`, `GEN`, `FCC`, `ESP`, `PLA`).
  - Extracción y caché local de coordenadas geográficas de las 24 cabeceras municipales desde OpenStreetMap / Nominatim (`scripts/cache/nominatim/`) respetando el límite $\le 1$ req/s y cabecera descriptiva `RutaQ-proyecto-academico`.
  - Construcción de `scripts/build_dataset.py` y `scripts/verify_dataset.py` en entorno `.venv` con dependencias en `scripts/requirements.txt` (`requests`, `networkx`, `polyline`).
  - Cálculo de distancias reales de conducción mediante OSRM (`scripts/cache/osrm/`) y simplificación de geometrías con Ramer-Douglas-Peucker (precisión 5).
  - Generación de `src/data/quetzaltenango.json`: 24 nodos, 36 aristas directas (criterio $< 1\text{ km}$ de cabeceras intermedias), pesos positivos $km > 0$, grafo 100 % conexo verificado con `networkx`, carreteras identificadas (CA-01, CA-02, RN-01, RN-10, Cito-180, RD-QUE-...), `verificado_google: false` y `km_google: null`.
  - Documentación completa en `docs/datos/METODOLOGIA.md` (fuentes, fecha de consulta 2026-10-14, criterio de arista, tratamiento de vías interdepartamentales).
  - Documentación en `docs/datos/VALIDACION.md` con tabla comparativa de las 36 aristas y lista de 18 aristas prioritarias (incluyendo las 5 más largas de la red) listas para la validación con Google Maps por Antigravity.
- **Encargo 2 — Ejemplo didáctico de 6 nodos:**
  - Generación de `src/data/ejemplo6.json` (tipo `GraphFile`): 6 nodos A–F con dimensiones estándar $132 \times 44\text{ px}$, pesos enteros, camino indirecto ventajoso ($A \to B \to D$ de peso 7 vs arista directa $A-D$ de peso 10), empate didáctico en iteración 2 ($B$ y $C$ con distancia 4, desempate $B < C$) y rutas empatadas hacia $F$.
  - Elaboración exhaustiva de `docs/informe/solucion_teorica.md`: resolución manual analítica aplicando el método tabular tradicional desde A, con matriz de adyacencia, tabla de iteraciones detallada (etiqueta mínima, columna tachada, casillas actualizadas), justificación paso a paso y tabla resumen final de distancias y rutas.
- **Verificaciones técnicas superadas:**
  - `npm run lint` (0 advertencias, 0 errores).
  - `npm run typecheck` (tsc limpio contra `CoreApi` y `Dataset`).
  - `npm run test` (pruebas unitarias en verde).
  - `npm run build` (build de Vite exitoso sin errores de empaquetado).
  - `verify_dataset.py` (integridad topológica y de contratos superada al 100 %).
  - Formateo con `npx prettier --write docs/datos docs/informe src/data scripts`.

### Pendiente

- **Encargo 3 — Informe académico:** Redacción del informe final en `docs/informe/` y exportación a .docx y PDF tras la integración (F2) y con capturas de pantalla reales de la aplicación (F5), conforme a la planificación.
- **Validación con Google Maps:** Toma de medidas en Google Maps por parte del agente Antigravity (mediante navegador automatizado) para completar `km_google` en las aristas prioritarias de `docs/datos/VALIDACION.md`.

### Decisiones

1. **Corrección de la cabecera de Almolonga:** La consulta automática inicial devolvía la cima del Volcán Almolonga (`type=volcano`) en la zona rural 12 de Quetzaltenango. Se corrigió explícitamente para apuntar a la cabecera municipal en el valle agrícola (`14.81498, -91.49475`), resolviendo la conectividad real sobre la RN-10 hacia Xela y Zunil.
2. **Conexiones interdepartamentales:** Las carreteras `PAL-ZUN` (Cito-180), `COL-PAL` (Cito-180/CA-02) y `SAL-SIJ` (CA-01) transitan brevemente por Retalhuleu o Totonicapán debido al relieve de la Sierra Madre. Se mantuvieron como aristas directas registrando la aclaración en el atributo `nota`, cumpliendo la sección 3.2 del plan maestro.
3. **Nomenclatura uniforme:** Los identificadores de arista se ordenan lexicográficamente `min(u, v) - max(u, v)` (p. ej. `ALM-QTZ`), eliminando aristas duplicadas y garantizando unicidad en grafos no dirigidos.
4. **Simplificación RDP:** Se aplicó tolerancia $\epsilon = 0.0001^\circ$ (~10 m), optimizando el tamaño del archivo JSON sin comprometer la precisión cartográfica.

### Dudas

- Ninguna duda contractual. Los archivos generados se acoplan con total fidelidad a `src/core/types.ts` y `src/store/dataset.ts`.
