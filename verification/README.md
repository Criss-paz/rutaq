# Verificación teórica (Codex)

`verify.py` resuelve con **networkx** el ejemplo de 6 nodos y la red de Quetzaltenango (todos los pares),
compara contra la salida del programa y escribe `resultados.csv` + un reporte de coincidencia (debe ser 100 %).
Termina con código ≠ 0 si hay alguna discrepancia (lo usa la CI).

```bash
pip install -r verification/requirements.txt
python verification/verify.py
```
