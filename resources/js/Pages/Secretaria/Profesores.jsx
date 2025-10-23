import { Head, router, usePage } from '@inertiajs/react';
import { Search, Edit3, Users, X, Filter, Plus, Trash2 } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Profesores() {
    const editFormRef = useRef(null);
    const { profesores, asignaturas, grupos, error, flash } = usePage().props;

    const [search, setSearch] = useState('');
    const [filterAsignatura, setFilterAsignatura] = useState('todos');
    const [filterActive, setFilterActive] = useState('todos');
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editData, setEditData] = useState({
        is_active: true,
        asignaturas: [
            {
                subject_id: '',
                group_ids: [],
            }
        ],
    });
    const [formErrors, setFormErrors] = useState({});

    // Filtrado dinámico
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
        console.log('📝 Editando profesor:', prof);

        setEditingTeacher(prof.id);

        // Si el profesor ya tiene asignaturas, cargarlas
        const asignaturasExistentes = prof.asignaturas && prof.asignaturas.length > 0
            ? prof.asignaturas.map(a => ({
                subject_id: a.id.toString(),
                group_ids: a.grupos.map(g => g.id),
            }))
            : [{
                subject_id: '',
                group_ids: [],
            }];

        setEditData({
            is_active: prof.is_active ?? true,
            asignaturas: asignaturasExistentes,
        });
        setFormErrors({});

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleAddAsignatura = () => {
        setEditData({
            ...editData,
            asignaturas: [
                ...editData.asignaturas,
                {
                    subject_id: '',
                    group_ids: [],
                }
            ]
        });
    };

    const handleRemoveAsignatura = (index) => {
        if (editData.asignaturas.length === 1) {
            alert('⚠️ Debe haber al menos una asignatura asignada');
            return;
        }

        const newAsignaturas = editData.asignaturas.filter((_, i) => i !== index);
        setEditData({
            ...editData,
            asignaturas: newAsignaturas,
        });
    };

    const handleAsignaturaChange = (index, field, value) => {
        const newAsignaturas = [...editData.asignaturas];
        newAsignaturas[index][field] = value;
        setEditData({
            ...editData,
            asignaturas: newAsignaturas,
        });
    };

    const handleToggleGroup = (asignaturaIndex, groupId) => {
        const newAsignaturas = [...editData.asignaturas];
        const currentGroups = newAsignaturas[asignaturaIndex].group_ids;

        if (currentGroups.includes(groupId)) {
            newAsignaturas[asignaturaIndex].group_ids = currentGroups.filter(id => id !== groupId);
        } else {
            newAsignaturas[asignaturaIndex].group_ids = [...currentGroups, groupId];
        }

        setEditData({
            ...editData,
            asignaturas: newAsignaturas,
        });
    };

    const handleToggleAllGroups = (asignaturaIndex) => {
        const newAsignaturas = [...editData.asignaturas];
        const allGroupIds = grupos.map(g => g.id);

        // Si ya están todos seleccionados, deseleccionar todos
        if (newAsignaturas[asignaturaIndex].group_ids.length === allGroupIds.length) {
            newAsignaturas[asignaturaIndex].group_ids = [];
        } else {
            newAsignaturas[asignaturaIndex].group_ids = allGroupIds;
        }

        setEditData({
            ...editData,
            asignaturas: newAsignaturas,
        });
    };

    const handleEditSubmit = () => {
        // Validación en el frontend
        const errors = {};

        editData.asignaturas.forEach((asig, index) => {
            if (!asig.subject_id) {
                errors[`asignaturas.${index}.subject_id`] = 'La asignatura es obligatoria';
            }
            if (asig.group_ids.length === 0) {
                errors[`asignaturas.${index}.group_ids`] = 'Debe seleccionar al menos un grupo';
            }
        });

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        console.log('💾 Guardando cambios:', {
            id: editingTeacher,
            data: editData
        });

        router.put(
            route('profesores.update', editingTeacher),
            editData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('✅ Actualización exitosa');
                    setEditingTeacher(null);
                    setEditData({
                        is_active: true,
                        asignaturas: [{
                            subject_id: '',
                            group_ids: [],
                        }],
                    });
                    setFormErrors({});
                },
                onError: (errors) => {
                    console.error('❌ Errores de validación:', errors);
                    setFormErrors(errors);
                },
            }
        );
    };

    const toggleActive = (id, isActive) => {
        if (confirm(`⚠️ ¿Seguro que deseas ${isActive ? 'desactivar' : 'activar'} este profesor?`)) {
            router.put(route('profesores.toggle', id), { is_active: !isActive }, {
                preserveScroll: true,
                onError: (err) => alert('Error al cambiar el estado: ' + Object.values(err).join(', ')),
            });
        }
    };

    return (
        <Layout title="Gestionar Profesores">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestionar Profesores</h1>
                        <p className="text-gray-600 mt-2">Administra las asignaciones de profesores y asignaturas</p>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
                        {error}
                    </div>
                )}
                {flash?.success && (
                    <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
                        ✅ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
                        ❌ {flash.error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-xs sm:text-sm">Total Profesores</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{profesores?.total || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-xs sm:text-sm">Activos</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {profesores?.data?.filter(p => p.is_active).length || 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-xs sm:text-sm">Inactivos</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                            {profesores?.data?.filter(p => !p.is_active).length || 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-xs sm:text-sm">Asignaturas</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{asignaturas?.length || 0}</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, correo o documento..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                aria-label="Buscar profesores"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
                            <select
                                value={filterAsignatura}
                                onChange={(e) => setFilterAsignatura(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                aria-label="Filtrar por asignatura"
                            >
                                <option value="todos">Todas las asignaturas</option>
                                {asignaturas?.map((asig) => (
                                    <option key={asig.id} value={asig.id}>
                                        {asig.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
                            <select
                                value={filterActive}
                                onChange={(e) => setFilterActive(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                aria-label="Filtrar por estado"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Formulario de Edición (Banner) */}
                {editingTeacher && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 border-2 border-green-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Edit3 className="text-green-600" />
                                Editar Profesor
                            </h2>
                            <button
                                onClick={() => {
                                    setEditingTeacher(null);
                                    setFormErrors({});
                                }}
                                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition"
                                aria-label="Cerrar formulario de edición"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Asignaturas del profesor */}
                        <div className="space-y-6">
                            {editData.asignaturas.map((asignatura, index) => (
                                <div key={index} className="bg-white rounded-lg p-6 shadow-md border-2 border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            Asignatura {index + 1}
                                        </h3>
                                        {editData.asignaturas.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveAsignatura(index)}
                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"
                                                title="Eliminar asignatura"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Selector de asignatura */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Asignatura *
                                        </label>
                                        <select
                                            value={asignatura.subject_id}
                                            onChange={(e) => handleAsignaturaChange(index, 'subject_id', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Seleccionar asignatura</option>
                                            {asignaturas?.map((asig) => (
                                                <option key={asig.id} value={asig.id}>
                                                    {asig.name} ({asig.code})
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors[`asignaturas.${index}.subject_id`] && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {formErrors[`asignaturas.${index}.subject_id`]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Selector de grupos */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Grupos * ({asignatura.group_ids.length} seleccionados)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAllGroups(index)}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                {asignatura.group_ids.length === grupos?.length
                                                    ? 'Deseleccionar todos'
                                                    : 'Seleccionar todos'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            {grupos?.map((grupo) => (
                                                <label
                                                    key={grupo.id}
                                                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={asignatura.group_ids.includes(grupo.id)}
                                                        onChange={() => handleToggleGroup(index, grupo.id)}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">{grupo.nombre}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {formErrors[`asignaturas.${index}.group_ids`] && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {formErrors[`asignaturas.${index}.group_ids`]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Botón para agregar otra asignatura */}
                            <button
                                type="button"
                                onClick={handleAddAsignatura}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Agregar otra asignatura</span>
                            </button>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingTeacher(null);
                                    setFormErrors({});
                                }}
                                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium order-2 sm:order-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleEditSubmit}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md order-1 sm:order-2"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Profesor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Correo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teléfono
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Asignaturas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProfesores.length > 0 ? (
                                    filteredProfesores.map((prof) => (
                                        <tr key={prof.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-purple-600 font-bold text-sm">
                                                            {prof.name?.charAt(0) || ''}{prof.last_name?.charAt(0) || ''}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {prof.name || 'N/A'} {prof.last_name || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="break-all">{prof.email || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {prof.document_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {prof.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {prof.asignaturas && prof.asignaturas.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {prof.asignaturas.map((asig) => (
                                                            <div key={asig.id} className="text-sm">
                                                                <span className="font-medium text-gray-900">{asig.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Sin asignaturas</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${prof.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {prof.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => toggleActive(prof.id, prof.is_active)}
                                                        className={`${prof.is_active
                                                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                            } p-2 rounded`}
                                                        title={prof.is_active ? 'Desactivar profesor' : 'Activar profesor'}
                                                        aria-label={prof.is_active ? 'Desactivar profesor' : 'Activar profesor'}
                                                    >
                                                        <Users className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(prof)}
                                                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                        title="Editar profesor"
                                                        aria-label="Editar profesor"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
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

                {/* Pagination */}
                {profesores?.links && profesores.links.length > 3 && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex space-x-2">
                            {profesores.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    className={`px-4 py-2 rounded-lg ${link.active
                                        ? 'bg-green-600 text-white'
                                        : link.url
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    aria-label={`Ir a la página ${link.label}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}