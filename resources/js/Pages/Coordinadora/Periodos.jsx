import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Plus, Edit, Trash2, Lock, Unlock, Percent, AlertCircle, Shield, X, CheckCircle2, Clock, Archive, Sparkles } from 'lucide-react';
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

    const passwordForm = useForm({ password: '' });

    const calcularPorcentajeDisponible = () => {
        if (editingPeriodo) return stats.porcentajeDisponible + (editingPeriodo.porcentaje || 0);
        return stats.porcentajeDisponible;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPeriodo) {
            put(route('coordinadora.periodos.actualizar', editingPeriodo.id), {
                onSuccess: () => { setShowModal(false); reset(); setEditingPeriodo(null); },
            });
        } else {
            post(route('coordinadora.periodos.crear'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleEdit = (periodo) => {
        setEditingPeriodo(periodo);
        setData({
            name: periodo.nombre, start_date: periodo.fecha_inicio,
            end_date: periodo.fecha_fin, habilitado: periodo.habilitado,
            directrices: periodo.directrices || '', porcentaje: periodo.porcentaje || '', password: ''
        });
        setShowModal(true);
    };

    const handleDelete = (periodoId) => {
        if (confirm('¿Estás seguro de eliminar este periodo?')) {
            router.delete(route('coordinadora.periodos.eliminar', periodoId));
        }
    };

    const toggleHabilitado = (periodo) => {
        if (!periodo.es_periodo_actual) { setPendingToggle(periodo.id); setShowPasswordModal(true); }
        else { router.patch(route('coordinadora.periodos.toggle', periodo.id)); }
    };

    const handleAction = (action, periodoId, label) => {
        if (confirm(`¿Estás seguro de que deseas ${label} este periodo?`)) {
            router.post(route(`coordinadora.periodos.${action}`, periodoId));
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.patch(route('coordinadora.periodos.toggle', pendingToggle), {
            onSuccess: () => { setShowPasswordModal(false); setPendingToggle(null); passwordForm.reset(); }
        });
    };

    const closeModal = () => { setShowModal(false); setEditingPeriodo(null); reset(); };
    const closePasswordModal = () => { setShowPasswordModal(false); setPendingToggle(null); passwordForm.reset(); };

    const getStatusBadge = (status, esPeriodoActual) => {
        if (esPeriodoActual) return { label: 'Periodo Actual', icon: Sparkles, classes: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0' };
        switch (status) {
            case 'draft':    return { label: 'Borrador',  icon: Edit,         classes: 'bg-gray-100 text-gray-700 border-gray-200' };
            case 'active':   return { label: 'Activo',    icon: CheckCircle2, classes: 'bg-green-100 text-green-700 border-green-200' };
            case 'closed':   return { label: 'Cerrado',   icon: Lock,         classes: 'bg-red-100 text-red-700 border-red-200' };
            case 'archived': return { label: 'Archivado', icon: Archive,      classes: 'bg-purple-100 text-purple-700 border-purple-200' };
            default:         return { label: 'Inactivo',  icon: Clock,        classes: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    return (
        <Layout title="Periodos Académicos">
            <Head title="Periodos Académicos" />
            <div className={`space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${showModal || showPasswordModal ? 'blur-sm pointer-events-none' : ''}`}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Periodos Académicos
                        </h1>
                        <p className="text-gray-600 mt-1">Control del ciclo académico y carga de notas</p>
                    </div>
                    <button
                        onClick={() => { setEditingPeriodo(null); reset(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Periodo
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-blue-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Periodo Actual</p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                                    {stats.periodoActual}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl">
                                <Calendar className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-green-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Habilitados</p>
                                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">
                                    {stats.habilitados}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                                <Unlock className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className={`relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-sm p-6 border ${
                        stats.porcentajeDisponible === 0 ? 'bg-green-50/80 border-green-200'
                        : stats.porcentajeDisponible < 25 ? 'bg-orange-50/80 border-orange-200'
                        : 'bg-blue-50/80 border-blue-200'
                    }`}>
                        <div className={`absolute inset-0 ${
                            stats.porcentajeDisponible === 0 ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10'
                            : stats.porcentajeDisponible < 25 ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
                            : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10'
                        }`}></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">% Disponible</p>
                                <p className={`text-2xl font-bold mt-1 bg-clip-text text-transparent ${
                                    stats.porcentajeDisponible === 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                                    : stats.porcentajeDisponible < 25 ? 'bg-gradient-to-r from-orange-600 to-red-600'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                }`}>
                                    {stats.porcentajeDisponible}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Usado: {stats.porcentajeTotal}%</p>
                            </div>
                            <div className={`p-3 rounded-xl ${
                                stats.porcentajeDisponible === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                : stats.porcentajeDisponible < 25 ? 'bg-gradient-to-br from-orange-500 to-red-500'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                            }`}>
                                <Percent className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerta de porcentaje */}
                {stats.porcentajeTotal !== 100 && (
                    <div className={`rounded-xl p-4 flex items-start gap-3 border-2 ${
                        stats.porcentajeTotal > 100 ? 'bg-red-50 border-red-200'
                        : stats.porcentajeTotal === 0 ? 'bg-blue-50 border-blue-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            stats.porcentajeTotal > 100 ? 'text-red-600'
                            : stats.porcentajeTotal === 0 ? 'text-blue-600' : 'text-yellow-600'
                        }`} />
                        <div>
                            <p className={`font-bold text-sm ${
                                stats.porcentajeTotal > 100 ? 'text-red-800'
                                : stats.porcentajeTotal === 0 ? 'text-blue-800' : 'text-yellow-800'
                            }`}>
                                {stats.porcentajeTotal > 100 ? '¡Porcentaje excedido!'
                                : stats.porcentajeTotal === 0 ? 'Sin porcentajes asignados' : 'Configuración incompleta'}
                            </p>
                            <p className={`text-sm mt-1 ${
                                stats.porcentajeTotal > 100 ? 'text-red-700'
                                : stats.porcentajeTotal === 0 ? 'text-blue-700' : 'text-yellow-700'
                            }`}>
                                {stats.porcentajeTotal > 100
                                    ? `Total: ${stats.porcentajeTotal}%. Debe ser exactamente 100%.`
                                    : stats.porcentajeTotal === 0
                                    ? 'Asigna porcentajes para calcular notas finales.'
                                    : `Falta ${stats.porcentajeDisponible}% para completar el 100%.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Lista de periodos */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    {periodos.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                <Calendar className="h-12 w-12 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-lg font-medium">No hay periodos registrados</p>
                            <p className="text-gray-400 text-sm mt-2">Crea el primer periodo académico</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-3">
                            {periodos.map((periodo) => {
                                const statusCfg = getStatusBadge(periodo.status, periodo.es_periodo_actual);
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <div
                                        key={periodo.id}
                                        className={`rounded-xl border p-5 sm:p-6 hover:shadow-md transition-all ${
                                            periodo.es_periodo_actual
                                                ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-blue-200'
                                                : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{periodo.nombre}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.classes}`}>
                                                        <StatusIcon className="h-3.5 w-3.5" />
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-blue-500" />
                                                        <span>
                                                            {new Date(periodo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                            {' – '}
                                                            {new Date(periodo.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    {periodo.porcentaje && (
                                                        <div className="flex items-center gap-2">
                                                            <Percent className="h-4 w-4 text-blue-500" />
                                                            <span className="font-semibold">{periodo.porcentaje}%</span>
                                                        </div>
                                                    )}
                                                    <div className={`flex items-center gap-2 font-medium ${periodo.habilitado ? 'text-green-600' : 'text-red-600'}`}>
                                                        {periodo.habilitado
                                                            ? <><Unlock className="h-4 w-4" /><span>Habilitado</span></>
                                                            : <><Lock className="h-4 w-4" /><span>Bloqueado</span></>}
                                                    </div>
                                                </div>
                                                {periodo.directrices && (
                                                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Directrices</p>
                                                        <p className="text-sm text-gray-700">{periodo.directrices}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            {periodo.status === 'active' && (
                                                <button onClick={() => handleAction('close', periodo.id, 'CERRAR')}
                                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Cerrar Periodo">
                                                    <Lock className="h-5 w-5" />
                                                </button>
                                            )}
                                            {periodo.status === 'closed' && (
                                                <>
                                                    <button onClick={() => handleAction('reopen', periodo.id, 'REABRIR')}
                                                        className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors" title="Reabrir Periodo">
                                                        <Unlock className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleAction('archive', periodo.id, 'ARCHIVAR')}
                                                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors" title="Archivar Periodo">
                                                        <Archive className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => toggleHabilitado(periodo)}
                                                className={`p-2 rounded-lg transition-colors ${periodo.habilitado ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                title={periodo.habilitado ? 'Bloquear carga' : 'Habilitar carga'}>
                                                {periodo.habilitado ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                                            </button>
                                            <button onClick={() => handleEdit(periodo)}
                                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors" title="Editar">
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleDelete(periodo.id)}
                                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Eliminar">
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

            {/* Modal Principal — diseño amplio sin scroll */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden">
                        <form onSubmit={handleSubmit}>

                            {/* ── Banner header ── */}
                            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4 text-white overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/5 rounded-full"></div>
                                <div className="relative flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex bg-white/20 p-2.5 rounded-xl flex-shrink-0">
                                            <Calendar className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-widest">
                                                {editingPeriodo ? 'Edición' : 'Creación'} de periodo
                                            </p>
                                            <h2 className="text-lg sm:text-xl font-bold leading-tight">
                                                {editingPeriodo ? 'Editar Periodo Académico' : 'Nuevo Periodo Académico'}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex bg-white/15 px-3 py-1 rounded-full text-xs font-semibold items-center gap-1.5">
                                            <Percent className="h-3 w-3" />
                                            Disponible: {calcularPorcentajeDisponible()}%
                                        </div>
                                        <button type="button" onClick={closeModal}
                                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Cuerpo en grid 2 cols con scroll permitido ── */}
                            <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* Columna izquierda */}
                                    <div className="space-y-5">
                                        {/* Nombre */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Nombre del Periodo <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Ej: Primer Periodo 2026"
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                                required
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</p>}
                                        </div>

                                        {/* Fechas */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                    Fecha Inicio <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.start_date}
                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                                    required
                                                />
                                                {errors.start_date && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.start_date}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                                    Fecha Fin <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.end_date}
                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                                    required
                                                />
                                                {errors.end_date && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.end_date}</p>}
                                            </div>
                                        </div>

                                        {/* Porcentaje */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Peso en Nota Final (%) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={data.porcentaje}
                                                    onChange={(e) => setData('porcentaje', e.target.value)}
                                                    placeholder="25"
                                                    min="0"
                                                    max={calcularPorcentajeDisponible()}
                                                    className="w-full pl-4 pr-12 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                                    required
                                                />
                                                <Percent className="absolute right-4 top-3.5 h-5 w-5 text-blue-400" />
                                            </div>
                                            {/* Barra visual del porcentaje */}
                                            <div className="mt-3 bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(((100 - calcularPorcentajeDisponible()) / 100) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-1.5 text-xs text-gray-500">
                                                <span>Usado: <strong>{100 - calcularPorcentajeDisponible()}%</strong></span>
                                                <span className="text-blue-600 font-bold">Disponible: {calcularPorcentajeDisponible()}%</span>
                                            </div>
                                            {errors.porcentaje && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.porcentaje}</p>}
                                        </div>
                                    </div>

                                    {/* Columna derecha — Directrices ocupa toda la altura */}
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Directrices <span className="text-gray-400 font-normal">(opcional)</span>
                                        </label>
                                        <textarea
                                            value={data.directrices}
                                            onChange={(e) => setData('directrices', e.target.value)}
                                            placeholder="Instrucciones, lineamientos o notas especiales para este periodo académico...&#10;&#10;Ej: En este periodo se evaluarán competencias comunicativas..."
                                            className="flex-1 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm min-h-[180px] lg:min-h-0"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            Las directrices son visibles para los docentes en el periodo activo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Footer ── */}
                            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 font-semibold shadow-lg text-sm flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</>
                                    ) : (
                                        <><Calendar className="h-4 w-4" /> {editingPeriodo ? 'Actualizar Periodo' : 'Crear Periodo'}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Contraseña */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Verificación Requerida</h2>
                                    <p className="text-sm text-gray-500">Periodo fuera de fecha actual</p>
                                </div>
                            </div>
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-5">
                                <p className="text-sm text-orange-800 font-medium">
                                    ⚠️ Este NO es el periodo actual. Habilitar la carga puede afectar registros históricos.
                                </p>
                            </div>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-5">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tu Contraseña de Coordinadora</label>
                                    <input type="password" value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        required autoFocus />
                                    {passwordForm.errors.password && (
                                        <p className="text-red-500 text-xs mt-2 font-bold">{passwordForm.errors.password}</p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={closePasswordModal} disabled={passwordForm.processing}
                                        className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={passwordForm.processing}
                                        className="px-8 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50 font-bold text-sm shadow-lg">
                                        {passwordForm.processing ? 'Validando...' : 'Autorizar'}
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