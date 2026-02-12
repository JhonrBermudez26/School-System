import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    Edit3,
    Trash2,
    Plus,
    X,
    Filter,
    AlertCircle,
    Save,
    BookOpen,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Grupos() {
    const { grupos, grados, cursos, auth, error, flash, can } = usePage().props;
    const user = auth?.user;

    const [search, setSearch] = useState('');
    const [filterGrade, setFilterGrade] = useState('todos');
    const [filterCourse, setFilterCourse] = useState('todos');
    // const [filterActive, setFilterActive] = useState('todos'); // ← Descomenta si realmente usas is_active

    const [sortConfig, setSortConfig] = useState({ field: null, order: null });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        grado_texto: '',
        curso_texto: '',
        nombre: '',
        grade_id: '',
        course_id: '',
    });
    const [formErrors, setFormErrors] = useState({});

    // Auto-generar nombre del grupo
    useEffect(() => {
        if (formData.grado_texto && formData.curso_texto) {
            const nombreGenerado = `${formData.grado_texto}-${formData.curso_texto}`;
            setFormData((prev) => ({ ...prev, nombre: nombreGenerado }));
        } else {
            setFormData((prev) => ({ ...prev, nombre: '' }));
        }
    }, [formData.grado_texto, formData.curso_texto]);

    // Filtrado + ordenamiento local
    const filteredGrupos = useMemo(() => {
        if (!Array.isArray(grupos)) return [];

        let result = grupos.filter((grupo) => {
            const matchSearch =
                (grupo.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
                (grupo.grade?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
                (grupo.course?.nombre || '').toLowerCase().includes(search.toLowerCase());

            const matchGrade =
                filterGrade === 'todos' || grupo.grade_id === Number(filterGrade);

            const matchCourse =
                filterCourse === 'todos' || grupo.course_id === Number(filterCourse);

            // Descomenta si realmente tienes is_active en el modelo Group
            /*
            const matchActive =
              filterActive === 'todos' ||
              (filterActive === 'activo' && grupo.is_active) ||
              (filterActive === 'inactivo' && !grupo.is_active);
            */

            return matchSearch && matchGrade && matchCourse /* && matchActive */;
        });

        // Ordenamiento
        if (sortConfig.field && sortConfig.order) {
            result = [...result].sort((a, b) => {
                let compareA, compareB;

                switch (sortConfig.field) {
                    case 'nombre':
                        compareA = (a.nombre || '').toLowerCase();
                        compareB = (b.nombre || '').toLowerCase();
                        break;
                    case 'grado':
                        compareA = (a.grade?.nombre || '').toLowerCase();
                        compareB = (b.grade?.nombre || '').toLowerCase();
                        break;
                    case 'curso':
                        compareA = (a.course?.nombre || '').toLowerCase();
                        compareB = (b.course?.nombre || '').toLowerCase();
                        break;
                    default:
                        return 0;
                }

                return sortConfig.order === 'asc'
                    ? compareA.localeCompare(compareB)
                    : compareB.localeCompare(compareA);
            });
        }

        return result;
    }, [grupos, search, filterGrade, filterCourse, /* filterActive, */ sortConfig]);

    const toggleSort = (field) => {
        setSortConfig((prev) => {
            if (prev.field !== field) return { field, order: 'asc' };
            if (prev.order === 'asc') return { field, order: 'desc' };
            return { field: null, order: null };
        });
    };

    const getSortIcon = (field) => {
        if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
        if (sortConfig.order === 'asc') return <ArrowUp className="h-4 w-4 text-green-600" />;
        if (sortConfig.order === 'desc') return <ArrowDown className="h-4 w-4 text-green-600" />;
        return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    };

    const handleFormSubmit = (e) => {
        if (e) e.preventDefault();
        setFormErrors({});

        // Validaciones
        if (!formData.grado_texto || !formData.curso_texto) {
            setFormErrors({
                grado_texto: !formData.grado_texto ? 'El grado es obligatorio' : '',
                curso_texto: !formData.curso_texto ? 'El curso es obligatorio' : '',
            });
            return;
        }

        // Buscar o crear grado
        const gradoExistente = grados?.find(g =>
            g.nombre.toLowerCase() === formData.grado_texto.toLowerCase()
        );

        // Buscar o crear curso
        const cursoExistente = cursos?.find(c =>
            c.nombre.toUpperCase() === formData.curso_texto.toUpperCase()
        );

        const dataToSend = {
            nombre: formData.nombre,
            grado_nombre: formData.grado_texto,
            curso_nombre: formData.curso_texto,
            grade_id: gradoExistente?.id,
            course_id: cursoExistente?.id,
        };

        const routeName = editingId ? 'grupos.update' : 'grupos.store';
        const method = editingId ? 'put' : 'post';

        router[method](route(routeName, editingId || undefined), dataToSend, {
            onSuccess: () => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    grado_texto: '',
                    curso_texto: '',
                    nombre: '',
                    grade_id: '',
                    course_id: ''
                });
                setFormErrors({});
            },
            onError: (errors) => {
                setFormErrors(errors);
            },
        });
    };

    const handleEdit = (grupo) => {
        setEditingId(grupo.id);
        setFormData({
            grado_texto: grupo.grade?.nombre || '',
            curso_texto: grupo.course?.nombre || '',
            nombre: grupo.nombre,
            grade_id: grupo.grade_id.toString(),
            course_id: grupo.course_id.toString(),
        });
        setShowForm(true);
        setFormErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (grupo) => {
        if (confirm(`⚠️ ¿Seguro que deseas eliminar el grupo "${grupo.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            router.delete(route('grupos.destroy', grupo.id), {
                preserveScroll: true,
                onError: (err) => {
                    alert('Error al eliminar: ' + Object.values(err).join(', '));
                },
            });
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            grado_texto: '',
            curso_texto: '',
            nombre: '',
            grade_id: '',
            course_id: ''
        });
        setFormErrors({});
    };

    return (
        <Layout title="Gestión de Grupos">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestionar Grupos</h1>
                    <p className="text-gray-600 mt-2">Combina grados y cursos para crear grupos escolares</p>
                </div>
                {can?.create && (
                <button
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setShowForm(true);
                        }
                    }}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md w-full sm:w-auto justify-center"
                >
                    {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <span>{showForm ? 'Cancelar' : 'Nuevo Grupo'}</span>
                </button>
                )}
            </div>

            {/* Mensajes Flash */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {flash.success}
                </div>
            )}
            {(flash?.error || error) && (
                <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {flash?.error || error}
                </div>
            )}

            {/* Formulario */}
            {showForm && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 border-2 border-green-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                {editingId ? <Edit3 className="text-blue-600" /> : <Plus className="text-green-600" />}
                                {editingId ? 'Editar Grupo' : 'Crear Nuevo Grupo'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">Escribe el grado y curso, el nombre se genera automáticamente</p>
                        </div>
                        <button
                            onClick={resetForm}
                            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition"
                            aria-label="Cerrar formulario"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Grado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Grado *
                            </label>
                            <input
                                type="text"
                                value={formData.grado_texto}
                                onChange={(e) => setFormData({ ...formData, grado_texto: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.grado_texto ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: 1°, 2°, 10°, 11°"
                                maxLength={10}
                            />
                            {formErrors.grado_texto && <p className="text-red-500 text-xs mt-1">{formErrors.grado_texto}</p>}
                            <p className="text-xs text-gray-500 mt-1">Escribe el grado</p>
                        </div>

                        {/* Curso */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Curso *
                            </label>
                            <input
                                type="text"
                                value={formData.curso_texto}
                                onChange={(e) => setFormData({ ...formData, curso_texto: e.target.value.toUpperCase() })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${formErrors.curso_texto ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Ej: A, B, C"
                                maxLength={5}
                            />
                            {formErrors.curso_texto && <p className="text-red-500 text-xs mt-1">{formErrors.curso_texto}</p>}
                            <p className="text-xs text-gray-500 mt-1">Escribe el curso</p>
                        </div>

                        {/* Nombre (auto-generado) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Grupo *
                            </label>
                            <input
                                type="text"
                                value={formData.nombre}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                                placeholder="Se genera automáticamente"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.nombre || 'Formato: Grado-Curso'}
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="sm:col-span-3 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleFormSubmit}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md flex items-center justify-center gap-2"
                            >
                                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {editingId ? 'Guardar Cambios' : 'Crear Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-500 text-xs sm:text-sm">Total Grupos</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredGrupos.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-500 text-xs sm:text-sm">Grados Únicos</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {new Set(filteredGrupos.map((g) => g.grade_id).filter(Boolean)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-500 text-xs sm:text-sm">Cursos Únicos</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {new Set(filteredGrupos.map((g) => g.course_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, grado o curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="todos">Todos los grados</option>
              {grados?.map((grado) => (
                <option key={grado.id} value={grado.id}>
                  {grado.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="todos">Todos los cursos</option>
              {cursos?.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla con ordenamiento */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort('nombre')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition"
                  >
                    <span>Nombre Grupo</span>
                    {getSortIcon('nombre')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort('grado')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition"
                  >
                    <span>Grado</span>
                    {getSortIcon('grado')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort('curso')}
                    className="flex items-center space-x-1 hover:text-gray-700 transition"
                  >
                    <span>Curso</span>
                    {getSortIcon('curso')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrupos.length > 0 ? (
                filteredGrupos.map((grupo) => (
                  <tr key={grupo.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {grupo.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {grupo.grade?.nombre || 'Sin grado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {grupo.course?.nombre || 'Sin curso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {can?.update && (
                        <button
                          onClick={() => handleEdit(grupo)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition"
                          title="Editar grupo"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        )}
                         {can?.delete && (
                        <button
                          onClick={() => handleDelete(grupo)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition"
                          title="Eliminar grupo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                      <p className="font-medium">No hay grupos disponibles</p>
                      <p className="text-sm">
                        {search || filterGrade !== 'todos' || filterCourse !== 'todos'
                          ? 'No se encontraron grupos con los filtros aplicados'
                          : 'Crea tu primer grupo usando el botón "Nuevo Grupo"'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}