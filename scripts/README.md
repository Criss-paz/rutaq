# Scripts de Construcción y Verificación de Datos (Gemini)

Este directorio contiene el entorno y las herramientas automatizadas para la extracción, procesamiento y validación del dataset de la red vial de Quetzaltenango (`src/data/quetzaltenango.json`) y el ejemplo didáctico de 6 nodos (`src/data/ejemplo6.json`).

---

## 1. Estructura

- `requirements.txt`: Dependencias de Python (`requests`, `networkx`, `polyline`).
- `build_dataset.py`: Script maestro que regenera y valida `src/data/quetzaltenango.json` desde las fuentes oficiales (Nominatim + OSRM), aplicando el criterio de aristas directas (< 1 km) y simplificación de geometrías.
- `cache/`: Almacén local de respuestas HTTP para garantizar reproducibilidad sin repetir peticiones externas.
  - `cache/nominatim/`: Coordenadas geográficas oficiales de las 24 cabeceras municipales.
  - `cache/osrm/`: Respuestas de cálculo de rutas y perfiles de conducción de OSRM.

---

## 2. Instrucciones de Uso

Para regenerar el dataset:

```bash
# 1. Crear y activar el entorno virtual (si no existe)
python -m venv .venv
.\.venv\Scripts\activate

# 2. Instalar dependencias
pip install -r scripts/requirements.txt

# 3. Ejecutar el constructor
python scripts/build_dataset.py
```

El script efectúa verificaciones automáticas de:

- Exactitud de 24 nodos únicos.
- Formato de identificadores `ORIGEN-DESTINO` en orden lexicográfico.
- Distancias $km > 0$.
- Conectividad integral del grafo (conexo en una única componente).
- Geometrías codificadas y simplificadas.
