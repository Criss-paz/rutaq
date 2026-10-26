/**
 * Diálogo «Acerca de» del Proyecto II (G5).
 * Muestra los datos institucionales de la Universidad Mariano Gálvez de Guatemala,
 * los nombres y carnés exactos de los 3 integrantes del grupo y la fecha de presentación.
 *
 * Datos estáticos según docs/PLAN_PROYECTO2.md.
 */
import Modal from '../Modal';

interface GuatemalaAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuatemalaAboutModal({ isOpen, onClose }: GuatemalaAboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acerca de — Transporte Express (RutaQ)" testId="modal-about">
      <div className="flex flex-col gap-4 text-xs leading-relaxed" data-testid="about-dialog-content">
        {/* Encabezado Institucional */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="text-base font-extrabold text-blue-900 dark:text-blue-100">
            Universidad Mariano Gálvez de Guatemala
          </div>
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mt-0.5">
            Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
            Proyecto II: «Transporte Express» — Optimización de Rutas Departamentales
          </div>
        </div>

        {/* Datos académicos */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Curso:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">________</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Catedrático:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">________</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sección:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">________</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Fecha de presentación:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Sábado 31 de octubre de 2026</div>
          </div>
        </div>

        {/* Integrantes del grupo y carnés */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Integrantes del equipo de desarrollo:</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="table-team-members">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-700">
                  <th className="py-1.5 px-2">Nombre completo</th>
                  <th className="py-1.5 px-2 font-mono text-right">Carné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-slate-800 dark:text-slate-200">Cristopher Alexis Castellanos Paz</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    2690-24-5972
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-slate-800 dark:text-slate-200">Leonel Taracena Marroquín</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    2690-24-4072
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-slate-800 dark:text-slate-200">Pablo Alexander Vásquez Rivera</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    2690-24-13123
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Descripción del sistema */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <strong>RutaQ — Transporte Express</strong> resuelve el problema de optimización de entrega de paquetes a
          través de la red vial de los 22 departamentos de Guatemala, integrando el algoritmo de Dijkstra para rutas más
          cortas, el árbol de expansión mínima con Prim y Kruskal, y recorridos heurísticos de reparto.
        </p>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            data-testid="btn-close-about"
            onClick={onClose}
            className="min-h-[44px] rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
}
