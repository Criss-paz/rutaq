# Solución Teórica a Mano — Ejemplo Académico de 6 Nodos

Este documento contiene la resolución analítica y manual paso a paso del algoritmo de Dijkstra aplicado al grafo de prueba definido en `src/data/ejemplo6.json`. Se emplea estrictamente el **método tabular tradicional** visto en cursos universitarios de Investigación de Operaciones y Teoría de Grafos, asegurando compatibilidad iteración por iteración con la implementación del sistema RutaQ.

---

## 1. Definición del Grafo

- **Conjunto de Vértices:** $V = \{A, B, C, D, E, F\}$ ($|V| = 6$).
- **Nodo de Origen:** $A$.
- **Naturaleza de la red:** Grafo no dirigido, conexo, con pesos enteros positivos ($w(u, v) > 0$).
- **Aristas y Costos:**
  - $(A, B)$ con peso $4$
  - $(A, C)$ con peso $4$
  - $(A, D)$ con peso $10$
  - $(B, C)$ con peso $3$
  - $(B, D)$ con peso $3$
  - $(C, E)$ con peso $5$
  - $(D, E)$ con peso $2$
  - $(D, F)$ con peso $6$
  - $(E, F)$ con peso $3$

### Particularidades Didácticas del Grafo

1. **Empate en etiqueta mínima:** En la iteración 2 existe un empate entre los nodos $B$ y $C$ con distancia temporal acumulada $4$. La regla determinista de desempate selecciona el identificador alfabético menor ($B < C$).
2. **Camino indirecto ventajoso:** Aunque existe una conexión directa entre $A$ y $D$ con peso $10$, el algoritmo descubre que el camino indirecto $A \to B \to D$ tiene costo $4 + 3 = 7$, relajando y sustituyendo la etiqueta de $D$.
3. **Múltiples caminos mínimos hacia el destino:** Existen dos rutas de costo mínimo $12$ desde $A$ hacia $F$:
   - $A \to C \to E \to F$ ($4 + 5 + 3 = 12$)
   - $A \to B \to D \to E \to F$ ($4 + 3 + 2 + 3 = 12$)
     El criterio de desempate al relajar el nodo $E$ conserva como predecesor canónico a $C$ frente a $D$ ($C < D$).

---

## 2. Matriz de Adyacencia

La matriz simétrica de pesos $W$ (donde '—' denota ausencia de arista o la diagonal) se define como:

|       |  A  |  B  |  C  |  D  |  E  |  F  |
| :---: | :-: | :-: | :-: | :-: | :-: | :-: |
| **A** |  —  |  4  |  4  | 10  |  —  |  —  |
| **B** |  4  |  —  |  3  |  3  |  —  |  —  |
| **C** |  4  |  3  |  —  |  —  |  5  |  —  |
| **D** | 10  |  3  |  —  |  —  |  2  |  6  |
| **E** |  —  |  —  |  5  |  2  |  —  |  3  |
| **F** |  —  |  —  |  —  |  6  |  3  |  —  |

---

## 3. Formulación y Reglas del Método Tabular

En cada paso:

1. **Casilla de la tabla:** Se representa como `distancia (predecesor)`.
2. **Selección:** Se identifica el nodo no permanente con la menor distancia acumulada temporal. Ante distancias iguales, se desempata eligiendo el identificador menor lexicográficamente (`NodeId` menor).
3. **Fijación y Tachado:** El nodo seleccionado pasa a ser **permanente**, su distancia es óptima definitiva y su columna se tacha (se resalta entre corchetes `[...]` en la tabla).
4. **Relajación:** Para cada vecino no permanente $v$ del nodo seleccionado $u$:
   $$d(v) = \min\big(d(v),\, d(u) + w(u, v)\big)$$
   Si la distancia disminuye estrictamente, se actualiza la casilla con la nueva distancia y se anota a $u$ como nuevo predecesor: `d(v) (u)`. Si empata en distancia, se aplica la regla de predecesor menor.

---

## 4. Tabla de Iteraciones Completa

A continuación se presenta la tabla de ejecución iteración por iteración. Las casillas con asterisco `*valor*` indican el nodo permanente elegido en la fila; las casillas con signo más `+valor+` indican actualización o mejora; las casillas entre corchetes `[valor]` representan columnas tachadas en iteraciones previas:

| Iter  | Nodo Elegido |     A     |       B       |       C       |       D       |       E       |       F        | Aristas Evaluadas | Observaciones                                                              |
| :---: | :----------: | :-------: | :-----------: | :-----------: | :-----------: | :-----------: | :------------: | :---------------- | :------------------------------------------------------------------------- |
| **0** |      —       |  **+0+**  |   $\infty$    |   $\infty$    |   $\infty$    |   $\infty$    |    $\infty$    | —                 | Inicialización en el origen $A$.                                           |
| **1** |    **A**     | **\*0\*** |  **+4 (A)+**  |  **+4 (A)+**  | **+10 (A)+**  |   $\infty$    |    $\infty$    | A-B, A-C, A-D     | Se fija $A$. Se relajan sus vecinos directos $B, C, D$.                    |
| **2** |    **B**     |    [0]    | **\*4 (A)\*** |     4 (A)     |  **+7 (B)+**  |   $\infty$    |    $\infty$    | B-C, B-D          | Empate $B=4$ y $C=4$. Desempate: $B < C$. Se relaja $D$: $4+3=7 < 10$.     |
| **3** |    **C**     |    [0]    |    [4 (A)]    | **\*4 (A)\*** |     7 (B)     |  **+9 (C)+**  |    $\infty$    | C-E               | Se fija $C$. Se relaja $E$: $0 + 4 + 5 = 9$.                               |
| **4** |    **D**     |    [0]    |    [4 (A)]    |    [4 (A)]    | **\*7 (B)\*** |     9 (C)     |  **+13 (D)+**  | D-E, D-F          | Se fija $D$. Relaja $F$ ($7+6=13$). Hacia $E$: $7+2=9$, no mejora a 9 (C). |
| **5** |    **E**     |    [0]    |    [4 (A)]    |    [4 (A)]    |    [7 (B)]    | **\*9 (C)\*** |  **+12 (E)+**  | E-F               | Se fija $E$. Relaja $F$: $9+3=12 < 13$. F actualiza predecesor a $E$.      |
| **6** |    **F**     |    [0]    |    [4 (A)]    |    [4 (A)]    |    [7 (B)]    |    [9 (C)]    | **\*12 (E)\*** | —                 | Se fija $F$. Todos los nodos son permanentes. Fin.                         |

---

## 5. Justificación Detallada de Cada Iteración

### Iteración 0 (Inicialización)

- Se establece $d(A) = 0$ con predecesor nulo.
- Todos los demás nodos $v \in \{B, C, D, E, F\}$ reciben $d(v) = \infty$.
- Conjunto de permanentes: $S = \emptyset$.

### Iteración 1

- El mínimo temporal es $A$ con $d(A) = 0$.
- $S = \{A\}$. La columna de $A$ queda tachada.
- Se exploran los vecinos de $A$:
  - $B$: $d(B) = \min(\infty, 0 + 4) = 4$ con predecesor $A$.
  - $C$: $d(C) = \min(\infty, 0 + 4) = 4$ con predecesor $A$.
  - $D$: $d(D) = \min(\infty, 0 + 10) = 10$ con predecesor $A$.

### Iteración 2

- Candidatos temporales: $B: 4$, $C: 4$, $D: 10$.
- **Empate:** $d(B) = d(C) = 4$. Por criterio determinista lexicográfico, se selecciona $B$ porque $'B' < 'C'$.
- $S = \{A, B\}$. La columna de $B$ queda tachada.
- Se exploran los vecinos de $B$:
  - $C$: $d(B) + w(B, C) = 4 + 3 = 7 > 4$. Se mantiene $4 (A)$.
  - $D$: $d(B) + w(B, D) = 4 + 3 = 7 < 10$. Se actualiza $d(D) = 7$ con predecesor $B$. (¡Demostración de camino indirecto favorable!).

### Iteración 3

- Candidatos temporales: $C: 4$, $D: 7$.
- El mínimo temporal es $C$ con $d(C) = 4$.
- $S = \{A, B, C\}$. La columna de $C$ queda tachada.
- Se exploran los vecinos de $C$:
  - $E$: $d(C) + w(C, E) = 4 + 5 = 9 < \infty$. Se actualiza $d(E) = 9$ con predecesor $C$.

### Iteración 4

- Candidatos temporales: $D: 7$, $E: 9$.
- El mínimo temporal es $D$ con $d(D) = 7$.
- $S = \{A, B, C, D\}$. La columna de $D$ queda tachada.
- Se exploran los vecinos de $D$:
  - $E$: $d(D) + w(D, E) = 7 + 2 = 9$. Ya tiene etiqueta temporal $9 (C)$. Al no haber mejora estricta y ser $'C' < 'D'$, la etiqueta no cambia.
  - $F$: $d(D) + w(D, F) = 7 + 6 = 13 < \infty$. Se actualiza $d(F) = 13$ con predecesor $D$.

### Iteración 5

- Candidatos temporales: $E: 9$, $F: 13$.
- El mínimo temporal es $E$ con $d(E) = 9$.
- $S = \{A, B, C, D, E\}$. La columna de $E$ queda tachada.
- Se exploran los vecinos de $E$:
  - $F$: $d(E) + w(E, F) = 9 + 3 = 12 < 13$. Se actualiza $d(F) = 12$ con predecesor $E$.

### Iteración 6

- Único candidato temporal restante: $F$ con $d(F) = 12$.
- $S = \{A, B, C, D, E, F\}$.
- Todos los vértices han quedado fijados.

---

## 6. Tabla Resumen de Resultados Finales

Reconstruyendo los caminos hacia atrás desde los predecesores:

| Nodo  | Distancia Mínima | Ruta Más Corta        | Desglose de Tramos y Costos              |
| :---: | :--------------: | :-------------------- | :--------------------------------------- |
| **A** |      **0**       | $A$                   | Origen                                   |
| **B** |      **4**       | $A \to B$             | $(A, B): 4$                              |
| **C** |      **4**       | $A \to C$             | $(A, C): 4$                              |
| **D** |      **7**       | $A \to B \to D$       | $(A, B): 4 + (B, D): 3 = 7$              |
| **E** |      **9**       | $A \to C \to E$       | $(A, C): 4 + (C, E): 5 = 9$              |
| **F** |      **12**      | $A \to C \to E \to F$ | $(A, C): 4 + (C, E): 5 + (E, F): 3 = 12$ |

### Árbol de Caminos Mínimos (SPT)

Las aristas que conforman el árbol con raíz en $A$ son:

- $(A, B)$
- $(A, C)$
- $(B, D)$
- $(C, E)$
- $(E, F)$

Total de aristas en el árbol: $|V| - 1 = 5$ aristas. Suma de pesos del árbol: $4 + 4 + 3 + 5 + 3 = 19$.
