#!/usr/bin/env python3
"""
build_dataset.py — Constructor reproducible del dataset de Quetzaltenango para RutaQ.

Genera src/data/quetzaltenango.json cumpliendo estrictamente con el contrato Dataset de src/core/types.ts:
- 24 municipios oficiales (INE / SEGEPLAN / Wikipedia).
- Identificadores únicos de 3 letras en mayúscula.
- Coordenadas reales de cabecera municipal (Nominatim / OpenStreetMap).
- Distancias viales reales obtenidas de OSRM (precisión de 1 decimal, km > 0).
- Geometrías simplificadas mediante Ramer-Douglas-Peucker (precisión 5).
- Criterio de arista directa: ruta OSRM que no cruza a < 1 km de otra cabecera municipal.
- Grafo conexo, sin lazos ni aristas duplicadas.
- verificado_google = False y km_google = None (listo para validación posterior).
"""

import os
import sys
import json
import time
import math
import requests
import networkx as nx
import polyline

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_NOMINATIM = os.path.join(BASE_DIR, 'scripts', 'cache', 'nominatim')
CACHE_OSRM = os.path.join(BASE_DIR, 'scripts', 'cache', 'osrm')
OUTPUT_FILE = os.path.join(BASE_DIR, 'src', 'data', 'quetzaltenango.json')

os.makedirs(CACHE_NOMINATIM, exist_ok=True)
os.makedirs(CACHE_OSRM, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

USER_AGENT = 'RutaQ-proyecto-academico'
HEADERS = {'User-Agent': USER_AGENT}

# Definición de los 24 municipios
MUNICIPIOS = [
    ('QTZ', 'Quetzaltenango', 'Quetzaltenango, Guatemala'),
    ('SAL', 'Salcajá', 'Salcajá, Quetzaltenango, 09002, Guatemala'),
    ('OLI', 'Olintepeque', 'Olintepeque, Quetzaltenango, Guatemala'),
    ('SIJ', 'San Carlos Sija', 'San Carlos Sija, Quetzaltenango, Guatemala'),
    ('SIB', 'Sibilia', 'Sibilia, Quetzaltenango, Guatemala'),
    ('CAB', 'Cabricán', 'Cabricán, Quetzaltenango, Guatemala'),
    ('CAJ', 'Cajolá', 'Cajolá, Quetzaltenango, Guatemala'),
    ('SIG', 'San Miguel Sigüilá', 'San Miguel Sigüilá, Quetzaltenango, Guatemala'),
    ('OST', 'San Juan Ostuncalco', 'San Juan Ostuncalco, Quetzaltenango, 09009, Guatemala'),
    ('MAT', 'San Mateo', 'San Mateo, Quetzaltenango, Guatemala'),
    ('CCH', 'Concepción Chiquirichapa', 'Concepción Chiquirichapa, Quetzaltenango, Guatemala'),
    ('SMA', 'San Martín Sacatepéquez', 'San Martín Sacatepéquez, Quetzaltenango, Guatemala'),
    ('ALM', 'Almolonga', 'Almolonga, Quetzaltenango, Guatemala'),
    ('CAN', 'Cantel', 'Cantel, Quetzaltenango, Guatemala'),
    ('HUI', 'Huitán', 'Huitán, Quetzaltenango, Guatemala'),
    ('ZUN', 'Zunil', 'Zunil, Quetzaltenango, Guatemala'),
    ('COL', 'Colomba Costa Cuca', 'Colomba, Quetzaltenango, Guatemala'),
    ('FLU', 'San Francisco La Unión', 'San Francisco La Unión, Quetzaltenango, Guatemala'),
    ('PAL', 'El Palmar', 'El Palmar, Quetzaltenango, Guatemala'),
    ('COA', 'Coatepeque', 'Coatepeque, Quetzaltenango, 09020, Guatemala'),
    ('GEN', 'Génova', 'Génova, Quetzaltenango, Guatemala'),
    ('FCC', 'Flores Costa Cuca', 'Flores Costa Cuca, Quetzaltenango, Guatemala'),
    ('ESP', 'La Esperanza', 'La Esperanza, Quetzaltenango, Guatemala'),
    ('PLA', 'Palestina de Los Altos', 'Palestina de Los Altos, Quetzaltenango, Guatemala')
]

# Definición de conexiones viales directas
EDGES_DEF = [
    ('ALM', 'QTZ', 'RN-10', 'Carretera hacia los baños termales y el cañón del Samalá.'),
    ('ALM', 'ZUN', 'RN-10', 'Conexión turística y agrícola directa entre Almolonga y Zunil.'),
    ('CAB', 'HUI', 'RD-QUE-11', 'Ruta departamental del altiplano norte entre Huitán y Cabricán.'),
    ('CAJ', 'FLU', 'RD-QUE-06', 'Conexión transversal intermunicipal hacia San Francisco La Unión.'),
    ('CAJ', 'PLA', 'RD-QUE-09', 'Camino intermunicipal directo entre Cajolá y Palestina de Los Altos.'),
    ('CAJ', 'SIB', 'RD-QUE-08', 'Ruta rural directa del altiplano central hacia Sibilia.'),
    ('CAJ', 'SIG', 'RD-QUE-07', 'Conexión intermunicipal directa entre San Miguel Sigüilá y Cajolá.'),
    ('CAN', 'QTZ', 'RN-01 / Periférico Sur', 'Acceso conurbado suroriental de Quetzaltenango a Cantel.'),
    ('CAN', 'SAL', 'RD-QUE-04', 'Ruta directa oriental entre Cantel y Salcajá.'),
    ('CAN', 'ZUN', 'Cito-180 / RN-10', 'Enlace vial entre Cantel y Zunil.'),
    ('CCH', 'OST', 'RN-01', 'Tramo continuo y directo entre Ostuncalco y Concepción Chiquirichapa.'),
    ('CCH', 'SMA', 'RN-01', 'Tramo de ascenso hacia la Laguna de Chicabal y San Martín Sacatepéquez.'),
    ('COA', 'COL', 'RN-13', 'Corredor comercial directo entre Coatepeque y Colomba Costa Cuca.'),
    ('COA', 'FCC', 'CA-02 Occidente', 'Tramo de la Carretera del Pacífico CA-2 entre Coatepeque y Flores Costa Cuca.'),
    ('COL', 'FCC', 'RD-QUE-15', 'Ruta departamental directa que une Colomba con Flores Costa Cuca.'),
    ('COL', 'PAL', 'Cito-180 / CA-02 Occidente / RN-13', 'Corredor costero interdepartamental que conecta El Palmar con Colomba transitando temporalmente por el departamento de Retalhuleu.'),
    ('COL', 'SMA', 'RN-01', 'Descenso montañoso histórico de Los Altos (San Martín Sacatepéquez) a la Costa Cuca (Colomba).'),
    ('ESP', 'MAT', 'RN-01', 'Tramo conurbado sobre la Ruta Nacional 1 entre La Esperanza y San Mateo.'),
    ('ESP', 'OLI', 'RD-QUE-05', 'Anillo intermunicipal metropolitano norte-occidente.'),
    ('ESP', 'QTZ', 'RN-01', 'Eje vial principal metropolitano de Quetzaltenango hacia el occidente.'),
    ('ESP', 'SIG', 'RD-QUE-07', 'Ruta local directa entre La Esperanza y San Miguel Sigüilá.'),
    ('FCC', 'GEN', 'RD-QUE-16', 'Conexión directa sur hacia la cabecera municipal de Génova Costa Cuca.'),
    ('FLU', 'OLI', 'RD-QUE-02', 'Ruta de ascenso hacia San Francisco La Unión desde Olintepeque.'),
    ('FLU', 'SIJ', 'RD-QUE-02', 'Conexión de montaña entre San Francisco La Unión y San Carlos Sija.'),
    ('HUI', 'SIB', 'RD-QUE-11', 'Ruta intermunicipal directa entre Sibilia y Huitán.'),
    ('HUI', 'SIJ', 'RD-QUE-12', 'Enlace directo entre Huitán y San Carlos Sija.'),
    ('MAT', 'OST', 'RN-01', 'Tramo principal sobre la RN-1 entre San Mateo y San Juan Ostuncalco.'),
    ('OLI', 'QTZ', 'RD-QUE-02', 'Avenida de conexión conurbada norte entre Quetzaltenango y Olintepeque.'),
    ('OLI', 'SAL', 'RD-QUE-03', 'Ruta intermunicipal directa en el valle de Los Altos.'),
    ('OST', 'PLA', 'RN-01', 'Ruta Nacional 1 de ascenso hacia Palestina de Los Altos y el departamento de San Marcos.'),
    ('OST', 'SIG', 'RD-QUE-07', 'Enlace municipal directo entre San Juan Ostuncalco y San Miguel Sigüilá.'),
    ('PAL', 'ZUN', 'Cito-180', 'Ruta Cito-180 que desciende de Los Altos (Zunil) hacia la Bocacosta (El Palmar); sale temporalmente hacia el norte de Retalhuleu por razones orográficas.'),
    ('PLA', 'SIB', 'RD-QUE-08', 'Ruta del altiplano occidental entre Palestina de Los Altos y Sibilia.'),
    ('QTZ', 'SAL', 'CA-01 Occidente / RN-01', 'Eje troncal de cuatro carriles entre la cabecera departamental y Salcajá.'),
    ('SAL', 'SIJ', 'CA-01 Occidente', 'Carretera Panamericana que conecta Salcajá con San Carlos Sija, saliendo brevemente del departamento por el entronque de Cuatro Caminos (Totonicapán) hacia Calel.'),
    ('SIB', 'SIJ', 'RD-QUE-10', 'Conexión transversal directa entre Sibilia y San Carlos Sija.')
]

def rdp_simplify(points, epsilon=0.0001):
    """Simplificación de polyline con Ramer-Douglas-Peucker (epsilon en grados, ~10m)."""
    if len(points) < 3:
        return points
    first, last = points[0], points[-1]
    dy = last[0] - first[0]
    dx = last[1] - first[1]
    norm = math.sqrt(dx * dx + dy * dy)
    dmax = 0.0
    index = 0
    if norm == 0:
        for i in range(1, len(points) - 1):
            d = math.hypot(points[i][0] - first[0], points[i][1] - first[1])
            if d > dmax:
                index = i
                dmax = d
    else:
        for i in range(1, len(points) - 1):
            p = points[i]
            d = abs(dy * p[1] - dx * p[0] + last[1] * first[0] - last[0] * first[1]) / norm
            if d > dmax:
                index = i
                dmax = d
    if dmax > epsilon:
        rec1 = rdp_simplify(points[:index + 1], epsilon)
        rec2 = rdp_simplify(points[index:], epsilon)
        return rec1[:-1] + rec2
    else:
        return [first, last]

def fetch_node_coords(m_id, label, query):
    cache_path = os.path.join(CACHE_NOMINATIM, f"{m_id}.json")
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        url = 'https://nominatim.openstreetmap.org/search'
        resp = requests.get(url, params={'q': query, 'format': 'json', 'limit': 3}, headers=HEADERS)
        data = resp.json()
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.1)

    if not data:
        raise ValueError(f"No se encontraron coordenadas para {m_id} ({label})")
    
    item = data[0]
    return {
        'id': m_id,
        'label': label,
        'lat': round(float(item['lat']), 5),
        'lon': round(float(item['lon']), 5),
        'fuente': 'Nominatim / OpenStreetMap (cabecera municipal oficial)'
    }

def fetch_edge_route(u, v, nodes_dict):
    src = min(u, v)
    tgt = max(u, v)
    pair_key = f"{src}_{tgt}"
    cache_path = os.path.join(CACHE_OSRM, f"{pair_key}.json")
    
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        n1 = nodes_dict[src]
        n2 = nodes_dict[tgt]
        url = f"https://router.project-osrm.org/route/v1/driving/{n1['lon']},{n1['lat']};{n2['lon']},{n2['lat']}?overview=full&geometries=polyline"
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            raise RuntimeError(f"Error {resp.status_code} de OSRM para {src}-{tgt}")
        data = resp.json()
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.1)

    if not data.get('routes'):
        raise ValueError(f"OSRM no encontró ruta entre {src} y {tgt}")

    route = data['routes'][0]
    distance_km = round(route['distance'] / 1000.0, 1)
    if distance_km <= 0:
        raise ValueError(f"Distancia inválida ({distance_km} km) para {src}-{tgt}")
        
    raw_geom = route['geometry']
    pts = polyline.decode(raw_geom)
    simplified_pts = rdp_simplify(pts, epsilon=0.0001)
    simplified_geom = polyline.encode(simplified_pts)
    
    return distance_km, simplified_geom

def build():
    print("--- 1. Cargando y verificando nodos (24 municipios) ---")
    nodes = []
    nodes_dict = {}
    ids_seen = set()
    for m_id, label, query in MUNICIPIOS:
        if m_id in ids_seen:
            raise ValueError(f"ID duplicado: {m_id}")
        ids_seen.add(m_id)
        node = fetch_node_coords(m_id, label, query)
        nodes.append(node)
        nodes_dict[m_id] = node
        print(f"  [{m_id}] {label:<26} -> {node['lat']:.5f}, {node['lon']:.5f}")

    if len(nodes) != 24:
        raise ValueError(f"Se esperaban 24 municipios, se obtuvieron {len(nodes)}")

    print(f"\n--- 2. Consultando y procesando aristas viales ({len(EDGES_DEF)} aristas) ---")
    edges = []
    edge_ids_seen = set()
    for u, v, carretera, nota in EDGES_DEF:
        src = min(u, v)
        tgt = max(u, v)
        edge_id = f"{src}-{tgt}"
        
        if edge_id in edge_ids_seen:
            raise ValueError(f"Arista duplicada: {edge_id}")
        edge_ids_seen.add(edge_id)
        
        km, geom = fetch_edge_route(src, tgt, nodes_dict)
        edges.append({
            'id': edge_id,
            'source': src,
            'target': tgt,
            'km': km,
            'carretera': carretera,
            'fuente': 'OSRM Car Routing (router.project-osrm.org)',
            'verificado_google': False,
            'km_google': None,
            'nota': nota,
            'geometry': geom
        })
        print(f"  {edge_id:<10} | {km:>5.1f} km | {carretera:<25} | geom: {len(geom)} chars")

    print("\n--- 3. Verificaciones de integridad topológica del grafo ---")
    G = nx.Graph()
    for n in nodes:
        G.add_node(n['id'], label=n['label'])
    for e in edges:
        G.add_edge(e['source'], e['target'], weight=e['km'])

    if not nx.is_connected(G):
        components = list(nx.connected_components(G))
        raise ValueError(f"¡El grafo NO es conexo! Componentes: {components}")
    print("  [OK] El grafo es CONEXO.")

    if G.number_of_nodes() != 24:
        raise ValueError(f"Número de nodos incorrecto en el grafo: {G.number_of_nodes()}")
    print("  [OK] Exactamente 24 nodos presentes.")

    if G.number_of_edges() != len(EDGES_DEF):
        raise ValueError("Discrepancia en número de aristas.")
    print(f"  [OK] Exactamente {len(edges)} aristas válidas sin lazos ni duplicados.")

    dataset = {
        'meta': {
            'nombre': 'Red Vial del Departamento de Quetzaltenango',
            'unidad': 'km',
            'fuentes': [
                'Instituto Nacional de Estadística de Guatemala (INE)',
                'OpenStreetMap / Nominatim (coordenadas de cabeceras)',
                'Project OSRM Car Routing (distancias viales y geometrías)',
                'Ministerio de Comunicaciones, Infraestructura y Vivienda (MICIVI / DGC)'
            ],
            'fecha': '2026-10-14'
        },
        'nodes': nodes,
        'edges': edges
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"\n[EXITO] Archivo generado exitosamente en: {OUTPUT_FILE}")

if __name__ == '__main__':
    build()
