import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    BookOpen,
    TrendingUp,
    Award,
    FileText,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    BarChart3,
    Target,
    Filter
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Notas({
    materias = [],
    promedioGeneral = 0,
    periodos = [],
    periodoActual = null,
    estadisticas = {},
    can = {}
}) {
    const [expandedMateria, setExpandedMateria] = useState(null);
    const [selectedPeriodId, setSelectedPeriodId] = useState(periodoActual?.id || '');

    const handlePeriodChange = (periodId) => {
        setSelectedPeriodId(periodId);
        if (periodId) {
            router.get(route('estudiante.notas'), { period_id: periodId }, { preserveState: true, preserveScroll: true });
        } else {
            router.get(route('estudiante.notas'), {}, { preserveState: true, preserveScroll: true });
        }
    };

    const getGradeColor = (grade) => {
        if (grade === null || grade === undefined) return 'text-gray-400';
        if (grade >= 4.5) return 'text-blue-600';
        if (grade >= 4.0) return 'text-indigo-600';
        if (grade >= 3.5) return 'text-yellow-600';
        if (grade >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBg = (grade) => {
        if (grade === null || grade === undefined) return 'bg-gray-50 border-gray-200';
        if (grade >= 4.5) return 'bg-blue-50 border-blue-200';
        if (grade >= 4.0) return 'bg-indigo-50 border-indigo-200';
        if (grade >= 3.5) return 'bg-yellow-50 border-yellow-200';
        if (grade >= 3.0) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    const getGradeBadge = (grade) => {
        if (grade === null || grade === undefined) return 'bg-gray-100 text-gray-600';
        if (grade >= 4.5) return 'bg-blue-100 text-blue-700';
        if (grade >= 4.0) return 'bg-indigo-100 text-indigo-700';
        if (grade >= 3.5) return 'bg-yellow-100 text-yellow-700';
        if (grade >= 3.0) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    const getStatusBadge = (status) => {
        const badges = {
            graded: { text: 'Calificada', class: 'bg-blue-100 text-blue-700' },
            submitted: { text: 'Entregada', class: 'bg-indigo-100 text-indigo-700' },
            pending: { text: 'Pendiente', class: 'bg-gray-100 text-gray-700' },
        };
        return badges[status] || badges.pending;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getMessage = (grade) => {
        if (grade >= 4.5) return '¡Excelente desempeño! 🌟';
        if (grade >= 4.0) return '¡Muy buen trabajo! 👏';
        if (grade >= 3.5) return '¡Buen esfuerzo! 💪';
        if (grade >= 3.0) return 'Sigue mejorando 📚';
        return '¡No te rindas! 🚀';
    };

    const toggleMateria = (materiaId) => {
        setExpandedMateria(expandedMateria === materiaId ? null : materiaId);
    };

    return (
        <Layout>
            <Head title="Mis Calificaciones" />
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header con Selector de Periodo */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Mis Calificaciones
                        </h1>
                        <p className="text-gray-600 mt-1">Consulta tu rendimiento académico por periodo</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Periodo Académico</label>
                        <div className="relative">
                            <select
                                value={selectedPeriodId}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="w-full sm:w-64 px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                            >
                                <option value="">Todos los periodos</option>
                                {periodos.map((periodo) => (
                                    <option key={periodo.id} value={periodo.id}>
                                        {periodo.nombre} {periodo.es_actual && '(Actual)'}
                                    </option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Info del Periodo */}
                {periodoActual && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-5 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-blue-900">{periodoActual.nombre}</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    {formatDate(periodoActual.inicio)} — {formatDate(periodoActual.fin)}
                                    {periodoActual.porcentaje && <span className="ml-2">• Peso: {periodoActual.porcentaje}%</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estadísticas Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Promedio Global */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Promedio {selectedPeriodId ? 'del Periodo' : 'Global'}
                                    </h2>
                                    <p className="text-sm opacity-90 mt-1">
                                        {selectedPeriodId ? periodoActual?.nombre : 'Todo el año académico'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="flex items-baseline gap-2">
                                <p className={`text-6xl font-bold ${getGradeColor(promedioGeneral)}`}>
                                    {promedioGeneral > 0 ? promedioGeneral.toFixed(1) : '—'}
                                </p>
                                <p className="text-lg text-gray-400 font-medium">/5.0</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-700">
                                    {promedioGeneral > 0 ? getMessage(promedioGeneral) : 'Sin calificaciones aún'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de Asignaturas */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Resumen de Asignaturas
                            </h2>
                            <p className="text-sm opacity-90 mt-1">Total: {estadisticas.total_asignaturas}</p>
                        </div>
                        <div className="p-6 sm:p-8 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Aprobadas</span>
                                <span className="text-xl font-bold text-blue-600">{estadisticas.asignaturas_aprobadas}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Reprobadas</span>
                                <span className="text-xl font-bold text-red-600">{estadisticas.asignaturas_reprobadas}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Sin calificar</span>
                                <span className="text-xl font-bold text-gray-400">{estadisticas.asignaturas_sin_calificar}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estadísticas de Evaluaciones */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl shadow-md p-5 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold text-blue-600">{estadisticas.total_evaluaciones || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Calificadas</p>
                                <p className="text-2xl font-bold text-blue-600">{estadisticas.evaluaciones_calificadas || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-5 border border-yellow-200 col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-50 p-3 rounded-lg">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pendientes</p>
                                <p className="text-2xl font-bold text-yellow-600">{estadisticas.evaluaciones_pendientes || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notas por Materia */}
                <div className="space-y-4">
                    {materias.length > 0 ? (
                        materias.map((materia) => (
                            <div
                                key={materia.id}
                                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-2xl"
                            >
                                {/* Header de la materia */}
                                <button
                                    onClick={() => toggleMateria(materia.id)}
                                    className={`w-full p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between hover:opacity-90 transition-opacity ${getGradeBg(materia.promedio)}`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm flex-shrink-0">
                                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">{materia.name}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <p className="text-xs sm:text-sm text-gray-600">{materia.code}</p>
                                                <span className="text-gray-400">•</span>
                                                <p className="text-xs sm:text-sm text-gray-600">{materia.group_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-2">
                                        <div className="text-right">
                                            <p className="text-xs sm:text-sm text-gray-600">Promedio</p>
                                            <p className={`text-2xl sm:text-3xl font-bold ${getGradeColor(materia.promedio)}`}>
                                                {materia.promedio > 0 ? materia.promedio.toFixed(1) : 'N/A'}
                                            </p>
                                        </div>
                                        {expandedMateria === materia.id
                                            ? <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                            : <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                        }
                                    </div>
                                </button>

                                {/* Contenido expandible */}
                                {expandedMateria === materia.id && (
                                    <div className="p-4 sm:p-6">
                                        {/* Mini estadísticas */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Total</p>
                                                <p className="text-lg sm:text-xl font-bold text-blue-600">{materia.stats.total}</p>
                                            </div>
                                            <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Calificadas</p>
                                                <p className="text-lg sm:text-xl font-bold text-indigo-600">{materia.stats.calificadas}</p>
                                            </div>
                                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Pendientes</p>
                                                <p className="text-lg sm:text-xl font-bold text-yellow-600">{materia.stats.pendientes}</p>
                                            </div>
                                        </div>

                                        {/* Tabla de notas */}
                                        {materia.notas.length === 0 ? (
                                            <div className="text-center py-8 sm:py-12 text-gray-500">
                                                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                                                <p className="text-sm sm:text-base">No hay calificaciones registradas</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Vista mobile */}
                                                <div className="sm:hidden space-y-3">
                                                    {materia.notas.map((nota, idx) => (
                                                        <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                        <span className="font-semibold text-gray-800 text-sm truncate">{nota.nombre}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(nota.estado).class}`}>
                                                                            {getStatusBadge(nota.estado).text}
                                                                        </span>
                                                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{nota.tipo}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right ml-2">
                                                                    <p className={`text-2xl font-bold ${getGradeColor(nota.valor)}`}>
                                                                        {nota.valor !== null ? nota.valor.toFixed(1) : '—'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">/ {nota.max_score.toFixed(1)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-600 pt-2 border-t border-gray-200">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {formatDate(nota.fecha)}
                                                            </div>
                                                            {nota.feedback && (
                                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                                    <p className="text-xs text-gray-600 font-medium mb-1">Retroalimentación:</p>
                                                                    <p className="text-xs text-gray-700">{nota.feedback}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Vista desktop */}
                                                <div className="hidden sm:block overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                            <tr>
                                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Evaluación</th>
                                                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Nota</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {materia.notas.map((nota, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                            <div className="min-w-0">
                                                                                <span className="font-medium text-gray-800 block truncate">{nota.nombre}</span>
                                                                                {nota.feedback && (
                                                                                    <span className="text-xs text-gray-500 block truncate" title={nota.feedback}>
                                                                                        💬 {nota.feedback}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded">
                                                                            {nota.tipo}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                                                            <Calendar className="w-4 h-4" />
                                                                            {formatDate(nota.fecha)}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className={`text-xs font-medium px-2.5 py-1 rounded ${getStatusBadge(nota.estado).class}`}>
                                                                            {getStatusBadge(nota.estado).text}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className={`text-xl font-bold ${getGradeColor(nota.valor)}`}>
                                                                            {nota.valor !== null ? nota.valor.toFixed(1) : '—'}
                                                                        </span>
                                                                        <span className="text-sm text-gray-500"> / {nota.max_score.toFixed(1)}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
                            <Award className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay calificaciones disponibles</h3>
                            <p className="text-gray-600">
                                {selectedPeriodId
                                    ? 'No tienes calificaciones registradas para este periodo'
                                    : 'Aún no tienes calificaciones registradas'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}