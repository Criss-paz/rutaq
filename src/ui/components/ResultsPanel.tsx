import { useEffect, useRef, useState } from 'react';
import type { ResultTab } from '../../store/types';
import { useUiStore } from '../uiStore';
import { useApp } from '../useApp';
import GuatemalaRouteBreakdown from './guatemala/GuatemalaRouteBreakdown';
import AllPathsTab from './tabs/AllPathsTab';
import FloydTab from './tabs/FloydTab';
import GraphicTab from './tabs/GraphicTab';
import MstTab from './tabs/MstTab';
import TabularTab from './tabs/TabularTab';

type GuatemalaTab = 'ruta' | 'mst' | 'tabla' | 'grafica' | 'rutas' | 'floyd';

export default function ResultsPanel() {
  const mode = useApp((s) => s.mode);
  const activeTab = useApp((s) => s.activeTab);
  const setActiveTab = useApp((s) => s.setActiveTab);

  const mobileSheetPos = useUiStore((s) => s.mobileSheetPos);
  const setMobileSheetPos = useUiStore((s) => s.setMobileSheetPos);
  const isDesktopCollapsed = useUiStore((s) => s.isDesktopCollapsed);
  const setIsDesktopCollapsed = useUiStore((s) => s.setIsDesktopCollapsed);
  const panelWidth = useUiStore((s) => s.panelWidth);
  const setPanelWidth = useUiStore((s) => s.setPanelWidth);
  const panelState = useUiStore((s) => s.panelState);
  const setPanelState = useUiStore((s) => s.setPanelState);
  const guatemalaTab = useUiStore((s) => s.guatemalaTab);
  const setGuatemalaTab = useUiStore((s) => s.setGuatemalaTab);
  const setIsAssistantOpen = useUiStore((s) => s.setIsAssistantOpen);

  // Arrastre móvil
  const [isDraggingMobile, setIsDraggingMobile] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStartRef = useRef<{ y: number; height: number; time: number } | null>(null);

  // Redimensión escritorio
  const [isResizingDesktop, setIsResizingDesktop] = useState(false);
  const resizeStartRef = useRef<{ clientX: number; initialWidth: number } | null>(null);

  // Manejador del tirador táctil inferior (móvil)
  const handlePointerDownMobile = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (window.innerWidth >= 1024) return;
    if (e.button !== 0) return;
    const panel = e.currentTarget.closest('[data-testid="results-panel"]') as HTMLElement | null;
    const currentHeight = panel
      ? panel.getBoundingClientRect().height
      : mobileSheetPos === 'collapsed'
        ? 56
        : mobileSheetPos === 'mid'
          ? window.innerHeight * 0.45
          : mobileSheetPos === 'maximized'
            ? window.innerHeight
            : window.innerHeight * 0.85;

    dragStartRef.current = { y: e.clientY, height: currentHeight, time: Date.now() };
    setIsDraggingMobile(true);
    setDragHeight(currentHeight);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignorar si pointer capture no está disponible
    }
  };

  const handlePointerMoveMobile = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingMobile || !dragStartRef.current) return;
    const deltaY = dragStartRef.current.y - e.clientY;
    const newH = Math.max(56, Math.min(window.innerHeight, dragStartRef.current.height + deltaY));
    setDragHeight(newH);
  };

  const handlePointerUpMobile = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingMobile || !dragStartRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignorar si pointer capture no está disponible
    }
    setIsDraggingMobile(false);
    const deltaY = dragStartRef.current.y - e.clientY;
    const totalDist = Math.abs(deltaY);
    const elapsed = Date.now() - dragStartRef.current.time;
    const finalHeight = dragHeight ?? dragStartRef.current.height;
    dragStartRef.current = null;
    setDragHeight(null);

    // Tap rápido (<8px y <350ms)
    if (totalDist < 8 && elapsed < 350) {
      setMobileSheetPos((prev) => (prev === 'collapsed' ? 'mid' : 'collapsed'));
      return;
    }

    const vh = window.innerHeight;
    if (finalHeight < vh * 0.28) {
      setMobileSheetPos('collapsed');
    } else if (finalHeight < vh * 0.65) {
      setMobileSheetPos('mid');
    } else if (finalHeight < vh * 0.92) {
      setMobileSheetPos('expanded');
    } else {
      setMobileSheetPos('maximized');
    }
  };

  // Manejador de redimensión del panel lateral (escritorio)
  const handleDesktopResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    if (panelState !== 'normal') return;
    e.preventDefault();
    resizeStartRef.current = { clientX: e.clientX, initialWidth: panelWidth };
    setIsResizingDesktop(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignorar si pointer capture no está disponible
    }
  };

  const handleDesktopResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingDesktop || !resizeStartRef.current) return;
    const deltaX = resizeStartRef.current.clientX - e.clientX;
    const targetW = resizeStartRef.current.initialWidth + deltaX;
    const maxW = Math.round(window.innerWidth * 0.75);
    const clamped = Math.max(320, Math.min(maxW, targetW));
    setPanelWidth(clamped);
  };

  const handleDesktopResizeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingDesktop) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignorar si pointer capture no está disponible
    }
    setIsResizingDesktop(false);
    resizeStartRef.current = null;
    window.dispatchEvent(new Event('resize'));
  };

  const handleDesktopResizeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPanelWidth((prev) => prev + 30);
      window.dispatchEvent(new Event('resize'));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPanelWidth((prev) => prev - 30);
      window.dispatchEvent(new Event('resize'));
    }
  };

  // Disparar fitView al cambiar estado o tamaño del panel
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, [panelState, panelWidth]);

  const p1Tabs: { key: ResultTab; label: string; shortLabel: string; icon: string; testId: string }[] = [
    { key: 'tabla', label: 'Tabla (S1)', shortLabel: 'Tabla', icon: '📋', testId: 'tab-tabla' },
    { key: 'grafica', label: 'Gráfica (S2)', shortLabel: 'Gráfica', icon: '🗺️', testId: 'tab-grafica' },
    { key: 'rutas', label: 'Rutas (S3)', shortLabel: 'Rutas', icon: '⭐', testId: 'tab-rutas' },
    { key: 'floyd', label: 'Floyd', shortLabel: 'Floyd', icon: '🔢', testId: 'tab-floyd' },
  ];

  const guatemalaTabs = [
    { key: 'mst', label: 'Red mínima (AEM)', shortLabel: 'AEM', icon: '🌳', testId: 'tab-mst' },
    { key: 'ruta', label: 'Ruta Express', shortLabel: 'Ruta', icon: '📦', testId: 'tab-breakdown' },
    { key: 'tabla', label: 'Tabla (S1)', shortLabel: 'Tabla', icon: '📋', testId: 'tab-tabla' },
    { key: 'grafica', label: 'Gráfica (S2)', shortLabel: 'Gráfica', icon: '🗺️', testId: 'tab-grafica' },
    { key: 'rutas', label: 'Rutas (S3)', shortLabel: 'Rutas', icon: '⭐', testId: 'tab-rutas' },
    { key: 'floyd', label: 'Floyd', shortLabel: 'Floyd', icon: '🔢', testId: 'tab-floyd' },
  ];

  const displayTabs = mode === 'guatemala' ? guatemalaTabs : p1Tabs;

  const mobileHeightClass =
    mobileSheetPos === 'maximized'
      ? 'fixed inset-0 z-30 h-full border-t'
      : mobileSheetPos === 'expanded'
        ? 'fixed inset-x-0 bottom-0 h-[85vh] border-t'
        : mobileSheetPos === 'mid'
          ? 'fixed inset-x-0 bottom-0 h-[45vh] border-t'
          : 'fixed inset-x-0 bottom-0 h-[56px] border-t';

  const isDesktopMinimized = panelState === 'minimized' || isDesktopCollapsed;
  const isDesktopMaximized = panelState === 'maximized';

  const desktopClasses = isDesktopMaximized
    ? 'lg:absolute lg:inset-0 lg:z-30 lg:h-full lg:w-full lg:border-0'
    : isDesktopMinimized
      ? 'lg:relative lg:h-full lg:w-[56px] lg:border-t-0 lg:border-l'
      : 'lg:relative lg:h-full lg:border-t-0 lg:border-l';

  return (
    <section
      data-testid="results-panel"
      data-sheet-position={mobileSheetPos}
      data-panel-state={panelState}
      aria-label="Panel de resultados"
      style={{
        height: isDraggingMobile && dragHeight ? `${dragHeight}px` : undefined,
        width:
          typeof window !== 'undefined' && window.innerWidth >= 1024
            ? isDesktopMinimized
              ? '56px'
              : isDesktopMaximized
                ? '100%'
                : `${panelWidth}px`
            : undefined,
        maxWidth: typeof window !== 'undefined' && window.innerWidth >= 1024 && isDesktopMinimized ? '56px' : undefined,
      }}
      className={`z-20 flex shrink-0 flex-col border-slate-200 bg-white/98 shadow-xl backdrop-blur-md transition-all lg:transition-none ${
        isDraggingMobile || isResizingDesktop ? 'duration-0' : 'duration-200'
      } dark:border-slate-800 dark:bg-slate-900/98 ${mobileHeightClass} ${desktopClasses}`}
    >
      {/* Tirador para redimensionar en escritorio (borde izquierdo) */}
      {!isDesktopMinimized && !isDesktopMaximized && (
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Redimensionar panel de resultados"
          aria-valuenow={panelWidth}
          aria-valuemin={320}
          aria-valuemax={typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.75) : 1200}
          data-testid="panel-resize-handle"
          onPointerDown={handleDesktopResizeStart}
          onPointerMove={handleDesktopResizeMove}
          onPointerUp={handleDesktopResizeEnd}
          onPointerCancel={handleDesktopResizeEnd}
          onKeyDown={handleDesktopResizeKeyDown}
          className="hidden lg:flex absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize items-center justify-center group z-40 select-none hover:bg-blue-500/20 active:bg-blue-500/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="w-1 h-8 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 transition-colors" />
        </div>
      )}

      {/* Tirador táctil para dispositivos móviles (Bottom Sheet Grab Handle) */}
      <button
        type="button"
        data-testid="bottom-sheet-handle"
        onPointerDown={handlePointerDownMobile}
        onPointerMove={handlePointerMoveMobile}
        onPointerUp={handlePointerUpMobile}
        onPointerCancel={handlePointerUpMobile}
        onClick={() => {
          if (!isDraggingMobile) {
            setMobileSheetPos((prev) => (prev === 'collapsed' ? 'mid' : 'collapsed'));
          }
        }}
        aria-label={
          mobileSheetPos === 'collapsed' ? 'Expandir panel inferior' : 'Panel inferior, arrastre para redimensionar'
        }
        className="flex min-h-[44px] w-full cursor-grab active:cursor-grabbing items-center justify-center py-2 lg:hidden focus-visible:outline-hidden touch-none"
      >
        <span className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
      </button>

      {/* Barra de título y pestañas */}
      <div
        className={`flex items-center justify-between border-b border-slate-200 px-2 py-1.5 sm:px-3 dark:border-slate-800 ${
          isDesktopMinimized ? 'lg:hidden' : ''
        }`}
      >
        {!isDesktopMinimized && (
          <div role="tablist" aria-label="Pestañas de solución" className="flex items-center gap-1 overflow-x-auto">
            {displayTabs.map((tab) => {
              const isActive = mode === 'guatemala' ? guatemalaTab === tab.key : activeTab === tab.key;
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
                    if (mode === 'guatemala') {
                      setGuatemalaTab(tab.key as GuatemalaTab);
                      if (['tabla', 'grafica', 'rutas', 'floyd'].includes(tab.key)) {
                        setActiveTab(tab.key as ResultTab);
                      }
                    } else {
                      setActiveTab(tab.key as ResultTab);
                    }
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

        {/* Botones de control tipo ventana en escritorio (≥1024px) */}
        {!isDesktopMinimized && (
          <div className="hidden lg:flex items-center gap-1">
            {/* Minimizar */}
            <button
              type="button"
              data-testid="btn-minimize-panel"
              onClick={() => {
                setPanelState('minimized');
                setIsDesktopCollapsed(true);
              }}
              aria-label="Minimizar panel"
              title="Minimizar panel a franja vertical"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              ─
            </button>

            {/* Maximizar o Restaurar */}
            {isDesktopMaximized ? (
              <button
                type="button"
                data-testid="btn-restore-panel"
                onClick={() => setPanelState('normal')}
                aria-label="Restaurar panel"
                title="Restaurar tamaño anterior"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                🗗
              </button>
            ) : (
              <button
                type="button"
                data-testid="btn-maximize-panel"
                onClick={() => setPanelState('maximized')}
                aria-label="Maximizar panel"
                title="Maximizar panel en todo el área de trabajo"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                🗖
              </button>
            )}

            {/* Retrocompatibilidad con desktop-collapse-btn */}
            <button
              type="button"
              data-testid="desktop-collapse-btn"
              onClick={() => {
                const nextState = isDesktopMinimized ? 'normal' : 'minimized';
                setPanelState(nextState);
                setIsDesktopCollapsed(nextState === 'minimized');
              }}
              aria-label={isDesktopMinimized ? 'Expandir panel' : 'Colapsar panel'}
              className="hidden"
            >
              {isDesktopMinimized ? '◀' : '▶'}
            </button>
          </div>
        )}

        {/* Botón Maximizar / Restaurar en tableta y móvil (<1024px) */}
        <div className="flex items-center gap-1 lg:hidden">
          {mobileSheetPos === 'maximized' ? (
            <button
              type="button"
              data-testid="btn-sheet-restore"
              onClick={() => setMobileSheetPos('mid')}
              aria-label="Restaurar altura del panel inferior"
              title="Restaurar panel inferior a altura media"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              🗗 Restaurar
            </button>
          ) : (
            <button
              type="button"
              data-testid="btn-sheet-maximize"
              onClick={() => setMobileSheetPos('maximized')}
              aria-label="Maximizar panel inferior"
              title="Maximizar panel inferior a pantalla completa"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              🗖 Maximizar
            </button>
          )}

          {/* Botón alternar colapsar/media en móvil */}
          <button
            type="button"
            onClick={() => {
              setMobileSheetPos((prev) => (prev === 'collapsed' ? 'mid' : 'collapsed'));
            }}
            aria-label={mobileSheetPos === 'collapsed' ? 'Expandir panel inferior' : 'Colapsar panel inferior'}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            {mobileSheetPos === 'collapsed' ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Si está minimizado en escritorio: franja vertical con iconos y botón restaurar */}
      {isDesktopMinimized && (
        <div className="hidden flex-col items-center gap-2 py-3 lg:flex">
          {/* Botón restaurar en franja vertical */}
          <button
            type="button"
            data-testid="btn-restore-panel"
            onClick={() => {
              setPanelState('normal');
              setIsDesktopCollapsed(false);
            }}
            aria-label="Restaurar panel"
            title="Restaurar panel"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ◀
          </button>

          {displayTabs.map((tab) => {
            const isActive = mode === 'guatemala' ? guatemalaTab === tab.key : activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                data-testid={`${tab.testId}-mini`}
                onClick={() => {
                  if (mode === 'guatemala') {
                    setGuatemalaTab(tab.key as GuatemalaTab);
                    if (['tabla', 'grafica', 'rutas', 'floyd'].includes(tab.key)) {
                      setActiveTab(tab.key as ResultTab);
                    }
                  } else {
                    setActiveTab(tab.key as ResultTab);
                  }
                  setPanelState('normal');
                  setIsDesktopCollapsed(false);
                }}
                aria-label={tab.label}
                title={tab.label}
                className={`flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-base transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenido de la pestaña activa */}
      <div
        id={`panel-${mode === 'guatemala' ? guatemalaTab : activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${mode === 'guatemala' ? guatemalaTab : activeTab}`}
        className={`flex-1 overflow-y-auto ${isDesktopMinimized ? 'hidden lg:hidden' : ''}`}
      >
        {mode === 'guatemala' ? (
          <>
            {guatemalaTab === 'mst' && <MstTab />}
            {guatemalaTab === 'ruta' && <GuatemalaRouteBreakdown onOpenAssistant={() => setIsAssistantOpen(true)} />}
            {guatemalaTab === 'tabla' && <TabularTab />}
            {guatemalaTab === 'grafica' && <GraphicTab />}
            {guatemalaTab === 'rutas' && <AllPathsTab />}
            {guatemalaTab === 'floyd' && <FloydTab />}
          </>
        ) : (
          <>
            {activeTab === 'tabla' && <TabularTab />}
            {activeTab === 'grafica' && <GraphicTab />}
            {activeTab === 'rutas' && <AllPathsTab />}
            {activeTab === 'floyd' && <FloydTab />}
          </>
        )}
      </div>
    </section>
  );
}
