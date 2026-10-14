#!/usr/bin/env python3
"""
verify_dataset.py — Verifica que los archivos JSON generados cumplan todos los requisitos
del contrato congelado v1 de RutaQ y las propiedades topológicas exigidas.
"""

import os
import json
import networkx as nx

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, 'src', 'data', 'quetzaltenango.json')
EJEMPLO6_PATH = os.path.join(BASE_DIR, 'src', 'data', 'ejemplo6.json')

def verify_quetzaltenango():
    print("=== Verificando src/data/quetzaltenango.json ===")
    assert os.path.exists(DATASET_PATH), f"No existe {DATASET_PATH}"
    with open(DATASET_PATH, 'r', encoding='utf-8') as f:
        ds = json.load(f)

    # Validar metadatos
    assert 'meta' in ds, "Falta 'meta'"
    assert ds['meta']['unidad'] == 'km', "Unidad debe ser 'km'"
    assert len(ds['meta']['fuentes']) > 0, "Debe tener fuentes"

    # Validar nodos
    nodes = ds['nodes']
    assert len(nodes) == 24, f"Se esperaban 24 nodos, hay {len(nodes)}"
    node_ids = set()
    for n in nodes:
        assert len(n['id']) == 3 and n['id'].isupper(), f"ID inválido: {n['id']}"
        assert n['id'] not in node_ids, f"ID duplicado: {n['id']}"
        node_ids.add(n['id'])
        assert isinstance(n['lat'], (int, float)) and 14.0 <= n['lat'] <= 16.0, f"Latitud fuera de rango para {n['id']}"
        assert isinstance(n['lon'], (int, float)) and -93.0 <= n['lon'] <= -90.0, f"Longitud fuera de rango para {n['id']}"
        assert len(n['label']) > 0, f"Label vacío para {n['id']}"
        assert len(n['fuente']) > 0, f"Fuente vacía para {n['id']}"
    print(f"  [OK] 24 nodos validados correctamente.")

    # Validar aristas
    edges = ds['edges']
    assert len(edges) >= 24, f"Muy pocas aristas ({len(edges)})"
    edge_ids = set()
    G = nx.Graph()
    G.add_nodes_from(node_ids)

    for e in edges:
        eid = e['id']
        src, tgt = e['source'], e['target']
        assert src in node_ids and tgt in node_ids, f"Nodos inexistentes en arista {eid}"
        assert src != tgt, f"Lazo detectado en arista {eid}"
        assert eid not in edge_ids, f"Arista duplicada {eid}"
        edge_ids.add(eid)
        assert e['km'] > 0, f"Distancia no positiva en {eid}: {e['km']}"
        assert round(e['km'], 1) == e['km'], f"km no tiene exactamente 1 decimal en {eid}: {e['km']}"
        assert e['verificado_google'] is False, f"verificado_google debe ser false inicialmente en {eid}"
        assert e['km_google'] is None, f"km_google debe ser null inicialmente en {eid}"
        assert len(e['geometry']) > 0, f"Geometría vacía en {eid}"
        assert len(e['carretera']) > 0, f"Carretera vacía en {eid}"
        G.add_edge(src, tgt, weight=e['km'])

    print(f"  [OK] {len(edges)} aristas validadas correctamente.")

    # Validar conexo
    assert nx.is_connected(G), "El grafo de Quetzaltenango NO es conexo"
    print("  [OK] Grafo 100% conexo.")

def verify_ejemplo6():
    print("\n=== Verificando src/data/ejemplo6.json ===")
    assert os.path.exists(EJEMPLO6_PATH), f"No existe {EJEMPLO6_PATH}"
    with open(EJEMPLO6_PATH, 'r', encoding='utf-8') as f:
        gf = json.load(f)

    assert gf['format'] == 'rutaq-graph'
    assert gf['version'] == 1
    g = gf['graph']
    assert g['directed'] is False
    assert len(g['nodes']) == 6, f"Se esperaban 6 nodos, hay {len(g['nodes'])}"
    
    node_ids = {n['id'] for n in g['nodes']}
    assert node_ids == {'A', 'B', 'C', 'D', 'E', 'F'}, f"IDs inesperados: {node_ids}"
    
    for n in g['nodes']:
        assert n['w'] == 132 and n['h'] == 44, f"Dimensiones de nodo incorrectas en {n['id']}"
        assert isinstance(n['x'], (int, float)) and isinstance(n['y'], (int, float))

    for e in g['edges']:
        assert e['weight'] > 0 and isinstance(e['weight'], int), f"Peso no entero en {e['id']}"
        assert e['shape'] == 'straight'
        assert e['shapeAuto'] is True

    G = nx.Graph()
    for e in g['edges']:
        G.add_edge(e['source'], e['target'], weight=e['weight'])

    assert nx.is_connected(G), "El grafo de 6 nodos no es conexo"
    print("  [OK] Ejemplo de 6 nodos cumple contrato GraphFile y es conexo.")

if __name__ == '__main__':
    verify_quetzaltenango()
    verify_ejemplo6()
    print("\n[TODAS LAS VERIFICACIONES DE DATOS PASARON EXITOSAMENTE]")
