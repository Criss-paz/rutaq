import type { CoreApiP2, PathResult } from './types';

/**
 * Desglosa un camino en sus tramos y acumula sus distancias.
 * Complejidad: O(V + E + L), donde L es el número de tramos.
 * Referencia: especificación del Proyecto II, apartado G3 (tabla de tramos).
 */
export const routeBreakdown: CoreApiP2['routeBreakdown'] = (g, path: PathResult) => {
  if (!path.nodes.length || path.edges.length !== path.nodes.length - 1)
    throw new Error('La ruta debe tener un nodo más que aristas.');
  const nodeIds = new Set(g.nodes.map((node) => node.id));
  const edgeById = new Map(g.edges.map((edge) => [edge.id, edge]));
  if (path.nodes.some((id) => !nodeIds.has(id))) throw new Error('La ruta contiene un nodo que no existe.');
  let cumulative = 0;
  const legs = path.edges.map((edgeId, index) => {
    const from = path.nodes[index]!,
      to = path.nodes[index + 1]!;
    const edge = edgeById.get(edgeId);
    if (!edge || !((edge.source === from && edge.target === to) || (edge.source === to && edge.target === from)))
      throw new Error(`La arista «${edgeId}» no conecta ${from} con ${to}.`);
    cumulative += edge.weight;
    const road = edge.meta?.carretera;
    return {
      from,
      to,
      edgeId,
      ...(typeof road === 'string' && road.trim() ? { road } : {}),
      km: edge.weight,
      cumulative,
    };
  });
  const total = cumulative;
  const formula = legs.length
    ? `${legs.map((leg) => leg.km.toFixed(1)).join(' + ')} = ${total.toFixed(1)} ${g.unit}`
    : `0 ${g.unit}`;
  return { nodes: [...path.nodes], legs, total, formula };
};
