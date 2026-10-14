import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import { useApp } from '../useApp';

export interface CustomNodeData {
  label: string;
  isOrigin?: boolean;
  isTarget?: boolean;
  isCurrent?: boolean;
  isPermanent?: boolean;
  isOnPath?: boolean;
  dist?: number;
  [key: string]: unknown;
}

function CustomNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as CustomNodeData;
  const label = nodeData.label || id;
  const isOrigin = nodeData.isOrigin ?? false;
  const isTarget = nodeData.isTarget ?? false;
  const isCurrent = nodeData.isCurrent ?? false;
  const isPermanent = nodeData.isPermanent ?? false;
  const isOnPath = nodeData.isOnPath ?? false;
  const dist = nodeData.dist;

  const mode = useApp((s) => s.mode);
  const renameNode = useApp((s) => s.renameNode);
  const resizeNode = useApp((s) => s.resizeNode);
  const removeNodes = useApp((s) => s.removeNodes);
  const setTreeQuery = useApp((s) => s.setTreeQuery);
  const setPathQuery = useApp((s) => s.setPathQuery);
  const query = useApp((s) => s.query);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ top: number; left: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const openNodeMenu = useCallback(
    (clientX: number, clientY: number) => {
      const menuWidth = 200;
      const menuHeight = mode === 'design' ? 220 : 180;
      const padding = 12;

      let left = clientX;
      let top = clientY;

      if (left + menuWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - menuWidth - padding);
      }
      if (left < padding) left = padding;

      if (top + menuHeight > window.innerHeight - padding) {
        top = Math.max(padding, clientY - menuHeight);
      }
      if (top < padding) top = padding;

      setContextMenuPos({ top, left });
      setShowContextMenu(true);
    },
    [mode],
  );

  useEffect(() => {
    if (!showContextMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowContextMenu(false);
    };

    window.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showContextMenu]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleRenameSubmit = () => {
    setIsEditing(false);
    const trimmed = editText.trim();
    if (trimmed && trimmed !== label) {
      renameNode(id, trimmed);
    } else {
      setEditText(label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(label);
    }
  };

  // Determinación de clases de borde y fondo según el estado
  let borderClasses =
    'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100';
  let badgeColor = '';
  let badgeText = '';

  if (isCurrent) {
    borderClasses =
      'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 shadow-md ring-2 ring-amber-400 animate-pulse';
    badgeColor = 'bg-amber-500 text-white';
    badgeText = 'Actual';
  } else if (isOrigin) {
    borderClasses =
      'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500';
    badgeColor = 'bg-emerald-600 text-white';
    badgeText = 'Origen';
  } else if (isTarget) {
    borderClasses =
      'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 shadow-md ring-2 ring-rose-500';
    badgeColor = 'bg-rose-600 text-white';
    badgeText = 'Destino';
  } else if (isOnPath) {
    borderClasses =
      'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-950 dark:text-purple-100 shadow-md ring-2 ring-purple-400';
    badgeColor = 'bg-purple-600 text-white';
    badgeText = 'En Ruta';
  } else if (isPermanent) {
    borderClasses = 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100';
    badgeColor = 'bg-blue-500 text-white';
    badgeText = typeof dist === 'number' && dist < Infinity ? `${dist} km` : 'Perm.';
  }

  return (
    <div
      data-testid={`node-${id}`}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openNodeMenu(e.clientX, e.clientY);
      }}
      className={`group relative flex h-full w-full min-h-[44px] min-w-[80px] items-center justify-between rounded-xl border-2 px-3 py-2 text-xs font-semibold shadow-xs transition-all ${borderClasses} ${
        selected ? 'ring-2 ring-blue-600' : ''
      }`}
      onDoubleClick={() => {
        setEditText(label);
        setIsEditing(true);
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={44}
        lineClassName="border-blue-500"
        handleClassName="h-2.5 w-2.5 bg-blue-500 rounded-sm"
        onResizeEnd={(_, params) => {
          resizeNode(id, { x: params.x, y: params.y, w: params.width, h: params.height });
        }}
      />

      {/* Handles de conexión en los 4 extremos */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-2 !w-2 !bg-blue-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2 !w-2 !bg-blue-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2 !w-2 !bg-blue-500 opacity-60 hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!h-2 !w-2 !bg-blue-500 opacity-60 hover:opacity-100"
      />

      {/* Insignia de estado superior */}
      {badgeText && (
        <span
          className={`absolute -top-3 left-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-xs ${badgeColor}`}
        >
          {badgeText}
        </span>
      )}

      {/* Contenido / Edición del nombre */}
      <div className="flex h-full w-full items-center justify-center text-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            aria-label={`Editar nombre del nodo ${id}`}
            data-testid={`node-input-${id}`}
            className="w-full rounded border border-blue-400 bg-white px-1 py-0.5 text-center text-xs font-bold text-slate-900 focus-visible:outline-hidden dark:bg-slate-900 dark:text-white"
          />
        ) : (
          <span
            data-testid={`node-label-${label}`}
            className="block w-full cursor-pointer truncate text-xs font-bold leading-tight text-slate-900 dark:text-slate-100"
            title={`${label} (Doble clic para renombrar o clic derecho para menú)`}
          >
            {label}
          </span>
        )}
      </div>

      {/* Botones de acción rápida flotantes en hover/focus o selección */}
      <div
        className={`absolute -top-4 right-0 z-10 items-center gap-0.5 rounded-full border border-slate-200 bg-white/95 p-0.5 shadow-md backdrop-blur-xs dark:border-slate-700 dark:bg-slate-800/95 ${
          selected ? 'flex' : 'hidden group-hover:flex group-focus-within:flex'
        }`}
      >
        {/* Fijar como origen en F2/F3 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (query?.kind === 'path') {
              setPathQuery(id, query.target);
            } else {
              setTreeQuery(id);
            }
          }}
          aria-label={`Fijar ${label} como origen`}
          title="Fijar como origen (A)"
          className="flex h-7 w-7 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            A
          </span>
        </button>

        {/* Fijar como destino en F3 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const source = query ? query.source : id;
            setPathQuery(source, id);
          }}
          aria-label={`Fijar ${label} como destino`}
          title="Fijar como destino (B)"
          className="flex h-7 w-7 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[11px] font-bold text-rose-700 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-rose-950"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">B</span>
        </button>

        {/* Menú de opciones del nodo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            openNodeMenu(rect.left, rect.bottom + 4);
          }}
          aria-label={`Más opciones del nodo ${label}`}
          title="Menú contextual del nodo"
          className="flex h-7 w-7 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[11px] font-bold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs dark:bg-slate-700">
            ⋯
          </span>
        </button>

        {/* Eliminar nodo en modo diseño */}
        {mode === 'design' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeNodes([id]);
            }}
            aria-label={`Eliminar nodo ${label}`}
            title="Eliminar nodo"
            className="flex h-7 w-7 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[11px] font-bold text-slate-600 hover:bg-red-100 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-300 dark:hover:bg-red-950"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 hover:bg-red-200 dark:bg-slate-700">
              ×
            </span>
          </button>
        )}
      </div>

      {/* Menú contextual flotante del nodo reposicionado en viewport con items >= 44px */}
      {showContextMenu &&
        contextMenuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              top: `${contextMenuPos.top}px`,
              left: `${contextMenuPos.left}px`,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-52 rounded-xl border border-slate-200 bg-white/98 p-1.5 text-xs shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/98"
            role="menu"
          >
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
              Nodo: {label}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowContextMenu(false);
                if (query?.kind === 'path') {
                  setPathQuery(id, query.target);
                } else {
                  setTreeQuery(id);
                }
              }}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-emerald-950/50"
            >
              <span className="text-sm">🌳</span>
              <span>Fijar como origen (A)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowContextMenu(false);
                const source = query ? query.source : id;
                setPathQuery(source, id);
              }}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-200 dark:hover:bg-rose-950/50"
            >
              <span className="text-sm">📍</span>
              <span>Fijar como destino (B)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowContextMenu(false);
                setEditText(label);
                setIsEditing(true);
              }}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span className="text-sm">✏️</span>
              <span>Renombrar nodo</span>
            </button>
            {mode === 'design' && (
              <>
                <hr className="my-1 border-slate-200 dark:border-slate-700" />
                <button
                  type="button"
                  onClick={() => {
                    setShowContextMenu(false);
                    removeNodes([id]);
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                >
                  <span className="text-sm">🗑️</span>
                  <span>Eliminar nodo</span>
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);
