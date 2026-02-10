import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Plus, Edit, Trash2, Lock, Unlock, FileText, Percent, AlertCircle, Shield } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Periodos({ periodos, stats }) {
    const [showModal, setShowModal] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingToggle, setPendingToggle] = useState(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        habilitado: true,
        directrices: '',
        porcentaje: '',
        password: ''
    });

    const passwordForm = useForm({
        password: ''
    });

    const calcularPorcentajeDisponible = () => {
        if (editingPeriodo) {
            return stats.porcentajeDisponible + (editingPeriodo.porcentaje || 0);
        }
        return stats.porcentajeDisponible;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const fechaInicio = new Date(data.fecha_inicio);
        const fechaFin = new Date(data.fecha_fin);
        const hoy = new Date();
        const dentroFecha = fechaInicio <= hoy && fechaFin >= hoy;

        if (data.habilitado && !dentroFecha && !data.password) {
            alert('Este periodo está fuera de las fechas actuales. Se requiere contraseña para habilitarlo.');
            return;
        }
        
        if (editingPeriodo) {
            put(route('secretaria.periodos.actualizar', editingPeriodo.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setEditingPeriodo(null);
                },
            });
        } else {
            post(route('secretaria.periodos.crear'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (periodo) => {
        setEditingPeriodo(periodo);
        setData({
            nombre: periodo.nombre,
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin,
            habilitado: periodo.habilitado,
            directrices: periodo.directrices || '',
            porcentaje: periodo.porcentaje || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = (periodoId) => {
        if (confirm('¿Estás seguro de eliminar este periodo? Esta acción no se puede deshacer.')) {
            router.delete(route('secretaria.periodos.eliminar', periodoId));
        }
    };

    const toggleHabilitado = (periodo) => {
        const fechaInicio = new Date(periodo.fecha_inicio + 'T00:00:00');
        const fechaFin = new Date(periodo.fecha_fin + 'T00:00:00');
        const hoy = new Date();
        const dentroFecha = fechaInicio <= hoy && fechaFin >= hoy;

        if (!periodo.habilitado && !dentroFecha) {
            setPendingToggle(periodo.id);
            setShowPasswordModal(true);
        } else {
            router.patch(route('secretaria.periodos.toggle', periodo.id));
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        
        passwordForm.patch(route('secretaria.periodos.toggle', pendingToggle), {
            onSuccess: () => {
                setShowPasswordModal(false);
                setPendingToggle(null);
                passwordForm.reset();
            }
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPeriodo(null);
        reset();
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPendingToggle(null);
        passwordForm.reset();
    };

    return (
        <Layout title="Periodos Académicos">
            <Head title="Periodos Académicos" />
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Periodos Académicos</h1>
                    <p className="text-gray-600 mt-2">Gestiona los periodos y habilita la carga de notas</p>
                </div>
                <button
                    onClick={() => {
                        setEditingPeriodo(null);
                        reset();
                        setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                >
                    <Plus className="h-5 w-5" />
                    <span>Nuevo Periodo</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Periodo Actual</p>
                            <p className="text-2xl font-bold text-green-600">{stats.periodoActual}</p>
                        </div>
                        <Calendar className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Periodos</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                        </div>
                        <Calendar className="h-10 w-10 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Carga Habilitada</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.habilitados}</p>
                        </div>
                        <Unlock className="h-10 w-10 text-orange-600" />
                    </div>
                </div>

                <div className={`rounded-lg shadow-md p-6 ${
                    stats.porcentajeDisponible === 0 ? 'bg-green-50' : 'bg-white'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">% Disponible</p>
                            <p className={`text-2xl font-bold ${
                                stats.porcentajeDisponible === 0 ? 'text-green-600' : 
                                stats.porcentajeDisponible < 25 ? 'text-orange-600' : 'text-purple-600'
                            }`}>
                                {stats.porcentajeDisponible}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Usado: {stats.porcentajeTotal}%
                            </p>
                        </div>
                        <Percent className={`h-10 w-10 ${
                            stats.porcentajeDisponible === 0 ? 'text-green-600' : 
                            stats.porcentajeDisponible < 25 ? 'text-orange-600' : 'text-purple-600'
                        }`} />
                    </div>
                </div>
            </div>

            {/* Alerta de porcentaje */}
            {stats.porcentajeTotal !== 100 && (
                <div className={`rounded-lg p-4 mb-6 flex items-start space-x-3 ${
                    stats.porcentajeTotal > 100 ? 'bg-red-50 border border-red-200' :
                    stats.porcentajeTotal === 0 ? 'bg-blue-50 border border-blue-200' :
                    'bg-yellow-50 border border-yellow-200'
                }`}>
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${
                        stats.porcentajeTotal > 100 ? 'text-red-600' :
                        stats.porcentajeTotal === 0 ? 'text-blue-600' :
                        'text-yellow-600'
                    }`} />
                    <div>
                        <p className={`font-semibold ${
                            stats.porcentajeTotal > 100 ? 'text-red-800' :
                            stats.porcentajeTotal === 0 ? 'text-blue-800' :
                            'text-yellow-800'
                        }`}>
                            {stats.porcentajeTotal > 100 ? '¡Atención! Porcentaje excedido' :
                             stats.porcentajeTotal === 0 ? 'Sin porcentajes asignados' :
                             'Configuración de porcentajes incompleta'}
                        </p>
                        <p className={`text-sm ${
                            stats.porcentajeTotal > 100 ? 'text-red-700' :
                            stats.porcentajeTotal === 0 ? 'text-blue-700' :
                            'text-yellow-700'
                        }`}>
                            {stats.porcentajeTotal > 100 ? 
                                `La suma total es ${stats.porcentajeTotal}%. Debe ser exactamente 100%.` :
                             stats.porcentajeTotal === 0 ? 
                                'No hay porcentajes asignados a los periodos. Asigna porcentajes para calcular notas finales.' :
                                `Falta asignar ${stats.porcentajeDisponible}% para completar el 100%.`
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Lista de periodos */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Periodos</h2>
                    
                    {periodos.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No hay periodos registrados</p>
                            <p className="text-gray-400 text-sm mt-2">Crea el primer periodo académico</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {periodos.map((periodo) => (
                                <div 
                                    key={periodo.id}
                                    className={`border rounded-lg p-4 hover:shadow-md transition ${
                                        periodo.es_periodo_actual ? 'border-green-300 bg-green-50' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    Periodo {periodo.nombre}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    periodo.estado === 'Activo' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {periodo.estado}
                                                </span>
                                                {periodo.habilitado ? (
                                                    <span className="flex items-center text-green-600 text-sm">
                                                        <Unlock className="h-4 w-4 mr-1" />
                                                        Carga habilitada
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600 text-sm">
                                                        <Lock className="h-4 w-4 mr-1" />
                                                        Carga bloqueada
                                                    </span>
                                                )}
                                                {!periodo.es_periodo_actual && periodo.habilitado && (
                                                    <span className="flex items-center text-orange-600 text-xs">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Habilitado manualmente
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    {new Date(periodo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-CO', { 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })} - {new Date(periodo.fecha_fin + 'T00:00:00').toLocaleDateString('es-CO', { 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                                
                                                {periodo.porcentaje && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Percent className="h-4 w-4 mr-2" />
                                                        Peso en nota final: {periodo.porcentaje}%
                                                    </div>
                                                )}
                                                
                                                {periodo.directrices && (
                                                    <div className="flex items-start text-sm text-gray-600 mt-2">
                                                        <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-700 mb-1">Directrices:</p>
                                                            <p className="text-gray-600 whitespace-pre-line">{periodo.directrices}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => toggleHabilitado(periodo)}
                                                className={`p-2 rounded-lg transition ${
                                                    periodo.habilitado 
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                                title={periodo.habilitado ? 'Deshabilitar carga' : 'Habilitar carga'}
                                            >
                                                {periodo.habilitado ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(periodo)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                title="Editar"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(periodo.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Principal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingPeriodo ? 'Editar Periodo' : 'Nuevo Periodo'}
                            </h2>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre del Periodo *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                            placeholder="Ej: 2025-1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                        {errors.nombre && (
                                            <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Fecha de Inicio *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.fecha_inicio}
                                                onChange={(e) => setData('fecha_inicio', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                required
                                            />
                                            {errors.fecha_inicio && (
                                                <p className="text-red-500 text-sm mt-1">{errors.fecha_inicio}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Fecha de Fin *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.fecha_fin}
                                                onChange={(e) => setData('fecha_fin', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                required
                                            />
                                            {errors.fecha_fin && (
                                                <p className="text-red-500 text-sm mt-1">{errors.fecha_fin}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Porcentaje de Equivalencia (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={data.porcentaje}
                                            onChange={(e) => setData('porcentaje', e.target.value)}
                                            placeholder="Ej: 25"
                                            min="0"
                                            max={calcularPorcentajeDisponible()}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Disponible: {calcularPorcentajeDisponible()}% (Total usado: {editingPeriodo ? stats.porcentajeTotal - (editingPeriodo.porcentaje || 0) : stats.porcentajeTotal}%)
                                        </p>
                                        {errors.porcentaje && (
                                            <p className="text-red-500 text-sm mt-1">{errors.porcentaje}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Directrices del Periodo
                                        </label>
                                        <textarea
                                            value={data.directrices}
                                            onChange={(e) => setData('directrices', e.target.value)}
                                            placeholder="Normas, criterios de evaluación, observaciones importantes..."
                                            rows="5"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Información importante sobre el periodo (opcional)
                                        </p>
                                        {errors.directrices && (
                                            <p className="text-red-500 text-sm mt-1">{errors.directrices}</p>
                                        )}
                                    </div>

                                    <div className="flex items-start space-x-2 pt-2">
                                        <input
                                            type="checkbox"
                                            checked={data.habilitado}
                                            onChange={(e) => setData('habilitado', e.target.checked)}
                                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                                        />
                                        <div className="flex-1">
                                            <label className="text-sm text-gray-700 font-medium">
                                                Habilitar carga de notas para este periodo
                                            </label>
                                            {data.habilitado && data.fecha_inicio && data.fecha_fin && (
                                                (() => {
                                                    const fechaInicio = new Date(data.fecha_inicio);
                                                    const fechaFin = new Date(data.fecha_fin);
                                                    const hoy = new Date();
                                                    const dentroFecha = fechaInicio <= hoy && fechaFin >= hoy;
                                                    
                                                    if (!dentroFecha) {
                                                        return (
                                                            <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                                <div className="flex items-start space-x-2">
                                                                    <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-semibold text-orange-800">Requiere contraseña</p>
                                                                        <p className="text-xs text-orange-700 mt-1">
                                                                            Este periodo está fuera de las fechas actuales. Ingresa tu contraseña para habilitarlo.
                                                                        </p>
                                                                        <input
                                                                            type="password"
                                                                            value={data.password}
                                                                            onChange={(e) => setData('password', e.target.value)}
                                                                            placeholder="Tu contraseña"
                                                                            className="w-full px-3 py-2 mt-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                                                        />
                                                                        {errors.password && (
                                                                            <p className="text-red-600 text-xs mt-1">{errors.password}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                })()
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                        disabled={processing}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {processing ? 'Guardando...' : (editingPeriodo ? 'Actualizar Periodo' : 'Crear Periodo')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Contraseña */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-3 bg-orange-100 rounded-full">
                                    <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Verificación Requerida</h2>
                                    <p className="text-sm text-gray-600">Este periodo está fuera de fecha</p>
                                </div>
                            </div>
                            
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-orange-800">
                                    Estás habilitando la carga de notas para un periodo que no está dentro de las fechas actuales. 
                                    Por seguridad, ingresa tu contraseña para continuar.
                                </p>
                            </div>

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tu contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        placeholder="Ingresa tu contraseña"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        required
                                        autoFocus
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="text-red-500 text-sm mt-2">{passwordForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closePasswordModal}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        disabled={passwordForm.processing}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {passwordForm.processing ? 'Verificando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}