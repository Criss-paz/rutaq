# Estado del proyecto RutaQ

_Última actualización: 2026-10-14 — Claude Code (orquestador)_

## Fase actual: **F3 QA terminada (local) — F4 Despliegue bloqueado por confirmación de Cris** (2026-10-14)

| Fase           | Estado   | Puerta de salida                                                                   |
| -------------- | -------- | ---------------------------------------------------------------------------------- |
| F0 Base        | ✅       | Repo, contrato, CI y estructura                                                    |
| F1 Paralelo    | ✅       | Core (Codex, 2 rondas) · dataset (Gemini, 4 rondas) · UI (Antigravity, 6 rondas)   |
| F2 Integración | ✅       | App con núcleo, store y dataset reales                                             |
| F3 QA          | ✅ local | Sección 8 completa salvo lo que exige la URL pública                               |
| F4 Despliegue  | ⏳       | Workflow listo; falta confirmar el repositorio público                             |
| F5 Informe     | 🔄       | Borrador verificado; faltan capturas de la versión desplegada y exportar .docx/PDF |

## Sección 8 — verificación del orquestador

| Prueba                                                                     | Resultado                                                            |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| lint · typecheck · test · build                                            | ✅ 31 pruebas unitarias                                              |
| Dijkstra = Floyd = fuerza bruta (≥ 500 grafos)                             | ✅ fast-check, 500 corridas                                          |
| networkx vs programa                                                       | ✅ 648/648 (100 %), incluye los 576 pares de Quetzaltenango          |
| Solución a mano = tabla S1                                                 | ✅ `tests/unit/store/teoria-ejemplo6.test.ts`                        |
| S3: UI fluida, cancelar, primera ruta = Dijkstra                           | ✅ `tests/e2e/qa.spec.ts`                                            |
| Modo diseño completo                                                       | ✅ E2E 08–10                                                         |
| Validaciones con mensajes claros (peso ≤ 0, lazo, duplicada, desconectado) | ✅ `qa.spec.ts`                                                      |
| Escala 1–100 / 1–1 000 / 1–10 000 + distribución sugerida                  | ✅ `qa.spec.ts` (escritorio)                                         |
| E2E 4 dispositivos                                                         | ✅ local: 297/297 con `--repeat-each=3`; ⏳ contra la URL desplegada |
| Lighthouse móvil ≥ 85 / ≥ 90                                               | ✅ local 96 / 95; ⏳ contra la URL desplegada                        |
| Sin errores de consola                                                     | ✅                                                                   |

## Datos

- 24 municipios (Nominatim), 276 pares OSRM, 55 aristas directas calculadas, 221 descartadas con motivo.
- Validación Google Maps: 20 aristas medidas por Antigravity y verificadas de forma independiente por el orquestador
  (6/6 coincidencias). 12 dentro de ±10 %; 8 fuera de tolerancia usan el valor de Google Maps (documentado en `nota`).

## Cómo corren los agentes

| Rol         | Herramienta                                                                                                                   | Worktree / rama                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Codex       | `codex exec` (cuenta administrada por Orca)                                                                                   | `../codex-core` · `feat/codex-core`         |
| Gemini      | `agy -p --model gemini-3.8-flash-high` (la CLI `gemini` ya no admite cuentas personales; Google la reemplazó por Antigravity) | `../gemini-data` · `feat/gemini-data`       |
| Antigravity | `agy -p --model gemini-3.8-flash-high`                                                                                        | `../antigravity-ui` · `feat/antigravity-ui` |

Plan completo para los agentes: `docs/PLAN.md`. Rama de integración: `main`.

## Bloqueos

- **Store (Claude Code):** `src/store/useAppStore.ts` implementa `AppState`. Para mover nodos, la UI debe llamar `moveNodes` al soltar (no en cada píxel) para no llenar el historial.
- **Publicación:** `gh` ya tiene sesión de Criss-paz. Falta que Cris confirme crear el repositorio público `rutaq` (GitHub Pages gratis exige repo público; incluye su nombre y carné).
- **Formato exacto del método tabular del catedrático:** pendiente de confirmar con los apuntes de Cris; S1 es configurable (`TabularConfig`).

## Propiedad de carpetas

| Carpeta                                                                                                            | Dueño       |
| ------------------------------------------------------------------------------------------------------------------ | ----------- |
| `src/core/types.ts`, `src/core/index.ts`, `src/store/`, `src/main.tsx`, `.github/`, `docs/ESTADO.md`, configs raíz | Claude Code |
| `src/core/*` (resto), `tests/unit/` (excepto `tests/unit/store/`), `verification/`                                 | Codex       |
| `src/data/`, `scripts/`, `docs/datos/`, `docs/informe/`                                                            | Gemini      |
| `src/ui/`, `tests/e2e/`                                                                                            | Antigravity |

Cambios de contrato: se proponen en `docs/agentes/<agente>.md` → sección **Dudas**; solo el orquestador los aplica.
