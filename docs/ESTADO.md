# Estado del proyecto RutaQ

_Última actualización: 2026-10-14 — Claude Code (orquestador)_

## Fase actual: **F0 Base → terminada.** Siguiente: **F1 Paralelo** (Codex + Gemini + Antigravity)

| Fase           | Estado         | Responsable                              | Puerta de salida                                                    |
| -------------- | -------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| F0 Base        | ✅ Hecha       | Claude Code                              | Repo, contrato, CI y estructura en la rama base                     |
| F1 Paralelo    | ⏳ Por iniciar | Codex · Gemini · Antigravity             | Core con pruebas en verde · dataset validado y conexo · UI con mock |
| F2 Integración | ⬜             | Claude Code                              | App con core y dataset reales; build sin errores                    |
| F3 QA          | ⬜             | Claude Code + Antigravity                | Sección 8 del plan completa                                         |
| F4 Despliegue  | ⬜             | Claude Code (+ Cris para iniciar sesión) | URL pública; E2E contra producción                                  |
| F5 Informe     | ⬜             | Gemini (revisa Claude Code)              | Informe .docx + PDF con capturas reales                             |

## Hecho en F0

- Vite 8 + React 18 + TypeScript 6 + Tailwind 4, ESLint (flat) + Prettier, Vitest 5 + fast-check + cobertura v8, Playwright (4 dispositivos).
- Dependencias de la app instaladas: `@xyflow/react`, `zustand`, `zundo`, `comlink`, `@tanstack/react-virtual`.
- **Contrato congelado v1**: `src/core/types.ts` (tipos + `CoreApi` + `CoreWorkerApi` + formatos de archivo) y `src/store/types.ts` (`AppState`, lo que consume la UI).
- Stubs del núcleo tipados contra `CoreApi` (el typecheck falla si una implementación cambia la firma).
- Regla ESLint: `src/core` no puede importar React, Zustand, `store/` ni `ui/`.
- `src/store/dataset.ts`: conversión `Dataset` → `Graph` (proyección lat/lon) con pruebas.
- CI (`.github/workflows/ci.yml`): lint, typecheck, formato, tests, build; job de verificación networkx que se activa cuando exista `verification/verify.py`.
- Ramas de trabajo creadas desde la base: `feat/codex-core`, `feat/gemini-data`, `feat/antigravity-ui`.
- Encargos detallados en `docs/agentes/{codex,gemini,antigravity}.md`.

## Pendiente / quién lo tiene

| Tarea                                                                              | Dueño                | Estado                   |
| ---------------------------------------------------------------------------------- | -------------------- | ------------------------ |
| Algoritmos `src/core/*` + `tests/unit/` + `verification/`                          | Codex                | ⏳                       |
| Dataset `src/data/quetzaltenango.json`, `ejemplo6.json`, `scripts/`, `docs/datos/` | Gemini               | ⏳                       |
| Solución a mano del ejemplo 6 nodos (`docs/informe/solucion_teorica.md`)           | Gemini               | ⏳                       |
| UI `src/ui/*` con mock de `AppState` + `tests/e2e/`                                | Antigravity          | ⏳                       |
| Validación Google Maps (≥ 15 aristas) → `docs/datos/VALIDACION.md`                 | Antigravity + Gemini | ⏳ (después del dataset) |
| Implementación del store (`src/store/`) con Zustand + zundo + Worker               | Claude Code          | ⏳                       |
| Workflow de despliegue (GitHub Pages)                                              | Claude Code          | ⏳ F4                    |

## Bloqueos

- **Remoto de GitHub:** el repo no tiene `origin`. Para CI y despliegue, Cris debe crear el repositorio en GitHub (o autorizar `gh repo create` iniciando sesión con `gh auth login`). Nadie más crea cuentas ni escribe credenciales.
- **Rama principal:** el repo usa `master` (no `main`). La integración se hace en `master` salvo que Cris prefiera renombrarla.
- **Formato exacto del método tabular del catedrático:** pendiente de confirmar con los apuntes de Cris; S1 es configurable (`TabularConfig`).

## Propiedad de carpetas

| Carpeta                                                                                                            | Dueño       |
| ------------------------------------------------------------------------------------------------------------------ | ----------- |
| `src/core/types.ts`, `src/core/index.ts`, `src/store/`, `src/main.tsx`, `.github/`, `docs/ESTADO.md`, configs raíz | Claude Code |
| `src/core/*` (resto), `tests/unit/` (excepto `tests/unit/store/`), `verification/`                                 | Codex       |
| `src/data/`, `scripts/`, `docs/datos/`, `docs/informe/`                                                            | Gemini      |
| `src/ui/`, `tests/e2e/`                                                                                            | Antigravity |

Cambios de contrato: se proponen en `docs/agentes/<agente>.md` → sección **Dudas**; solo el orquestador los aplica.
