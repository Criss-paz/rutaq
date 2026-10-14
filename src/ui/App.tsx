import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Canvas from './components/Canvas';
import Header from './components/Header';
import ResultsPanel from './components/ResultsPanel';
import { useApp } from './useApp';

export default function App() {
  const undo = useApp((s) => s.undo);
  const redo = useApp((s) => s.redo);
  const canUndo = useApp((s) => s.canUndo());
  const canRedo = useApp((s) => s.canRedo());
  const mode = useApp((s) => s.mode);
  const validation = useApp((s) => s.validation);

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
      <Header />

      {/* Alerta de validación en caso de advertencia o error en el grafo */}
      {!validation.ok && (
        <div
          data-testid="validation-alert"
          role="alert"
          className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/80 dark:text-rose-200"
        >
          <span>⚠️ {validation.issues[0]?.message ?? 'El grafo presenta inconsistencias.'}</span>
        </div>
      )}

      {/* Contenedor principal: en pantallas >= 1024px divide en lienzo a la izquierda y panel a la derecha */}
      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Área central del lienzo con React Flow */}
        <main className="relative h-full flex-1 overflow-hidden" role="main">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </main>

        {/* Panel de resultados con pestañas (hoja inferior en móvil/tablet, lateral derecho en escritorio) */}
        <ResultsPanel />
      </div>
    </div>
  );
}
