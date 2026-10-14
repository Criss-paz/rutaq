import { useRef } from 'react';
import type { Theme } from '../../store/types';
import { useApp } from '../useApp';

export default function Header() {
  const mode = useApp((s) => s.mode);
  const setMode = useApp((s) => s.setMode);
  const loadTemplate = useApp((s) => s.loadTemplate);
  const exportGraphFile = useApp((s) => s.exportGraphFile);
  const importGraphFile = useApp((s) => s.importGraphFile);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const canUndo = useApp((s) => s.canUndo());
  const canRedo = useApp((s) => s.canRedo());
  const undo = useApp((s) => s.undo);
  const redo = useApp((s) => s.redo);
  const graph = useApp((s) => s.graph);
  const graphName = useApp((s) => s.graphName);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const data = exportGraphFile();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${graphName.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = importGraphFile(content);
        if (!res.ok) {
          alert(`Error al importar: ${res.message}`);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportPng = () => {
    // Renderizado nativo del grafo a un canvas HTML para descarga PNG de alta resolución
    const canvas = document.createElement('canvas');
    const width = 1400;
    const height = 900;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Título en la imagen
    ctx.fillStyle = theme === 'dark' ? '#e2e8f0' : '#1e293b';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(`RutaQ — ${graphName}`, 40, 50);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = theme === 'dark' ? '#94a3b8' : '#64748b';
    ctx.fillText(`${graph.nodes.length} nodos · ${graph.edges.length} aristas · Unidad: ${graph.unit}`, 40, 80);

    // Encontrar límites de los nodos para centrar el dibujo
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : width;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : height;

    const graphW = Math.max(100, maxX - minX + 160);
    const graphH = Math.max(100, maxY - minY + 160);
    const scale = Math.min((width - 120) / graphW, (height - 180) / graphH, 1.2);
    const offsetX = 60 + (width - 120 - graphW * scale) / 2 - minX * scale;
    const offsetY = 120 + (height - 180 - graphH * scale) / 2 - minY * scale;

    const nodePos = new Map<string, { cx: number; cy: number; w: number; h: number; label: string }>();
    for (const n of graph.nodes) {
      const cx = offsetX + (n.x + n.w / 2) * scale;
      const cy = offsetY + (n.y + n.h / 2) * scale;
      nodePos.set(n.id, { cx, cy, w: n.w * scale, h: n.h * scale, label: n.label });
    }

    // Dibujar aristas
    ctx.lineWidth = 2.5;
    for (const e of graph.edges) {
      const s = nodePos.get(e.source);
      const t = nodePos.get(e.target);
      if (!s || !t) continue;

      ctx.strokeStyle = theme === 'dark' ? '#475569' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(s.cx, s.cy);
      ctx.lineTo(t.cx, t.cy);
      ctx.stroke();

      // Etiqueta del peso
      const mx = (s.cx + t.cx) / 2;
      const my = (s.cy + t.cy) / 2;
      ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(mx - 24, my - 12, 48, 24, 6);
      ctx.fill();
      ctx.strokeStyle = theme === 'dark' ? '#64748b' : '#94a3b8';
      ctx.stroke();

      ctx.fillStyle = theme === 'dark' ? '#38bdf8' : '#0284c7';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${e.weight}`, mx, my);
    }

    // Dibujar nodos
    for (const [, n] of nodePos) {
      ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(n.cx - n.w / 2, n.cy - n.h / 2, n.w, n.h, 10);
      ctx.fill();

      ctx.strokeStyle = theme === 'dark' ? '#3b82f6' : '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.cx, n.cy);
    }

    // Descargar imagen
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutaq_${graphName.toLowerCase().replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const cycleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 text-slate-800 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Logotipo y título */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-xs">
          Q
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">RutaQ</h1>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            Red vial de Quetzaltenango · Dijkstra &amp; Floyd-Warshall
          </p>
        </div>
      </div>

      {/* Selector de Modo: Quetzaltenango / Diseño */}
      <div
        className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
        role="group"
        aria-label="Modo de la aplicación"
      >
        <button
          type="button"
          data-testid="mode-quetzaltenango"
          onClick={() => {
            setMode('quetzaltenango');
            loadTemplate('quetzaltenango');
          }}
          className={`min-h-[44px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            mode === 'quetzaltenango'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
          aria-pressed={mode === 'quetzaltenango'}
        >
          Quetzaltenango
        </button>
        <button
          type="button"
          data-testid="mode-design"
          onClick={() => setMode('design')}
          className={`min-h-[44px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            mode === 'design'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
          aria-pressed={mode === 'design'}
        >
          Diseño
        </button>
      </div>

      {/* Plantillas y Archivos */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Selector de plantilla */}
        <div className="relative">
          <select
            data-testid="template-select"
            aria-label="Cargar plantilla"
            onChange={(e) => {
              const val = e.target.value as 'quetzaltenango' | 'ejemplo6' | 'vacio';
              loadTemplate(val);
            }}
            defaultValue="ejemplo6"
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="quetzaltenango">Plantilla: Quetzaltenango (24 muns)</option>
            <option value="ejemplo6">Plantilla: Ejemplo 6 nodos</option>
            <option value="vacio">Plantilla: Grafo vacío</option>
          </select>
        </div>

        {/* Deshacer / Rehacer en modo diseño */}
        {mode === 'design' && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid="btn-undo"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Deshacer acción"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Deshacer (Ctrl+Z)"
            >
              ↩
            </button>
            <button
              type="button"
              data-testid="btn-redo"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Rehacer acción"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Rehacer (Ctrl+Y)"
            >
              ↪
            </button>
          </div>
        )}

        {/* Cargar JSON */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json,application/json"
          className="hidden"
          data-testid="input-file-json"
          aria-hidden="true"
        />
        <button
          type="button"
          data-testid="btn-import-json"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Cargar archivo de grafo JSON"
          className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          📂 Cargar
        </button>

        {/* Guardar JSON */}
        <button
          type="button"
          data-testid="btn-export-json"
          onClick={handleExportJson}
          aria-label="Guardar grafo en formato JSON"
          className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          💾 Guardar
        </button>

        {/* Exportar PNG */}
        <button
          type="button"
          data-testid="btn-export-png"
          onClick={handleExportPng}
          aria-label="Exportar imagen del grafo en formato PNG"
          className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          📷 PNG
        </button>

        {/* Alternador de Tema Claro / Oscuro / Sistema */}
        <button
          type="button"
          data-testid="theme-toggle"
          onClick={cycleTheme}
          aria-label={`Cambiar tema visual (actual: ${theme})`}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-sm shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          title={`Tema: ${theme}`}
        >
          {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
        </button>
      </div>
    </header>
  );
}
