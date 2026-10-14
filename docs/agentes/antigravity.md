# Antigravity — Interfaz, experiencia y pruebas en navegador

**Rama:** `feat/antigravity-ui` · **Carpetas propias:** `src/ui/`, `tests/e2e/`.
**Contrato:** `src/store/types.ts` (`AppState`, v1, congelado) y los tipos de `src/core/types.ts`. La UI **no** llama al núcleo directamente: lee estado y ejecuta acciones de `AppState`.

## Cómo trabajar sin esperar al store real

Crea `src/ui/mock/mockStore.ts` que implemente `AppState` con datos de prueba (un grafo de 6–8 nodos y resultados de Dijkstra/tabla escritos a mano). Expón el estado con un hook `useApp()` en `src/ui/useApp.ts`; en F2 el orquestador lo apuntará al store real de Zustand sin cambiar tus componentes. `src/ui/App.tsx` es el componente raíz (ya lo importa `src/main.tsx`).

## Encargo

1. Layout: barra superior (modo **Quetzaltenango** / **Diseño**, cargar/guardar, exportar PNG, tema claro/oscuro), lienzo React Flow al centro, panel de resultados con pestañas **Tabla | Gráfica | Todas las rutas | Floyd**.
2. Nodos personalizados redimensionables (`NodeResizer`), nombre editable, estados: origen, destino, permanente, actual, en ruta.
3. Aristas personalizadas para las 5 formas (`straight`, `bezier`, `arc`, `step`, `smoothstep`), etiqueta de peso legible, edición con doble clic/toque; menú para cambiar forma (individual / todas / volver a automático).
4. Tabla S1 animada y configurable según `TabularConfig` (casilla mínima resaltada, columna tachada, actualizadas en otro color, enfoque al nodo actual), sincronizada con el lienzo vía `playback.stepIndex`. Controles: anterior / siguiente / reproducir / pausa / ir al final / velocidad. Tabla resumen final.
5. Pestaña Floyd: matrices D⁽ᵏ⁾ con selector de k y casillas mejoradas resaltadas.
6. S3: lista virtualizada (`@tanstack/react-virtual`) con progreso (`allPaths.found`), cancelar, ⭐ en la más corta, diferencia vs. la más corta, clic → `highlightPath`, exportar CSV.
7. F6: indicador de escala (`scale.range`), botón "Aplicar distribución sugerida", error de ajuste (`layoutSuggestion.stressError`) con la aclaración de que no todos los pesos son representables en 2D, opción "mantener proporción".
8. Responsive real (F7): en celular el panel pasa a hoja inferior deslizable; pellizcar/arrastrar/mantener presionado; sin scroll horizontal; botones ≥ 44 px. Accesibilidad: contraste, foco visible, `aria-label`. Todo el texto en español.
9. **Validación con Google Maps** (cuando Gemini entregue el dataset): ≥ 15 aristas, incluidas las 5 más largas, tolerancia ±10 %; completa `docs/datos/VALIDACION.md` junto con Gemini.
10. E2E Playwright (`tests/e2e/`, proyectos ya configurados: desktop-chrome, iphone-13, pixel-7, ipad): cargar Quetzaltenango, F2 desde 3 nodos, F3 entre 3 pares, tabla paso a paso hasta el final, lista S3, crear grafo de 5 nodos en diseño y resolverlo, cambiar forma de arista, guardar y recargar JSON. Usa `data-testid` estables. Capturas por dispositivo en `docs/informe/capturas/`.

## Criterio de aceptación (puerta F1)

UI completa funcionando con el mock; `npm run lint && npm run typecheck && npm run build` en verde; sin errores de consola; sin tocar archivos fuera de tus carpetas.

---

## Reporte (lo llena Antigravity)

### Hecho

### Pendiente

### Decisiones

### Dudas
