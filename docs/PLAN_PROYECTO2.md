# PLAN MAESTRO — AMPLIACIÓN: PROYECTO II «Transporte Express»

Módulo Guatemala (22 departamentos) dentro de RutaQ. Amplía `docs/PLAN.md` (Proyecto I): todas sus reglas siguen
vigentes (roles, propiedad de carpetas, contratos, datos reales y trazables, pruebas, Definición de Terminado).

## 0. Regla principal: no romper lo que ya existe

1. Quetzaltenango y el modo Diseño (Proyecto I) siguen funcionando exactamente igual.
2. Respaldo: etiqueta `v1-proyecto-1` en `main` (ya creada y publicada).
3. Todo se **agrega**. En `src/core/types.ts` solo se permiten adiciones; ningún tipo ni firma existente cambia.
4. **Puerta de regresión:** las pruebas unitarias y E2E del Proyecto I siguen en verde después de cada integración.
   Línea base (2026-10-25): 33 unitarias, 112/112 E2E en 4 dispositivos, networkx 648/648, cobertura de ramas 90.96 %.
5. Misma arquitectura: React + TypeScript sin servidor, desplegado en https://criss-paz.github.io/rutaq/.

## 1. Enunciado (del catedrático)

La empresa **Transporte Express** envía paquetes a diferentes destinos; los paquetes llegan tarde y quiere analizar las
rutas más cortas hacia cada departamento de Guatemala. El sistema debe:

- Permitir el **ingreso de departamentos**.
- Permitir el **ingreso de las carreteras** que conectan los destinos y su **kilometraje** (todas las rutas posibles:
  A→B, A→C, B→C…).
- **Preguntar dónde está el paquete y a dónde debe ir**, y mostrar la **mejor ruta**.

Documentación: carátula, descripción y solución del problema, capturas de pantalla y código fuente.
**Presentación: sábado 31 de octubre de 2026**, un solo expositor, sistema funcionando con un par de ejemplos.

| Integrante                        | Carné         |
| --------------------------------- | ------------- |
| Cristopher Alexis Castellanos Paz | 2690-24-5972  |
| Leonel Taracena Marroquín         | 2690-24-4072  |
| Pablo Alexander Vásquez Rivera    | 2690-24-13123 |

Universidad Mariano Gálvez de Guatemala, Ingeniería en Sistemas. **Curso, catedrático y sección: pendientes** (los
confirma Cris antes de la documentación final; usar `________` mientras tanto).

## 2. Nuevo módulo «Guatemala — Transporte Express»

Selector de modo: **Quetzaltenango | Guatemala (Transporte Express) | Diseño**. Encabezado propio con el nombre de la empresa.

### G1 — Mapa de los 22 departamentos orientado como Google Maps

Nodos = cabecera departamental de cada departamento (ids fijos, ver `docs/agentes/proyecto2_ids.md`):

| Departamento  | Cabecera            | Departamento   | Cabecera              |
| ------------- | ------------------- | -------------- | --------------------- |
| Guatemala     | Ciudad de Guatemala | Alta Verapaz   | Cobán                 |
| Sacatepéquez  | Antigua Guatemala   | Baja Verapaz   | Salamá                |
| Chimaltenango | Chimaltenango       | Petén          | Flores                |
| Escuintla     | Escuintla           | Quiché         | Santa Cruz del Quiché |
| Santa Rosa    | Cuilapa             | Huehuetenango  | Huehuetenango         |
| Jutiapa       | Jutiapa             | San Marcos     | San Marcos            |
| Jalapa        | Jalapa              | Quetzaltenango | Quetzaltenango        |
| El Progreso   | Guastatoya          | Totonicapán    | Totonicapán           |
| Zacapa        | Zacapa              | Sololá         | Sololá                |
| Chiquimula    | Chiquimula          | Retalhuleu     | Retalhuleu            |
| Izabal        | Puerto Barrios      | Suchitepéquez  | Mazatenango           |

- Posición real: lat/lon proyectada con **Web Mercator, norte arriba** (Petén arriba, costa sur abajo, Huehuetenango y
  San Marcos a la izquierda, Izabal a la derecha). Rosa de los vientos y escala en km.
- **Contorno simplificado de Guatemala** como fondo tenue (GeoJSON de dominio público: Natural Earth u OSM). Extra
  opcional: fondo Leaflet + OpenStreetMap.
- Petén queda lejos: zoom y «Ajustar a pantalla»; no se distorsiona la geografía.

### G2 — Ingreso de departamentos y carreteras (formularios) — panel «Administrar red»

- Departamentos: agregar (nombre, cabecera, latitud y longitud opcionales), editar, eliminar, buscar. Sin coordenadas
  → se coloca donde el usuario haga clic o con la distribución sugerida (F6).
- Carreteras: agregar (origen, destino, km, nombre opcional como CA-1, CA-9…), editar, eliminar; tabla ordenable.
- Validaciones: km > 0, origen ≠ destino, sin duplicadas entre el mismo par (ofrecer editar la existente),
  departamentos existentes. Carreteras **bidireccionales**.
- Persistencia automática en localStorage (try/catch); exportar/importar JSON; **restaurar datos originales**.

### G3 — Asistente «¿Dónde está el paquete? / ¿A dónde debe ir?» (función principal)

- Botón destacado **«Calcular mejor ruta»** → asistente de dos preguntas con listas con búsqueda:
  1. «¿Dónde se encuentra el paquete?» 2. «¿A qué departamento debe llegar?»
     También tocando nodos en el mapa (primer toque = inicio, segundo = final).
- Resultado (Dijkstra de `core`): ruta resaltada y animada; **listado de nodos** en orden; **tabla de tramos**
  `# | Desde | Hasta | Carretera | km del tramo | km acumulado`; **suma total** grande y la fórmula
  `12.5 + 30.2 + … = 245.7 km`; siguen disponibles las 3 formas de solución del Proyecto I (tabla, gráfica, todas las
  rutas). Empates: todas las rutas empatadas. Sin conexión: mensaje claro.

### G4 — «Ruta más corta que recorra y conecte todos los nodos» (selector, (a) predeterminada)

- **(a) Árbol de expansión mínima (Prim y Kruskal):** árbol que conecta los 22 departamentos con el menor total de km,
  sin ciclos; aristas en orden de selección, km y total. Solución **tabulada paso a paso** con el estilo del método de
  clase (Prim: arista mínima resaltada, nodo incorporado, columna tachada; Kruskal en su pestaña: aristas ordenadas,
  aceptada / rechazada por ciclo). Prim y Kruskal deben dar el mismo total (prueba cruzada).
- **(b) Árbol de rutas más cortas desde la bodega** (como F2 del Proyecto I) con tabla de distancias a los otros 21.
- **(c) Recorrido de reparto que visita todos** (opcional, solo si (a) y (b) pasaron QA): vecino más cercano + 2-opt
  sobre distancias de camino más corto, en Web Worker; la UI aclara que es una **aproximación heurística**.
- Texto claro de cada opción en la UI para el expositor.

### G5 — Presentación

- Ejemplos rápidos con un botón: «Quetzaltenango → Puerto Barrios», «Ciudad de Guatemala → Flores»,
  «San Marcos → Jutiapa» y la red mínima completa.
- **Modo presentación:** oculta paneles secundarios, agranda el texto, mapa y resultado a pantalla completa; bien en
  proyector 1280×720 y 1920×1080.
- «Acerca de»: integrantes, carnés, universidad.

## 3. Datos reales de los 22 departamentos (Gemini; validación Antigravity)

Mismo método que la sección 3.2 del Proyecto I, con estos ajustes:

1. Coordenadas de cada cabecera (OSM/Nominatim o Wikidata) con fuente; auditar contra Wikipedia/Google Maps como se hizo
   en Quetzaltenango (lección aprendida: El Palmar estaba en el casco abandonado).
2. Km por carretera con OSRM (1 decimal), geometría simplificada y nombre de carretera (CA-1, CA-2, CA-9, CA-13, CA-14,
   RN-…) derivado de los `steps` de OSRM; nunca inventado.
3. Arista directa: la ruta A–B **no pasa por otra cabecera departamental** (umbral documentado).
4. Validación doble: **Google Maps ≥ 20 aristas** (±10 %); y distancias **Ciudad de Guatemala → cada cabecera** del
   programa contra la tabla oficial de la **Dirección General de Caminos (CIV)** si está publicada; documentar diferencias.
5. Grafo **conexo**; Petén conectado por su carretera real hacia Alta Verapaz o Izabal.
6. `src/data/guatemala.json` con el mismo formato que `quetzaltenango.json` (tipo `GuatemalaDataset`).
7. `docs/datos/VALIDACION_GUATEMALA.md`. 8. El script reproducible también genera este archivo.

## 4. Cambios en el código (solo adiciones)

Contrato añadido en `src/core/types.ts` (sección «Proyecto II»): `MSTStep`, `MSTResult`, `RouteBreakdown`,
`TourResult`, `GuatemalaDataset`, `CoreApiP2` (`prim`, `kruskal`, `routeBreakdown`, `deliveryTour`) y
`CoreWorkerApiP2`. Store añadido en `src/store/types.ts`. Delegación detallada en `docs/agentes/*.md`.

## 5. Preparación para el PDF (siguiente paso)

- `docs/proyecto2/`: descripción y solución, guion, solución teórica del MST a mano.
- `npm run capturas` contra la URL desplegada → `docs/capturas/proyecto2/`.
- Código comentado en español en archivos clave; `npm run anexo-codigo` → `docs/proyecto2/codigo_fuente.md`.
- Documento: Carátula (UMG, curso, catedrático, sección, integrantes, 31/10/2026) → Descripción → Solución → Capturas → Código.

## 6. Calendario (límite real: sábado 31 de octubre)

| Fecha  | Meta                                                                |
| ------ | ------------------------------------------------------------------- |
| Lun 26 | Respaldo, contrato ampliado, dataset de Guatemala listo y validado  |
| Mar 27 | `mst.ts` y `route.ts` con pruebas; UI del módulo con datos reales   |
| Mié 28 | Integración completa, regresión del Proyecto I en verde, despliegue |
| Jue 29 | QA completa, capturas y anexo de código                             |
| Vie 30 | PDF, correcciones y ensayo                                          |

Prioridad si hay atraso: **G3 > G1 > G2 > G4(a) > G5 > G4(b) > G4(c)**.

## 7. Definición de Terminado del Proyecto II

- [ ] Proyecto I intacto (todas sus pruebas en verde).
- [ ] Mapa con 22 departamentos orientado al norte, rosa de los vientos, datos reales validados.
- [ ] Ingreso, edición y eliminación de departamentos y carreteras por formulario, con persistencia.
- [ ] Asistente con origen/destino, ruta, listado de nodos, tabla de tramos y suma de km.
- [ ] MST con Prim y Kruskal: mismo total y coincide con networkx.
- [ ] Ejemplos rápidos y modo presentación en proyector y celular.
- [ ] Pruebas unitarias, E2E y Lighthouse en verde contra la URL desplegada.
- [ ] `npm run capturas` y `npm run anexo-codigo` generan sus archivos.
- [ ] Guion de presentación y descripción/solución listos.
- [ ] `README.md` y `docs/ESTADO.md` actualizados.
