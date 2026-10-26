/**
 * Contorno de la República de Guatemala para el módulo Transporte Express.
 * Muestra los polígonos del contorno del país proyectados en coordenadas del lienzo (Web Mercator),
 * como una capa SVG de fondo tenue que se desplaza y escala en sincronía con el viewport de React Flow.
 * Lee: `outline` y `mode` desde el store global (`useApp`).
 */
import { useViewport } from '@xyflow/react';
import { useApp } from '../../useApp';

export default function GuatemalaOutline() {
  const mode = useApp((s) => s.mode);
  const outline = useApp((s) => s.outline);
  const { x, y, zoom } = useViewport();

  if (mode !== 'guatemala' || !outline || outline.length === 0) {
    return null;
  }

  const pathData = outline
    .map((ring) => {
      if (!ring || ring.length === 0) return '';
      return 'M ' + ring.map((pt) => `${pt.x},${pt.y}`).join(' L ') + ' Z';
    })
    .filter(Boolean)
    .join(' ');

  if (!pathData) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-0" aria-hidden="true">
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        <path
          d={pathData}
          data-testid="guatemala-outline"
          className="fill-emerald-500/8 dark:fill-emerald-400/8 stroke-emerald-600/30 dark:stroke-emerald-400/25"
          style={{ vectorEffect: 'non-scaling-stroke' }}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </g>
    </svg>
  );
}
