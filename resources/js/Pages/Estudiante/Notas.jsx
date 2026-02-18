import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
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

    // Manejar cambio de periodo
    const handlePeriodChange = (periodId) => {
        setSelectedPeriodId(periodId);

        if (periodId) {
            router.get(route('estudiante.notas'), { period_id: periodId }, {
                preserveState: true,
                preserveScroll: true,
            });
        } else {
            router.get(route('estudiante.notas'), {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    // Función para determinar el color según la nota
    const getGradeColor = (grade) => {
        if (grade === null || grade === undefined) return 'text-gray-400';
        if (grade >= 4.5) return 'text-green-600';
        if (grade >= 4.0) return 'text-blue-600';
        if (grade >= 3.5) return 'text-yellow-600';
        if (grade >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBg = (grade) => {
        if (grade === null || grade === undefined) return 'bg-gray-50 border-gray-200';
        if (grade >= 4.5) return 'bg-green-50 border-green-200';
        if (grade >= 4.0) return 'bg-blue-50 border-blue-200';
        if (grade >= 3.5) return 'bg-yellow-50 border-yellow-200';
        if (grade >= 3.0) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    const getGradeBadge = (grade) => {
        if (grade === null || grade === undefined) return 'bg-gray-100 text-gray-600';
        if (grade >= 4.5) return 'bg-green-100 text-green-700';
        if (grade >= 4.0) return 'bg-blue-100 text-blue-700';
        if (grade >= 3.5) return 'bg-yellow-100 text-yellow-700';
        if (grade >= 3.0) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    const getStatusBadge = (status) => {
        const badges = {
            graded: { text: 'Calificada', class: 'bg-green-100 text-green-700' },
            submitted: { text: 'Entregada', class: 'bg-blue-100 text-blue-700' },
            pending: { text: 'Pendiente', class: 'bg-gray-100 text-gray-700' },
        };
        return badges[status] || badges.pending;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
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

            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                {/* Header con Selector de Periodo */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                                Mis Calificaciones
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">
                                Consulta tu rendimiento académico por periodo
                            </p>
                        </div>

                        {/* Selector de Periodo y Acciones */}
                        <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Periodo Académico
                                </label>
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
                    </div>

                    {/* Info del Periodo Seleccionado */}
                    {periodoActual && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-blue-900">
                                    {periodoActual.nombre}
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    {formatDate(periodoActual.inicio)} — {formatDate(periodoActual.fin)}
                                    {periodoActual.porcentaje && (
                                        <span className="ml-2">
                                            • Peso: {periodoActual.porcentaje}%
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Estadísticas Principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {/* Promedio Global */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Promedio {selectedPeriodId ? 'del Periodo' : 'Global'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {selectedPeriodId ? periodoActual?.nombre : 'Todo el año académico'}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-2.5 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className={`text-5xl sm:text-6xl font-bold ${getGradeColor(promedioGeneral)}`}>
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

                    {/* Estadísticas de Asignaturas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Resumen de Asignaturas
                                </p>
                                <p className="text-xs text-gray-500">
                                    Total: {estadisticas.total_asignaturas}
                                </p>
                            </div>
                            <div className="bg-purple-50 p-2.5 rounded-lg">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Aprobadas</span>
                                <span className="text-lg font-bold text-green-600">
                                    {estadisticas.asignaturas_aprobadas}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Reprobadas</span>
                                <span className="text-lg font-bold text-red-600">
                                    {estadisticas.asignaturas_reprobadas}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Sin calificar</span>
                                <span className="text-lg font-bold text-gray-400">
                                    {estadisticas.asignaturas_sin_calificar}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estadísticas de Evaluaciones - Grid Compacto */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-600">Total</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {estadisticas.total_evaluaciones || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-green-50 p-2 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-600">Calificadas</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {estadisticas.evaluaciones_calificadas || 0}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-amber-50 p-2 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-600">Pendientes</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">
                            {estadisticas.evaluaciones_pendientes || 0}
                        </p>
                    </div>
                </div>

                {/* Notas por Materia */}
                <div className="space-y-4 sm:space-y-6">
                    {materias.length > 0 ? (
                        materias.map((materia) => (
                            <div
                                key={materia.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-xl"
                            >
                                {/* Header de la materia - Clickeable */}
                                <button
                                    onClick={() => toggleMateria(materia.id)}
                                    className={`w-full p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between ${getGradeBg(materia.promedio)} transition-all hover:opacity-90`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm flex-shrink-0">
                                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                                                {materia.name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    {materia.code}
                                                </p>
                                                <span className="text-gray-400">•</span>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    {materia.group_name}
                                                </p>
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
                                        {expandedMateria === materia.id ? (
                                            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Contenido expandible */}
                                {expandedMateria === materia.id && (
                                    <div className="p-4 sm:p-6">
                                        {/* Mini estadísticas */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Total</p>
                                                <p className="text-lg sm:text-xl font-bold text-blue-600">
                                                    {materia.stats.total}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Calificadas</p>
                                                <p className="text-lg sm:text-xl font-bold text-green-600">
                                                    {materia.stats.calificadas}
                                                </p>
                                            </div>
                                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Pendientes</p>
                                                <p className="text-lg sm:text-xl font-bold text-yellow-600">
                                                    {materia.stats.pendientes}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tabla de notas */}
                                        {materia.notas.length === 0 ? (
                                            <div className="text-center py-8 sm:py-12 text-gray-500">
                                                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                                                <p className="text-sm sm:text-base">No hay calificaciones registradas</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 sm:space-y-0">
                                                {/* Vista mobile (cards) */}
                                                <div className="sm:hidden space-y-3">
                                                    {materia.notas.map((nota, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                        <span className="font-semibold text-gray-800 text-sm truncate">
                                                                            {nota.nombre}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(nota.estado).class}`}>
                                                                            {getStatusBadge(nota.estado).text}
                                                                        </span>
                                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                                            {nota.tipo}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right ml-2">
                                                                    <p className={`text-2xl font-bold ${getGradeColor(nota.valor)}`}>
                                                                        {nota.valor !== null ? nota.valor.toFixed(1) : '—'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        / {nota.max_score.toFixed(1)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {formatDate(nota.fecha)}
                                                                </div>
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

                                                {/* Vista desktop (tabla) */}
                                                <div className="hidden sm:block overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b-2 border-gray-200">
                                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Evaluación</th>
                                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Tipo</th>
                                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
                                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Nota</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {materia.notas.map((nota, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <td className="py-3 px-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                            <div className="min-w-0">
                                                                                <span className="font-medium text-gray-800 block truncate">
                                                                                    {nota.nombre}
                                                                                </span>
                                                                                {nota.feedback && (
                                                                                    <span className="text-xs text-gray-500 block truncate" title={nota.feedback}>
                                                                                        💬 {nota.feedback}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded">
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
                                                                        <div>
                                                                            <span className={`text-xl font-bold ${getGradeColor(nota.valor)}`}>
                                                                                {nota.valor !== null ? nota.valor.toFixed(1) : '—'}
                                                                            </span>
                                                                            <span className="text-sm text-gray-500">
                                                                                {' '}/ {nota.max_score.toFixed(1)}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
                            <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                                No hay calificaciones disponibles
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600">
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