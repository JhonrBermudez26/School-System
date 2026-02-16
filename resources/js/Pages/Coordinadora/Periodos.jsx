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
        name: '',
        start_date: '',
        end_date: '',
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

        const fechaInicio = new Date(data.start_date);
        const fechaFin = new Date(data.end_date);
        const hoy = new Date();
        const dentroFecha = fechaInicio <= hoy && fechaFin >= hoy;

        if (data.habilitado && !dentroFecha && !data.password) {
            alert('Este periodo está fuera de las fechas actuales. Se requiere contraseña para habilitarlo.');
            return;
        }

        if (editingPeriodo) {
            put(route('coordinadora.periodos.actualizar', editingPeriodo.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setEditingPeriodo(null);
                },
            });
        } else {
            post(route('coordinadora.periodos.crear'), {
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
            name: periodo.nombre,
            start_date: periodo.fecha_inicio,
            end_date: periodo.fecha_fin,
            habilitado: periodo.habilitado,
            directrices: periodo.directrices || '',
            porcentaje: periodo.porcentaje || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = (periodoId) => {
        if (confirm('¿Estás seguro de eliminar este periodo? Esta acción no se puede deshacer.')) {
            router.delete(route('coordinadora.periodos.eliminar', periodoId));
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
            router.patch(route('coordinadora.periodos.toggle', periodo.id));
        }
    };

    const handleAction = (action, periodoId, label) => {
        if (confirm(`¿Estás seguro de que deseas ${label} este periodo?`)) {
            router.post(route(`coordinadora.periodos.${action}`, periodoId));
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();

        passwordForm.patch(route('coordinadora.periodos.toggle', pendingToggle), {
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

    const getStatusConfig = (status, esPeriodoActual) => {
        switch (status) {
            case 'draft': return { label: 'Borrador', color: 'bg-gray-100 text-gray-800' };
            case 'active': return { label: 'Activo', color: 'bg-green-100 text-green-800' };
            case 'closed': return { label: 'Cerrado', color: 'bg-red-100 text-red-800' };
            case 'archived': return { label: 'Archivado', color: 'bg-purple-100 text-purple-800' };
            default: return {
                label: esPeriodoActual ? 'Activo' : 'Finalizado',
                color: esPeriodoActual ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            };
        }
    };

    return (
        <Layout title="Periodos Académicos">
            <Head title="Periodos Académicos" />

            <div className={`transition-all duration-300 ${showModal ? 'blur-sm grayscale-[0.2]' : ''}`}>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Periodos Académicos</h1>
                        <p className="text-gray-600 mt-2">Gestiona el ciclo de vida de los periodos y carga de notas</p>
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

                    <div className={`rounded-lg shadow-md p-6 ${stats.porcentajeDisponible === 0 ? 'bg-green-50' : 'bg-white'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">% Disponible</p>
                                <p className={`text-2xl font-bold ${stats.porcentajeDisponible === 0 ? 'text-green-600' :
                                    stats.porcentajeDisponible < 25 ? 'text-orange-600' : 'text-purple-600'
                                    }`}>
                                    {stats.porcentajeDisponible}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Usado: {stats.porcentajeTotal}%
                                </p>
                            </div>
                            <Percent className={`h-10 w-10 ${stats.porcentajeDisponible === 0 ? 'text-green-600' :
                                stats.porcentajeDisponible < 25 ? 'text-orange-600' : 'text-purple-600'
                                }`} />
                        </div>
                    </div>
                </div>

                {/* Alerta de porcentaje */}
                {stats.porcentajeTotal !== 100 && (
                    <div className={`rounded-lg p-4 mb-6 flex items-start space-x-3 ${stats.porcentajeTotal > 100 ? 'bg-red-50 border border-red-200' :
                        stats.porcentajeTotal === 0 ? 'bg-blue-50 border border-blue-200' :
                            'bg-yellow-50 border border-yellow-200'
                        }`}>
                        <AlertCircle className={`h-5 w-5 mt-0.5 ${stats.porcentajeTotal > 100 ? 'text-red-600' :
                            stats.porcentajeTotal === 0 ? 'text-blue-600' :
                                'text-yellow-600'
                            }`} />
                        <div>
                            <p className={`font-semibold ${stats.porcentajeTotal > 100 ? 'text-red-800' :
                                stats.porcentajeTotal === 0 ? 'text-blue-800' :
                                    'text-yellow-800'
                                }`}>
                                {stats.porcentajeTotal > 100 ? '¡Atención! Porcentaje excedido' :
                                    stats.porcentajeTotal === 0 ? 'Sin porcentajes asignados' :
                                        'Configuración de porcentajes incompleta'}
                            </p>
                            <p className={`text-sm ${stats.porcentajeTotal > 100 ? 'text-red-700' :
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
                                {periodos.map((periodo) => {
                                    const statusCfg = getStatusConfig(periodo.status, periodo.es_periodo_actual);
                                    return (
                                        <div
                                            key={periodo.id}
                                            className={`border rounded-lg p-4 hover:shadow-md transition ${periodo.es_periodo_actual ? 'border-green-300 bg-green-50' : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            Periodo {periodo.nombre}
                                                        </h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                                                            {statusCfg.label}
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
                                                    </div>
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
                                                {/* Transiciones de Estado */}
                                                {periodo.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleAction('activate', periodo.id, 'ACTIVAR')}
                                                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                                        title="Activar Periodo"
                                                    >
                                                        <Unlock className="h-5 w-5" />
                                                    </button>
                                                )}

                                                {periodo.status === 'active' && (
                                                    <button
                                                        onClick={() => handleAction('close', periodo.id, 'CERRAR')}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Cerrar Periodo"
                                                    >
                                                        <Lock className="h-5 w-5" />
                                                    </button>
                                                )}

                                                {periodo.status === 'closed' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction('reopen', periodo.id, 'REABRIR')}
                                                            className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition"
                                                            title="Reabrir Periodo"
                                                        >
                                                            <Unlock className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction('archive', periodo.id, 'ARCHIVAR')}
                                                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
                                                            title="Archivar Periodo"
                                                        >
                                                            <Lock className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => toggleHabilitado(periodo)}
                                                    className={`p-2 rounded-lg transition ${periodo.habilitado
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
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Principal (Estilo Banner) */}
            {showModal && (
                <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-start z-50 pt-20 animate-in fade-in zoom-in duration-300">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={closeModal}></div>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative z-10 border border-gray-100">
                        {/* Header con X */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingPeriodo ? 'Actualizar Periodo Académico' : 'Configurar Nuevo Periodo'}
                                </h2>
                                <p className="text-xs text-gray-500">Completa la información para {editingPeriodo ? 'editar' : 'crear'} el ciclo</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <Plus className="h-6 w-6 transform rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSubmit} id="period-form">
                                <div className="space-y-6">
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <label className="block text-xs font-bold text-green-700 mb-2 uppercase tracking-widest">
                                            Nombre Identificador *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Ej: 2025-1 o Primer Periodo 2025"
                                            className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all text-lg font-medium"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                                Inicia el *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                                                required
                                            />
                                            {errors.start_date && (
                                                <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                                Finaliza el *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                                                required
                                            />
                                            {errors.end_date && (
                                                <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <label className="block text-xs font-bold text-blue-700 mb-2 uppercase tracking-widest">
                                                Peso en Nota Final (%)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={data.porcentaje}
                                                    onChange={(e) => setData('porcentaje', e.target.value)}
                                                    placeholder="25"
                                                    min="0"
                                                    max={calcularPorcentajeDisponible()}
                                                    className="w-full pl-4 pr-10 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <Percent className="absolute right-3 top-2.5 h-4 w-4 text-blue-400" />
                                            </div>
                                            <p className="text-[10px] text-blue-600 mt-2 font-medium">
                                                Cupo disponible: {calcularPorcentajeDisponible()}%
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.habilitado}
                                                    onChange={(e) => setData('habilitado', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                                <div className="ml-3">
                                                    <span className="text-sm font-bold text-gray-700 block">Carga de Notas</span>
                                                    <span className={`text-[10px] font-bold uppercase ${data.habilitado ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {data.habilitado ? 'Habilitada' : 'Bloqueada'}
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {data.habilitado && data.start_date && data.end_date && (
                                        (() => {
                                            const fechaInicio = new Date(data.start_date);
                                            const fechaFin = new Date(data.end_date);
                                            const hoy = new Date();
                                            const dentroFecha = fechaInicio <= hoy && fechaFin >= hoy;

                                            if (!dentroFecha) {
                                                return (
                                                    <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500 animate-pulse">
                                                        <div className="flex items-start space-x-3">
                                                            <Shield className="h-6 w-6 text-orange-600 mt-1" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-orange-900 uppercase tracking-tight">Acceso Extemporáneo Requerido</p>
                                                                <p className="text-xs text-orange-700 mt-1 mb-3">
                                                                    Este periodo no coincide con el tiempo real. Confirma tu identidad para habilitar la carga.
                                                                </p>
                                                                <input
                                                                    type="password"
                                                                    value={data.password}
                                                                    onChange={(e) => setData('password', e.target.value)}
                                                                    placeholder="Confirmar con contraseña"
                                                                    className="w-full px-4 py-2 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                                                                />
                                                                {errors.password && (
                                                                    <p className="text-red-600 text-[10px] mt-1 font-bold">{errors.password}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })()
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
                                            Directrices y Observaciones
                                        </label>
                                        <textarea
                                            value={data.directrices}
                                            onChange={(e) => setData('directrices', e.target.value)}
                                            placeholder="Escribe aquí las directrices para este periodo..."
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 resize-none bg-white text-sm"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer del Banner Modal */}
                        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                {processing ? 'Sincronizando con el servidor...' : 'Todos los campos marcados con * son obligatorios'}
                            </span>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition font-bold text-sm shadow-sm"
                                    disabled={processing}
                                >
                                    Descartar
                                </button>
                                <button
                                    form="period-form"
                                    type="submit"
                                    disabled={processing}
                                    className="px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50 font-bold text-sm shadow-lg shadow-green-600/20 flex items-center space-x-2"
                                >
                                    {processing ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                    <span>{editingPeriodo ? 'Guardar Cambios' : 'Confirmar y Crear'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Contraseña */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[60] p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closePasswordModal}></div>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-orange-100 rounded-2xl">
                                    <Shield className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Verificación Crítica</h2>
                                    <p className="text-xs text-gray-500">Se requiere contraseña de administrador</p>
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-orange-800 leading-relaxed font-medium">
                                    Habilitar carga para un periodo extemporáneo puede afectar los registros históricos.
                                </p>
                            </div>

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                        Tu Contraseña de Acceso
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                                        required
                                        autoFocus
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="text-red-500 text-xs mt-2 font-bold">{passwordForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closePasswordModal}
                                        className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm"
                                        disabled={passwordForm.processing}
                                    >
                                        Abortar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="px-8 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition disabled:opacity-50 font-bold text-sm shadow-lg shadow-orange-600/20"
                                    >
                                        {passwordForm.processing ? 'Validando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout >
    );
}
