# RutaQ — Resumen de una página

**Aplicación:** https://criss-paz.github.io/rutaq/ · **Código:** https://github.com/Criss-paz/rutaq ·
**Informe:** [`docs/informe/INFORME.pdf`](informe/INFORME.pdf) y [`INFORME.docx`](informe/INFORME.docx)
Cristopher Alexis Castellanos Paz — carné 2690245972

## Qué hace cada función

| Función                       | Qué hace                                                                                                                                                                                                               | Dónde se ve                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **F1 Mapa de Quetzaltenango** | 24 cabeceras en su posición geográfica real (auditadas contra Wikipedia y Google Maps) y 50 carreteras directas con km reales (OSRM; 18 validadas en Google Maps, 5 con su valor). Rosa de los vientos y escala en km. | Modo «Quetzaltenango»            |
| **F2 Árbol de rutas**         | Desde un municipio, Dijkstra resalta el árbol de caminos más cortos hacia todos los demás y su distancia.                                                                                                              | «Árbol (F2)»                     |
| **F3 Ruta más corta**         | Entre dos municipios marca la ruta mínima y su distancia; muestra todas las rutas empatadas; avisa si no hay ruta.                                                                                                     | «Ruta (F3)»                      |
| **S1 Tabla**                  | Método tabular de Dijkstra paso a paso: matriz de adyacencia, etiquetas `distancia (predecesor)`, mínima resaltada, columna tachada, casillas actualizadas. Formato configurable.                                      | Pestaña «Tabla»                  |
| **S2 Gráfica**                | El mapa refleja el mismo paso de la tabla: nodo actual, permanentes, aristas evaluadas, árbol o ruta final.                                                                                                            | Pestaña «Gráfica» y lienzo       |
| **S3 Todas las rutas**        | Todos los caminos simples ordenados por distancia (⭐ la mínima); si son demasiados, los K más cortos con Yen. Segundo plano, cancelable, exporta CSV.                                                                 | Pestaña «Rutas»                  |
| **Floyd-Warshall**            | Matrices D⁽ᵏ⁾ para cada k con las casillas que mejoran.                                                                                                                                                                | Pestaña «Floyd»                  |
| **F4 Modo diseño**            | Crear, mover, renombrar y redimensionar nodos; conectar y editar pesos con validaciones; deshacer/rehacer; guardar/cargar JSON; PNG; autoguardado.                                                                     | Modo «Diseño»                    |
| **F5 Formas de arista**       | Recta, curva, arco, ortogonal y ortogonal redondeada; automáticas o manuales.                                                                                                                                          | Menú de cada arista              |
| **F6 Escala**                 | Detecta el rango de los pesos y sugiere una distribución proporcional (stress majorization) con su error de ajuste.                                                                                                    | «Distribuir» / pestaña «Gráfica» |
| **F7 Multiplataforma**        | Responsive (panel lateral redimensionable, minimizable y maximizable en PC; hoja inferior en celular), tema claro/oscuro, táctil.                                                                                      | Cualquier dispositivo            |

## Cómo se comprobó

- **Teoría vs programa:** la solución a mano del ejemplo de 6 nodos coincide con la tabla del programa iteración por
  iteración (prueba automática); networkx coincide en 648/648 pares (100 %), incluidos los 576 de Quetzaltenango.
- **Algoritmos:** Dijkstra = Floyd = fuerza bruta en 500 grafos aleatorios; cobertura del núcleo ≥ 90 %.
- **En producción:** 112/112 pruebas E2E en PC, iPhone 13, Pixel 7 e iPad; Lighthouse móvil 92 rendimiento,
  95 accesibilidad, 100 buenas prácticas, 100 SEO.

## Lo único que falta confirmar

El formato exacto de la tabla de tu catedrático. La tabla ya permite cambiar, sin tocar código, el formato de etiqueta
(`12 (B)`, `[12, B]`, `12/B`), el tachado (por columna o por fila), repetir permanentes y mostrar la matriz de adyacencia.
