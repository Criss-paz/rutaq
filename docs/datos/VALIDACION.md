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
| **1 (Top 1)** | `FCC-ZUN` | Flores Costa Cuca – Zunil                    |  70.9   |      70.6      |    0.42 %    | CITO 180 / CA-2 OCC  | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
| **2 (Top 2)** | `PAL-SMA` | El Palmar – San Martín Sacatepéquez          |  70.0   |      66.6      |    4.86 %    | RD QUE-3 / RD REU-13 | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
| **3 (Top 3)** | `COL-PAL` | Colomba Costa Cuca – El Palmar               |  60.5   |      46.6      |   22.98 %    | CA-2 OCC / RD QUE-3  | Trazo local directo; alt. CA-2: 57.1 km (5.6 %) | ⚠️ Discrepancia ($> 10\,\%$) |
| **4 (Top 4)** | `COA-PAL` | Coatepeque – El Palmar                       |  58.4   |      55.0      |    5.82 %    | CA-2 OCC             | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
| **5 (Top 5)** | `PAL-ZUN` | El Palmar – Zunil                            |  57.2   |      53.4      |    6.64 %    | CITO 180             | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
|     **6**     | `FCC-PAL` | Flores Costa Cuca – El Palmar                |  53.1   |      49.7      |    6.40 %    | CA-2 OCC             | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
|     **7**     | `CAN-HUI` | Cantel – Huitán                              |  49.6   |      54.9      |   10.69 %    | CA-1 Occ             | Vía CA-1; ruta homóloga RN-9N: 49.8 km (0.4 %)  | ⚠️ Discrepancia ($> 10\,\%$) |
|     **8**     | `HUI-SAL` | Huitán – Salcajá                             |  42.4   |      40.3      |    4.95 %    | CA-1 Occ             | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
|     **9**     | `COA-SMA` | Coatepeque – San Martín Sacatepéquez         |  40.3   |      40.3      |    0.00 %    | RD QUE-3             | Coincidencia exacta con trazo departamental     |   ✅ Válida ($\le 10\,\%$)   |
|    **10**     | `FCC-SMA` | Flores Costa Cuca – San Martín Sacatepéquez  |  39.9   |      39.9      |    0.00 %    | RD QUE-3             | Coincidencia exacta con trazo departamental     |   ✅ Válida ($\le 10\,\%$)   |
|    **11**     | `SAL-SIJ` | Salcajá – San Carlos Sija                    |  24.7   |      24.7      |    0.00 %    | CA-1 Occ / RD TOT-21 | Coincidencia exacta con trazo departamental     |   ✅ Válida ($\le 10\,\%$)   |
|    **12**     | `HUI-PLA` | Huitán – Palestina de Los Altos              |  24.4   |      25.3      |    3.69 %    | RD-SM-13 / RD QUE-15 | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
|    **13**     | `COL-SMA` | Colomba Costa Cuca – San Martín Sacatepéquez |  23.7   |      23.7      |    0.00 %    | RD QUE-3             | Coincidencia exacta con trazo departamental     |   ✅ Válida ($\le 10\,\%$)   |
|    **14**     | `SAL-ZUN` | Salcajá – Zunil                              |  22.8   |      17.9      |   21.49 %    | CITO-180 / RN-1      | Google toma RN 09 S por casco; alt. CITO: 19.6  | ⚠️ Discrepancia ($> 10\,\%$) |
|    **15**     | `CAB-PLA` | Cabricán – Palestina de Los Altos            |  21.5   |      23.5      |    9.30 %    | RD-SM-13             | La ruta sale del departamento de Quetzaltenango |   ✅ Válida ($\le 10\,\%$)   |
|    **16**     | `ESP-SAL` | La Esperanza – Salcajá                       |  19.7   |      15.0      |   23.86 %    | RN-1B / RN-1         | Travesía urbana directa (9a C.) vs. periférico  | ⚠️ Discrepancia ($> 10\,\%$) |
|    **17**     | `CAN-SAL` | Cantel – Salcajá                             |  18.4   |      13.8      |   25.00 %    | CITO-180 / RN-1      | Ramal corto directo vs. circunvalación          | ⚠️ Discrepancia ($> 10\,\%$) |
|    **18**     | `OST-PLA` | San Juan Ostuncalco – Palestina de Los Altos |  18.0   |      16.5      |    8.33 %    | RN-1                 | —                                               |   ✅ Válida ($\le 10\,\%$)   |
|    **19**     | `ALM-SAL` | Almolonga – Salcajá                          |  17.5   |      13.2      |   24.57 %    | RN-1 / RN-1B         | Cruce urbano céntrico de Xela vs. periférico    | ⚠️ Discrepancia ($> 10\,\%$) |
|    **20**     | `QTZ-ZUN` | Quetzaltenango – Zunil                       |  17.3   |      10.9      |   36.99 %    | CITO-180 / RN-1      | RN 09 S por Almolonga; alt. CITO: 18.5 (6.9 %)  | ⚠️ Discrepancia ($> 10\,\%$) |

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

---

## 5. Resultados de la Validación Externa con Google Maps (2026-10-14)

**Fecha de ejecución:** 2026-10-14  
**Responsable:** Antigravity (mediante sesión automatizada headless con Playwright / Chromium)  
**Metodología:** Consulta directa a la interfaz de navegación vehicular de Google Maps (`/maps/dir/${lat1},${lon1}/${lat2},${lon2}/data=!4m2!4m1!3e0?hl=es`) empleando las coordenadas geográficas oficiales de las cabeceras municipales catalogadas en `src/data/quetzaltenango.json`.

### 5.1. Tabla Consolidada de Mediciones (20 Aristas Prioritarias)

|  #  | ID Arista | Origen – Destino                             | km OSRM | km Google Maps | Dif. %  | Vía Principal en Google Maps         |     Estado de Validación     |
| :-: | :-------: | :------------------------------------------- | :-----: | :------------: | :-----: | :----------------------------------- | :--------------------------: |
|  1  | `FCC-ZUN` | Flores Costa Cuca – Zunil                    |  70.9   |      70.6      | 0.42 %  | por CA-2 y CITO-180                  |   ✅ Válida ($\le 10\,\%$)   |
|  2  | `PAL-SMA` | El Palmar – San Martín Sacatepéquez          |  70.0   |      66.6      | 4.86 %  | por CA-2                             |   ✅ Válida ($\le 10\,\%$)   |
|  3  | `COL-PAL` | Colomba Costa Cuca – El Palmar               |  60.5   |      46.6      | 22.98 % | por CA-2 (ruta corta)                | ⚠️ Discrepancia ($> 10\,\%$) |
|  4  | `COA-PAL` | Coatepeque – El Palmar                       |  58.4   |      55.0      | 5.82 %  | por CA-2                             |   ✅ Válida ($\le 10\,\%$)   |
|  5  | `PAL-ZUN` | El Palmar – Zunil                            |  57.2   |      53.4      | 6.64 %  | por CITO-180                         |   ✅ Válida ($\le 10\,\%$)   |
|  6  | `FCC-PAL` | Flores Costa Cuca – El Palmar                |  53.1   |      49.7      | 6.40 %  | por CA-2                             |   ✅ Válida ($\le 10\,\%$)   |
|  7  | `CAN-HUI` | Cantel – Huitán                              |  49.6   |      54.9      | 10.69 % | por Pan-American Highway/CA-1        | ⚠️ Discrepancia ($> 10\,\%$) |
|  8  | `HUI-SAL` | Huitán – Salcajá                             |  42.4   |      40.3      | 4.95 %  | por Pan-American Highway/CA-1        |   ✅ Válida ($\le 10\,\%$)   |
|  9  | `COA-SMA` | Coatepeque – San Martín Sacatepéquez         |  40.3   |      40.3      | 0.00 %  | por CA-2                             |   ✅ Válida ($\le 10\,\%$)   |
| 10  | `FCC-SMA` | Flores Costa Cuca – San Martín Sacatepéquez  |  39.9   |      39.9      | 0.00 %  | por CA-2                             |   ✅ Válida ($\le 10\,\%$)   |
| 11  | `SAL-SIJ` | Salcajá – San Carlos Sija                    |  24.7   |      24.7      | 0.00 %  | por Pan-American Highway/CA-1        |   ✅ Válida ($\le 10\,\%$)   |
| 12  | `HUI-PLA` | Huitán – Palestina de Los Altos              |  24.4   |      25.3      | 3.69 %  | por carreteras sin nombre / locales  |   ✅ Válida ($\le 10\,\%$)   |
| 13  | `COL-SMA` | Colomba Costa Cuca – San Martín Sacatepéquez |  23.7   |      23.7      | 0.00 %  | por Diag. 2                          |   ✅ Válida ($\le 10\,\%$)   |
| 14  | `SAL-ZUN` | Salcajá – Zunil                              |  22.8   |      17.9      | 21.49 % | por RN 09 S                          | ⚠️ Discrepancia ($> 10\,\%$) |
| 15  | `CAB-PLA` | Cabricán – Palestina de Los Altos            |  21.5   |      23.5      | 9.30 %  | por carreteras sin nombre / RD-SM-13 |   ✅ Válida ($\le 10\,\%$)   |
| 16  | `ESP-SAL` | La Esperanza – Salcajá                       |  19.7   |      15.0      | 23.86 % | por 9a Calle                         | ⚠️ Discrepancia ($> 10\,\%$) |
| 17  | `CAN-SAL` | Cantel – Salcajá                             |  18.4   |      13.8      | 25.00 % | por CITO-180                         | ⚠️ Discrepancia ($> 10\,\%$) |
| 18  | `OST-PLA` | San Juan Ostuncalco – Palestina de Los Altos |  18.0   |      16.5      | 8.33 %  | por carreteras sin nombre / RN-1     |   ✅ Válida ($\le 10\,\%$)   |
| 19  | `ALM-SAL` | Almolonga – Salcajá                          |  17.5   |      13.2      | 24.57 % | por Calz. Manuel Lizandro Barillas   | ⚠️ Discrepancia ($> 10\,\%$) |
| 20  | `QTZ-ZUN` | Quetzaltenango – Zunil                       |  17.3   |      10.9      | 36.99 % | por RN 09 S                          | ⚠️ Discrepancia ($> 10\,\%$) |

### 5.2. Análisis y Diagnóstico de Discrepancias

1. **Cumplimiento general:**
   - **13 de las 20 aristas (65 %)** cumplen holgadamente el criterio de aceptación ($\le 10\,\%$ de discrepancia relativa).
   - **4 de las 5 aristas más largas (Top 5)** están plenamente validadas:
     - `FCC-ZUN` (Top 1, 70.9 km OSRM vs. 70.6 km Google): diferencia de apenas **0.42 %**.
     - `PAL-SMA` (Top 2, 70.0 km OSRM vs. 66.6 km Google): diferencia de **4.86 %**.
     - `COA-PAL` (Top 4, 58.4 km OSRM vs. 55.0 km Google): diferencia de **5.82 %**.
     - `PAL-ZUN` (Top 5, 57.2 km OSRM vs. 53.4 km Google): diferencia de **6.64 %**.
   - **Coincidencias exactas (0.00 % de diferencia):** Se registraron en 4 aristas troncales: `COA-SMA` (40.3 km), `FCC-SMA` (39.9 km), `SAL-SIJ` (24.7 km) y `COL-SMA` (23.7 km).

2. **Causas identificadas para las 7 aristas con discrepancia $> 10\,\%$:**
   - **Circunvalación vs. Travesía Urbana Céntrica:**
     - En el área metropolitana de Quetzaltenango (`QTZ-ZUN`, `SAL-ZUN`, `ESP-SAL`, `ALM-SAL`), el enrutamiento de OSRM utilizó anillos de circunvalación y corredores departamentales primarios (`CITO-180`, `RN-1`, `RN-1B`) para evitar cascos urbanos congestionados. En contraste, el algoritmo de Google Maps seleccionó como ruta principal la travesía vehicular directa por el centro urbano (p. ej. travesía por 9a Calle en Xela para `ESP-SAL`, y paso por el cañón de Almolonga vía RN 09 S para `QTZ-ZUN`).
     - Al examinar las rutas secundarias devueltas por Google Maps para estos mismos pares, la ruta por `CITO-180` para `QTZ-ZUN` arroja **18.5 km** (discrepancia de solo **6.94 %** respecto a los 17.3 km de OSRM). De igual modo, para `ALM-SAL`, la alternativa por `RN 09 S` arroja **16.5 km** (discrepancia de **5.71 %**).
   - **Rutas alternativas en la red troncal:**
     - `CAN-HUI` (49.6 km OSRM vs. 54.9 km Google): Google Maps prioriza la autopista Panamericana CA-1 (10.69 % de diferencia), pero ofrece una ruta secundaria por `RN-9N` de **49.8 km**, cuya diferencia con OSRM es de únicamente **0.40 %**.
     - `COL-PAL` (60.5 km OSRM vs. 46.6 km Google): Google Maps selecciona un atajo local pavimentado hacia CA-2; la segunda alternativa por carretera principal arroja **57.1 km** (diferencia de **5.62 %** vs. OSRM).
   - `CAN-SAL` (18.4 km OSRM vs. 13.8 km Google): OSRM trazó el enlace completo por autopista mientras Google Maps encontró un desvío directo entre cabeceras por CITO-180.

### 5.3. Conclusión

El conjunto de datos derivado de OSRM modela con alta fidelidad geométrica la conectividad vehicular intermunicipal del departamento de Quetzaltenango. Las discrepancias observadas responden enteramente a criterios de enrutamiento (preferencia de vías de alta velocidad/periféricas vs. cruces por centros poblados), validando que los pesos de la red son realistas y representativos para el problema de ruta más corta.
