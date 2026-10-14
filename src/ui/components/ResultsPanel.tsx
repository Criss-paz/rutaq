import { useState } from 'react';
import type { ResultTab } from '../../store/types';
import { useApp } from '../useApp';
import AllPathsTab from './tabs/AllPathsTab';
import FloydTab from './tabs/FloydTab';
import GraphicTab from './tabs/GraphicTab';
import TabularTab from './tabs/TabularTab';

export default function ResultsPanel() {
  const activeTab = useApp((s) => s.activeTab);
  const setActiveTab = useApp((s) => s.setActiveTab);

  // Estado para la hoja inferior en dispositivos móviles (colapsada inicialmente, expandible al tocar pestaña o tirador)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const tabs: { key: ResultTab; label: string; shortLabel: string; icon: string; testId: string }[] = [
    { key: 'tabla', label: 'Tabla (S1)', shortLabel: 'Tabla', icon: '📋', testId: 'tab-tabla' },
    { key: 'grafica', label: 'Gráfica (S2)', shortLabel: 'Gráfica', icon: '🗺️', testId: 'tab-grafica' },
    { key: 'rutas', label: 'Todas las rutas (S3)', shortLabel: 'Rutas', icon: '⭐', testId: 'tab-rutas' },
    { key: 'floyd', label: 'Floyd', shortLabel: 'Floyd', icon: '🔢', testId: 'tab-floyd' },
  ];

  return (
    <section
      data-testid="results-panel"
      aria-label="Panel de resultados"
      className={`z-20 flex flex-col border-t border-slate-200 bg-white/95 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 ${
        /* En pantallas móviles se comporta como hoja inferior deslizable */
        isMobileExpanded
          ? 'fixed inset-x-0 bottom-0 h-[60vh] md:static md:h-[360px]'
          : 'fixed inset-x-0 bottom-0 h-[56px] md:static md:h-[360px]'
      }`}
    >
      {/* Tirador para dispositivos móviles (Bottom Sheet Grab Handle) */}
      <button
        type="button"
        data-testid="bottom-sheet-handle"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
        aria-label={isMobileExpanded ? 'Minimizar panel inferior' : 'Expandir panel inferior'}
        className="flex w-full cursor-pointer items-center justify-center py-1.5 md:hidden focus-visible:outline-hidden"
      >
        <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
      </button>

      {/* Barra de pestañas */}
      <div className="flex items-center justify-between overflow-x-auto border-b border-slate-200 px-2 py-1 sm:px-3 dark:border-slate-800">
        <div role="tablist" aria-label="Pestañas de solución" className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.key}`}
                data-testid={tab.testId}
                onClick={() => {
                  setActiveTab(tab.key);
                  // En móvil, si estaba minimizado, al cambiar de pestaña expandirlo para ver el contenido
                  setIsMobileExpanded(true);
                }}
                className={`flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden sm:gap-1.5 sm:px-3 sm:py-2 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Botón de alternar altura en móvil */}
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          aria-label={isMobileExpanded ? 'Colapsar panel' : 'Expandir panel'}
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 md:flex dark:text-slate-400 dark:hover:text-white"
        >
          {isMobileExpanded ? '▼' : '▲'}
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto"
      >
        {activeTab === 'tabla' && <TabularTab />}
        {activeTab === 'grafica' && <GraphicTab />}
        {activeTab === 'rutas' && <AllPathsTab />}
        {activeTab === 'floyd' && <FloydTab />}
      </div>
    </section>
  );
}
