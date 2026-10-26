/**
 * Barra de herramientas complementaria para el módulo Guatemala — Transporte Express (G1–G5).
 * Proporciona acceso directo a:
 *   - Botón destacado «Calcular mejor ruta» (asistente de dos pasos G3)
 *   - Ejemplos rápidos (QUE→IZA, GUA→PET, SMA→JUT, Red mínima)
 *   - Botón «Administrar red» (G2)
 *   - Botón «Modo presentación» (G5)
 *   - Botón «Acerca de» (G5)
 *
 * Lee y modifica: `query`, `setPathQuery`, `coverMode`, `setCoverMode`, `clearQuery` desde `useApp`.
 */
import { useApp } from '../../useApp';

interface GuatemalaToolbarProps {
  onOpenAssistant: () => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  onStartPresentation: () => void;
}

export default function GuatemalaToolbar({
  onOpenAssistant,
  onOpenAdmin,
  onOpenAbout,
  onStartPresentation,
}: GuatemalaToolbarProps) {
  const query = useApp((s) => s.query);
  const setPathQuery = useApp((s) => s.setPathQuery);
  const coverMode = useApp((s) => s.coverMode);
  const setCoverMode = useApp((s) => s.setCoverMode);
  const clearQuery = useApp((s) => s.clearQuery);

  return (
    <div
      data-testid="guatemala-toolbar"
      className="shrink-0 flex items-center gap-2 border-b border-blue-100 bg-blue-50/70 px-2 py-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 sm:flex-wrap sm:justify-between sm:px-3 sm:py-1.5"
    >
      {/* Botón principal del Asistente */}
      <button
        type="button"
        data-testid="btn-calculate-route"
        onClick={onOpenAssistant}
        className="shrink-0 flex min-h-[38px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span>📦</span>
        <span className="whitespace-nowrap">Calcular mejor ruta</span>
      </button>

      {/* Separador sutil en escritorio */}
      <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

      {/* Fila con desplazamiento horizontal en móvil para ejemplos y acciones secundarias */}
      <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5 sm:flex-initial sm:overflow-visible sm:py-0">
        <span className="hidden lg:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-0.5">
          Ejemplos:
        </span>
        <button
          type="button"
          data-testid="btn-example-que-iza"
          onClick={() => setPathQuery('QUE', 'IZA')}
          title="Quetzaltenango a Puerto Barrios (QUE → IZA)"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            query?.kind === 'path' && query.source === 'QUE' && query.target === 'IZA'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          QUE → IZA
        </button>
        <button
          type="button"
          data-testid="btn-example-gua-pet"
          onClick={() => setPathQuery('GUA', 'PET')}
          title="Ciudad de Guatemala a Flores (GUA → PET)"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            query?.kind === 'path' && query.source === 'GUA' && query.target === 'PET'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          GUA → PET
        </button>
        <button
          type="button"
          data-testid="btn-example-sma-jut"
          onClick={() => setPathQuery('SMA', 'JUT')}
          title="San Marcos a Jutiapa (SMA → JUT)"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            query?.kind === 'path' && query.source === 'SMA' && query.target === 'JUT'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          SMA → JUT
        </button>
        <button
          type="button"
          data-testid="btn-example-mst"
          onClick={() => {
            setCoverMode('mst');
            clearQuery();
          }}
          title="Red mínima completa con Prim y Kruskal"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            coverMode === 'mst' && !query
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🌳 Red Mínima
        </button>

        <span className="shrink-0 text-slate-300 dark:text-slate-700 sm:hidden">|</span>

        {/* Acciones de gestión, presentación e información */}
        <button
          type="button"
          data-testid="btn-admin-network"
          onClick={onOpenAdmin}
          className="shrink-0 flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Administrar departamentos y carreteras"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Administrar red</span>
        </button>

        <button
          type="button"
          data-testid="btn-presentation-mode"
          onClick={onStartPresentation}
          className="shrink-0 flex min-h-[36px] items-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
          title="Modo pantalla completa para exposición"
        >
          <span>📽️</span>
          <span className="hidden sm:inline">Presentación</span>
        </button>

        <button
          type="button"
          data-testid="btn-about"
          onClick={onOpenAbout}
          className="shrink-0 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          title="Acerca de los desarrolladores e institución"
        >
          ℹ️
        </button>
      </div>
    </div>
  );
}
