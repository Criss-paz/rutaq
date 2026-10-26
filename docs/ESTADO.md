# Estado del proyecto RutaQ

_Última actualización: 2026-10-14 — Claude Code (orquestador)_

## Proyecto II — Transporte Express: **publicado** (2026-10-26) · presentación: sábado 31 de octubre de 2026

Plan: `docs/PLAN_PROYECTO2.md` · respaldo del Proyecto I: etiqueta `v1-proyecto-1`.

| Puerta                                      | Resultado                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Proyecto I intacto                          | ✅ sus 112 E2E siguen en verde (la única adaptación: distancias mostradas con 1 decimal)                                                    |
| Unitarias y cobertura                       | ✅ 47 pruebas · cobertura del núcleo 97.1 % sentencias, 91.4 % ramas                                                                        |
| networkx vs programa                        | ✅ 1168/1168 pares de caminos mínimos y 10/10 totales de AEM                                                                                |
| Datos de Guatemala                          | ✅ 22 cabeceras auditadas; 49 aristas entre vecinos; 49/49 medidas en Google Maps (35 recomendada, 9 alternativa, 5 con el valor de Google) |
| E2E contra la URL publicada                 | ✅ 148/148 en escritorio, iPhone 13, Pixel 7 e iPad                                                                                         |
| Lighthouse móvil (producción)               | ✅ rendimiento 91, accesibilidad 95, buenas prácticas 100, SEO 100                                                                          |
| `npm run capturas` · `npm run anexo-codigo` | ✅ 13 capturas de producción · anexo de 4 896 líneas                                                                                        |
| Documentación                               | ✅ descripción y solución, guion con valores reales, solución a mano del AEM                                                                |

Pendiente de Cris: **curso, catedrático y sección** para la carátula; después se genera el PDF.

Nota técnica: Vitest guarda un caché por contenido en `node_modules/.vitest-cache`; si se agrega un JSON a `src/data/`
después de haber corrido pruebas, borrar ese caché (el `import.meta.glob` del store quedaría sin el archivo nuevo).

## Estado: **TERMINADO** — app publicada en https://criss-paz.github.io/rutaq/ (2026-10-14)

| Fase           | Estado | Puerta de salida                                                                              |
| -------------- | ------ | --------------------------------------------------------------------------------------------- |
| F0 Base        | ✅     | Repo, contrato, CI y estructura                                                               |
| F1 Paralelo    | ✅     | Core (Codex, 2 rondas) · dataset (Gemini, 4 rondas) · UI (Antigravity, 6 rondas)              |
| F2 Integración | ✅     | App con núcleo, store y dataset reales                                                        |
| F3 QA          | ✅     | Sección 8 completa, también contra la URL publicada                                           |
| F4 Despliegue  | ✅     | https://criss-paz.github.io/rutaq/ · https://github.com/Criss-paz/rutaq · CI y Pages en verde |
| F5 Informe     | ✅     | `docs/informe/INFORME.pdf` (29 págs.) y `INFORME.docx`, con capturas de la versión desplegada |

## Sección 8 — verificación del orquestador

| Prueba                                                                     | Resultado                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| lint · typecheck · test · build                                            | ✅ 31 pruebas unitarias                                                        |
| Dijkstra = Floyd = fuerza bruta (≥ 500 grafos)                             | ✅ fast-check, 500 corridas                                                    |
| networkx vs programa                                                       | ✅ 648/648 (100 %), incluye los 576 pares de Quetzaltenango                    |
| Solución a mano = tabla S1                                                 | ✅ `tests/unit/store/teoria-ejemplo6.test.ts`                                  |
| S3: UI fluida, cancelar, primera ruta = Dijkstra                           | ✅ `tests/e2e/qa.spec.ts`                                                      |
| Modo diseño completo                                                       | ✅ E2E 08–10                                                                   |
| Validaciones con mensajes claros (peso ≤ 0, lazo, duplicada, desconectado) | ✅ `qa.spec.ts`                                                                |
| Escala 1–100 / 1–1 000 / 1–10 000 + distribución sugerida                  | ✅ `qa.spec.ts` (escritorio)                                                   |
| E2E 4 dispositivos                                                         | ✅ producción: 112/112 (2026-10-15)                                            |
| Lighthouse móvil ≥ 85 / ≥ 90                                               | ✅ producción: rendimiento 92, accesibilidad 95, buenas prácticas 100, SEO 100 |
| Sin errores de consola                                                     | ✅                                                                             |

## Datos

- 24 municipios (Nominatim + auditoría contra Wikipedia y Google Maps; El Palmar → El Nuevo Palmar y Cantel corregidos),
  276 pares OSRM, 50 aristas directas calculadas, 226 descartadas con motivo.
- Validación Google Maps: 18 aristas (incluidas las 5 más largas); 13 dentro de ±10 %, 5 usan el valor de Google.
- Mapa: posición geográfica exacta (norte arriba, escala real), rosa de los vientos, escala en km, nombres sin
  superposición según el zoom; panel de resultados redimensionable, minimizable y maximizable.

## Cómo corren los agentes

| Rol         | Herramienta                                                                                                                   | Worktree / rama                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Codex       | `codex exec` (cuenta administrada por Orca)                                                                                   | `../codex-core` · `feat/codex-core`         |
| Gemini      | `agy -p --model gemini-3.8-flash-high` (la CLI `gemini` ya no admite cuentas personales; Google la reemplazó por Antigravity) | `../gemini-data` · `feat/gemini-data`       |
| Antigravity | `agy -p --model gemini-3.8-flash-high`                                                                                        | `../antigravity-ui` · `feat/antigravity-ui` |

Plan completo para los agentes: `docs/PLAN.md`. Rama de integración: `main`.

## Notas para Cris (no bloquean)

- **Formato de la tabla del catedrático:** S1 es configurable desde la app (formato de etiqueta, tachado, matriz de adyacencia); confirmar con los apuntes. Resumen de entrega: `docs/RESUMEN.md`.

## Propiedad de carpetas

| Carpeta                                                                                                            | Dueño       |
| ------------------------------------------------------------------------------------------------------------------ | ----------- |
| `src/core/types.ts`, `src/core/index.ts`, `src/store/`, `src/main.tsx`, `.github/`, `docs/ESTADO.md`, configs raíz | Claude Code |
| `src/core/*` (resto), `tests/unit/` (excepto `tests/unit/store/`), `verification/`                                 | Codex       |
| `src/data/`, `scripts/`, `docs/datos/`, `docs/informe/`                                                            | Gemini      |
| `src/ui/`, `tests/e2e/`                                                                                            | Antigravity |

Cambios de contrato: se proponen en `docs/agentes/<agente>.md` → sección **Dudas**; solo el orquestador los aplica.
