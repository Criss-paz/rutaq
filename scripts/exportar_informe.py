#!/usr/bin/env python3
"""
scripts/exportar_informe.py

Script automatizado y reproducible para compilar el informe técnico-académico
(docs/informe/INFORME.md) a formatos Microsoft Word (.docx) y PDF (.pdf).

Requisitos en el entorno virtual (.venv):
  - pypandoc_binary (provee el binario de pandoc de forma autocontenida)
  - playwright (utiliza el Chromium ya provisto por Playwright)

Uso:
  python scripts/exportar_informe.py
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import tempfile
from pathlib import Path

try:
    import pypandoc
except ImportError:
    sys.exit(
        "ERROR: 'pypandoc_binary' no está instalado en el entorno virtual.\n"
        "Ejecute: pip install pypandoc_binary"
    )

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit(
        "ERROR: 'playwright' no está instalado en el entorno virtual.\n"
        "Ejecute: pip install playwright"
    )

PRINT_CSS = """
@page {
  size: letter;
  margin: 22mm 18mm 22mm 18mm;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.6;
  color: #2d3748;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  color: #1a202c;
  font-weight: 700;
  page-break-after: avoid;
  break-after: avoid;
}

h1 {
  font-size: 18pt;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  border-bottom: 2px solid #2b6cb0;
  padding-bottom: 4px;
}

h2 {
  font-size: 14pt;
  margin-top: 1.3em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 3px;
}

h3 {
  font-size: 12pt;
  margin-top: 1.1em;
  margin-bottom: 0.4em;
}

h4 {
  font-size: 10.5pt;
  margin-top: 1em;
  margin-bottom: 0.3em;
}

p {
  margin: 0.8em 0;
  text-align: justify;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.2em 0;
  font-size: 8.5pt;
  page-break-inside: avoid;
  break-inside: avoid;
}

th, td {
  border: 1px solid #cbd5e0;
  padding: 5px 7px;
  text-align: left;
}

th {
  background-color: #edf2f7;
  font-weight: 600;
  border-bottom: 2px solid #a0aec0;
}

tr:nth-child(even) td {
  background-color: #f7fafc;
}

img {
  max-width: 100%;
  max-height: 360px;
  width: auto;
  height: auto;
  display: block;
  margin: 0.8em auto;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  object-fit: contain;
}

figure {
  margin: 1.4em 0;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
}

figcaption {
  font-size: 8.5pt;
  color: #4a5568;
  margin-top: 6px;
  font-style: italic;
  font-weight: 500;
  page-break-after: avoid;
  break-after: avoid;
}

pre, code {
  font-family: Consolas, Menlo, Monaco, "Courier New", monospace;
}

pre {
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 8pt;
  line-height: 1.4;
  overflow-x: auto;
  page-break-inside: avoid;
  break-inside: avoid;
}

code {
  font-size: 8.5pt;
  background-color: #edf2f7;
  padding: 2px 4px;
  border-radius: 3px;
}

pre code {
  background-color: transparent;
  padding: 0;
}

blockquote {
  border-left: 3px solid #3182ce;
  padding-left: 12px;
  margin: 1em 0;
  color: #4a5568;
  font-style: italic;
}

hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.5em 0;
}

.page-break {
  page-break-after: always;
  break-after: page;
}

math {
  font-size: 1.05em;
}
"""


def count_pdf_pages(pdf_path: Path) -> int:
    """Cuenta el número de páginas de un archivo PDF inspeccionando sus objetos /Type /Page."""
    content = pdf_path.read_bytes()
    matches = re.findall(rb"/Type\s*/Page(?=[^s]|$)", content)
    return len(matches)


def exportar_informe(
    input_file: Path,
    output_docx: Path,
    output_pdf: Path,
    resource_dir: Path,
) -> None:
    print(f"=== Exportación de Informe Técnico ===")
    print(f"Origen: {input_file}")
    print(f"Directorio de recursos: {resource_dir}")

    if not input_file.exists():
        raise FileNotFoundError(f"No existe el archivo de entrada: {input_file}")

    md_text = input_file.read_text(encoding="utf-8")

    # Asegurar que los directorios de salida existan
    output_docx.parent.mkdir(parents=True, exist_ok=True)
    output_pdf.parent.mkdir(parents=True, exist_ok=True)

    # 1. Generar Microsoft Word (.docx) con Pandoc
    print(f"\n[1/3] Generando Word (.docx)...")
    pypandoc.convert_text(
        md_text,
        "docx",
        format="markdown",
        outputfile=str(output_docx),
        extra_args=[
            f"--resource-path={resource_dir}",
            "--toc",
        ],
    )
    docx_size_kb = output_docx.stat().st_size / 1024
    print(f"  -> Creado: {output_docx} ({docx_size_kb:.1f} KB)")

    # 2. Generar HTML autónomo intermedio con MathML y CSS de impresión
    print(f"\n[2/3] Generando HTML intermedio autónomo...")
    # Reemplazar \newpage por salto de página explícito para impresión
    html_md = re.sub(
        r"\\newpage",
        r'<div class="page-break" style="page-break-after: always; break-after: page;"></div>',
        md_text,
    )

    with tempfile.NamedTemporaryFile("w", suffix=".css", delete=False, encoding="utf-8") as f_css:
        f_css.write(PRINT_CSS)
        css_tmp_path = Path(f_css.name)

    try:
        html_content = pypandoc.convert_text(
            html_md,
            "html",
            format="markdown",
            extra_args=[
                "--mathml",
                "--embed-resources",
                "--standalone",
                f"--resource-path={resource_dir}",
                f"--css={css_tmp_path.as_posix()}",
            ],
        )
    finally:
        if css_tmp_path.exists():
            css_tmp_path.unlink()

    # Guardar temporalmente el HTML para cargarlo en Chromium
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f_html:
        f_html.write(html_content)
        html_tmp_path = Path(f_html.name)

    # 3. Imprimir a PDF con Playwright / Chromium
    print(f"\n[3/3] Imprimiendo a PDF con Playwright/Chromium...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            # Cargar HTML autónomo con protocolo file://
            file_url = html_tmp_path.resolve().as_uri()
            page.goto(file_url, wait_until="networkidle")

            # Imprimir a PDF tamaño Carta con encabezado y pie de página
            page.pdf(
                path=str(output_pdf),
                format="Letter",
                display_header_footer=True,
                header_template=(
                    '<div style="font-size: 7.5pt; width: 100%; padding: 0 18mm; '
                    'display: flex; justify-content: space-between; color: #718096; '
                    'border-bottom: 1px solid #e2e8f0; margin-bottom: 4mm;">'
                    '<span>RutaQ — Sistema Integral de Optimización de Rutas Mínimas</span>'
                    '<span>Universidad Mariano Gálvez</span>'
                    '</div>'
                ),
                footer_template=(
                    '<div style="font-size: 7.5pt; width: 100%; text-align: center; '
                    'color: #718096; padding: 0 18mm;">'
                    'Página <span class="pageNumber"></span> de <span class="totalPages"></span>'
                    '</div>'
                ),
                margin={
                    "top": "22mm",
                    "bottom": "22mm",
                    "left": "18mm",
                    "right": "18mm",
                },
                print_background=True,
            )
            browser.close()
    finally:
        if html_tmp_path.exists():
            html_tmp_path.unlink()

    pdf_size_kb = output_pdf.stat().st_size / 1024
    pdf_pages = count_pdf_pages(output_pdf)
    print(f"  -> Creado: {output_pdf} ({pdf_size_kb:.1f} KB, {pdf_pages} páginas)")

    print(f"\n=== Resumen de Exportación ===")
    print(f"  - Documento Word (.docx): {output_docx.name} ({docx_size_kb:.1f} KB)")
    print(f"  - Documento PDF  (.pdf):  {output_pdf.name} ({pdf_size_kb:.1f} KB, {pdf_pages} páginas)")
    print(f"Exportación finalizada exitosamente.")


def main() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    default_input = root_dir / "docs" / "informe" / "INFORME.md"
    default_docx = root_dir / "docs" / "informe" / "INFORME.docx"
    default_pdf = root_dir / "docs" / "informe" / "INFORME.pdf"
    default_resources = root_dir / "docs" / "informe"

    parser = argparse.ArgumentParser(
        description="Exporta docs/informe/INFORME.md a Word (.docx) y PDF (.pdf) mediante Pandoc y Playwright."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=default_input,
        help="Ruta al archivo Markdown de entrada",
    )
    parser.add_argument(
        "--output-docx",
        type=Path,
        default=default_docx,
        help="Ruta al archivo .docx de salida",
    )
    parser.add_argument(
        "--output-pdf",
        type=Path,
        default=default_pdf,
        help="Ruta al archivo .pdf de salida",
    )
    parser.add_argument(
        "--resource-dir",
        type=Path,
        default=default_resources,
        help="Directorio base para resolver rutas relativas de recursos (capturas)",
    )

    args = parser.parse_args()
    exportar_informe(
        input_file=args.input,
        output_docx=args.output_docx,
        output_pdf=args.output_pdf,
        resource_dir=args.resource_dir,
    )


if __name__ == "__main__":
    main()
