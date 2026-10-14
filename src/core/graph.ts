import type { CoreApi, Graph, NodeId } from './types';

export interface Neighbor {
  node: NodeId;
  weight: number;
  edgeId: string;
}
export const adjacencyList = (g: Graph): Map<NodeId, Neighbor[]> => {
  const map = new Map(g.nodes.map((n) => [n.id, [] as Neighbor[]]));
  for (const e of g.edges) {
    map.get(e.source)?.push({ node: e.target, weight: e.weight, edgeId: e.id });
    map.get(e.target)?.push({ node: e.source, weight: e.weight, edgeId: e.id });
  }
  for (const list of map.values())
    list.sort((a, b) => (a.node < b.node ? -1 : a.node > b.node ? 1 : a.edgeId.localeCompare(b.edgeId)));
  return map;
};

export const validateGraph: CoreApi['validateGraph'] = (g) => {
  const issues: ReturnType<CoreApi['validateGraph']>['issues'] = [];
  const issue = (code: (typeof issues)[number]['code'], message: string, ids?: string[], edge = false) =>
    issues.push({
      code,
      severity: code === 'DISCONNECTED' ? 'warning' : 'error',
      message,
      ...(ids ? (edge ? { edgeIds: ids } : { nodeIds: ids }) : {}),
    });
  if (!g.nodes.length) issue('EMPTY_GRAPH', 'El grafo no contiene nodos.');
  const nodes = new Set<string>();
  for (const n of g.nodes) {
    if (nodes.has(n.id)) issue('DUPLICATE_NODE_ID', `El identificador de nodo «${n.id}» está repetido.`, [n.id]);
    nodes.add(n.id);
  }
  const edges = new Set<string>(),
    pairs = new Set<string>();
  for (const e of g.edges) {
    if (edges.has(e.id))
      issue('DUPLICATE_EDGE_ID', `El identificador de arista «${e.id}» está repetido.`, [e.id], true);
    edges.add(e.id);
    if (!nodes.has(e.source) || !nodes.has(e.target))
      issue('MISSING_NODE', `La arista «${e.id}» referencia un nodo inexistente.`, [e.id], true);
    if (e.source === e.target) issue('SELF_LOOP', `La arista «${e.id}» conecta un nodo consigo mismo.`, [e.id], true);
    const pair = [e.source, e.target].sort().join('\0');
    if (pairs.has(pair))
      issue('DUPLICATE_EDGE', `Hay más de una arista entre «${e.source}» y «${e.target}».`, [e.id], true);
    pairs.add(pair);
    if (!Number.isFinite(e.weight))
      issue('INVALID_WEIGHT', `El peso de «${e.id}» debe ser un número finito.`, [e.id], true);
    else if (e.weight <= 0) issue('NON_POSITIVE_WEIGHT', `El peso de «${e.id}» debe ser mayor que cero.`, [e.id], true);
  }
  if (g.nodes.length > 0 && nodes.size === g.nodes.length) {
    const adj = adjacencyList(g),
      seen = new Set<NodeId>(),
      stack = [g.nodes[0]!.id];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const n of adj.get(id) ?? []) if (!seen.has(n.node)) stack.push(n.node);
    }
    if (seen.size !== g.nodes.length)
      issue(
        'DISCONNECTED',
        'El grafo está desconectado; algunas rutas no existen.',
        g.nodes.filter((n) => !seen.has(n.id)).map((n) => n.id),
      );
  }
  return { ok: !issues.some((i) => i.severity === 'error'), issues };
};
