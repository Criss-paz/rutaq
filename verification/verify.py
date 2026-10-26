import csv
import json
import subprocess
import sys
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parents[1]
NPX = 'npx.cmd' if sys.platform == 'win32' else 'npx'
subprocess.run([NPX, '--yes', 'tsx', 'verification/export.ts'], cwd=ROOT, check=True)
program_file = ROOT / 'verification/programa.json'
data = json.loads(program_file.read_text(encoding='utf-8'))
program_file.unlink(missing_ok=True)
rows, mismatches, mst_rows, mst_mismatches = [], [], [], []
for name, item in data.items():
    graph, actual = item['graph'], item['distances']
    G = nx.Graph()
    G.add_nodes_from(n['id'] for n in graph['nodes'])
    G.add_weighted_edges_from((e['source'], e['target'], e['weight']) for e in graph['edges'])
    for source in G.nodes:
        expected = nx.single_source_dijkstra_path_length(G, source)
        for target in G.nodes:
            want = expected.get(target, float('inf'))
            got = actual[source][target]['dist']
            ok = abs(got - want) <= 1e-9 * max(1, abs(want), abs(got)) if want != float('inf') else got == want
            rows.append([name, source, target, want, got, ok])
            if not ok:
                mismatches.append((name, source, target, want, got))
    expected_mst = sum(edge[2]['weight'] for edge in nx.minimum_spanning_tree(G).edges(data=True))
    for algorithm, got in item['mst'].items():
        ok = abs(got - expected_mst) <= 1e-9 * max(1, abs(expected_mst), abs(got))
        mst_rows.append([name, algorithm, expected_mst, got, ok])
        if not ok:
            mst_mismatches.append((name, algorithm, expected_mst, got))
with (ROOT / 'verification/resultados.csv').open('w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['grafo', 'origen', 'destino', 'networkx', 'programa', 'coincide'])
    writer.writerows(rows)
optional = ['src/data/ejemplo6.json', 'src/data/ejemplo_mst.json', 'src/data/quetzaltenango.json', 'src/data/guatemala.json']
missing = [path for path in optional if not (ROOT / path).exists()]
distance_ok = len(rows) - len(mismatches)
mst_ok = len(mst_rows) - len(mst_mismatches)
report = (
    '# Reporte de verificación\n\n'
    f'Caminos mínimos: {distance_ok}/{len(rows)} pares coinciden con NetworkX.\n\n'
    f'Árbol de expansión mínima: {mst_ok}/{len(mst_rows)} totales coinciden con NetworkX.\n\n'
    + ('Datasets opcionales no disponibles: ' + ', '.join(missing) + '.\n' if missing else 'Todos los datasets opcionales disponibles fueron procesados.\n')
)
(ROOT / 'verification/reporte.md').write_text(report, encoding='utf-8')
print(f'Caminos mínimos: {distance_ok}/{len(rows)} pares; AEM: {mst_ok}/{len(mst_rows)} totales.')
if missing:
    print('Datasets opcionales aún no disponibles: ' + ', '.join(missing))
if mismatches:
    print('Discrepancias de caminos:', mismatches[:10])
if mst_mismatches:
    print('Discrepancias de AEM:', mst_mismatches[:10])
if mismatches or mst_mismatches:
    sys.exit(1)
