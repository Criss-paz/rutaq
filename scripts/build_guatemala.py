#!/usr/bin/env python3
"""
build_guatemala.py — Constructor reproducible del dataset de Guatemala (22 departamentos) para RutaQ.

Cumple con el contrato GuatemalaDataset de src/core/types.ts:
1. Nodos: 22 cabeceras departamentales oficiales según docs/agentes/proyecto2_ids.md (fuente Nominatim con caché).
2. Auditoría de coordenadas: contraste contra la API de Wikipedia (prop=coordinates), guardado en
   docs/datos/auditoria_coordenadas_guatemala.csv y corrección documentada en docs/datos/coordenadas_corregidas_guatemala.csv.
3. Polígonos departamentales y vecindad: polígonos oficiales de OSM/Nominatim (polygon_geojson=1, addresstype=state)
   con caché en scripts/cache/departamentos_geojson/. Cálculo topológico de vecindad con tolerancia de ~200 m, guardado
   en docs/datos/vecindad_departamentos.csv.
4. Criterio de arista directa reproducible (ambas condiciones deben cumplirse simultáneamente):
   - Condición 1: Los departamentos A y B son vecinos (comparten frontera geográfica).
   - Condición 2: La ruta OSRM no pasa a menos de 2.0 km de ninguna otra cabecera departamental C != A, B.
   Descartes registrados en docs/datos/aristas_descartadas_guatemala.csv indicando la condición fallida.
5. carretera: derivada de los steps de OSRM sumando distancias de ref (CA-1, CA-9, CA-13, RN-…) o name.
6. Grafo conexo: verificación topológica de conectividad completa (especialmente Petén conectado a la red nacional).
7. Contorno simplificado de Guatemala: GeoJSON Polygon (<= 400 puntos) en src/data/guatemala_contorno.json.
8. Reproducibilidad: con la caché en scripts/cache/, el script se ejecuta sin conexión y produce el mismo JSON idéntico.
"""

import os
import sys
import json
import time
import math
import csv
import urllib.request
import urllib.parse
from shapely.geometry import shape
import networkx as nx

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_NOMINATIM = os.path.join(BASE_DIR, 'scripts', 'cache', 'nominatim_guatemala')
CACHE_OSRM = os.path.join(BASE_DIR, 'scripts', 'cache', 'osrm_guatemala')
CACHE_WIKIPEDIA = os.path.join(BASE_DIR, 'scripts', 'cache', 'wikipedia_guatemala')
CACHE_DEPT_GEOJSON = os.path.join(BASE_DIR, 'scripts', 'cache', 'departamentos_geojson')

OUTPUT_DATASET = os.path.join(BASE_DIR, 'src', 'data', 'guatemala.json')
OUTPUT_CONTORNO = os.path.join(BASE_DIR, 'src', 'data', 'guatemala_contorno.json')
OUTPUT_AUDITORIA = os.path.join(BASE_DIR, 'docs', 'datos', 'auditoria_coordenadas_guatemala.csv')
INPUT_COORDENADAS_CORREGIDAS = os.path.join(BASE_DIR, 'docs', 'datos', 'coordenadas_corregidas_guatemala.csv')
OUTPUT_VECINDAD = os.path.join(BASE_DIR, 'docs', 'datos', 'vecindad_departamentos.csv')
OUTPUT_DISCARDED = os.path.join(BASE_DIR, 'docs', 'datos', 'aristas_descartadas_guatemala.csv')

os.makedirs(CACHE_NOMINATIM, exist_ok=True)
os.makedirs(CACHE_OSRM, exist_ok=True)
os.makedirs(CACHE_WIKIPEDIA, exist_ok=True)
os.makedirs(CACHE_DEPT_GEOJSON, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_DATASET), exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_DISCARDED), exist_ok=True)

USER_AGENT = 'RutaQ-proyecto-academico/1.0 (https://github.com/Criss-paz/rutaq; estudiante@miumg.edu.gt)'
EARTH_RADIUS_KM = 6371.0088

# Umbrales metodológicos exactos
VECINDAD_TOLERANCE_DEG = 0.002  # ~220 m (tolerancia de contacto entre polígonos departamentales)
DIRECT_EDGE_THRESHOLD_KM = 2.0  # Distancia mínima a cabecera intermedia distinta de A y B

# 22 departamentos con id de 3 letras, nombre oficial, cabecera departamental, consulta Nominatim y título Wikipedia
DEPARTAMENTOS = [
    ('GUA', 'Guatemala', 'Ciudad de Guatemala', 'Ciudad de Guatemala, Guatemala', 'Ciudad de Guatemala'),
    ('SAC', 'Sacatepéquez', 'Antigua Guatemala', 'Antigua Guatemala, Sacatepéquez, Guatemala', 'Antigua Guatemala'),
    ('CHI', 'Chimaltenango', 'Chimaltenango', 'Chimaltenango, Chimaltenango, Guatemala', 'Chimaltenango (municipio)'),
    ('ESC', 'Escuintla', 'Escuintla', 'Escuintla, Escuintla, Guatemala', 'Escuintla (ciudad)'),
    ('SRO', 'Santa Rosa', 'Cuilapa', 'Cuilapa, Santa Rosa, Guatemala', 'Cuilapa'),
    ('JUT', 'Jutiapa', 'Jutiapa', 'Jutiapa, Jutiapa, Guatemala', 'Jutiapa (municipio)'),
    ('JAL', 'Jalapa', 'Jalapa', 'Jalapa, Jalapa, Guatemala', 'Jalapa (Jalapa)'),
    ('PRO', 'El Progreso', 'Guastatoya', 'Guastatoya, El Progreso, Guatemala', 'Guastatoya'),
    ('ZAC', 'Zacapa', 'Zacapa', 'Zacapa, Zacapa, Guatemala', 'Zacapa (ciudad)'),
    ('CHQ', 'Chiquimula', 'Chiquimula', 'Chiquimula, Chiquimula, Guatemala', 'Chiquimula (municipio)'),
    ('IZA', 'Izabal', 'Puerto Barrios', 'Puerto Barrios, Izabal, Guatemala', 'Puerto Barrios'),
    ('AVE', 'Alta Verapaz', 'Cobán', 'Cobán, Alta Verapaz, Guatemala', 'Cobán'),
    ('BVE', 'Baja Verapaz', 'Salamá', 'Salamá, Baja Verapaz, Guatemala', 'Salamá'),
    ('PET', 'Petén', 'Flores', 'Flores, Petén, Guatemala', 'Flores (Petén)'),
    ('QUI', 'Quiché', 'Santa Cruz del Quiché', 'Santa Cruz del Quiché, Quiché, Guatemala', 'Santa Cruz del Quiché'),
    ('HUE', 'Huehuetenango', 'Huehuetenango', 'Huehuetenango, Huehuetenango, Guatemala', 'Huehuetenango (municipio)'),
    ('SMA', 'San Marcos', 'San Marcos', 'San Marcos, San Marcos, Guatemala', 'San Marcos (San Marcos)'),
    ('QUE', 'Quetzaltenango', 'Quetzaltenango', 'Quetzaltenango, Quetzaltenango, Guatemala', 'Quetzaltenango'),
    ('TOT', 'Totonicapán', 'Totonicapán', 'Totonicapán, Totonicapán, Guatemala', 'Totonicapán (municipio)'),
    ('SOL', 'Sololá', 'Sololá', 'Sololá, Sololá, Guatemala', 'Sololá (ciudad)'),
    ('REU', 'Retalhuleu', 'Retalhuleu', 'Retalhuleu, Retalhuleu, Guatemala', 'Retalhuléu (municipio)'),
    ('SUC', 'Suchitepéquez', 'Mazatenango', 'Mazatenango, Suchitepéquez, Guatemala', 'Mazatenango')
]

# ─────────────────── Geometría y Polyline ───────────────────

def decode_polyline(polyline_str, precision=5):
    """Decodifica un polyline codificado a lista de tuplas (lat, lon)."""
    factor = 10.0 ** precision
    index = 0
    lat = 0
    lng = 0
    coordinates = []
    length = len(polyline_str)
    while index < length:
        shift = 0
        result = 0
        while True:
            byte = ord(polyline_str[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        shift = 0
        result = 0
        while True:
            byte = ord(polyline_str[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        coordinates.append((lat / factor, lng / factor))
    return coordinates

def encode_polyline(coordinates, precision=5):
    """Codifica lista de tuplas (lat, lon) a string polyline."""
    factor = 10.0 ** precision
    def encode_value(value):
        value = ~(value << 1) if value < 0 else (value << 1)
        chunks = []
        while value >= 0x20:
            chunks.append(chr((0x20 | (value & 0x1f)) + 63))
            value >>= 5
        chunks.append(chr(value + 63))
        return ''.join(chunks)

    output = []
    prev_lat = 0
    prev_lng = 0
    for lat, lng in coordinates:
        ilat = round(lat * factor)
        ilng = round(lng * factor)
        output.append(encode_value(ilat - prev_lat))
        output.append(encode_value(ilng - prev_lng))
        prev_lat = ilat
        prev_lng = ilng
    return ''.join(output)

def rdp_simplify(points, epsilon=0.0001):
    """Simplificación de polyline con Ramer-Douglas-Peucker."""
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

def haversine_km(lat1, lon1, lat2, lon2):
    """Distancia haversine en kilómetros entre dos coordenadas esféricas."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * EARTH_RADIUS_KM * math.asin(math.sqrt(min(1.0, a)))

def point_to_segment_haversine(lat_c, lon_c, lat_a, lon_a, lat_b, lon_b):
    """Distancia haversine punto-segmento ortogonal."""
    lat_ref = math.radians((lat_c + lat_a + lat_b) / 3.0)
    cos_lat = math.cos(lat_ref)

    xa = EARTH_RADIUS_KM * cos_lat * math.radians(lon_a - lon_c)
    ya = EARTH_RADIUS_KM * math.radians(lat_a - lat_c)
    xb = EARTH_RADIUS_KM * cos_lat * math.radians(lon_b - lon_c)
    yb = EARTH_RADIUS_KM * math.radians(lat_b - lat_c)

    dx = xb - xa
    dy = yb - ya
    l2 = dx * dx + dy * dy
    if l2 == 0:
        t = 0.0
    else:
        t = max(0.0, min(1.0, -(xa * dx + ya * dy) / l2))

    proj_x = xa + t * dx
    proj_y = ya + t * dy

    proj_lat = lat_c + math.degrees(proj_y / EARTH_RADIUS_KM)
    proj_lon = lon_c + math.degrees(proj_x / (EARTH_RADIUS_KM * cos_lat))
    return haversine_km(lat_c, lon_c, proj_lat, proj_lon)

def min_distance_point_to_route(lat_c, lon_c, route_points):
    """Distancia mínima desde un punto C a la geometría de una ruta polyline."""
    min_dist = float('inf')
    for i in range(len(route_points) - 1):
        pa = route_points[i]
        pb = route_points[i + 1]
        d = point_to_segment_haversine(lat_c, lon_c, pa[0], pa[1], pb[0], pb[1])
        if d < min_dist:
            min_dist = d
            if min_dist < 0.1:
                break
    return min_dist

# ─────────────────── Nodos y Coordenadas ───────────────────

def get_node_coords(m_id, label, cabecera, query):
    """Obtiene o lee de caché las coordenadas de la cabecera departamental desde Nominatim."""
    cache_path = os.path.join(CACHE_NOMINATIM, f"{m_id}.json")
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        print(f"  [Nominatim] Consultando coordenadas para {cabecera}, {label} ({m_id})...")
        params = urllib.parse.urlencode({'q': query, 'format': 'json', 'limit': 3})
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.05)

    if not data:
        raise ValueError(f"Nominatim no devolvió resultados para {m_id} ({cabecera})")

    selected = None
    for item in data:
        if item.get('class') in ('place', 'boundary') or item.get('type') in ('city', 'town', 'administrative'):
            selected = item
            break
    if not selected:
        selected = data[0]

    lat = round(float(selected['lat']), 5)
    lon = round(float(selected['lon']), 5)
    return {
        'id': m_id,
        'label': label,
        'cabecera': cabecera,
        'lat': lat,
        'lon': lon,
        'fuente': 'Nominatim / OpenStreetMap (cabecera departamental oficial)'
    }

def get_wikipedia_coords(m_id, title):
    """Obtiene o lee de caché las coordenadas oficiales de Wikipedia en español."""
    cache_path = os.path.join(CACHE_WIKIPEDIA, f"{m_id}.json")
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        print(f"  [Wikipedia] Consultando {title} ({m_id})...")
        url = f"https://es.wikipedia.org/w/api.php?action=query&prop=coordinates&titles={urllib.parse.quote(title)}&redirects=1&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.05)

    pages = data['query']['pages']
    page = list(pages.values())[0]
    coords = page.get('coordinates')
    if not coords:
        raise ValueError(f"Wikipedia no devolvió coordenadas para {m_id} ({title})")

    lat = round(float(coords[0]['lat']), 5)
    lon = round(float(coords[0]['lon']), 5)
    return lat, lon

def audit_coordinates(nodes):
    """Genera la auditoría de coordenadas de Nominatim vs Wikipedia en CSV."""
    print("\n--- Auditoría de Coordenadas (Nominatim vs Wikipedia) ---")
    rows = []
    discrepancies = []
    for node, (_, _, _, _, wiki_title) in zip(nodes, DEPARTAMENTOS):
        m_id = node['id']
        nom_lat = node['lat']
        nom_lon = node['lon']
        wiki_lat, wiki_lon = get_wikipedia_coords(m_id, wiki_title)
        dif_km = round(haversine_km(nom_lat, nom_lon, wiki_lat, wiki_lon), 3)

        rows.append({
            'id': m_id,
            'departamento': node['label'],
            'cabecera': node['cabecera'],
            'nominatim_lat': nom_lat,
            'nominatim_lon': nom_lon,
            'wikipedia_lat': wiki_lat,
            'wikipedia_lon': wiki_lon,
            'diferencia_km': dif_km
        })
        status_flag = " [!] DIF > 3km" if dif_km > 3.0 else " [OK]"
        print(f"  [{m_id}] {node['cabecera']:<22} | Nom: ({nom_lat:8.5f}, {nom_lon:9.5f}) | Wiki: ({wiki_lat:8.5f}, {wiki_lon:9.5f}) | Dif: {dif_km:6.3f} km{status_flag}")
        if dif_km > 3.0:
            discrepancies.append((m_id, node['cabecera'], dif_km))

    with open(OUTPUT_AUDITORIA, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'id', 'departamento', 'cabecera', 'nominatim_lat', 'nominatim_lon', 'wikipedia_lat', 'wikipedia_lon', 'diferencia_km'
        ])
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Guardada auditoría en: {OUTPUT_AUDITORIA}")
    return discrepancies

# ─────────────────── Polígonos Departamentales y Vecindad ───────────────────

def get_department_polygon(m_id, label):
    """Obtiene de caché o consulta a Nominatim el polígono GeoJSON del departamento."""
    cache_path = os.path.join(CACHE_DEPT_GEOJSON, f"{m_id}.json")
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            item = json.load(f)
    else:
        print(f"  [Nominatim] Consultando polígono para departamento {label} ({m_id})...")
        if m_id == 'GUA':
            params = {'q': 'Departamento de Guatemala, Guatemala', 'polygon_geojson': '1', 'format': 'json'}
        else:
            params = {'country': 'Guatemala', 'state': label, 'polygon_geojson': '1', 'format': 'json'}
        url = f"https://nominatim.openstreetmap.org/search?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        item = next((x for x in data if x.get('addresstype') == 'state'), None)
        if not item and data:
            item = data[0]
        if not item:
            raise ValueError(f"Nominatim no devolvió polígono para el departamento {label} ({m_id})")
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(item, f, ensure_ascii=False, indent=2)
        time.sleep(1.05)

    geom = shape(item['geojson'])
    if not geom.is_valid:
        geom = geom.buffer(0)
    return geom

def build_vecindad_matrix(dept_codes, geoms):
    """
    Calcula la matriz de vecindad entre departamentos (distancia <= ~200 m)
    y la guarda en docs/datos/vecindad_departamentos.csv.
    """
    print("\n--- Cálculo de Matriz de Vecindad Departamental ---")
    adjacency = {}
    matrix_rows = []

    for c1 in dept_codes:
        g1 = geoms[c1]
        row_dict = {'departamento': c1}
        for c2 in dept_codes:
            if c1 == c2:
                is_adj = 0
            else:
                g2 = geoms[c2]
                dist = g1.distance(g2)
                is_adj = 1 if dist <= VECINDAD_TOLERANCE_DEG else 0
                pair = (min(c1, c2), max(c1, c2))
                adjacency[pair] = (is_adj == 1)
            row_dict[c2] = is_adj
        matrix_rows.append(row_dict)

    fieldnames = ['departamento'] + dept_codes
    with open(OUTPUT_VECINDAD, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(matrix_rows)

    num_vecinos = sum(1 for is_v in adjacency.values() if is_v)
    print(f"  Total pares vecinos identificados: {num_vecinos}")
    print(f"  Guardada matriz de vecindad en: {OUTPUT_VECINDAD}")
    return adjacency

# ─────────────────── Consulta y Caché OSRM ───────────────────

def get_osrm_route(u, v, nodes_dict):
    """Obtiene la ruta OSRM entre u y v con overview=full, geometries=polyline y steps=true."""
    src = min(u, v)
    tgt = max(u, v)
    pair_key = f"{src}_{tgt}"
    cache_path = os.path.join(CACHE_OSRM, f"{pair_key}.json")

    n1 = nodes_dict[src]
    n2 = nodes_dict[tgt]

    has_valid_cache = False
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if data.get('routes') and len(data['routes']) > 0:
                legs = data['routes'][0].get('legs', [])
                if legs and len(legs[0].get('steps', [])) > 0:
                    if '_query_coords' in data:
                        qc = data['_query_coords']
                        if (abs(qc.get('lat1', 0) - n1['lat']) < 1e-4 and
                            abs(qc.get('lon1', 0) - n1['lon']) < 1e-4 and
                            abs(qc.get('lat2', 0) - n2['lat']) < 1e-4 and
                            abs(qc.get('lon2', 0) - n2['lon']) < 1e-4):
                            has_valid_cache = True
                    elif 'waypoints' in data and len(data['waypoints']) >= 2:
                        wp1 = data['waypoints'][0]['location']
                        wp2 = data['waypoints'][1]['location']
                        d1 = haversine_km(n1['lat'], n1['lon'], wp1[1], wp1[0])
                        d2 = haversine_km(n2['lat'], n2['lon'], wp2[1], wp2[0])
                        if d1 < 1.0 and d2 < 1.0:
                            has_valid_cache = True
        except Exception:
            has_valid_cache = False

    if not has_valid_cache:
        print(f"  [OSRM] Consultando ruta para {src}-{tgt} ({n1['cabecera']} -> {n2['cabecera']})...")
        url = (
            f"https://router.project-osrm.org/route/v1/driving/"
            f"{n1['lon']},{n1['lat']};{n2['lon']},{n2['lat']}"
            f"?overview=full&geometries=polyline&steps=true"
        )
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        attempts = 0
        while attempts < 3:
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                break
            except Exception as e:
                attempts += 1
                print(f"    Reintento {attempts}/3 para {pair_key} tras error: {e}")
                time.sleep(2.0 * attempts)
        else:
            raise RuntimeError(f"Fallo persistente consultando OSRM para {pair_key}")

        data['_query_coords'] = {
            'src': src,
            'tgt': tgt,
            'lat1': n1['lat'],
            'lon1': n1['lon'],
            'lat2': n2['lat'],
            'lon2': n2['lon']
        }
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.05)

    if not data.get('routes'):
        raise ValueError(f"OSRM no encontró ruta entre {src} y {tgt}")

    return data['routes'][0]

def derive_carretera_from_steps(route):
    """Deriva el nombre o código de carretera desde los steps de OSRM (CA-1, CA-9, etc.)."""
    steps = route.get('legs', [{}])[0].get('steps', [])
    ref_dist = {}
    name_dist = {}
    ignored_markers = {'unknown', 'unnamed', 'sin nombre', 'none'}

    for s in steps:
        dist = s.get('distance', 0)
        ref = s.get('ref')
        name = s.get('name')
        if ref and ref.strip():
            for r in ref.replace(';', '/').split('/'):
                clean_r = r.strip()
                if clean_r and clean_r.lower() not in ignored_markers:
                    ref_dist[clean_r] = ref_dist.get(clean_r, 0) + dist
        if name and name.strip():
            clean_name = name.strip()
            if clean_name and clean_name.lower() not in ignored_markers:
                name_dist[clean_name] = name_dist.get(clean_name, 0) + dist

    if ref_dist:
        sorted_refs = sorted(ref_dist.items(), key=lambda x: -x[1])
        top_ref, top_d = sorted_refs[0]
        total_ref_d = sum(ref_dist.values())
        if len(sorted_refs) > 1 and sorted_refs[1][1] >= 0.20 * total_ref_d:
            return f"{top_ref} / {sorted_refs[1][0]}"
        return top_ref

    if name_dist:
        sorted_names = sorted(name_dist.items(), key=lambda x: -x[1])
        top_name, top_d = sorted_names[0]
        total_name_d = sum(name_dist.values())
        if len(sorted_names) > 1 and sorted_names[1][1] >= 0.25 * total_name_d:
            return f"{top_name} / {sorted_names[1][0]}"
        return top_name

    return ""

# ─────────────────── Contorno de Guatemala ───────────────────

def build_guatemala_contorno():
    """Genera src/data/guatemala_contorno.json simplificado con RDP (<= 400 puntos)."""
    cache_path = os.path.join(CACHE_NOMINATIM, 'guatemala_boundary_osm.json')
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        print("  [Nominatim] Consultando límite nacional de Guatemala con polygon_geojson=1...")
        url = 'https://nominatim.openstreetmap.org/search?country=Guatemala&polygon_geojson=1&format=json&limit=1'
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.05)

    raw_geojson = data[0]['geojson']
    gtype = raw_geojson['type']
    print(f"  Geometría de contorno original: {gtype}")

    if gtype == 'Polygon':
        raw_ring = raw_geojson['coordinates'][0] # lista de [lon, lat]
        latlon_ring = [(p[1], p[0]) for p in raw_ring]
        simplified_latlon = rdp_simplify(latlon_ring, epsilon=0.005)
        simplified_ring = [[round(p[1], 5), round(p[0], 5)] for p in simplified_latlon]
        contorno_geojson = {
            "type": "Polygon",
            "coordinates": [simplified_ring]
        }
        point_count = len(simplified_ring)
    elif gtype == 'MultiPolygon':
        simplified_coords = []
        point_count = 0
        for poly in raw_geojson['coordinates']:
            raw_ring = poly[0]
            latlon_ring = [(p[1], p[0]) for p in raw_ring]
            simplified_latlon = rdp_simplify(latlon_ring, epsilon=0.005)
            simplified_ring = [[round(p[1], 5), round(p[0], 5)] for p in simplified_latlon]
            simplified_coords.append([simplified_ring])
            point_count += len(simplified_ring)
        contorno_geojson = {
            "type": "MultiPolygon",
            "coordinates": simplified_coords
        }
    else:
        raise ValueError(f"Tipo GeoJSON no soportado para contorno: {gtype}")

    print(f"  Contorno simplificado: {point_count} puntos (requisito <= 400 puntos)")
    with open(OUTPUT_CONTORNO, 'w', encoding='utf-8') as f:
        json.dump(contorno_geojson, f, ensure_ascii=False, indent=2)
    print(f"  Guardado contorno en: {OUTPUT_CONTORNO}")
    return point_count

# ─────────────────── Construcción Principal ───────────────────

def build():
    print("=" * 65)
    print("Iniciando construcción reproducible del dataset de Guatemala (22 Deptos)")
    print("=" * 65)

    # 1. Cargar coordenadas de los 22 departamentos
    nodes = []
    nodes_dict = {}
    dept_codes = [m[0] for m in DEPARTAMENTOS]
    print("\n--- 1. Coordenadas de las 22 cabeceras departamentales ---")
    for m_id, label, cabecera, query, _ in DEPARTAMENTOS:
        node = get_node_coords(m_id, label, cabecera, query)
        nodes.append(node)
        nodes_dict[m_id] = node

    # 2. Auditar contra Wikipedia
    audit_coordinates(nodes)

    # 3. Aplicar correcciones si existen en docs/datos/coordenadas_corregidas_guatemala.csv
    if os.path.exists(INPUT_COORDENADAS_CORREGIDAS):
        print(f"\n--- 2. Aplicando correcciones desde {INPUT_COORDENADAS_CORREGIDAS} ---")
        with open(INPUT_COORDENADAS_CORREGIDAS, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                cid = row['id'].strip()
                if cid in nodes_dict:
                    lat_c = float(row['lat'].strip())
                    lon_c = float(row['lon'].strip())
                    fuente_c = row['fuente'].strip()
                    nodes_dict[cid]['lat'] = lat_c
                    nodes_dict[cid]['lon'] = lon_c
                    nodes_dict[cid]['fuente'] = fuente_c
                    print(f"  [CORRECCION] [{cid}] {nodes_dict[cid]['cabecera']}: {lat_c:.5f}, {lon_c:.5f} | fuente: {fuente_c}")

    if len(nodes) != 22:
        raise ValueError(f"Se esperaban 22 nodos departamentales, se obtuvieron {len(nodes)}")

    # 4. Cargar polígonos departamentales y calcular matriz de vecindad
    print("\n--- 3. Polígonos Departamentales y Matriz de Vecindad ---")
    geoms = {}
    for m_id, label, _, _, _ in DEPARTAMENTOS:
        geoms[m_id] = get_department_polygon(m_id, label)
    adjacency = build_vecindad_matrix(dept_codes, geoms)

    # 5. Evaluar los 231 pares candidatos con el nuevo triple criterio
    all_pairs = []
    n = len(dept_codes)
    for i in range(n):
        for j in range(i + 1, n):
            u = dept_codes[i]
            v = dept_codes[j]
            src = min(u, v)
            tgt = max(u, v)
            all_pairs.append((src, tgt))

    print(f"\n--- 4. Evaluando los {len(all_pairs)} pares candidatos (Criterio Definitivo: Vecindad + Proximidad >= 2.0 km) ---")

    accepted_edges = []
    discarded_pairs = []

    for src, tgt in all_pairs:
        pair_tuple = (src, tgt)
        is_vecino = adjacency.get(pair_tuple, False)

        # Cargar ruta OSRM
        route = get_osrm_route(src, tgt, nodes_dict)
        raw_geom = route['geometry']
        route_points = decode_polyline(raw_geom)
        distance_km = round(route['distance'] / 1000.0, 1)

        # Condición 1: Departamentos vecinos (frontera compartida)
        if not is_vecino:
            discarded_pairs.append({
                'origen': src,
                'destino': tgt,
                'condicion_fallida': 'Condicion 1 (Vecindad)',
                'motivo': 'Los departamentos no comparten frontera geográfica',
                'distancia_minima_km': '',
                'cabecera_intermedia': ''
            })
            continue

        # Condición 2: No pasar a menos de 2.0 km de otra cabecera departamental
        min_dist_to_other = float('inf')
        closest_intermediate = None

        for c_id, c_node in nodes_dict.items():
            if c_id == src or c_id == tgt:
                continue

            c_lat, c_lon = c_node['lat'], c_node['lon']
            d = min_distance_point_to_route(c_lat, c_lon, route_points)
            if d < min_dist_to_other:
                min_dist_to_other = d
                closest_intermediate = c_id

        if min_dist_to_other < DIRECT_EDGE_THRESHOLD_KM:
            cabecera_inter = nodes_dict[closest_intermediate]['cabecera']
            motivo = f"Pasa a {min_dist_to_other:.3f} km de la cabecera de {closest_intermediate} ({cabecera_inter})"
            discarded_pairs.append({
                'origen': src,
                'destino': tgt,
                'condicion_fallida': 'Condicion 2 (Proximidad a otra cabecera)',
                'motivo': motivo,
                'distancia_minima_km': round(min_dist_to_other, 3),
                'cabecera_intermedia': closest_intermediate
            })
            continue

        # Aceptada como arista directa
        carretera = derive_carretera_from_steps(route)
        simplified_points = rdp_simplify(route_points, epsilon=0.0001)
        simplified_geom = encode_polyline(simplified_points)

        edge_id = f"{src}-{tgt}"
        accepted_edges.append({
            'id': edge_id,
            'source': src,
            'target': tgt,
            'km': distance_km,
            'carretera': carretera,
            'fuente': 'OSRM (router.project-osrm.org) sobre OpenStreetMap',
            'verificado_google': False,
            'km_google': None,
            'nota': '',
            'geometry': simplified_geom
        })
        print(f"  [ACEPTADA] {edge_id:<10} | {distance_km:>6.1f} km | {carretera:<25}")

    print(f"\n--- 5. Resumen de filtrado de aristas ---")
    print(f"  Total pares consultados   : {len(all_pairs)}")
    print(f"  Aristas directas aceptadas: {len(accepted_edges)}")
    print(f"  Pares descartados         : {len(discarded_pairs)}")

    # Guardar descartadas
    with open(OUTPUT_DISCARDED, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'origen', 'destino', 'condicion_fallida', 'motivo', 'distancia_minima_km', 'cabecera_intermedia'
        ])
        writer.writeheader()
        writer.writerows(discarded_pairs)
    print(f"  Guardado reporte de descartes: {OUTPUT_DISCARDED}")

    # 6. Verificación de conexidad topológica
    G = nx.Graph()
    G.add_nodes_from(dept_codes)
    for e in accepted_edges:
        G.add_edge(e['source'], e['target'], weight=e['km'])

    if not nx.is_connected(G):
        comps = list(nx.connected_components(G))
        raise ValueError(f"¡El grafo NO es conexo! Componentes ({len(comps)}): {comps}")

    if not nx.has_path(G, 'PET', 'GUA'):
        raise ValueError("¡Petén (PET) no quedó conectado al grafo nacional!")

    pet_neighbors = list(G.neighbors('PET'))
    print(f"  [OK] Grafo 100 % CONEXO con los 22 departamentos.")
    print(f"  [OK] Petén (PET) conectado directamente con: {', '.join(pet_neighbors)}")

    # 7. Construir contorno simplificado de Guatemala
    print("\n--- 6. Construcción de contorno simplificado de Guatemala ---")
    build_guatemala_contorno()

    # 8. Guardar dataset JSON
    dataset = {
        'meta': {
            'nombre': 'Red Vial Nacional de la República de Guatemala (Transporte Express)',
            'unidad': 'km',
            'fuentes': [
                'Instituto Nacional de Estadística de Guatemala (INE)',
                'OpenStreetMap / Nominatim (coordenadas oficiales de las 22 cabeceras departamentales y límites territoriales)',
                'OSRM (router.project-osrm.org) sobre OpenStreetMap (rutas, distancias y steps)'
            ],
            'fecha': '2026-10-25'
        },
        'nodes': nodes,
        'edges': accepted_edges
    }

    with open(OUTPUT_DATASET, 'w', encoding='utf-8', newline='') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"\n  [EXITO] Dataset JSON generado en: {OUTPUT_DATASET}")
    return dataset

if __name__ == '__main__':
    build()
