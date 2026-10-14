import csv
import json
import subprocess
import sys
from pathlib import Path

import networkx as nx

ROOT = Path(__file__).resolve().parents[1]
subprocess.run(['npx.cmd', '--yes', 'tsx', 'verification/export.ts'], cwd=ROOT, check=True)
data = json.loads((ROOT / 'verification/programa.json').read_text(encoding='utf-8'))
(ROOT / 'verification/programa.json').unlink(missing_ok=True)
rows, mismatches = [], []
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
            ok = got == want
            rows.append([name, source, target, want, got, ok])
            if not ok: mismatches.append((name, source, target, want, got))
with (ROOT / 'verification/resultados.csv').open('w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f); writer.writerow(['grafo','origen','destino','networkx','programa','coincide']); writer.writerows(rows)
optional = ['src/data/ejemplo6.json', 'src/data/quetzaltenango.json']
missing = [p for p in optional if not (ROOT / p).exists()]
print(f"Coincidencia: {len(rows)-len(mismatches)}/{len(rows)} ({100*(len(rows)-len(mismatches))/len(rows):.1f} %)")
report = f"# Reporte de verificación\n\nCoincidencia: {len(rows)-len(mismatches)}/{len(rows)} ({100*(len(rows)-len(mismatches))/len(rows):.1f} %).\n\n" + ("Datasets opcionales no disponibles: " + ", ".join(missing) + ".\n" if missing else "Datasets opcionales procesados.\n")
(ROOT / 'verification/reporte.md').write_text(report, encoding='utf-8')
if missing: print('Datasets opcionales aún no disponibles: ' + ', '.join(missing))
if mismatches:
    print('Discrepancias:', mismatches[:10]); sys.exit(1)
