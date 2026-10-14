import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  type EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from '@xyflow/react';
import type { EdgeShape } from '../../core/types';
import { useApp } from '../useApp';

export interface CustomEdgeData {
  weight: number;
  shape: EdgeShape;
  shapeAuto: boolean;
  isOnPath?: boolean;
  isTreeEdge?: boolean;
  isEvaluated?: boolean;
  [key: string]: unknown;
}

function CustomEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const edgeData = (data as CustomEdgeData) || {
    weight: 1,
    shape: 'straight',
    shapeAuto: true,
  };
  const weight = edgeData.weight ?? 1;
  const shape = edgeData.shape ?? 'straight';
  const isOnPath = edgeData.isOnPath ?? false;
  const isTreeEdge = edgeData.isTreeEdge ?? false;
  const isEvaluated = edgeData.isEvaluated ?? false;

  const mode = useApp((s) => s.mode);
  const setEdgeWeight = useApp((s) => s.setEdgeWeight);
  const setEdgeShape = useApp((s) => s.setEdgeShape);
  const resetEdgeShapeAuto = useApp((s) => s.resetEdgeShapeAuto);
  const removeEdges = useApp((s) => s.removeEdges);

  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(weight));
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleShapeMenu = useCallback(() => {
    if (!showShapeMenu) {
      const rect = menuButtonRef.current?.getBoundingClientRect();
      const menuWidth = 208;
      const menuHeight = 320;
      const padding = 8;

      let left = rect ? rect.left : 100;
      let top = rect ? rect.bottom + 4 : 100;

      if (left + menuWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - menuWidth - padding);
      }
      if (left < padding) left = padding;

      if (top + menuHeight > window.innerHeight - padding) {
        top = Math.max(padding, (rect?.top ?? 300) - menuHeight - 4);
      }
      if (top < padding) top = padding;

      setMenuPos({ top, left });
      setShowShapeMenu(true);
    } else {
      setShowShapeMenu(false);
    }
  }, [showShapeMenu]);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!showShapeMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setShowShapeMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShapeMenu(false);
    };

    window.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShapeMenu]);

  // Calcular trazado según la forma
  let edgePath = '';
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  switch (shape) {
    case 'straight': {
      const [path, lx, ly] = getStraightPath({ sourceX, sourceY, targetX, targetY });
      edgePath = path;
      labelX = lx;
      labelY = ly;
      break;
    }
    case 'bezier': {
      const [path, lx, ly] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
      break;
    }
    case 'step': {
      const [path, lx, ly] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
      break;
    }
    case 'smoothstep': {
      const [path, lx, ly] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
      break;
    }
    case 'arc': {
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const dist = Math.hypot(dx, dy) || 1;
      const mx = (sourceX + targetX) / 2;
      const my = (sourceY + targetY) / 2;
      const nx = -dy / dist;
      const ny = dx / dist;
      const arcOffset = Math.min(60, dist * 0.25);
      const cx = mx + nx * arcOffset;
      const cy = my + ny * arcOffset;
      edgePath = `M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`;
      labelX = (sourceX + 2 * cx + targetX) / 4;
      labelY = (sourceY + 2 * cy + targetY) / 4;
      break;
    }
  }

  // Estilos de la arista según estado
  let strokeColor = '#94a3b8'; // slate-400
  let strokeWidth = 2;
  let strokeDasharray: string | undefined;

  if (isOnPath) {
    strokeColor = '#9333ea'; // purple-600
    strokeWidth = 4.5;
  } else if (isTreeEdge) {
    strokeColor = '#2563eb'; // blue-600
    strokeWidth = 3.5;
  } else if (isEvaluated) {
    strokeColor = '#f59e0b'; // amber-500
    strokeWidth = 3;
    strokeDasharray = '5 5';
  } else if (selected) {
    strokeColor = '#3b82f6'; // blue-500
    strokeWidth = 3;
  }

  const handleWeightSubmit = () => {
    setIsEditingWeight(false);
    const parsed = parseFloat(weightInput);
    if (!isNaN(parsed) && parsed > 0) {
      setEdgeWeight(id, parsed);
    } else {
      setWeightInput(String(weight));
    }
  };

  const shapesList: { key: EdgeShape; label: string }[] = [
    { key: 'straight', label: 'Recta' },
    { key: 'bezier', label: 'Curva' },
    { key: 'arc', label: 'Arco' },
    { key: 'step', label: 'Ortogonal' },
    { key: 'smoothstep', label: 'Suave' },
  ];

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        <div
          data-testid={`edge-label-${id}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan flex items-center gap-1 rounded-full border border-slate-300 bg-white/95 px-2 py-0.5 text-[11px] font-bold text-slate-800 shadow-xs backdrop-blur-xs hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100"
        >
          {isEditingWeight ? (
            <input
              type="number"
              step="any"
              min="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleWeightSubmit();
                if (e.key === 'Escape') {
                  setIsEditingWeight(false);
                  setWeightInput(String(weight));
                }
              }}
              autoFocus
              aria-label={`Editar peso de la arista ${id}`}
              data-testid={`edge-input-${id}`}
              className="w-14 rounded border border-blue-500 bg-white px-1 py-0.5 text-center text-xs text-slate-900 focus-visible:outline-hidden dark:bg-slate-900 dark:text-white"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingWeight(true)}
              className="cursor-pointer select-none px-0.5 hover:text-blue-600 dark:hover:text-blue-400"
              title="Doble clic para editar peso"
            >
              {weight} km
            </span>
          )}

          {/* Botón de menú de forma de arista táctil (>=44px) */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              ref={menuButtonRef}
              data-testid={`edge-menu-${id}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleShapeMenu();
              }}
              aria-label={`Cambiar forma de la arista ${id}`}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title="Forma de arista"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-700">
                ⚙
              </span>
            </button>

            {/* Menú desplegable en portal document.body para evitar distorsión de coordenadas por transform de React Flow */}
            {showShapeMenu &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  ref={menuRef}
                  style={{
                    position: 'fixed',
                    top: `${menuPos.top}px`,
                    left: `${menuPos.left}px`,
                    zIndex: 9999,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-52 rounded-xl border border-slate-200 bg-white/98 p-1.5 text-xs shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/98"
                  role="menu"
                >
                  <div className="px-3 py-1 font-semibold text-slate-500 dark:text-slate-400">Forma ({shape})</div>
                  {shapesList.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      data-testid={`edge-shape-${s.key}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEdgeShape([id], s.key);
                        setShowShapeMenu(false);
                      }}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-300 ${
                        shape === s.key
                          ? 'font-bold text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{s.label}</span>
                      {shape === s.key && <span className="font-bold">✓</span>}
                    </button>
                  ))}

                  <hr className="my-1 border-slate-200 dark:border-slate-700" />

                  <button
                    type="button"
                    data-testid="edge-shape-apply-all"
                    onClick={() => {
                      setEdgeShape('all', shape);
                      setShowShapeMenu(false);
                    }}
                    className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Aplicar {shape} a todas
                  </button>

                  <button
                    type="button"
                    data-testid="edge-shape-reset-auto"
                    onClick={() => {
                      resetEdgeShapeAuto([id]);
                      setShowShapeMenu(false);
                    }}
                    className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Volver a automático
                  </button>

                  {mode === 'design' && (
                    <>
                      <hr className="my-1 border-slate-200 dark:border-slate-700" />
                      <button
                        type="button"
                        onClick={() => {
                          removeEdges([id]);
                          setShowShapeMenu(false);
                        }}
                        className="flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        Eliminar arista
                      </button>
                    </>
                  )}
                </div>,
                document.body,
              )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
