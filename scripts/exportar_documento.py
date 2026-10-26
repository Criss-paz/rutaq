#!/usr/bin/env python3
"""
scripts/exportar_documento.py

Script automatizado y reproducible para compilar el documento del Proyecto II
(docs/proyecto2/DOCUMENTO.md) a formatos Microsoft Word (.docx) y PDF (.pdf)
con números de línea en el código fuente.

Requisitos en el entorno virtual (.venv):
  - pypandoc_binary (provee el binario de pandoc de forma autocontenida)
  - playwright (utiliza el Chromium provisto por Playwright)

Uso:
  python scripts/exportar_documento.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Asegurar importación de exportar_informe
sys.path.insert(0, str(Path(__file__).resolve().parent))
from exportar_informe import exportar_informe, count_pdf_pages


def main() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    input_file = root_dir / "docs" / "proyecto2" / "DOCUMENTO.md"
    output_docx = root_dir / "docs" / "proyecto2" / "DOCUMENTO.docx"
    output_pdf = root_dir / "docs" / "proyecto2" / "DOCUMENTO.pdf"
    resource_dir = root_dir / "docs" / "proyecto2"

    exportar_informe(
        input_file=input_file,
        output_docx=output_docx,
        output_pdf=output_pdf,
        resource_dir=resource_dir,
        header_title="RutaQ — Transporte Express · Red Vial Departamental y Árbol de Expansión Mínima",
    )


if __name__ == "__main__":
    main()
