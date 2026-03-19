import { Head, router, usePage } from '@inertiajs/react';
import { Search, Edit3, Users, X, Filter, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function Profesores() {
    const editFormRef = useRef(null);
    const { profesores, asignaturas, grupos, error, flash, can } = usePage().props;
    const [search, setSearch] = useState('');
    const [filterAsignatura, setFilterAsignatura] = useState('todos');
    const [filterActive, setFilterActive] = useState('todos');
    const [sortConfig, setSortConfig] = useState({ field: null, order: null });
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editData, setEditData] = useState({
        is_active: true,
        asignaturas: [{ subject_id: '', group_ids: [] }],
    });
    const [formErrors, setFormErrors] = useState({});

    const toggleSort = (field) => {
        setSortConfig(prev => {
            if (prev.field !== field) return { field, order: 'asc' };
            if (prev.order === null || prev.order === 'desc') return { field, order: 'asc' };
            if (prev.order === 'asc') return { field, order: 'desc' };
            return { field: null, order: null };
        });
    };

    const filteredProfesores = useMemo(() => {
        if (!profesores || !profesores.data) return [];
        return profesores.data.filter((prof) => {
            const fullName = `${prof.name || ''} ${prof.last_name || ''}`.toLowerCase();
            const matchSearch =
                fullName.includes(search.toLowerCase()) ||
                (prof.email || '').toLowerCase().includes(search.toLowerCase()) ||
                (prof.document_number || '').includes(search);
            const matchAsignatura =
                filterAsignatura === 'todos' ||
                prof.asignaturas?.some(a => a.id === parseInt(filterAsignatura));
            const matchActive =
                filterActive === 'todos' ||
                (filterActive === 'activo' && prof.is_active) ||
                (filterActive === 'inactivo' && !prof.is_active);
            return matchSearch && matchAsignatura && matchActive;
        });
    }, [search, filterAsignatura, filterActive, profesores]);

    const handleEditClick = (prof) => {
        setEditingTeacher(prof.id);
        const asignaturasExistentes = prof.asignaturas && prof.asignaturas.length > 0
            ? prof.asignaturas.map(a => ({ subject_id: a.id.toString(), group_ids: a.grupos.map(g => g.id) }))
            : [{ subject_id: '', group_ids: [] }];
        setEditData({ is_active: prof.is_active ?? true, asignaturas: asignaturasExistentes });
        setFormErrors({});
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    };

    const handleAddAsignatura = () => {
        setEditData({ ...editData, asignaturas: [...editData.asignaturas, { subject_id: '', group_ids: [] }] });
    };

    const handleRemoveAsignatura = (index) => {
        if (editData.asignaturas.length === 1) { alert('⚠️ Debe haber al menos una asignatura asignada'); return; }
        setEditData({ ...editData, asignaturas: editData.asignaturas.filter((_, i) => i !== index) });
    };

    const handleAsignaturaChange = (index, field, value) => {
        const newAsignaturas = [...editData.asignaturas];
        newAsignaturas[index][field] = value;
        setEditData({ ...editData, asignaturas: newAsignaturas });
    };

    const handleToggleGroup = (asignaturaIndex, groupId) => {
        const newAsignaturas = [...editData.asignaturas];
        const currentGroups = newAsignaturas[asignaturaIndex].group_ids;
        newAsignaturas[asignaturaIndex].group_ids = currentGroups.includes(groupId)
            ? currentGroups.filter(id => id !== groupId)
            : [...currentGroups, groupId];
        setEditData({ ...editData, asignaturas: newAsignaturas });
    };

    const handleToggleAllGroups = (asignaturaIndex) => {
        const newAsignaturas = [...editData.asignaturas];
        const allGroupIds = grupos.map(g => g.id);
        newAsignaturas[asignaturaIndex].group_ids =
            newAsignaturas[asignaturaIndex].group_ids.length === allGroupIds.length ? [] : allGroupIds;
        setEditData({ ...editData, asignaturas: newAsignaturas });
    };

    const handleEditSubmit = () => {
        const errors = {};
        editData.asignaturas.forEach((asig, index) => {
            if (!asig.subject_id) errors[`asignaturas.${index}.subject_id`] = 'La asignatura es obligatoria';
            if (asig.group_ids.length === 0) errors[`asignaturas.${index}.group_ids`] = 'Debe seleccionar al menos un grupo';
        });
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
        router.put(route('profesores.update', editingTeacher), editData, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingTeacher(null);
                setEditData({ is_active: true, asignaturas: [{ subject_id: '', group_ids: [] }] });
                setFormErrors({});
            },
            onError: (errors) => setFormErrors(errors),
        });
    };

    const toggleActive = (id, isActive) => {
        if (confirm(`⚠️ ¿Seguro que deseas ${isActive ? 'desactivar' : 'activar'} este profesor?`)) {
            router.put(route('profesores.toggle', id), { is_active: !isActive }, {
                preserveScroll: true,
                onError: (err) => alert('Error al cambiar el estado: ' + Object.values(err).join(', ')),
            });
        }
    };

    const getSortIcon = (field) => {
        if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4 text-white/60" />;
        if (sortConfig.order === 'asc') return <ArrowUp className="h-4 w-4 text-white" />;
        return <ArrowDown className="h-4 w-4 text-white" />;
    };

    return (
        <Layout title="Gestionar Profesores">
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Gestionar Profesores
                        </h1>
                        <p className="text-gray-600 mt-1">Administra las asignaciones de profesores y asignaturas</p>
                    </div>
                </div>

                {/* Mensajes */}
                {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl">{error}</div>}
                {flash?.success && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl">✅ {flash.success}</div>}
                {flash?.error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl">❌ {flash.error}</div>}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Total Profesores</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredProfesores.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Activos</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{filteredProfesores.filter(p => p.is_active).length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Inactivos</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">{filteredProfesores.filter(p => !p.is_active).length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Asignaturas</p>
                        <p className="text-xl sm:text-2xl font-bold text-indigo-600">{asignaturas?.length || 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input type="text" placeholder="Buscar por nombre, correo o documento..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
                            <select value={filterAsignatura} onChange={(e) => setFilterAsignatura(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                <option value="todos">Todas las asignaturas</option>
                                {asignaturas?.map((asig) => <option key={asig.id} value={asig.id}>{asig.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
                            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                <option value="todos">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Formulario Edición */}
                {editingTeacher && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 sm:p-8 border border-blue-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Edit3 className="text-blue-600" />
                                Editar Profesor
                            </h2>
                            <button onClick={() => { setEditingTeacher(null); setFormErrors({}); }}
                                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            {editData.asignaturas.map((asignatura, index) => (
                                <div key={index} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-base font-semibold text-gray-700">Asignatura {index + 1}</h3>
                                        {editData.asignaturas.length > 1 && (
                                            <button onClick={() => handleRemoveAsignatura(index)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Asignatura *</label>
                                        <select value={asignatura.subject_id} onChange={(e) => handleAsignaturaChange(index, 'subject_id', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                            <option value="">Seleccionar asignatura</option>
                                            {asignaturas?.map((asig) => <option key={asig.id} value={asig.id}>{asig.name} ({asig.code})</option>)}
                                        </select>
                                        {formErrors[`asignaturas.${index}.subject_id`] && <p className="text-red-500 text-xs mt-1">{formErrors[`asignaturas.${index}.subject_id`]}</p>}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Grupos * ({asignatura.group_ids.length} seleccionados)</label>
                                            <button type="button" onClick={() => handleToggleAllGroups(index)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                                {asignatura.group_ids.length === grupos?.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            {grupos?.map((grupo) => (
                                                <label key={grupo.id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition">
                                                    <input type="checkbox" checked={asignatura.group_ids.includes(grupo.id)} onChange={() => handleToggleGroup(index, grupo.id)}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                                    <span className="text-sm text-gray-700">{grupo.nombre}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {formErrors[`asignaturas.${index}.group_ids`] && <p className="text-red-500 text-xs mt-1">{formErrors[`asignaturas.${index}.group_ids`]}</p>}
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddAsignatura}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition font-medium border border-blue-200">
                                <Plus className="h-5 w-5" />
                                <span>Agregar otra asignatura</span>
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                            <button type="button" onClick={() => { setEditingTeacher(null); setFormErrors({}); }}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">
                                Cancelar
                            </button>
                            <button type="button" onClick={handleEditSubmit}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-md">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Profesor</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Correo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Teléfono</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Asignaturas</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredProfesores.length > 0 ? (
                                    filteredProfesores.map((prof) => (
                                        <tr key={prof.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-indigo-700 font-bold text-sm">
                                                            {prof.name?.charAt(0) || ''}{prof.last_name?.charAt(0) || ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{prof.name || 'N/A'} {prof.last_name || ''}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600"><div className="break-all">{prof.email || 'N/A'}</div></td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{prof.document_number || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{prof.phone || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                {prof.asignaturas && prof.asignaturas.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {prof.asignaturas.map((asig) => (
                                                            <span key={asig.id} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">{asig.name}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Sin asignaturas</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${prof.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {prof.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1">
                                                    {can?.update && (
                                                        <>
                                                            <button onClick={() => toggleActive(prof.id, prof.is_active)}
                                                                className={`${prof.is_active ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'} p-2 rounded-lg transition`}
                                                                title={prof.is_active ? 'Desactivar' : 'Activar'}>
                                                                <Users className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleEditClick(prof)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                                                <Edit3 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {!can?.update && <span className="text-gray-400 text-xs italic px-2">Solo lectura</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            {profesores?.data?.length === 0
                                                ? 'No hay profesores registrados en la base de datos.'
                                                : 'No se encontraron profesores con los filtros aplicados.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}