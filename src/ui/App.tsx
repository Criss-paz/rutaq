import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './components/Canvas';
import Header from './components/Header';
import ResultsPanel from './components/ResultsPanel';
import ValidationAlert from './components/ValidationAlert';
import GuatemalaAboutModal from './components/guatemala/GuatemalaAboutModal';
import GuatemalaAdminModal from './components/guatemala/GuatemalaAdminModal';
import GuatemalaAssistantModal from './components/guatemala/GuatemalaAssistantModal';
import GuatemalaPresentation from './components/guatemala/GuatemalaPresentation';
import GuatemalaToolbar from './components/guatemala/GuatemalaToolbar';
import { useApp } from './useApp';
import { useUiStore } from './uiStore';

export default function App() {
  const undo = useApp((s) => s.undo);
  const redo = useApp((s) => s.redo);
  const canUndo = useApp((s) => s.canUndo());
  const canRedo = useApp((s) => s.canRedo());
  const mode = useApp((s) => s.mode);
  const mobileSheetPos = useUiStore((s) => s.mobileSheetPos);

  const isAssistantOpen = useUiStore((s) => s.isAssistantOpen);
  const setIsAssistantOpen = useUiStore((s) => s.setIsAssistantOpen);
  const isAdminOpen = useUiStore((s) => s.isAdminOpen);
  const setIsAdminOpen = useUiStore((s) => s.setIsAdminOpen);
  const isAboutOpen = useUiStore((s) => s.isAboutOpen);
  const setIsAboutOpen = useUiStore((s) => s.setIsAboutOpen);
  const isPresentationMode = useUiStore((s) => s.isPresentationMode);
  const setIsPresentationMode = useUiStore((s) => s.setIsPresentationMode);
  const setGuatemalaTab = useUiStore((s) => s.setGuatemalaTab);

  // Atajos de teclado globales (Ctrl+Z para deshacer, Ctrl+Y para rehacer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (mode === 'design') {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            if (canRedo) redo();
          } else {
            if (canUndo) undo();
          }
          e.preventDefault();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          if (canRedo) redo();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, canUndo, canRedo, undo, redo]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 select-none dark:bg-slate-950 dark:text-slate-100">
      {/* Barra superior */}
      {!isPresentationMode && <Header />}

      {/* Barra de herramientas específica de Guatemala (Transporte Express) */}
      {!isPresentationMode && mode === 'guatemala' && (
        <GuatemalaToolbar
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onStartPresentation={() => setIsPresentationMode(true)}
        />
      )}

      {/* Alerta de validación en caso de advertencia o error en el grafo */}
      {!isPresentationMode && <ValidationAlert />}

      {/* Contenedor principal: en pantallas >= 1024px divide en lienzo a la izquierda y panel a la derecha */}
      <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">
        {/* Área central del lienzo con React Flow */}
        <main
          className={`relative flex flex-1 min-h-0 flex-col overflow-hidden lg:!mb-0 ${
            // Presentación: se reserva espacio para la barra superior y la tarjeta (derecha en escritorio,
            // abajo en pantallas angostas) para que el mapa se ajuste al área libre y nada lo tape.
            isPresentationMode && mode === 'guatemala' ? 'pt-24 pb-[38vh] lg:pb-0 lg:pr-[400px] ' : ''
          }${
            isPresentationMode || mobileSheetPos === 'maximized'
              ? 'mb-0'
              : mobileSheetPos === 'expanded'
                ? 'mb-[85vh]'
                : mobileSheetPos === 'mid'
                  ? 'mb-[45vh]'
                  : 'mb-14'
          }`}
          role="main"
        >
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </main>

        {/* Panel de resultados con pestañas (hoja inferior en móvil/tablet, lateral derecho en escritorio) */}
        {!isPresentationMode && <ResultsPanel />}
      </div>

      {/* Modales y vistas del Módulo Guatemala */}
      {mode === 'guatemala' && (
        <>
          <GuatemalaAssistantModal
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            onCalculated={() => setGuatemalaTab('ruta')}
          />
          <GuatemalaAdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
          <GuatemalaAboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
          <GuatemalaPresentation isOpen={isPresentationMode} onExit={() => setIsPresentationMode(false)} />
        </>
      )}
    </div>
  );
}
