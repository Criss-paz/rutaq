import { useRef, useState } from 'react';
import type { ResultTab } from '../../store/types';
import { useUiStore } from '../uiStore';
import { useApp } from '../useApp';
import AllPathsTab from './tabs/AllPathsTab';
import FloydTab from './tabs/FloydTab';
import GraphicTab from './tabs/GraphicTab';
import TabularTab from './tabs/TabularTab';

export default function ResultsPanel() {
  const activeTab = useApp((s) => s.activeTab);
  const setActiveTab = useApp((s) => s.setActiveTab);

  const mobileSheetPos = useUiStore((s) => s.mobileSheetPos);
  const setMobileSheetPos = useUiStore((s) => s.setMobileSheetPos);
  const isDesktopCollapsed = useUiStore((s) => s.isDesktopCollapsed);
  const setIsDesktopCollapsed = useUiStore((s) => s.setIsDesktopCollapsed);

  const [isDragging, setIsDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStartRef = useRef<{ y: number; height: number; time: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (window.innerWidth >= 1024) return;
    if (e.button !== 0) return;
    const panel = e.currentTarget.closest('[data-testid="results-panel"]') as HTMLElement | null;
    const currentHeight = panel
      ? panel.getBoundingClientRect().height
      : mobileSheetPos === 'collapsed'
        ? 56
        : mobileSheetPos === 'mid'
          ? window.innerHeight * 0.45
          : window.innerHeight * 0.85;

    dragStartRef.current = { y: e.clientY, height: currentHeight, time: Date.now() };
    setIsDragging(true);
    setDragHeight(currentHeight);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar navegadores o entornos donde setPointerCapture no esté disponible
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaY = dragStartRef.current.y - e.clientY;
    const newH = Math.max(56, Math.min(window.innerHeight * 0.9, dragStartRef.current.height + deltaY));
    setDragHeight(newH);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si el puntero ya no estaba capturado
    }
    setIsDragging(false);
    const deltaY = dragStartRef.current.y - e.clientY;
    const totalDist = Math.abs(deltaY);
    const elapsed = Date.now() - dragStartRef.current.time;
    const finalHeight = dragHeight ?? dragStartRef.current.height;
    dragStartRef.current = null;
    setDragHeight(null);

    // Si fue un tap rápido (<8px de arrastre y <350ms)
    if (totalDist < 8 && elapsed < 350) {
      setMobileSheetPos((prev) => (prev === 'collapsed' ? 'mid' : 'collapsed'));
      return;
    }

    // Ajuste a posiciones colapsada / media / expandida
    const vh = window.innerHeight;
    if (finalHeight < vh * 0.28) {
      setMobileSheetPos('collapsed');
    } else if (finalHeight < vh * 0.65) {
      setMobileSheetPos('mid');
    } else {
      setMobileSheetPos('expanded');
    }
  };

  const tabs: { key: ResultTab; label: string; shortLabel: string; icon: string; testId: string }[] = [
    { key: 'tabla', label: 'Tabla (S1)', shortLabel: 'Tabla', icon: '📋', testId: 'tab-tabla' },
    { key: 'grafica', label: 'Gráfica (S2)', shortLabel: 'Gráfica', icon: '🗺️', testId: 'tab-grafica' },
    { key: 'rutas', label: 'Rutas (S3)', shortLabel: 'Rutas', icon: '⭐', testId: 'tab-rutas' },
    { key: 'floyd', label: 'Floyd', shortLabel: 'Floyd', icon: '🔢', testId: 'tab-floyd' },
  ];

  const mobileHeightClass =
    mobileSheetPos === 'expanded'
      ? 'fixed inset-x-0 bottom-0 h-[85vh] border-t'
      : mobileSheetPos === 'mid'
        ? 'fixed inset-x-0 bottom-0 h-[45vh] border-t'
        : 'fixed inset-x-0 bottom-0 h-[56px] border-t';

  return (
    <section
      data-testid="results-panel"
      data-sheet-position={mobileSheetPos}
      aria-label="Panel de resultados"
      style={{ height: isDragging && dragHeight ? `${dragHeight}px` : undefined }}
      className={`z-20 flex shrink-0 flex-col border-slate-200 bg-white/95 shadow-xl backdrop-blur-md transition-all ${
        isDragging ? 'duration-0' : 'duration-300'
      } dark:border-slate-800 dark:bg-slate-900/95 ${
        /* En pantallas móviles y tablet vertical (<1024px): hoja inferior deslizable */
        mobileHeightClass
      } ${
        /* En pantallas >=1024px: panel lateral a la derecha con ancho ~460px */
        isDesktopCollapsed
          ? 'lg:static lg:h-full lg:w-[56px] lg:border-t-0 lg:border-l'
          : 'lg:static lg:h-full lg:w-[460px] lg:border-t-0 lg:border-l'
      }`}
    >
      {/* Tirador táctil para dispositivos móviles (Bottom Sheet Grab Handle) con min-h-[44px] */}
      <button
        type="button"
        data-testid="bottom-sheet-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (!isDragging) {
            setMobileSheetPos((prev) => (prev === 'collapsed' ? 'mid' : 'collapsed'));
          }
        }}
        aria-label={
          mobileSheetPos === 'collapsed'
            ? 'Expandir panel inferior (altura media 45%)'
            : mobileSheetPos === 'mid'
              ? 'Panel inferior en altura media (45%), arrastre para expandir o colapsar'
              : 'Panel inferior expandido, arrastre hacia abajo para reducir'
        }
        className="flex min-h-[44px] w-full cursor-grab active:cursor-grabbing items-center justify-center py-2 lg:hidden focus-visible:outline-hidden touch-none"
      >
        <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
      </button>

      {/* Barra de pestañas */}
      <div className="flex items-center justify-between border-b border-slate-200 px-2 py-1.5 sm:px-3 dark:border-slate-800">
        {!isDesktopCollapsed && (
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
                    // En móvil, si estaba minimizado, al cambiar de pestaña abrir a posición media (~45%)
                    if (mobileSheetPos === 'collapsed') {
                      setMobileSheetPos('mid');
                    }
                  }}
                  className={`flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden sm:gap-1.5 sm:px-3 sm:py-2 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="sm:hidden lg:inline xl:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline lg:hidden xl:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Botón de alternar en escritorio (colapsar/expandir panel lateral derecho) */}
        <button
          type="button"
          data-testid="desktop-collapse-btn"
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          aria-label={isDesktopCollapsed ? 'Expandir panel lateral derecho' : 'Colapsar panel lateral derecho'}
          className="hidden min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          title={isDesktopCollapsed ? 'Expandir panel (460px)' : 'Colapsar panel'}
        >
          {isDesktopCollapsed ? '◀' : '▶'}
        </button>

        {/* Botón de alternar altura en móvil/tablet */}
        <button
          type="button"
          onClick={() => {
            setMobileSheetPos((prev) => (prev === 'collapsed' ? 'mid' : 'collapsed'));
          }}
          aria-label={mobileSheetPos === 'collapsed' ? 'Expandir panel inferior' : 'Colapsar panel inferior'}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 lg:hidden dark:text-slate-400 dark:hover:text-white"
        >
          {mobileSheetPos === 'collapsed' ? '▲' : '▼'}
        </button>
      </div>

      {/* Si está colapsado en escritorio, mostramos iconos verticales de las pestañas */}
      {isDesktopCollapsed && (
        <div className="hidden flex-col items-center gap-2 py-3 lg:flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-testid={`${tab.testId}-mini`}
              onClick={() => {
                setActiveTab(tab.key);
                setIsDesktopCollapsed(false);
              }}
              aria-label={tab.label}
              title={tab.label}
              className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-base transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      )}

      {/* Contenido de la pestaña activa */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className={`flex-1 overflow-y-auto ${isDesktopCollapsed ? 'hidden lg:hidden' : ''}`}
      >
        {activeTab === 'tabla' && <TabularTab />}
        {activeTab === 'grafica' && <GraphicTab />}
        {activeTab === 'rutas' && <AllPathsTab />}
        {activeTab === 'floyd' && <FloydTab />}
      </div>
    </section>
  );
}
