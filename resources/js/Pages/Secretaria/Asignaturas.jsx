// resources/js/Pages/Secretaria/Asignaturas.jsx
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
import { useState, useMemo } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Asignaturas() {
  const { asignaturas, auth, error, flash, can } = usePage().props;
  const user = auth?.user;

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('todos');
  const [sortConfig, setSortConfig] = useState({ field: null, order: null });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    hours_per_week: 4,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // Filtrado + ordenamiento local
  const filteredAsignaturas = useMemo(() => {
    if (!Array.isArray(asignaturas)) return [];

    let result = asignaturas.filter((asig) => {
      const matchSearch =
        (asig.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (asig.code || '').toLowerCase().includes(search.toLowerCase());

      const matchActive =
        filterActive === 'todos' ||
        (filterActive === 'activo' && asig.is_active) ||
        (filterActive === 'inactivo' && !asig.is_active);

      return matchSearch && matchActive;
    });

    // Ordenamiento
    if (sortConfig.field && sortConfig.order) {
      result = [...result].sort((a, b) => {
        let compareA, compareB;

        switch (sortConfig.field) {
          case 'code':
            compareA = (a.code || '').toLowerCase();
            compareB = (b.code || '').toLowerCase();
            break;
          case 'name':
            compareA = (a.name || '').toLowerCase();
            compareB = (b.name || '').toLowerCase();
            break;
          case 'hours':
            compareA = a.hours_per_week;
            compareB = b.hours_per_week;
            break;
          default:
            return 0;
        }

        if (typeof compareA === 'number') {
          return sortConfig.order === 'asc' ? compareA - compareB : compareB - compareA;
        }

        return sortConfig.order === 'asc'
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      });
    }

    return result;
  }, [asignaturas, search, filterActive, sortConfig]);

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

    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!formData.code.trim()) errors.code = 'El código es obligatorio';
    if (formData.hours_per_week < 1 || formData.hours_per_week > 20) {
      errors.hours_per_week = 'Las horas deben estar entre 1 y 20';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const routeName = editingId ? 'asignaturas.update' : 'asignaturas.store';
    const method = editingId ? 'put' : 'post';

    router[method](route(routeName, editingId || undefined), formData, {
      onSuccess: () => {
        resetForm();
      },
      onError: (errors) => {
        setFormErrors(errors);
      },
    });
  };

  const handleEdit = (asignatura) => {
    setEditingId(asignatura.id);
    setFormData({
      name: asignatura.name,
      code: asignatura.code,
      description: asignatura.description || '',
      hours_per_week: asignatura.hours_per_week,
      is_active: asignatura.is_active,
    });
    setShowForm(true);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (asignatura) => {
    if (
      confirm(
        `⚠️ ¿Seguro que deseas eliminar la asignatura "${asignatura.name}"?\n\nEsta acción eliminará todas las asignaciones relacionadas y no se puede deshacer.`
      )
    ) {
      router.delete(route('asignaturas.destroy', asignatura.id), {
        preserveScroll: true,
        onError: (err) => {
          alert('Error al eliminar: ' + Object.values(err).join(', '));
        },
      });
    }
  };

  const toggleActive = (id, isActive, name) => {
    if (confirm(`⚠️ ¿Seguro que deseas ${isActive ? 'desactivar' : 'activar'} la asignatura "${name}"?`)) {
      router.put(
        route('asignaturas.toggle', id),
        { is_active: !isActive },
        {
          preserveScroll: true,
          onError: (err) => alert('Error al cambiar el estado: ' + Object.values(err).join(', ')),
        }
      );
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      hours_per_week: 4,
      is_active: true,
    });
    setFormErrors({});
  };

  return (
    <Layout title="Gestión de Asignaturas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestionar Asignaturas</h1>
          <p className="text-gray-600 mt-2">Crea y administra las asignaturas del colegio</p>
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
          <span>{showForm ? 'Cancelar' : 'Nueva Asignatura'}</span>
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
                {editingId ? 'Editar Asignatura' : 'Crear Nueva Asignatura'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {editingId ? 'Modifica los datos de la asignatura' : 'Completa los datos para crear una nueva asignatura'}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition"
              aria-label="Cerrar formulario"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Asignatura *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Matemáticas, Español, Ciencias"
                maxLength={255}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formErrors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: MAT-01, ESP-02, CIE-03"
                maxLength={50}
              />
              {formErrors.code && <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>}
              <p className="text-xs text-gray-500 mt-1">Código único de la asignatura</p>
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Breve descripción de la asignatura..."
                rows="3"
              />
            </div>

            {/* Horas por semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas por Semana *
              </label>
              <input
                type="number"
                value={formData.hours_per_week}
                onChange={(e) => setFormData({ ...formData, hours_per_week: parseInt(e.target.value) || 1 })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formErrors.hours_per_week ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
                max="20"
              />
              {formErrors.hours_per_week && <p className="text-red-500 text-xs mt-1">{formErrors.hours_per_week}</p>}
              <p className="text-xs text-gray-500 mt-1">Entre 1 y 20 horas</p>
            </div>

            {/* Estado */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Asignatura activa</span>
              </label>
            </div>

            {/* Botones */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
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
                {editingId ? 'Guardar Cambios' : 'Crear Asignatura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-500 text-xs sm:text-sm">Total Asignaturas</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredAsignaturas.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-500 text-xs sm:text-sm">Activas</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">
            {filteredAsignaturas.filter((a) => a.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-gray-500 text-xs sm:text-sm">Inactivas</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">
            {filteredAsignaturas.filter((a) => !a.is_active).length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activas</option>
              <option value="inactivo">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort('code')}
                    className="flex items-center space-x-2 hover:text-gray-700 transition"
                    title="Ordenar por código"
                  >
                    <span>Código</span>
                    {getSortIcon('code')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center space-x-2 hover:text-gray-700 transition"
                    title="Ordenar por nombre"
                  >
                    <span>Nombre</span>
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => toggleSort('hours')}
                    className="flex items-center space-x-2 hover:text-gray-700 transition"
                    title="Ordenar por horas/semana"
                  >
                    <span>Horas/Semana</span>
                    {getSortIcon('hours')}
                  </button>
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
              {filteredAsignaturas.length > 0 ? (
                filteredAsignaturas.map((asig) => (
                  <tr key={asig.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {asig.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{asig.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">{asig.description || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{asig.hours_per_week}</span>
                        <span className="ml-1 text-gray-400">hrs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(asig.id, asig.is_active, asig.name)}
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition cursor-pointer ${
                          asig.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title={asig.is_active ? 'Click para desactivar' : 'Click para activar'}
                      >
                        {asig.is_active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {can?.update && (
                        <button
                          onClick={() => handleEdit(asig)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition"
                          title="Editar asignatura"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        )}
                          {can?.delete && (
                        <button
                          onClick={() => handleDelete(asig)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition"
                          title="Eliminar asignatura"
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
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                      <p className="font-medium">No hay asignaturas disponibles</p>
                      <p className="text-sm">
                        {search || filterActive !== 'todos'
                          ? 'No se encontraron asignaturas con los filtros aplicados'
                          : 'Crea tu primera asignatura usando el botón "Nueva Asignatura"'}
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