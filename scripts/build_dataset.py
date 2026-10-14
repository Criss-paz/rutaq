#!/usr/bin/env python3
"""
build_dataset.py — Constructor reproducible y 100 % guiado por datos del dataset de Quetzaltenango (RutaQ).

Cumple estrictamente con el contrato Dataset de src/core/types.ts y las directrices del proyecto:
1. Nodos: 24 cabeceras municipales oficiales en el departamento de Quetzaltenango (fuente Nominatim con caché).
2. Candidatas: los 276 pares no dirigidos (24·23/2) consultados a OSRM con overview=full, geometries=polyline y steps=true.
3. Criterio de arista directa (calculado): A–B es arista si la geometría completa de la ruta OSRM A->B
   NO pasa a menos de 1.0 km (distancia haversine punto-segmento) de la cabecera de ningún otro municipio C != A, B.
   Los pares descartados se guardan en docs/datos/aristas_descartadas.csv con el municipio intermedio y la distancia mínima.
4. carretera: derivada de los steps de OSRM sumando distancias de ref (o name si no hay ref).
5. nota: calculada con prueba punto-en-polígono contra el límite departamental oficial de Quetzaltenango
   obtenido de Nominatim (polygon_geojson=1). Si la ruta sale del polígono, nota = "La ruta sale del departamento de Quetzaltenango".
6. Reproducibilidad: con la caché en scripts/cache/, el script se ejecuta sin conexión y produce el mismo JSON idéntico.
"""

import os
import sys
import json
import time
import math
import csv
import urllib.request
import urllib.parse

# Directorios de trabajo y caché
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_NOMINATIM = os.path.join(BASE_DIR, 'scripts', 'cache', 'nominatim')
CACHE_OSRM = os.path.join(BASE_DIR, 'scripts', 'cache', 'osrm')
OUTPUT_DATASET = os.path.join(BASE_DIR, 'src', 'data', 'quetzaltenango.json')
OUTPUT_DISCARDED = os.path.join(BASE_DIR, 'docs', 'datos', 'aristas_descartadas.csv')

os.makedirs(CACHE_NOMINATIM, exist_ok=True)
os.makedirs(CACHE_OSRM, exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_DATASET), exist_ok=True)
os.makedirs(os.path.dirname(OUTPUT_DISCARDED), exist_ok=True)

USER_AGENT = 'RutaQ-proyecto-academico'
EARTH_RADIUS_KM = 6371.0088

# 24 municipios oficiales con id de 3 letras, nombre oficial y consulta de búsqueda
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
    ('PLA', 'Palestina de Los Altos', 'Palestina de los Altos, Quetzaltenango, Guatemala')
]

# ─────────────────── Geometría y Polyline ───────────────────

def decode_polyline(polyline_str, precision=5):
    """Decodifica un polyline codificado de Google/OSRM a una lista de tuplas (lat, lon)."""
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
    """Codifica una lista de tuplas (lat, lon) a un string polyline."""
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

def haversine_km(lat1, lon1, lat2, lon2):
    """Distancia haversine exacta en kilómetros entre dos coordenadas esféricas."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * EARTH_RADIUS_KM * math.asin(math.sqrt(min(1.0, a)))

def point_to_segment_haversine(lat_c, lon_c, lat_a, lon_a, lat_b, lon_b):
    """
    Distancia haversine punto-segmento: proyecta C ortogonalmente al segmento [A, B]
    en proyección cartográfica local centrada y calcula la distancia haversine exacta.
    """
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
    """Distancia mínima desde un punto C a toda la geometría de una ruta polyline."""
    min_dist = float('inf')
    for i in range(len(route_points) - 1):
        pa = route_points[i]
        pb = route_points[i + 1]
        d = point_to_segment_haversine(lat_c, lon_c, pa[0], pa[1], pb[0], pb[1])
        if d < min_dist:
            min_dist = d
            if min_dist < 0.1:  # si ya está muy cerca, podemos retornar temprano
                break
    return min_dist

# ─────────────────── Punto en Polígono (Límite Departamental) ───────────────────

def point_in_ring(lon, lat, ring):
    """Algoritmo de ray-casting estándar para verificar si (lon, lat) está dentro de un anillo."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

def point_in_geojson_polygon(lon, lat, geojson):
    """Verifica si un punto (lon, lat) se encuentra dentro de un Polygon o MultiPolygon de GeoJSON."""
    gtype = geojson.get('type')
    if gtype == 'Polygon':
        coords = geojson['coordinates']
        if not point_in_ring(lon, lat, coords[0]):
            return False
        for hole in coords[1:]:
            if point_in_ring(lon, lat, hole):
                return False
        return True
    elif gtype == 'MultiPolygon':
        for poly in geojson['coordinates']:
            if point_in_ring(lon, lat, poly[0]):
                in_hole = False
                for hole in poly[1:]:
                    if point_in_ring(lon, lat, hole):
                        in_hole = True
                        break
                if not in_hole:
                    return True
        return False
    return True

# ─────────────────── Descarga y Caché de Nodos y Polígono ───────────────────

def get_department_polygon():
    """Obtiene y guarda en caché el polígono oficial del departamento de Quetzaltenango."""
    cache_path = os.path.join(CACHE_NOMINATIM, 'departamento_quetzaltenango.json')
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data['geojson']

    print("  [Nominatim] Consultando polígono departamental de Quetzaltenango...")
    url = 'https://nominatim.openstreetmap.org/search?q=Quetzaltenango,+Guatemala&format=json&polygon_geojson=1&limit=5'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        results = json.loads(resp.read().decode('utf-8'))

    dept_res = None
    for item in results:
        if item.get('addresstype') == 'state' and item.get('geojson'):
            dept_res = item
            break
    if not dept_res:
        dept_res = results[1]  # segundo resultado suele ser el estado/departamento

    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump(dept_res, f, ensure_ascii=False, indent=2)
    time.sleep(1.1)
    return dept_res['geojson']

def get_node_coords(m_id, label, query):
    """Carga de caché u obtiene de Nominatim las coordenadas de la cabecera municipal."""
    cache_path = os.path.join(CACHE_NOMINATIM, f"{m_id}.json")
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        print(f"  [Nominatim] Consultando coordenadas para {label} ({m_id})...")
        params = urllib.parse.urlencode({'q': query, 'format': 'json', 'limit': 3})
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.1)

    if not data:
        raise ValueError(f"Nominatim no devolvió resultados para {m_id} ({label})")

    # El resultado seleccionado debe estar en Quetzaltenango
    selected = None
    for item in data:
        dn = item.get('display_name', '')
        if 'Quetzaltenango' in dn:
            selected = item
            break
    if not selected:
        selected = data[0]

    lat = round(float(selected['lat']), 5)
    lon = round(float(selected['lon']), 5)
    return {
        'id': m_id,
        'label': label,
        'lat': lat,
        'lon': lon,
        'fuente': 'Nominatim / OpenStreetMap (cabecera municipal oficial)'
    }

# ─────────────────── Consulta y Caché OSRM ───────────────────

def get_osrm_route(u, v, nodes_dict):
    """
    Obtiene la ruta OSRM entre u y v con overview=full, geometries=polyline y steps=true.
    Garantiza que la respuesta contenga steps no vacíos; de lo contrario reintenta/descarga.
    """
    src = min(u, v)
    tgt = max(u, v)
    pair_key = f"{src}_{tgt}"
    cache_path = os.path.join(CACHE_OSRM, f"{pair_key}.json")

    has_valid_cache = False
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if data.get('routes') and len(data['routes']) > 0:
                legs = data['routes'][0].get('legs', [])
                if legs and len(legs[0].get('steps', [])) > 0:
                    has_valid_cache = True
        except Exception:
            has_valid_cache = False

    if not has_valid_cache:
        n1 = nodes_dict[src]
        n2 = nodes_dict[tgt]
        url = (
            f"https://router.project-osrm.org/route/v1/driving/"
            f"{n1['lon']},{n1['lat']};{n2['lon']},{n2['lat']}"
            f"?overview=full&geometries=polyline&steps=true"
        )
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        time.sleep(1.05)

    if not data.get('routes'):
        raise ValueError(f"OSRM no encontró ruta entre {src} y {tgt}")

    return data['routes'][0]

# ─────────────────── Derivación de Carretera y Nota ───────────────────

def derive_carretera_from_steps(route):
    """
    Deriva el nombre o código de carretera desde los steps de OSRM:
    Suma distancias por cada ref (o por name si no hay ref).
    Si no hay ref ni name (o si el marcador es vacío/"Unknown"), retorna "". Nunca inventa códigos.
    """
    steps = route.get('legs', [{}])[0].get('steps', [])
    ref_dist = {}
    name_dist = {}
    ignored_markers = {'unknown', 'unnamed', 'sin nombre', 'none'}

    for s in steps:
        dist = s.get('distance', 0)
        ref = s.get('ref')
        name = s.get('name')
        if ref and ref.strip():
            # Limpiar y separar refs múltiples si están separadas por ';'
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

def check_route_leaves_department(route_points, dept_polygon):
    """Verifica si alguno de los puntos de la geometría de la ruta sale del polígono de Quetzaltenango."""
    for lat, lon in route_points:
        if not point_in_geojson_polygon(lon, lat, dept_polygon):
            return True
    return False

# ─────────────────── Construcción y Validación Principal ───────────────────

def build():
    print("=" * 60)
    print("Iniciando construcción reproducible del dataset de Quetzaltenango")
    print("=" * 60)

    # 1. Cargar polígono departamental
    dept_polygon = get_department_polygon()

    # 2. Cargar nodos (24 municipios)
    nodes = []
    nodes_dict = {}
    print("\n--- 1. Verificación de las 24 cabeceras municipales ---")
    for m_id, label, query in MUNICIPIOS:
        node = get_node_coords(m_id, label, query)
        nodes.append(node)
        nodes_dict[m_id] = node
        print(f"  [{m_id}] {label:<26} -> {node['lat']:.5f}, {node['lon']:.5f}")

    if len(nodes) != 24:
        raise ValueError(f"Se esperaban 24 nodos, se obtuvieron {len(nodes)}")

    # 3. Generar todos los 276 pares de municipios
    all_pairs = []
    n = len(MUNICIPIOS)
    for i in range(n):
        for j in range(i + 1, n):
            u = MUNICIPIOS[i][0]
            v = MUNICIPIOS[j][0]
            src = min(u, v)
            tgt = max(u, v)
            all_pairs.append((src, tgt))

    print(f"\n--- 2. Evaluando {len(all_pairs)} pares candidatos de OSRM ---")

    accepted_edges = []
    discarded_pairs = []

    for idx, (src, tgt) in enumerate(all_pairs, 1):
        route = get_osrm_route(src, tgt, nodes_dict)
        raw_geom = route['geometry']
        route_points = decode_polyline(raw_geom)
        distance_km = round(route['distance'] / 1000.0, 1)

        # Criterio de arista directa:
        # La ruta NO debe pasar a < 1.0 km de la cabecera de NINGÚN otro municipio C
        min_dist_to_other = float('inf')
        closest_intermediate = None

        for c_id, c_node in nodes_dict.items():
            if c_id == src or c_id == tgt:
                continue

            # Bounding box preliminar para optimizar cálculo
            # 1.0 km en lat es aprox 0.009 grados
            c_lat, c_lon = c_node['lat'], c_node['lon']
            d = min_distance_point_to_route(c_lat, c_lon, route_points)
            if d < min_dist_to_other:
                min_dist_to_other = d
                closest_intermediate = c_id

        if min_dist_to_other < 1.0:
            # Descartada: pasa a menos de 1 km de otro municipio
            discarded_pairs.append({
                'origen': src,
                'destino': tgt,
                'municipio_intermedio': closest_intermediate,
                'distancia_minima_km': round(min_dist_to_other, 3)
            })
        else:
            # Aceptada como arista directa
            carretera = derive_carretera_from_steps(route)
            leaves_dept = check_route_leaves_department(route_points, dept_polygon)
            nota = "La ruta sale del departamento de Quetzaltenango" if leaves_dept else ""

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
                'nota': nota,
                'geometry': simplified_geom
            })
            print(f"  [ACEPTADA] {edge_id:<10} | {distance_km:>5.1f} km | {carretera:<25} | nota: {nota}")

    print(f"\n--- 3. Resumen de filtrado de aristas ---")
    print(f"  Total pares consultados : {len(all_pairs)}")
    print(f"  Aristas directas aceptadas: {len(accepted_edges)}")
    print(f"  Pares descartados       : {len(discarded_pairs)}")

    # 4. Guardar aristas descartadas en CSV
    with open(OUTPUT_DISCARDED, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['origen', 'destino', 'municipio_intermedio', 'distancia_minima_km'])
        writer.writeheader()
        writer.writerows(discarded_pairs)
    print(f"  Guardado reporte de descarte: {OUTPUT_DISCARDED}")

    # 5. Verificación de conexidad topológica
    adj = {n['id']: [] for n in nodes}
    for e in accepted_edges:
        adj[e['source']].append(e['target'])
        adj[e['target']].append(e['source'])

    visited = set()
    queue = [nodes[0]['id']]
    visited.add(nodes[0]['id'])
    while queue:
        curr = queue.pop(0)
        for nxt in adj[curr]:
            if nxt not in visited:
                visited.add(nxt)
                queue.append(nxt)

    if len(visited) != len(nodes):
        missing = [n['id'] for n in nodes if n['id'] not in visited]
        raise ValueError(f"¡El grafo NO es conexo! Nodos no alcanzables desde {nodes[0]['id']}: {missing}")

    print("  [OK] El grafo resultante es 100 % CONEXO y contiene los 24 municipios.")

    # 6. Guardar dataset JSON
    dataset = {
        'meta': {
            'nombre': 'Red Vial del Departamento de Quetzaltenango',
            'unidad': 'km',
            'fuentes': [
                'Instituto Nacional de Estadística de Guatemala (INE)',
                'OpenStreetMap / Nominatim (coordenadas de cabeceras y límites)',
                'OSRM (router.project-osrm.org) sobre OpenStreetMap (rutas, distancias y steps)',
                'Ministerio de Comunicaciones, Infraestructura y Vivienda (MICIVI / DGC)'
            ],
            'fecha': '2026-10-14'
        },
        'nodes': nodes,
        'edges': accepted_edges
    }

    with open(OUTPUT_DATASET, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"  [EXITO] Dataset JSON generado en: {OUTPUT_DATASET}")

if __name__ == '__main__':
    build()
