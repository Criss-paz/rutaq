/**
 * Panel de administración de la red vial para Transporte Express (G2).
 * Incluye dos secciones:
 *   1. Departamentos: agregar, editar, eliminar, buscar; coordenadas opcionales.
 *   2. Carreteras: agregar, editar, eliminar, buscar; tabla ordenable (por origen, destino, carretera, km).
 * Operaciones globales:
 *   - Exportar JSON (dataset Guatemala)
 *   - Importar JSON
 *   - Restaurar datos originales con diálogo de confirmación.
 *
 * Lee y modifica: `graph`, `departments`, `addDepartment`, `updateDepartment`, `removeNodes`,
 * `addRoad`, `updateRoad`, `removeEdges`, `restoreOriginal`, `exportGuatemalaDataset`, `importGraphFile` desde `useApp`.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';
import Modal from '../Modal';

interface GuatemalaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RoadSortField = 'source' | 'target' | 'road' | 'km';
type SortOrder = 'asc' | 'desc';

const getCarretera = (meta?: Record<string, unknown>): string =>
  typeof meta?.carretera === 'string' ? meta.carretera : '';

export default function GuatemalaAdminModal({ isOpen, onClose }: GuatemalaAdminModalProps) {
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const addDepartment = useApp((s) => s.addDepartment);
  const updateDepartment = useApp((s) => s.updateDepartment);
  const removeNodes = useApp((s) => s.removeNodes);
  const addRoad = useApp((s) => s.addRoad);
  const updateRoad = useApp((s) => s.updateRoad);
  const removeEdges = useApp((s) => s.removeEdges);
  const restoreOriginal = useApp((s) => s.restoreOriginal);
  const exportGuatemalaDataset = useApp((s) => s.exportGuatemalaDataset);
  const importGraphFile = useApp((s) => s.importGraphFile);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sección activa: 'departments' | 'roads'
  const [activeSection, setActiveSection] = useState<'departments' | 'roads'>('departments');

  // Diálogo de confirmación para restaurar originales
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Mensajes de error globales o de importación
  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── ESTADO: DEPARTAMENTOS ──
  const [deptSearch, setDeptSearch] = useState('');
  const [newDeptLabel, setNewDeptLabel] = useState('');
  const [newDeptCabecera, setNewDeptCabecera] = useState('');
  const [newDeptLat, setNewDeptLat] = useState('');
  const [newDeptLon, setNewDeptLon] = useState('');
  const [deptFormError, setDeptFormError] = useState<string | null>(null);

  const [editingDeptId, setEditingDeptId] = useState<NodeId | null>(null);
  const [editDeptLabel, setEditDeptLabel] = useState('');
  const [editDeptCabecera, setEditDeptCabecera] = useState('');
  const [editDeptLat, setEditDeptLat] = useState('');
  const [editDeptLon, setEditDeptLon] = useState('');

  // ── ESTADO: CARRETERAS ──
  const [roadSearch, setRoadSearch] = useState('');
  const [newRoadSource, setNewRoadSource] = useState<NodeId>(graph.nodes[0]?.id ?? '');
  const [newRoadTarget, setNewRoadTarget] = useState<NodeId>(graph.nodes[1]?.id ?? '');
  const [newRoadKm, setNewRoadKm] = useState('');
  const [newRoadName, setNewRoadName] = useState('');
  const [roadFormError, setRoadFormError] = useState<{ message: string; existingEdgeId?: string } | null>(null);

  const [editingRoadId, setEditingRoadId] = useState<string | null>(null);
  const [editRoadKm, setEditRoadKm] = useState('');
  const [editRoadName, setEditRoadName] = useState('');

  // Ordenamiento de tabla de carreteras
  const [sortField, setSortField] = useState<RoadSortField>('source');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const getNodeLabel = useCallback(
    (id: NodeId): string => {
      return graph.nodes.find((n) => n.id === id)?.label ?? id;
    },
    [graph.nodes],
  );

  // ── ACCIONES: DEPARTAMENTOS ──
  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError(null);
    const lat = newDeptLat.trim() ? parseFloat(newDeptLat) : undefined;
    const lon = newDeptLon.trim() ? parseFloat(newDeptLon) : undefined;

    const res = addDepartment({
      label: newDeptLabel,
      cabecera: newDeptCabecera,
      lat,
      lon,
    });

    if (res.ok) {
      setNewDeptLabel('');
      setNewDeptCabecera('');
      setNewDeptLat('');
      setNewDeptLon('');
      setGlobalMessage({ text: `Departamento «${newDeptLabel}» agregado con éxito.`, type: 'success' });
    } else {
      if (res.reason === 'empty-name') {
        setDeptFormError('El nombre del departamento no puede estar vacío.');
      } else if (res.reason === 'duplicate-name') {
        setDeptFormError('Ya existe un departamento con ese nombre.');
      } else if (res.reason === 'invalid-coords') {
        setDeptFormError('Coordenadas inválidas: latitud entre -90 y 90, longitud entre -180 y 180.');
      }
    }
  };

  const handleStartEditDept = (id: NodeId) => {
    const node = graph.nodes.find((n) => n.id === id);
    if (!node) return;
    setEditingDeptId(id);
    setEditDeptLabel(node.label);
    setEditDeptCabecera(departments[id]?.cabecera ?? node.label);
    setEditDeptLat(node.lat !== undefined ? String(node.lat) : '');
    setEditDeptLon(node.lon !== undefined ? String(node.lon) : '');
  };

  const handleSaveEditDept = (id: NodeId) => {
    const lat = editDeptLat.trim() ? parseFloat(editDeptLat) : undefined;
    const lon = editDeptLon.trim() ? parseFloat(editDeptLon) : undefined;

    const res = updateDepartment(id, {
      label: editDeptLabel,
      cabecera: editDeptCabecera,
      lat,
      lon,
    });

    if (res.ok) {
      setEditingDeptId(null);
      setGlobalMessage({ text: 'Departamento actualizado correctamente.', type: 'success' });
    } else {
      alert(res.reason === 'duplicate-name' ? 'Ya existe un departamento con ese nombre.' : 'Error al actualizar.');
    }
  };

  const handleDeleteDept = (id: NodeId) => {
    const name = getNodeLabel(id);
    if (confirm(`¿Eliminar el departamento «${name}» y todas sus carreteras conectadas?`)) {
      removeNodes([id]);
      setGlobalMessage({ text: `Departamento «${name}» eliminado.`, type: 'success' });
    }
  };

  // ── ACCIONES: CARRETERAS ──
  const handleAddRoad = (e: React.FormEvent) => {
    e.preventDefault();
    setRoadFormError(null);
    const km = parseFloat(newRoadKm);

    if (newRoadSource === newRoadTarget) {
      setRoadFormError({ message: 'El origen y el destino no pueden ser el mismo departamento.' });
      return;
    }
    if (isNaN(km) || km <= 0) {
      setRoadFormError({ message: 'El kilometraje debe ser un número positivo mayor a 0.' });
      return;
    }

    const res = addRoad(newRoadSource, newRoadTarget, km, newRoadName || undefined);
    if (res.ok) {
      setNewRoadKm('');
      setNewRoadName('');
      setGlobalMessage({ text: 'Carretera agregada exitosamente.', type: 'success' });
    } else {
      if (res.reason === 'duplicate') {
        setRoadFormError({
          message: 'Ya existe una carretera directa entre estos dos departamentos.',
          existingEdgeId: res.existingEdgeId,
        });
      } else if (res.reason === 'self-loop') {
        setRoadFormError({ message: 'No se permiten lazos hacia el mismo departamento.' });
      } else if (res.reason === 'invalid-weight') {
        setRoadFormError({ message: 'El kilometraje ingresado no es válido.' });
      } else {
        setRoadFormError({ message: 'Error al agregar la carretera.' });
      }
    }
  };

  const handleStartEditRoad = (id: string) => {
    const edge = graph.edges.find((e) => e.id === id);
    if (!edge) return;
    setEditingRoadId(id);
    setEditRoadKm(String(edge.weight));
    setEditRoadName(getCarretera(edge.meta));
  };

  const handleSaveEditRoad = (id: string) => {
    const km = parseFloat(editRoadKm);
    if (isNaN(km) || km <= 0) {
      alert('El kilometraje debe ser mayor a 0.');
      return;
    }
    const ok = updateRoad(id, { km, road: editRoadName });
    if (ok) {
      setEditingRoadId(null);
      setGlobalMessage({ text: 'Carretera actualizada correctamente.', type: 'success' });
    }
  };

  const handleDeleteRoad = (id: string) => {
    if (confirm('¿Eliminar esta carretera?')) {
      removeEdges([id]);
      setGlobalMessage({ text: 'Carretera eliminada.', type: 'success' });
    }
  };

  // ── EXPORTAR / IMPORTAR / RESTAURAR ──
  const handleExportJson = () => {
    const data = exportGuatemalaDataset();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guatemala_transporte_express_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setGlobalMessage({ text: 'Archivo JSON de Guatemala exportado exitosamente.', type: 'success' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = importGraphFile(content);
        if (res.ok) {
          setGlobalMessage({ text: 'Dataset importado correctamente.', type: 'success' });
        } else {
          setGlobalMessage({ text: `Error al importar: ${res.message}`, type: 'error' });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRestore = () => {
    restoreOriginal();
    setShowRestoreConfirm(false);
    setGlobalMessage({ text: 'Se restauraron los datos originales de Guatemala.', type: 'success' });
  };

  // ── FILTRADO Y ORDENAMIENTO ──
  const filteredDepartments = useMemo(() => {
    const term = deptSearch.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      const label = n.label.toLowerCase();
      const cab = (departments[n.id]?.cabecera ?? '').toLowerCase();
      return !term || label.includes(term) || cab.includes(term) || n.id.toLowerCase().includes(term);
    });
  }, [graph.nodes, departments, deptSearch]);

  const sortedRoads = useMemo(() => {
    const term = roadSearch.trim().toLowerCase();
    const list = graph.edges.filter((e) => {
      const s = getNodeLabel(e.source).toLowerCase();
      const t = getNodeLabel(e.target).toLowerCase();
      const r = getCarretera(e.meta).toLowerCase();
      return !term || s.includes(term) || t.includes(term) || r.includes(term);
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'source') {
        cmp = getNodeLabel(a.source).localeCompare(getNodeLabel(b.source));
      } else if (sortField === 'target') {
        cmp = getNodeLabel(a.target).localeCompare(getNodeLabel(b.target));
      } else if (sortField === 'road') {
        cmp = getCarretera(a.meta).localeCompare(getCarretera(b.meta));
      } else if (sortField === 'km') {
        cmp = a.weight - b.weight;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [graph.edges, roadSearch, sortField, sortOrder, getNodeLabel]);

  const toggleSort = (field: RoadSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrar Red Vial — Transporte Express"
      testId="modal-admin-network"
    >
      <div className="flex flex-col gap-4 text-xs max-h-[78vh] overflow-y-auto pr-1" data-testid="panel-admin-network">
        {/* Input oculto para importación de JSON */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json,application/json"
          className="hidden"
          data-testid="input-admin-import-file"
        />

        {/* Barra superior de operaciones de archivo */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="btn-admin-export-json"
              onClick={handleExportJson}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>💾</span> Exportar JSON
            </button>
            <button
              type="button"
              data-testid="btn-admin-import-json"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>📂</span> Importar JSON
            </button>
          </div>

          <button
            type="button"
            data-testid="btn-admin-restore-original"
            onClick={() => setShowRestoreConfirm(true)}
            className="min-h-[40px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            🔄 Restaurar datos originales
          </button>
        </div>

        {/* Diálogo de confirmación para restaurar */}
        {showRestoreConfirm && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-md">
            <p className="font-bold text-sm">¿Confirmar restauración de datos originales?</p>
            <p className="mt-1 leading-relaxed">
              Esta acción restablecerá los 22 departamentos y carreteras oficiales de Transporte Express. Se descartarán
              las modificaciones locales no guardadas.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                data-testid="btn-cancel-restore"
                onClick={() => setShowRestoreConfirm(false)}
                className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="btn-confirm-restore"
                onClick={handleConfirmRestore}
                className="min-h-[38px] rounded-lg bg-amber-600 px-3.5 py-1 font-bold text-white shadow-xs hover:bg-amber-700"
              >
                Sí, restaurar datos
              </button>
            </div>
          </div>
        )}

        {/* Mensaje global temporal */}
        {globalMessage && (
          <div
            className={`rounded-lg p-2.5 font-semibold text-xs ${
              globalMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
            }`}
          >
            {globalMessage.text}
          </div>
        )}

        {/* Selector de pestañas de administración */}
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
          <button
            type="button"
            role="tab"
            data-testid="tab-admin-departments"
            aria-selected={activeSection === 'departments'}
            onClick={() => setActiveSection('departments')}
            className={`flex-1 min-h-[40px] rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeSection === 'departments'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            🏛️ Departamentos ({graph.nodes.length})
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-admin-roads"
            aria-selected={activeSection === 'roads'}
            onClick={() => setActiveSection('roads')}
            className={`flex-1 min-h-[40px] rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeSection === 'roads'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            🛣️ Carreteras ({graph.edges.length})
          </button>
        </div>

        {/* SECCIÓN 1: DEPARTAMENTOS */}
        {activeSection === 'departments' && (
          <div className="flex flex-col gap-4" data-testid="section-admin-departments">
            {/* Formulario para agregar departamento */}
            <form
              onSubmit={handleAddDept}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <h2 className="mb-2 font-bold text-slate-900 dark:text-slate-100">+ Agregar nuevo departamento</h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Nombre del departamento *
                  </label>
                  <input
                    type="text"
                    data-testid="input-dept-label"
                    value={newDeptLabel}
                    onChange={(e) => setNewDeptLabel(e.target.value)}
                    placeholder="Ej. Petén"
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Cabecera departamental
                  </label>
                  <input
                    type="text"
                    data-testid="input-dept-cabecera"
                    value={newDeptCabecera}
                    onChange={(e) => setNewDeptCabecera(e.target.value)}
                    placeholder="Ej. Flores"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 dark:text-slate-400">Latitud (opcional)</label>
                  <input
                    type="number"
                    step="any"
                    data-testid="input-dept-lat"
                    value={newDeptLat}
                    onChange={(e) => setNewDeptLat(e.target.value)}
                    placeholder="Ej. 16.9248"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 dark:text-slate-400">Longitud (opcional)</label>
                  <input
                    type="number"
                    step="any"
                    data-testid="input-dept-lon"
                    value={newDeptLon}
                    onChange={(e) => setNewDeptLon(e.target.value)}
                    placeholder="Ej. -89.8974"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {deptFormError && (
                <div data-testid="dept-form-error" className="mt-2 text-rose-600 font-bold dark:text-rose-400">
                  {deptFormError}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  data-testid="btn-save-department"
                  onClick={handleAddDept}
                  className="min-h-[42px] rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Agregar departamento
                </button>
              </div>
            </form>

            {/* Listado de departamentos con buscador */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Departamentos registrados ({filteredDepartments.length}):
                </h3>
                <input
                  type="text"
                  data-testid="input-dept-search"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Buscar departamento o cabecera…"
                  className="min-h-[38px] w-56 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800 max-h-72">
                <table className="w-full text-left border-collapse" data-testid="table-departments">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th className="py-2 px-3 w-12">ID</th>
                      <th className="py-2 px-3">Departamento</th>
                      <th className="py-2 px-3">Cabecera</th>
                      <th className="py-2 px-3">Ubicación (lat, lon)</th>
                      <th className="py-2 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {filteredDepartments.map((n) => {
                      const isEditing = editingDeptId === n.id;
                      const cabecera = departments[n.id]?.cabecera ?? n.label;
                      return (
                        <tr
                          key={n.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          data-testid={`dept-row-${n.id}`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-slate-500">{n.id}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            {isEditing ? (
                              <input
                                type="text"
                                data-testid={`input-edit-dept-name-${n.id}`}
                                value={editDeptLabel}
                                onChange={(e) => setEditDeptLabel(e.target.value)}
                                className="w-full rounded border px-1.5 py-0.5 text-xs font-semibold"
                              />
                            ) : (
                              n.label
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                data-testid={`input-edit-dept-cabecera-${n.id}`}
                                value={editDeptCabecera}
                                onChange={(e) => setEditDeptCabecera(e.target.value)}
                                className="w-full rounded border px-1.5 py-0.5 text-xs"
                              />
                            ) : (
                              cabecera
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  step="any"
                                  value={editDeptLat}
                                  onChange={(e) => setEditDeptLat(e.target.value)}
                                  placeholder="Lat"
                                  className="w-16 rounded border px-1 py-0.5 text-[10px]"
                                />
                                <input
                                  type="number"
                                  step="any"
                                  value={editDeptLon}
                                  onChange={(e) => setEditDeptLon(e.target.value)}
                                  placeholder="Lon"
                                  className="w-16 rounded border px-1 py-0.5 text-[10px]"
                                />
                              </div>
                            ) : n.lat !== undefined && n.lon !== undefined ? (
                              `${n.lat.toFixed(4)}, ${n.lon.toFixed(4)}`
                            ) : (
                              'Posición lienzo'
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-save-dept-${n.id}`}
                                  onClick={() => handleSaveEditDept(n.id)}
                                  className="min-h-[34px] rounded bg-emerald-600 px-2 py-0.5 font-bold text-white hover:bg-emerald-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-cancel-edit-dept-${n.id}`}
                                  onClick={() => setEditingDeptId(null)}
                                  className="min-h-[34px] rounded border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-edit-dept-${n.id}`}
                                  onClick={() => handleStartEditDept(n.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-delete-dept-${n.id}`}
                                  onClick={() => handleDeleteDept(n.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: CARRETERAS */}
        {activeSection === 'roads' && (
          <div className="flex flex-col gap-4" data-testid="section-admin-roads">
            {/* Formulario para agregar carretera */}
            <form
              onSubmit={handleAddRoad}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <h2 className="mb-2 font-bold text-slate-900 dark:text-slate-100">
                + Conectar departamentos (nueva carretera)
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Departamento Origen *
                  </label>
                  <select
                    data-testid="select-road-source"
                    value={newRoadSource}
                    onChange={(e) => setNewRoadSource(e.target.value)}
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {graph.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({departments[n.id]?.cabecera || n.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Departamento Destino *
                  </label>
                  <select
                    data-testid="select-road-target"
                    value={newRoadTarget}
                    onChange={(e) => setNewRoadTarget(e.target.value)}
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {graph.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({departments[n.id]?.cabecera || n.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Kilometraje (km) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    data-testid="input-road-km"
                    value={newRoadKm}
                    onChange={(e) => setNewRoadKm(e.target.value)}
                    placeholder="Ej. 42.5"
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 dark:text-slate-400">
                    Nombre carretera (ej. CA-1, CA-9)
                  </label>
                  <input
                    type="text"
                    data-testid="input-road-name"
                    value={newRoadName}
                    onChange={(e) => setNewRoadName(e.target.value)}
                    placeholder="Ej. CA-9 Norte"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {roadFormError && (
                <div
                  data-testid="road-form-error"
                  className="mt-2 text-rose-600 font-bold dark:text-rose-400 flex items-center gap-2"
                >
                  <span>{roadFormError.message}</span>
                  {roadFormError.existingEdgeId && (
                    <button
                      type="button"
                      data-testid="btn-edit-existing-road"
                      onClick={() => handleStartEditRoad(roadFormError.existingEdgeId!)}
                      className="underline text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      Editar la existente
                    </button>
                  )}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  data-testid="btn-save-road"
                  onClick={handleAddRoad}
                  className="min-h-[42px] rounded-lg bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Agregar carretera
                </button>
              </div>
            </form>

            {/* Listado ordenable de carreteras con buscador */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Carreteras registradas ({sortedRoads.length}):
                </h3>
                <input
                  type="text"
                  data-testid="input-road-search"
                  value={roadSearch}
                  onChange={(e) => setRoadSearch(e.target.value)}
                  placeholder="Buscar por departamento o carretera…"
                  className="min-h-[38px] w-64 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800 max-h-72">
                <table className="w-full text-left border-collapse" data-testid="table-roads">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th
                        onClick={() => toggleSort('source')}
                        data-testid="sort-road-source"
                        className="py-2 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Origen {sortField === 'source' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('target')}
                        data-testid="sort-road-target"
                        className="py-2 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Destino {sortField === 'target' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('road')}
                        data-testid="sort-road-name"
                        className="py-2 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Carretera {sortField === 'road' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('km')}
                        data-testid="sort-road-km"
                        className="py-2 px-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Kilometraje {sortField === 'km' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="py-2 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {sortedRoads.map((e) => {
                      const isEditing = editingRoadId === e.id;
                      const srcName = getNodeLabel(e.source);
                      const tgtName = getNodeLabel(e.target);
                      const roadName = getCarretera(e.meta) || '—';

                      return (
                        <tr
                          key={e.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          data-testid={`road-row-${e.id}`}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">{srcName}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">{tgtName}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                data-testid={`input-edit-road-name-${e.id}`}
                                value={editRoadName}
                                onChange={(evt) => setEditRoadName(evt.target.value)}
                                className="w-full rounded border px-1.5 py-0.5 text-xs"
                              />
                            ) : (
                              roadName
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {isEditing ? (
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                data-testid={`input-edit-road-km-${e.id}`}
                                value={editRoadKm}
                                onChange={(evt) => setEditRoadKm(evt.target.value)}
                                className="w-20 rounded border px-1.5 py-0.5 text-xs text-right font-mono font-bold"
                              />
                            ) : (
                              `${e.weight.toFixed(1)} km`
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-save-road-${e.id}`}
                                  onClick={() => handleSaveEditRoad(e.id)}
                                  className="min-h-[34px] rounded bg-emerald-600 px-2 py-0.5 font-bold text-white hover:bg-emerald-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-cancel-edit-road-${e.id}`}
                                  onClick={() => setEditingRoadId(null)}
                                  className="min-h-[34px] rounded border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-edit-road-${e.id}`}
                                  onClick={() => handleStartEditRoad(e.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-delete-road-${e.id}`}
                                  onClick={() => handleDeleteRoad(e.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
