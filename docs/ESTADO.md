# Estado del proyecto RutaQ

_Última actualización: 2026-10-14 — Claude Code (orquestador)_

## Fase actual: **F1 cerrando / F2 integración en curso** (2026-10-14)

| Fase           | Estado                                                   | Responsable               | Puerta de salida                                 |
| -------------- | -------------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| F0 Base        | ✅ Hecha                                                 | Claude Code               | Repo, contrato, CI y estructura                  |
| F1 Paralelo    | 🔄 Codex ✅ · Gemini ✅ (datos) · Antigravity 🔄 ronda 2 | Agentes                   | Core verde · dataset validado · UI               |
| F2 Integración | 🔄                                                       | Claude Code               | App con core y dataset reales; build sin errores |
| F3 QA          | ⬜                                                       | Claude Code + Antigravity | Sección 8 del plan                               |
| F4 Despliegue  | ⏳ workflow listo; falta confirmar publicación           | Claude Code               | URL pública; E2E contra producción               |
| F5 Informe     | 🔄 borrador (Gemini)                                     | Gemini + Claude Code      | Informe .docx + PDF                              |

## Resultados verificados por el orquestador

- **Núcleo (Codex)**: aprobado en ronda 2 (ronda 1 rechazada: Yen falso, layout circular, formas por esquina).
  Yen real (5 000 rutas en rejilla 7×7 < 5 s), SMACOF, cobertura ≥ 90 %.
- **networkx vs programa**: 648/648 (100 %) — los 576 pares de Quetzaltenango, ejemplo de 6 nodos y grafo de prueba.
- **Solución a mano = tabla S1**: prueba automática `tests/unit/store/teoria-ejemplo6.test.ts`.
- **Dataset (Gemini)**: aprobado en ronda 2 (ronda 1 rechazada: aristas y códigos de carretera escritos a mano).
  276 pares OSRM, 55 aristas directas calculadas, 221 descartadas con motivo, reproducible desde caché (SHA-256 idéntico).
- **Store (Claude Code)**: `src/store/useAppStore.ts` + integración UI ↔ store real; mapa sin nodos encimados.
- **Despliegue**: `.github/workflows/deploy.yml` (GitHub Pages, `BASE_PATH=/<repo>/`) probado localmente.

## En curso

| Tarea                                                                                                       | Dueño       | Estado                             |
| ----------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------- |
| UI ronda 2: panel lateral en escritorio, arrastre al soltar, «mantener proporción», E2E contra datos reales | Antigravity | 🔄                                 |
| Validación Google Maps (≥ 15 aristas)                                                                       | Antigravity | 🔄 (depende de acceso a navegador) |
| Borrador del informe + `carretera: "Unknown"` → `""`                                                        | Gemini      | 🔄                                 |
| QA sección 8, Lighthouse, E2E contra producción                                                             | Claude Code | ⬜                                 |

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
