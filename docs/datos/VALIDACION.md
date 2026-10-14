# Plan y Registro de Validación con Google Maps — Red Vial de Quetzaltenango

Este documento establece el protocolo, la tabla comparativa y la lista de aristas prioritarias para la validación externa de distancias por carretera mediante Google Maps, la cual será ejecutada por **Antigravity** (con navegador automatizado) en la siguiente etapa.

---

## 1. Criterios de Validación

- **Tolerancia:** $\pm 10\,\%$ de discrepancia relativa entre la distancia de OSRM ($km_{\text{OSRM}}$) y la calculada por Google Maps ($km_{\text{Google}}$).
  $$\text{Diferencia \%} = \frac{|km_{\text{OSRM}} - km_{\text{Google}}|}{km_{\text{OSRM}}} \times 100$$
- **Criterio de Aceptación:**
  - Si la diferencia es $\le 10\,\%$, la arista se considera **válida** y se conserva la distancia OSRM.
  - Si la diferencia supera el $10\,\%$, se investigará el trazo en Google Maps (p. ej., desvíos por obras, vías en un solo sentido dentro del casco urbano o variantes de autopista). Se registrará el valor de Google Maps en `km_google`, se actualizará `verificado_google = true` y se documentará la causa en la columna de notas.
- **Cobertura obligatoria:** Mínimo 15 aristas, incluyendo obligatoriamente **las 5 aristas más largas** de toda la red.

---

## 2. Aristas Prioritarias Seleccionadas (18 Aristas)

Se han seleccionado 18 aristas estratégicas que cubren las 5 más largas, los enlaces interdepartamentales hacia la costa, las rutas troncales nacionales (RN-01, RN-10, CA-01, CA-02) y los caminos intermunicipales del altiplano:

|   Prioridad   | ID Arista | Origen – Destino                             | km OSRM | km Google Maps | Diferencia % | Carretera                |            Estado            |
| :-----------: | :-------: | :------------------------------------------- | :-----: | :------------: | :----------: | :----------------------- | :--------------------------: |
| **1 (Top 1)** | `COL-PAL` | Colomba Costa Cuca – El Palmar               |  60.5   |  _Pendiente_   |      —       | Cito-180 / CA-02 / RN-13 | ⏳ Por validar (Antigravity) |
| **2 (Top 2)** | `PAL-ZUN` | El Palmar – Zunil                            |  57.2   |  _Pendiente_   |      —       | Cito-180                 | ⏳ Por validar (Antigravity) |
| **3 (Top 3)** | `SAL-SIJ` | Salcajá – San Carlos Sija                    |  24.7   |  _Pendiente_   |      —       | CA-01 Occidente          | ⏳ Por validar (Antigravity) |
| **4 (Top 4)** | `COL-SMA` | Colomba Costa Cuca – San Martín Sacatepéquez |  23.7   |  _Pendiente_   |      —       | RN-01                    | ⏳ Por validar (Antigravity) |
| **5 (Top 5)** | `CAN-SAL` | Cantel – Salcajá                             |  18.6   |  _Pendiente_   |      —       | RD-QUE-04                | ⏳ Por validar (Antigravity) |
|     **6**     | `OST-PLA` | San Juan Ostuncalco – Palestina de Los Altos |  18.0   |  _Pendiente_   |      —       | RN-01                    | ⏳ Por validar (Antigravity) |
|     **7**     | `COA-COL` | Coatepeque – Colomba Costa Cuca              |  16.7   |  _Pendiente_   |      —       | RN-13                    | ⏳ Por validar (Antigravity) |
|     **8**     | `COL-FCC` | Colomba Costa Cuca – Flores Costa Cuca       |  16.2   |  _Pendiente_   |      —       | RD-QUE-15                | ⏳ Por validar (Antigravity) |
|     **9**     | `HUI-SIJ` | Huitán – San Carlos Sija                     |  15.2   |  _Pendiente_   |      —       | RD-QUE-12                | ⏳ Por validar (Antigravity) |
|    **10**     | `PLA-SIB` | Palestina de Los Altos – Sibilia             |  14.5   |  _Pendiente_   |      —       | RD-QUE-08                | ⏳ Por validar (Antigravity) |
|    **11**     | `COA-FCC` | Coatepeque – Flores Costa Cuca               |  14.1   |  _Pendiente_   |      —       | CA-02 Occidente          | ⏳ Por validar (Antigravity) |
|    **12**     | `QTZ-SAL` | Quetzaltenango – Salcajá                     |  14.0   |  _Pendiente_   |      —       | CA-01 Occidente / RN-01  | ⏳ Por validar (Antigravity) |
|    **13**     | `CAN-QTZ` | Cantel – Quetzaltenango                      |  13.1   |  _Pendiente_   |      —       | RN-01 / Periférico Sur   | ⏳ Por validar (Antigravity) |
|    **14**     | `CAJ-PLA` | Cajolá – Palestina de Los Altos              |  12.7   |  _Pendiente_   |      —       | RD-QUE-09                | ⏳ Por validar (Antigravity) |
|    **15**     | `CAJ-SIB` | Cajolá – Sibilia                             |  11.8   |  _Pendiente_   |      —       | RD-QUE-08                | ⏳ Por validar (Antigravity) |
|    **16**     | `OLI-SAL` | Olintepeque – Salcajá                        |  10.5   |  _Pendiente_   |      —       | RD-QUE-03                | ⏳ Por validar (Antigravity) |
|    **17**     | `FLU-SIJ` | San Francisco La Unión – San Carlos Sija     |  10.4   |  _Pendiente_   |      —       | RD-QUE-02                | ⏳ Por validar (Antigravity) |
|    **18**     | `ESP-OLI` | La Esperanza – Olintepeque                   |  10.1   |  _Pendiente_   |      —       | RD-QUE-05                | ⏳ Por validar (Antigravity) |

---

## 3. Inventario Completo de la Red Vial (36 Aristas)

Todas las aristas generadas en `src/data/quetzaltenango.json` cuentan con `verificado_google: false` y `km_google: null`, preparadas para la fase de validación con navegador:

| ID Arista | Origen – Destino                                   | km OSRM | km Google Maps | Dif. % | Carretera                | Fuente Principal |
| :-------- | :------------------------------------------------- | :-----: | :------------: | :----: | :----------------------- | :--------------- |
| `ALM-QTZ` | Almolonga – Quetzaltenango                         |   6.8   |     _null_     |   —    | RN-10                    | OSRM Driving     |
| `ALM-ZUN` | Almolonga – Zunil                                  |   4.8   |     _null_     |   —    | RN-10                    | OSRM Driving     |
| `CAB-HUI` | Cabricán – Huitán                                  |   4.5   |     _null_     |   —    | RD-QUE-11                | OSRM Driving     |
| `CAJ-FLU` | Cajolá – San Francisco La Unión                    |   9.5   |     _null_     |   —    | RD-QUE-06                | OSRM Driving     |
| `CAJ-PLA` | Cajolá – Palestina de Los Altos                    |  12.7   |     _null_     |   —    | RD-QUE-09                | OSRM Driving     |
| `CAJ-SIB` | Cajolá – Sibilia                                   |  11.8   |     _null_     |   —    | RD-QUE-08                | OSRM Driving     |
| `CAJ-SIG` | Cajolá – San Miguel Sigüilá                        |   3.9   |     _null_     |   —    | RD-QUE-07                | OSRM Driving     |
| `CAN-QTZ` | Cantel – Quetzaltenango                            |  13.1   |     _null_     |   —    | RN-01 / Periférico Sur   | OSRM Driving     |
| `CAN-SAL` | Cantel – Salcajá                                   |  18.6   |     _null_     |   —    | RD-QUE-04                | OSRM Driving     |
| `CAN-ZUN` | Cantel – Zunil                                     |   8.9   |     _null_     |   —    | Cito-180 / RN-10         | OSRM Driving     |
| `CCH-OST` | Concepción Chiquirichapa – San Juan Ostuncalco     |   1.7   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `CCH-SMA` | Concepción Chiquirichapa – San Martín Sacatepéquez |   5.4   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `COA-COL` | Coatepeque – Colomba Costa Cuca                    |  16.7   |     _null_     |   —    | RN-13                    | OSRM Driving     |
| `COA-FCC` | Coatepeque – Flores Costa Cuca                     |  14.1   |     _null_     |   —    | CA-02 Occidente          | OSRM Driving     |
| `COL-FCC` | Colomba Costa Cuca – Flores Costa Cuca             |  16.2   |     _null_     |   —    | RD-QUE-15                | OSRM Driving     |
| `COL-PAL` | Colomba Costa Cuca – El Palmar                     |  60.5   |     _null_     |   —    | Cito-180 / CA-02 / RN-13 | OSRM Driving     |
| `COL-SMA` | Colomba Costa Cuca – San Martín Sacatepéquez       |  23.7   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `ESP-MAT` | La Esperanza – San Mateo                           |   2.8   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `ESP-OLI` | La Esperanza – Olintepeque                         |  10.1   |     _null_     |   —    | RD-QUE-05                | OSRM Driving     |
| `ESP-QTZ` | La Esperanza – Quetzaltenango                      |   7.5   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `ESP-SIG` | La Esperanza – San Miguel Sigüilá                  |   5.7   |     _null_     |   —    | RD-QUE-07                | OSRM Driving     |
| `FCC-GEN` | Flores Costa Cuca – Génova                         |   5.1   |     _null_     |   —    | RD-QUE-16                | OSRM Driving     |
| `FLU-OLI` | San Francisco La Unión – Olintepeque               |  10.1   |     _null_     |   —    | RD-QUE-02                | OSRM Driving     |
| `FLU-SIJ` | San Francisco La Unión – San Carlos Sija           |  10.4   |     _null_     |   —    | RD-QUE-02                | OSRM Driving     |
| `HUI-SIB` | Huitán – Sibilia                                   |   8.6   |     _null_     |   —    | RD-QUE-11                | OSRM Driving     |
| `HUI-SIJ` | Huitán – San Carlos Sija                           |  15.2   |     _null_     |   —    | RD-QUE-12                | OSRM Driving     |
| `MAT-OST` | San Mateo – San Juan Ostuncalco                    |   4.3   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `OLI-QTZ` | Olintepeque – Quetzaltenango                       |   6.2   |     _null_     |   —    | RD-QUE-02                | OSRM Driving     |
| `OLI-SAL` | Olintepeque – Salcajá                              |  10.5   |     _null_     |   —    | RD-QUE-03                | OSRM Driving     |
| `OST-PLA` | San Juan Ostuncalco – Palestina de Los Altos       |  18.0   |     _null_     |   —    | RN-01                    | OSRM Driving     |
| `OST-SIG` | San Juan Ostuncalco – San Miguel Sigüilá           |   4.6   |     _null_     |   —    | RD-QUE-07                | OSRM Driving     |
| `PAL-ZUN` | El Palmar – Zunil                                  |  57.2   |     _null_     |   —    | Cito-180                 | OSRM Driving     |
| `PLA-SIB` | Palestina de Los Altos – Sibilia                   |  14.5   |     _null_     |   —    | RD-QUE-08                | OSRM Driving     |
| `QTZ-SAL` | Quetzaltenango – Salcajá                           |  14.0   |     _null_     |   —    | CA-01 Occidente / RN-01  | OSRM Driving     |
| `SAL-SIJ` | Salcajá – San Carlos Sija                          |  24.7   |     _null_     |   —    | CA-01 Occidente          | OSRM Driving     |
| `SIB-SIJ` | Sibilia – San Carlos Sija                          |   9.9   |     _null_     |   —    | RD-QUE-10                | OSRM Driving     |

---

## 4. Próximos Pasos para Antigravity

1. Abrir Google Maps mediante Playwright / sesión automatizada.
2. Ingresar las cabeceras origen y destino de cada una de las 18 aristas prioritarias.
3. Extraer la distancia recomendada en automóvil (ruta principal).
4. Completar las columnas `km Google Maps` y `Diferencia %` en esta tabla.
5. Si alguna arista difiere en más de $\pm 10\,\%$, documentar el motivo y registrar el ajuste en `src/data/quetzaltenango.json` activando `verificado_google: true` y asignando `km_google`.
