import { Head, router, usePage } from '@inertiajs/react';
import { Search, Edit3, Users, X, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Estudiantes() {
    const { estudiantes, grupos, error, flash, can } = usePage().props;
    const editFormRef = useRef(null);

    const [search, setSearch] = useState('');
    const [filterGrupo, setFilterGrupo] = useState('todos');
    const [filterActive, setFilterActive] = useState('todos');
    const [sortConfig, setSortConfig] = useState({ field: null, order: null });
    const [editingStudent, setEditingStudent] = useState(null);
    const [editData, setEditData] = useState({ group_id: '', is_active: true });
    const [formErrors, setFormErrors] = useState({});

    const toggleSort = (field) => {
        setSortConfig(prev => {
            if (prev.field !== field) return { field, order: 'asc' };
            if (prev.order === null || prev.order === 'desc') return { field, order: 'asc' };
            if (prev.order === 'asc') return { field, order: 'desc' };
            return { field: null, order: null };
        });
    };

    const filteredEstudiantes = useMemo(() => {
        if (!Array.isArray(estudiantes)) return [];
        let result = estudiantes.filter((est) => {
            const fullName = `${est.name || ''} ${est.last_name || ''}`.toLowerCase();
            const matchSearch =
                fullName.includes(search.toLowerCase()) ||
                (est.email || '').toLowerCase().includes(search.toLowerCase()) ||
                (est.group?.nombre || '').toLowerCase().includes(search.toLowerCase());
            const matchGrupo = filterGrupo === 'todos' || (est.group && est.group.id === parseInt(filterGrupo));
            const matchActive = filterActive === 'todos' || (filterActive === 'activo' && est.is_active) || (filterActive === 'inactivo' && !est.is_active);
            return matchSearch && matchGrupo && matchActive;
        });
        if (sortConfig.field && sortConfig.order) {
            result = [...result].sort((a, b) => {
                let compareA, compareB;
                if (sortConfig.field === 'name') {
                    compareA = `${a.name || ''} ${a.last_name || ''}`.toLowerCase();
                    compareB = `${b.name || ''} ${b.last_name || ''}`.toLowerCase();
                } else if (sortConfig.field === 'group') {
                    compareA = (a.group?.nombre || '').toLowerCase();
                    compareB = (b.group?.nombre || '').toLowerCase();
                }
                return sortConfig.order === 'asc' ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA);
            });
        }
        return result;
    }, [search, filterGrupo, filterActive, sortConfig, estudiantes]);

    const handleEditClick = (est) => {
        setEditingStudent(est.id);
        setEditData({ group_id: est.group_id?.toString() || '', is_active: est.is_active ?? true });
        setFormErrors({});
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    };

    const handleEditSubmit = () => {
        if (!editData.group_id) { setFormErrors({ group_id: 'El grupo es obligatorio' }); return; }
        router.put(route('estudiantes.update', editingStudent), { group_id: editData.group_id, is_active: editData.is_active }, {
            preserveScroll: true,
            onSuccess: () => { setEditingStudent(null); setEditData({ group_id: '', is_active: true }); setFormErrors({}); },
            onError: (errors) => setFormErrors(errors),
        });
    };

    const toggleActive = (id, isActive) => {
        if (confirm(`⚠️ ¿Seguro que deseas ${isActive ? 'desactivar' : 'activar'} este estudiante?`)) {
            router.put(route('estudiantes.toggle', id), { is_active: !isActive }, {
                preserveScroll: true,
                onError: (err) => alert('Error al cambiar el estado: ' + Object.values(err).join(', ')),
            });
        }
    };

    const handleExport = (format) => {
        const params = {
            search: search.trim() || undefined,
            group_id: filterGrupo !== 'todos' ? filterGrupo : undefined,
            estado: filterActive !== 'todos' ? filterActive : undefined,
            sort_field: sortConfig.field || undefined,
            sort_order: sortConfig.order || undefined,
        };
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined));
        window.location.href = route(`estudiantes.export.${format}`, cleanParams);
    };

    const getSortIcon = (field) => {
        if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4 text-white/60" />;
        if (sortConfig.order === 'asc') return <ArrowUp className="h-4 w-4 text-white" />;
        return <ArrowDown className="h-4 w-4 text-white" />;
    };

    return (
        <Layout title="Gestionar Estudiantes">
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Gestionar Estudiantes
                        </h1>
                        <p className="text-gray-600 mt-1">Administra la información de los estudiantes</p>
                    </div>
                </div>

                {/* Mensajes */}
                {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl">{error}</div>}
                {flash?.success && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl">✅ {flash.success}</div>}
                {flash?.error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl">❌ {flash.error}</div>}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Total Estudiantes</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredEstudiantes.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Activos</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{filteredEstudiantes.filter(e => e.is_active).length || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Inactivos</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">{filteredEstudiantes.filter(e => !e.is_active).length || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                        <p className="text-gray-500 text-xs sm:text-sm">Grupos Únicos</p>
                        <p className="text-xl sm:text-2xl font-bold text-indigo-600">{grupos?.length || 0}</p>
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
                            <select value={filterGrupo} onChange={(e) => setFilterGrupo(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                <option value="todos">Todos los grupos</option>
                                {grupos?.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>)}
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
                {editingStudent && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 sm:p-8 border border-blue-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Edit3 className="text-blue-600" />
                                Editar Estudiante
                            </h2>
                            <button onClick={() => { setEditingStudent(null); setFormErrors({}); }} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                                <select value={editData.group_id} onChange={(e) => setEditData({ ...editData, group_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" required>
                                    <option value="">Seleccionar grupo</option>
                                    {grupos?.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>)}
                                </select>
                                {formErrors.group_id && <p className="text-red-500 text-xs mt-1">{formErrors.group_id}</p>}
                            </div>
                            <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-2">
                                <button type="button" onClick={() => { setEditingStudent(null); setFormErrors({}); }}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium border border-gray-300">Cancelar</button>
                                <button type="button" onClick={handleEditSubmit}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-md">Guardar Cambios</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        <button onClick={() => toggleSort('name')} className="flex items-center gap-2 hover:opacity-80 transition">
                                            <span>Estudiante</span>{getSortIcon('name')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Correo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Teléfono</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                                        <button onClick={() => toggleSort('group')} className="flex items-center gap-2 hover:opacity-80 transition">
                                            <span>Grupo</span>{getSortIcon('group')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredEstudiantes.length > 0 ? (
                                    filteredEstudiantes.map((est) => (
                                        <tr key={est.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-blue-700 font-bold text-sm">
                                                            {est.name?.charAt(0) || ''}{est.last_name?.charAt(0) || ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{est.name || 'N/A'} {est.last_name || ''}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600"><div className="break-all">{est.email || 'N/A'}</div></td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{est.document_number || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{est.phone || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                    {est.group ? est.group.nombre : 'Sin grupo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${est.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {est.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1">
                                                    {can?.update && (
                                                        <>
                                                            <button onClick={() => toggleActive(est.id, est.is_active)}
                                                                className={`${est.is_active ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'} p-2 rounded-lg transition`}
                                                                title={est.is_active ? 'Desactivar' : 'Activar'}>
                                                                <Users className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleEditClick(est)} className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition" title="Editar">
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
                                            {filteredEstudiantes.length === 0
                                                ? 'No hay estudiantes registrados en la base de datos.'
                                                : 'No se encontraron estudiantes con los filtros aplicados.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Export Buttons */}
                {can?.export && (
                    <div className="flex justify-end gap-3">
                        <button onClick={() => handleExport('excel')}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
                            <Download className="h-5 w-5" />
                            <span>Exportar Excel</span>
                        </button>
                        <button onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg">
                            <Download className="h-5 w-5" />
                            <span>Exportar PDF</span>
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}