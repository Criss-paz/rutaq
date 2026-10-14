# Plan y Registro de Validación con Google Maps — Red Vial de Quetzaltenango

Este documento establece el protocolo, la lista de aristas prioritarias y la tabla comparativa completa para la validación externa de distancias por carretera mediante Google Maps, la cual será ejecutada por **Antigravity** (mediante navegador automatizado con Playwright) conforme al Plan Maestro.

---

## 1. Criterios de Validación

- **Tolerancia:** $\pm 10\,\%$ de discrepancia relativa entre la distancia de OSRM ($km_{\text{OSRM}}$) y la calculada por Google Maps ($km_{\text{Google}}$).
  $$\text{Diferencia \%} = \frac{|km_{\text{OSRM}} - km_{\text{Google}}|}{km_{\text{OSRM}}} \times 100$$
- **Criterio de Aceptación:**
  - Si la diferencia es $\le 10\,\%$, la arista se considera **válida** y se conserva la distancia OSRM.
  - Si la diferencia supera el $10\,\%$, se investigará el trazo en Google Maps (p. ej., desvíos por obras, vías en un solo sentido dentro del casco urbano o variantes de autopista). Se registrará el valor de Google Maps en `km_google`, se actualizará `verificado_google = true` y se documentará la causa en la columna de notas.
- **Cobertura obligatoria:** Mínimo 15 aristas, incluyendo obligatoriamente **las 5 aristas más largas** de toda la red.

---

## 2. Aristas Prioritarias Seleccionadas para Antigravity (20 Aristas)

Se han seleccionado 20 aristas estratégicas que incluyen las **5 más largas de la red vial**, los corredores de conexión interdepartamental costa-altiplano y los ejes troncales:

|   Prioridad   | ID Arista | Origen – Destino                             | km OSRM | km Google Maps | Diferencia % | Carretera            | Nota                                            |            Estado            |
| :-----------: | :-------: | :------------------------------------------- | :-----: | :------------: | :----------: | :------------------- | :---------------------------------------------- | :--------------------------: |
| **1 (Top 1)** | `FCC-ZUN` | Flores Costa Cuca – Zunil                    |  70.9   |  _Pendiente_   |      —       | CITO 180 / CA-2 OCC  | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
| **2 (Top 2)** | `PAL-SMA` | El Palmar – San Martín Sacatepéquez          |  70.0   |  _Pendiente_   |      —       | RD QUE-3 / RD REU-13 | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
| **3 (Top 3)** | `COL-PAL` | Colomba Costa Cuca – El Palmar               |  60.5   |  _Pendiente_   |      —       | CA-2 OCC / RD QUE-3  | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
| **4 (Top 4)** | `COA-PAL` | Coatepeque – El Palmar                       |  58.4   |  _Pendiente_   |      —       | CA-2 OCC             | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
| **5 (Top 5)** | `PAL-ZUN` | El Palmar – Zunil                            |  57.2   |  _Pendiente_   |      —       | CITO 180             | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|     **6**     | `FCC-PAL` | Flores Costa Cuca – El Palmar                |  53.1   |  _Pendiente_   |      —       | CA-2 OCC             | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|     **7**     | `CAN-HUI` | Cantel – Huitán                              |  49.6   |  _Pendiente_   |      —       | CA-1 Occ             | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|     **8**     | `HUI-SAL` | Huitán – Salcajá                             |  42.4   |  _Pendiente_   |      —       | CA-1 Occ             | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|     **9**     | `COA-SMA` | Coatepeque – San Martín Sacatepéquez         |  40.3   |  _Pendiente_   |      —       | RD QUE-3             | —                                               | ⏳ Por validar (Antigravity) |
|    **10**     | `FCC-SMA` | Flores Costa Cuca – San Martín Sacatepéquez  |  39.9   |  _Pendiente_   |      —       | RD QUE-3             | —                                               | ⏳ Por validar (Antigravity) |
|    **11**     | `SAL-SIJ` | Salcajá – San Carlos Sija                    |  24.7   |  _Pendiente_   |      —       | CA-1 Occ / RD TOT-21 | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|    **12**     | `HUI-PLA` | Huitán – Palestina de Los Altos              |  24.4   |  _Pendiente_   |      —       | RD-SM-13 / RD QUE-15 | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|    **13**     | `COL-SMA` | Colomba Costa Cuca – San Martín Sacatepéquez |  23.7   |  _Pendiente_   |      —       | RD QUE-3             | —                                               | ⏳ Por validar (Antigravity) |
|    **14**     | `SAL-ZUN` | Salcajá – Zunil                              |  22.8   |  _Pendiente_   |      —       | CITO-180 / RN-1      | —                                               | ⏳ Por validar (Antigravity) |
|    **15**     | `CAB-PLA` | Cabricán – Palestina de Los Altos            |  21.5   |  _Pendiente_   |      —       | RD-SM-13             | La ruta sale del departamento de Quetzaltenango | ⏳ Por validar (Antigravity) |
|    **16**     | `ESP-SAL` | La Esperanza – Salcajá                       |  19.7   |  _Pendiente_   |      —       | RN-1B / RN-1         | —                                               | ⏳ Por validar (Antigravity) |
|    **17**     | `CAN-SAL` | Cantel – Salcajá                             |  18.4   |  _Pendiente_   |      —       | CITO-180 / RN-1      | —                                               | ⏳ Por validar (Antigravity) |
|    **18**     | `OST-PLA` | San Juan Ostuncalco – Palestina de Los Altos |  18.0   |  _Pendiente_   |      —       | RN-1                 | —                                               | ⏳ Por validar (Antigravity) |
|    **19**     | `ALM-SAL` | Almolonga – Salcajá                          |  17.5   |  _Pendiente_   |      —       | RN-1 / RN-1B         | —                                               | ⏳ Por validar (Antigravity) |
|    **20**     | `QTZ-ZUN` | Quetzaltenango – Zunil                       |  17.3   |  _Pendiente_   |      —       | CITO-180 / RN-1      | —                                               | ⏳ Por validar (Antigravity) |

---

## 3. Inventario Completo de la Red Vial (55 Aristas Aceptadas)

Todas las aristas de `src/data/quetzaltenango.json` inicializadas con `verificado_google: false` y `km_google: null`:

| ID Arista | Origen – Destino                                   | km OSRM | km Google Maps | Dif. % | Carretera                           | Nota                                            |
| :-------- | :------------------------------------------------- | :-----: | :------------: | :----: | :---------------------------------- | :---------------------------------------------- |
| `ALM-CAN` | Almolonga – Cantel                                 |  16.6   |     _null_     |   —    | CITO-180 / RN-9S                    | —                                               |
| `ALM-QTZ` | Almolonga – Quetzaltenango                         |   7.0   |     _null_     |   —    | RN-9S                               | —                                               |
| `ALM-SAL` | Almolonga – Salcajá                                |  17.5   |     _null_     |   —    | RN-1 / RN-1B                        | —                                               |
| `ALM-ZUN` | Almolonga – Zunil                                  |   4.8   |     _null_     |   —    | RN-9S                               | —                                               |
| `CAB-HUI` | Cabricán – Huitán                                  |   4.5   |     _null_     |   —    | RD QUE-13                           | —                                               |
| `CAB-PLA` | Cabricán – Palestina de Los Altos                  |  21.5   |     _null_     |   —    | RD-SM-13                            | La ruta sale del departamento de Quetzaltenango |
| `CAJ-FLU` | Cajolá – San Francisco La Unión                    |   9.5   |     _null_     |   —    | Unknown                             | —                                               |
| `CAJ-OST` | Cajolá – San Juan Ostuncalco                       |   8.5   |     _null_     |   —    | RN-1                                | —                                               |
| `CAJ-PLA` | Cajolá – Palestina de Los Altos                    |  12.7   |     _null_     |   —    | RN-1                                | —                                               |
| `CAJ-SIB` | Cajolá – Sibilia                                   |  11.8   |     _null_     |   —    |                                     | —                                               |
| `CAJ-SIG` | Cajolá – San Miguel Sigüilá                        |   3.9   |     _null_     |   —    | Carretera La Esperanza - Cajolá     | —                                               |
| `CAJ-SIJ` | Cajolá – San Carlos Sija                           |  13.3   |     _null_     |   —    | Carretera Sibilia - San Carlos Sija | —                                               |
| `CAN-HUI` | Cantel – Huitán                                    |  49.6   |     _null_     |   —    | CA-1 Occ                            | La ruta sale del departamento de Quetzaltenango |
| `CAN-QTZ` | Cantel – Quetzaltenango                            |  13.2   |     _null_     |   —    | CITO-180 / RN-1                     | —                                               |
| `CAN-SAL` | Cantel – Salcajá                                   |  18.4   |     _null_     |   —    | CITO-180 / RN-1                     | —                                               |
| `CAN-ZUN` | Cantel – Zunil                                     |   8.9   |     _null_     |   —    | CITO-180                            | —                                               |
| `CCH-MAT` | Concepción Chiquirichapa – San Mateo               |   4.2   |     _null_     |   —    | RD QUE-10                           | —                                               |
| `CCH-OST` | Concepción Chiquirichapa – San Juan Ostuncalco     |   2.0   |     _null_     |   —    |                                     | —                                               |
| `CCH-SMA` | Concepción Chiquirichapa – San Martín Sacatepéquez |   5.4   |     _null_     |   —    | RD QUE-3                            | —                                               |
| `COA-COL` | Coatepeque – Colomba Costa Cuca                    |  16.7   |     _null_     |   —    | RD QUE-3 / CA-2 OCC                 | —                                               |
| `COA-FCC` | Coatepeque – Flores Costa Cuca                     |  14.2   |     _null_     |   —    | CA-2 OCC / RN 13                    | —                                               |
| `COA-PAL` | Coatepeque – El Palmar                             |  58.4   |     _null_     |   —    | CA-2 OCC                            | La ruta sale del departamento de Quetzaltenango |
| `COA-SMA` | Coatepeque – San Martín Sacatepéquez               |  40.3   |     _null_     |   —    | RD QUE-3                            | —                                               |
| `COL-FCC` | Colomba Costa Cuca – Flores Costa Cuca             |  16.3   |     _null_     |   —    | RD QUE-3 / RN 13                    | —                                               |
| `COL-PAL` | Colomba Costa Cuca – El Palmar                     |  60.5   |     _null_     |   —    | CA-2 OCC / RD QUE-3                 | La ruta sale del departamento de Quetzaltenango |
| `COL-SMA` | Colomba Costa Cuca – San Martín Sacatepéquez       |  23.7   |     _null_     |   —    | RD QUE-3                            | —                                               |
| `ESP-MAT` | La Esperanza – San Mateo                           |   2.8   |     _null_     |   —    | RN-1                                | —                                               |
| `ESP-OLI` | La Esperanza – Olintepeque                         |  11.1   |     _null_     |   —    | RN-1B / RN-9N                       | —                                               |
| `ESP-QTZ` | La Esperanza – Quetzaltenango                      |   7.2   |     _null_     |   —    | RN-1                                | —                                               |
| `ESP-SAL` | La Esperanza – Salcajá                             |  19.7   |     _null_     |   —    | RN-1B / RN-1                        | —                                               |
| `ESP-SIG` | La Esperanza – San Miguel Sigüilá                  |   5.7   |     _null_     |   —    | Carretera La Esperanza - Cajolá     | —                                               |
| `FCC-GEN` | Flores Costa Cuca – Génova                         |   5.1   |     _null_     |   —    | RN 13                               | —                                               |
| `FCC-PAL` | Flores Costa Cuca – El Palmar                      |  53.1   |     _null_     |   —    | CA-2 OCC                            | La ruta sale del departamento de Quetzaltenango |
| `FCC-SMA` | Flores Costa Cuca – San Martín Sacatepéquez        |  39.9   |     _null_     |   —    | RD QUE-3                            | —                                               |
| `FCC-ZUN` | Flores Costa Cuca – Zunil                          |  70.9   |     _null_     |   —    | CITO 180 / CA-2 OCC                 | La ruta sale del departamento de Quetzaltenango |
| `FLU-OLI` | San Francisco La Unión – Olintepeque               |  11.7   |     _null_     |   —    | RN-9N                               | —                                               |
| `FLU-SIJ` | San Francisco La Unión – San Carlos Sija           |  10.4   |     _null_     |   —    | RN-9N                               | La ruta sale del departamento de Quetzaltenango |
| `HUI-PLA` | Huitán – Palestina de Los Altos                    |  24.4   |     _null_     |   —    | RD-SM-13 / RD QUE-15                | La ruta sale del departamento de Quetzaltenango |
| `HUI-SAL` | Huitán – Salcajá                                   |  42.4   |     _null_     |   —    | CA-1 Occ                            | La ruta sale del departamento de Quetzaltenango |
| `HUI-SIB` | Huitán – Sibilia                                   |   8.6   |     _null_     |   —    | RD QUE-15                           | —                                               |
| `HUI-SIJ` | Huitán – San Carlos Sija                           |  15.2   |     _null_     |   —    | RD QUE-13                           | —                                               |
| `MAT-OST` | San Mateo – San Juan Ostuncalco                    |   4.3   |     _null_     |   —    | RN-1                                | —                                               |
| `OLI-QTZ` | Olintepeque – Quetzaltenango                       |   5.8   |     _null_     |   —    | RN-9N / RN-1B                       | —                                               |
| `OLI-SAL` | Olintepeque – Salcajá                              |  15.5   |     _null_     |   —    | RN-1B                               | —                                               |
| `OLI-SIJ` | Olintepeque – San Carlos Sija                      |  16.8   |     _null_     |   —    | RN-9N                               | La ruta sale del departamento de Quetzaltenango |
| `OST-PLA` | San Juan Ostuncalco – Palestina de Los Altos       |  18.0   |     _null_     |   —    | RN-1                                | —                                               |
| `OST-SIG` | San Juan Ostuncalco – San Miguel Sigüilá           |   4.6   |     _null_     |   —    | RN-1                                | —                                               |
| `PAL-SMA` | El Palmar – San Martín Sacatepéquez                |  70.0   |     _null_     |   —    | RD QUE-3 / RD REU-13                | La ruta sale del departamento de Quetzaltenango |
| `PAL-ZUN` | El Palmar – Zunil                                  |  57.2   |     _null_     |   —    | CITO 180                            | La ruta sale del departamento de Quetzaltenango |
| `PLA-SIB` | Palestina de Los Altos – Sibilia                   |  14.5   |     _null_     |   —    | RN-1                                | La ruta sale del departamento de Quetzaltenango |
| `QTZ-SAL` | Quetzaltenango – Salcajá                           |  14.0   |     _null_     |   —    | RN-1 / RN-1B                        | —                                               |
| `QTZ-ZUN` | Quetzaltenango – Zunil                             |  17.3   |     _null_     |   —    | CITO-180 / RN-1                     | —                                               |
| `SAL-SIJ` | Salcajá – San Carlos Sija                          |  24.7   |     _null_     |   —    | CA-1 Occ / RD TOT-21                | La ruta sale del departamento de Quetzaltenango |
| `SAL-ZUN` | Salcajá – Zunil                                    |  22.8   |     _null_     |   —    | CITO-180 / RN-1                     | —                                               |
| `SIB-SIJ` | Sibilia – San Carlos Sija                          |   9.9   |     _null_     |   —    | RD QUE-16                           | —                                               |

---

## 4. Próximos Pasos para Antigravity

1. Abrir Google Maps mediante Playwright / sesión automatizada con navegador.
2. Ingresar las cabeceras origen y destino de cada una de las 20 aristas prioritarias listadas en la sección 2.
3. Extraer la distancia recomendada en automóvil (ruta principal).
4. Completar las columnas `km Google Maps` y `Diferencia %` en esta tabla.
5. Si alguna arista difiere en más de $\pm 10\,\%$, documentar el motivo y registrar el ajuste en `src/data/quetzaltenango.json` activando `verificado_google: true` y asignando `km_google`.
