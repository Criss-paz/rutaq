#!/usr/bin/env python3
"""
auditar_coordenadas.py — Auditoría de coordenadas de las 24 cabeceras municipales de Quetzaltenango.
Compara las coordenadas de Nominatim con las oficiales de Wikipedia en español (prop=coordinates),
almacena en caché en scripts/cache/wikipedia/ y genera docs/datos/auditoria_coordenadas.csv.
"""

import os
import sys
import json
import time
import math
import csv
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_NOMINATIM = os.path.join(BASE_DIR, 'scripts', 'cache', 'nominatim')
CACHE_WIKIPEDIA = os.path.join(BASE_DIR, 'scripts', 'cache', 'wikipedia')
OUTPUT_AUDITORIA = os.path.join(BASE_DIR, 'docs', 'datos', 'auditoria_coordenadas.csv')

os.makedirs(CACHE_WIKIPEDIA, exist_ok=True)

USER_AGENT = 'RutaQ-proyecto-academico/1.0 (https://github.com/Criss-paz/rutaq; estudiante@miumg.edu.gt)'
EARTH_RADIUS_KM = 6371.0088

# Mapeo oficial de los 24 municipios a sus artículos en es.wikipedia
WIKIPEDIA_TITLES = {
    'QTZ': 'Quetzaltenango',
    'SAL': 'Salcajá',
    'OLI': 'Olintepeque',
    'SIJ': 'San Carlos Sija',
    'SIB': 'Sibilia (Quetzaltenango)',
    'CAB': 'Cabricán',
    'CAJ': 'Cajolá',
    'SIG': 'San Miguel Sigüilá',
    'OST': 'San Juan Ostuncalco',
    'MAT': 'San Mateo (Quetzaltenango)',
    'CCH': 'Concepción Chiquirichapa',
    'SMA': 'San Martín Sacatepéquez',
    'ALM': 'Almolonga (Guatemala)',
    'CAN': 'Cantel',
    'HUI': 'Huitán',
    'ZUN': 'Zunil',
    'COL': 'Colomba Costa Cuca',
    'FLU': 'San Francisco La Unión',
    'PAL': 'El Palmar (Quetzaltenango)',
    'COA': 'Coatepeque (Quetzaltenango)',
    'GEN': 'Génova (Quetzaltenango)',
    'FCC': 'Flores Costa Cuca',
    'ESP': 'La Esperanza (Quetzaltenango)',
    'PLA': 'Palestina de Los Altos'
}

MUNICIPIOS_ORDEN = [
    'QTZ', 'SAL', 'OLI', 'SIJ', 'SIB', 'CAB', 'CAJ', 'SIG',
    'OST', 'MAT', 'CCH', 'SMA', 'ALM', 'CAN', 'HUI', 'ZUN',
    'COL', 'FLU', 'PAL', 'COA', 'GEN', 'FCC', 'ESP', 'PLA'
]

def haversine_km(lat1, lon1, lat2, lon2):
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return 2.0 * EARTH_RADIUS_KM * math.asin(math.sqrt(min(1.0, a)))

def get_nominatim_coords(m_id):
    path = os.path.join(CACHE_NOMINATIM, f"{m_id}.json")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
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
    return lat, lon

def get_wikipedia_coords(m_id, title):
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
        time.sleep(1.1)

    pages = data['query']['pages']
    page = list(pages.values())[0]
    coords = page.get('coordinates')
    if not coords:
        raise ValueError(f"Wikipedia no devolvió coordenadas para {m_id} ({title})")
    
    lat = float(coords[0]['lat'])
    lon = float(coords[0]['lon'])
    return lat, lon

def main():
    print("Iniciando auditoría de coordenadas (Nominatim vs Wikipedia)...")
    rows = []
    for m_id in MUNICIPIOS_ORDEN:
        title = WIKIPEDIA_TITLES[m_id]
        nom_lat, nom_lon = get_nominatim_coords(m_id)
        wiki_lat, wiki_lon = get_wikipedia_coords(m_id, title)
        dif_km = round(haversine_km(nom_lat, nom_lon, wiki_lat, wiki_lon), 3)
        rows.append({
            'id': m_id,
            'nominatim_lat': nom_lat,
            'nominatim_lon': nom_lon,
            'wikipedia_lat': round(wiki_lat, 5),
            'wikipedia_lon': round(wiki_lon, 5),
            'diferencia_km': dif_km
        })
        print(f"  {m_id:<4} Nom: ({nom_lat:8.5f}, {nom_lon:9.5f}) | Wiki: ({wiki_lat:8.5f}, {wiki_lon:9.5f}) | Dif: {dif_km:6.3f} km")

    with open(OUTPUT_AUDITORIA, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'id', 'nominatim_lat', 'nominatim_lon', 'wikipedia_lat', 'wikipedia_lon', 'diferencia_km'
        ])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nAuditoría guardada exitosamente en {OUTPUT_AUDITORIA}")

if __name__ == '__main__':
    main()
