import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Calendar, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertCircle,
    BookOpen,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    User,
    Award
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Asistencias({ 
    materias = [], 
    estadisticas = null, 
    currentPeriod = null,
    error = null 
}) {
    const [expandedMateria, setExpandedMateria] = useState(null);

    const toggleMateria = (materiaId) => {
        setExpandedMateria(expandedMateria === materiaId ? null : materiaId);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800 border-green-300';
            case 'absent': return 'bg-red-100 text-red-800 border-red-300';
            case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'excused': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle className="h-4 w-4" />;
            case 'absent': return <XCircle className="h-4 w-4" />;
            case 'late': return <Clock className="h-4 w-4" />;
            case 'excused': return <AlertCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            present: 'Presente',
            absent: 'Ausente',
            late: 'Tarde',
            excused: 'Excusado'
        };
        return labels[status] || status;
    };

    const getPercentageColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 75) return 'text-blue-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPercentageBg = (percentage) => {
        if (percentage >= 90) return 'bg-green-50 border-green-200';
        if (percentage >= 75) return 'bg-blue-50 border-blue-200';
        if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <Layout>
            <Head title="Mis Asistencias" />
            
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                        Mis Asistencias
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                        {currentPeriod 
                            ? `Periodo: ${currentPeriod.name}` 
                            : 'Consulta tu registro de asistencias'}
                    </p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6 sm:p-8 text-center">
                        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-red-900 mb-2">
                            {error.includes('período') ? 'Sin Período Activo' : 'Sin Grupo Asignado'}
                        </h3>
                        <p className="text-sm sm:text-base text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {/* Estadísticas Globales */}
                {estadisticas && !error && (
                    <>
                        {/* Card de Porcentaje Global */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6 sm:mb-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Porcentaje de Asistencia Global
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {currentPeriod ? currentPeriod.name : 'Periodo actual'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className={`text-5xl sm:text-6xl font-bold ${getPercentageColor(estadisticas.porcentaje_global)}`}>
                                        {estadisticas.porcentaje_global}%
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        {estadisticas.porcentaje_global >= 90 ? '¡Excelente!' : 
                                         estadisticas.porcentaje_global >= 75 ? '¡Muy bien!' : 
                                         estadisticas.porcentaje_global >= 60 ? 'Puede mejorar' : 
                                         'Necesita mejorar'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Estadísticas */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600">Total</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {estadisticas.total_clases}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-green-50 p-2 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600">Presentes</p>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {estadisticas.total_presente}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-red-50 p-2 rounded-lg">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600">Ausentes</p>
                                </div>
                                <p className="text-2xl font-bold text-red-600">
                                    {estadisticas.total_ausente}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-yellow-50 p-2 rounded-lg">
                                        <Clock className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600">Tarde</p>
                                </div>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {estadisticas.total_tarde}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-600">Excusados</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {estadisticas.total_excusado}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Asistencias por Materia */}
                {materias.length > 0 && !error && (
                    <div className="space-y-4">
                        {materias.map((materia) => (
                            <div 
                                key={`${materia.subject_id}-${materia.group_id}`}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Header Clickeable */}
                                <button
                                    onClick={() => toggleMateria(`${materia.subject_id}-${materia.group_id}`)}
                                    className={`w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                        getPercentageBg(materia.stats.attendance_percentage)
                                    }`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm flex-shrink-0">
                                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                                                {materia.subject_name}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-600">
                                                <span>{materia.subject_code}</span>
                                                <span>•</span>
                                                <span>{materia.group_name}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:inline flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {materia.teacher_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-2">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Asistencia</p>
                                            <p className={`text-xl sm:text-2xl font-bold ${getPercentageColor(materia.stats.attendance_percentage)}`}>
                                                {materia.stats.attendance_percentage}%
                                            </p>
                                        </div>
                                        {expandedMateria === `${materia.subject_id}-${materia.group_id}` ? 
                                            <ChevronUp className="w-5 h-5 text-gray-400" /> :
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        }
                                    </div>
                                </button>

                                {/* Contenido Expandible */}
                                {expandedMateria === `${materia.subject_id}-${materia.group_id}` && (
                                    <div className="border-t border-gray-200 p-4 sm:p-6">
                                        {/* Mini Estadísticas */}
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Total</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {materia.stats.total}
                                                </p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Presentes</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {materia.stats.present}
                                                </p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Ausentes</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    {materia.stats.absent}
                                                </p>
                                            </div>
                                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Tarde</p>
                                                <p className="text-lg font-bold text-yellow-600">
                                                    {materia.stats.late}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
                                                <p className="text-xs text-gray-600 mb-1">Excusados</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {materia.stats.excused}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Lista de Asistencias */}
                                        {materia.attendances.length > 0 ? (
                                            <div className="space-y-2 sm:space-y-0">
                                                {/* Vista Desktop - Tabla */}
                                                <div className="hidden sm:block overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 border-b">
                                                            <tr>
                                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Fecha</th>
                                                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-600">Estado</th>
                                                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600">Observaciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {materia.attendances.map((record) => (
                                                                <tr key={record.id} className="hover:bg-gray-50">
                                                                    <td className="py-3 px-4">
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {record.formatted_date}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                                                            {getStatusIcon(record.status)}
                                                                            {getStatusLabel(record.status)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                                        {record.notes || '—'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Vista Mobile - Cards */}
                                                <div className="sm:hidden space-y-3">
                                                    {materia.attendances.map((record) => (
                                                        <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-600">
                                                                        {record.day_name}
                                                                    </p>
                                                                    <p className="text-sm font-bold text-gray-900">
                                                                        {record.short_date}
                                                                    </p>
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                                                                    {getStatusIcon(record.status)}
                                                                    {getStatusLabel(record.status)}
                                                                </span>
                                                            </div>
                                                            {record.notes && (
                                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                                    <p className="text-xs text-gray-600">
                                                                        <strong>Observación:</strong> {record.notes}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                <p className="text-sm">No hay asistencias registradas</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {materias.length === 0 && !error && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                        <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
                            Sin registros
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                            Aún no tienes asistencias registradas
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}