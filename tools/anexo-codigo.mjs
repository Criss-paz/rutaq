// Genera docs/proyecto2/codigo_fuente.md: anexo de código fuente del Proyecto II (Transporte Express).
// Uso: npm run anexo-codigo
// Cada archivo va con su ruta, número de líneas y un bloque con resaltado y numeración (atributo de pandoc
// `.numberLines`, que se respeta al exportar a PDF/Word).
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'proyecto2', 'codigo_fuente.md');

/** Secciones del anexo en el orden del documento. Las carpetas se recorren completas (solo .ts / .tsx). */
const SECCIONES = [
  {
    titulo: 'Núcleo de algoritmos',
    descripcion: 'Algoritmos puros en TypeScript, sin dependencias de la interfaz.',
    rutas: ['src/core/dijkstra.ts', 'src/core/mst.ts', 'src/core/route.ts', 'src/core/tour.ts', 'src/core/graph.ts'],
  },
  {
    titulo: 'Contrato de tipos',
    descripcion: 'Tipos compartidos entre el núcleo, el estado y la interfaz.',
    rutas: ['src/core/types.ts'],
  },
  {
    titulo: 'Estado de la aplicación',
    descripcion: 'Store global: datos de la red, formularios, consultas y resultados.',
    rutas: ['src/store/dataset.ts', 'src/store/types.ts', 'src/store/useAppStore.ts'],
  },
  {
    titulo: 'Interfaz del módulo Transporte Express',
    descripcion: 'Componentes React del módulo Guatemala.',
    rutas: [
      'src/ui/components/guatemala',
      'src/ui/components/tabs/MstTab.tsx',
      'src/ui/components/tabs/PrimTab.tsx',
      'src/ui/components/tabs/KruskalTab.tsx',
    ],
  },
];

const LENGUAJE = { '.ts': 'typescript', '.tsx': 'tsx' };

function archivos(ruta) {
  const abs = join(ROOT, ruta);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [abs];
  return readdirSync(abs)
    .sort()
    .flatMap((nombre) => archivos(join(ruta, nombre)))
    .filter((f) => ['.ts', '.tsx'].includes(extname(f)));
}

let md = '# Anexo — Código fuente\n\n';
md += 'Proyecto II «Transporte Express» · RutaQ · https://github.com/Criss-paz/rutaq\n\n';
md += `Generado automáticamente con \`npm run anexo-codigo\` el ${new Date().toISOString().slice(0, 10)}.\n\n`;

let total = 0;
const omitidas = [];
for (const s of SECCIONES) {
  const lista = s.rutas.flatMap(archivos);
  s.rutas.filter((r) => !existsSync(join(ROOT, r))).forEach((r) => omitidas.push(r));
  if (!lista.length) continue;
  md += `## ${s.titulo}\n\n${s.descripcion}\n\n`;
  for (const abs of lista) {
    const rel = relative(ROOT, abs).replaceAll('\\', '/');
    const codigo = readFileSync(abs, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');
    const lineas = codigo.split('\n').length;
    total += lineas;
    md += `### \`${rel}\`\n\n${lineas} líneas.\n\n`;
    md += `\`\`\`{.${LENGUAJE[extname(abs)]} .numberLines}\n${codigo}\n\`\`\`\n\n`;
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md, 'utf8');
console.log(`Anexo generado: ${relative(ROOT, OUT)} (${total} líneas de código).`);
if (omitidas.length) console.log(`Rutas aún inexistentes (se incluirán cuando existan): ${omitidas.join(', ')}`);
