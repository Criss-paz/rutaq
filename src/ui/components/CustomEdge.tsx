import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  type EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useViewport,
} from '@xyflow/react';
import type { EdgeShape } from '../../core/types';
import { useApp } from '../useApp';
import { useUiStore } from '../uiStore';

export interface CustomEdgeData {
  weight: number;
  shape: EdgeShape;
  shapeAuto: boolean;
  isOnPath?: boolean;
  isTiedDashed?: boolean;
  isTreeEdge?: boolean;
  isEvaluated?: boolean;
  unit?: string;
  isMapMode?: boolean;
  /** El peso chocaría con un nombre u otro peso con este zoom (solo afecta al modo «automático»). */
  weightHidden?: boolean;
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
  const isTiedDashed = edgeData.isTiedDashed ?? false;
  const isTreeEdge = edgeData.isTreeEdge ?? false;
  const isEvaluated = edgeData.isEvaluated ?? false;
  const isMapMode = Boolean(edgeData.isMapMode);

  const mode = useApp((s) => s.mode);
  const theme = useApp((s) => s.theme);
  const graphUnit = useApp((s) => s.graph.unit || 'km');
  const unit = edgeData.unit ?? graphUnit;
  const edgeWeightsMode = useUiStore((s) => s.edgeWeightsMode);
  const { zoom } = useViewport();

  const setEdgeWeight = useApp((s) => s.setEdgeWeight);
  const setEdgeShape = useApp((s) => s.setEdgeShape);
  const resetEdgeShapeAuto = useApp((s) => s.resetEdgeShapeAuto);
  const removeEdges = useApp((s) => s.removeEdges);

  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(weight));
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const menuRef = useRef<HTMLDivElement>(null);

  const openShapeMenu = useCallback((clientX: number, clientY: number) => {
    const menuWidth = 208;
    const menuHeight = 320;
    const padding = 8;

    let left = clientX;
    let top = clientY + 4;

    if (!clientX && !clientY) {
      left = Math.max(padding, typeof window !== 'undefined' ? window.innerWidth / 2 - menuWidth / 2 : 100);
      top = Math.max(padding, typeof window !== 'undefined' ? window.innerHeight / 2 - menuHeight / 2 : 100);
    } else {
      if (typeof window !== 'undefined' && left + menuWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - menuWidth - padding);
      }
      if (left < padding) left = padding;

      if (typeof window !== 'undefined' && top + menuHeight > window.innerHeight - padding) {
        top = Math.max(padding, clientY - menuHeight - 4);
      }
      if (top < padding) top = padding;
    }

    setMenuPos({ top, left });
    setShowShapeMenu(true);
  }, []);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!showShapeMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowShapeMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowShapeMenu(false);
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleClickOutside);
    }, 20);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
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
  let animation: string | undefined;

  if (isOnPath) {
    strokeColor = '#9333ea'; // purple-600
    strokeWidth = 4.5;
    strokeDasharray = isTiedDashed ? '6 4' : '8 6';
    animation = 'flowDash 1.2s linear infinite';
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

  let isWeightVisible = true;
  if (isMapMode) {
    if (edgeWeightsMode === 'all') {
      isWeightVisible = true;
    } else if (edgeWeightsMode === 'hidden') {
      isWeightVisible = false;
    } else {
      // 'auto': solo si zoom >= 1.2 o en ruta, arbol, evaluada, seleccionada o bajo el cursor
      isWeightVisible =
        isHovered ||
        ((zoom >= 1.2 || isOnPath || isTreeEdge || isEvaluated || Boolean(selected)) && !edgeData.weightHidden);
    }
  }

  const haloStyle =
    theme === 'dark'
      ? {
          textShadow:
            '0 0 2px #0f172a, 0 0 4px #0f172a, 0 0 6px #0f172a, -1px -1px 0 #0f172a, 1px -1px 0 #0f172a, -1px 1px 0 #0f172a, 1px 1px 0 #0f172a',
          color: '#e2e8f0',
        }
      : {
          textShadow:
            '0 0 2px #ffffff, 0 0 4px #ffffff, 0 0 6px #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff',
          color: '#1e293b',
        };

  return (
    <>
      <style>{`@keyframes flowDash { from { strokeDashoffset: 28; } to { strokeDashoffset: 0; } }`}</style>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          animation,
          transition: 'stroke 0.2s, stroke-width 0.2s',
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
      />
      {/* Área invisible ancha (interactionWidth ≈ 20) para facilitar clic y hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: 'all' }}
        data-testid={`edge-interaction-${id}`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          openShapeMenu(e.clientX, e.clientY);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {isWeightVisible && (
        <EdgeLabelRenderer>
          <div
            data-testid={`edge-label-${id}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag nopan flex items-center justify-center select-none"
          >
            {isEditingWeight && mode === 'design' ? (
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
                className="w-14 rounded border border-blue-500 bg-white px-1 py-0.5 text-center text-[11px] text-slate-900 focus-visible:outline-hidden dark:bg-slate-900 dark:text-white"
              />
            ) : (
              <span
                data-testid={`edge-weight-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openShapeMenu(e.clientX, e.clientY);
                }}
                onDoubleClick={(e) => {
                  if (mode === 'design') {
                    e.stopPropagation();
                    setIsEditingWeight(true);
                  }
                }}
                style={{ ...haloStyle, fontSize: `${11 / Math.min(zoom, 1)}px` }}
                className={`font-semibold tracking-tight whitespace-nowrap ${
                  mode === 'design' ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : 'cursor-default'
                }`}
                title={mode === 'design' ? 'Doble clic para editar peso, clic para forma' : `${weight} ${unit}`}
              >
                {weight} {unit}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Menú de forma de arista flotante junto a ella al hacer clic */}
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
                  shape === s.key ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'
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
    </>
  );
}

export const CustomEdge = memo(CustomEdgeComponent);
