// resources/js/Pages/Rector/Performance.jsx
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    TrendingUp, TrendingDown, Minus, Users, Award,
    AlertTriangle, BarChart3, Download, Filter,
    ChevronUp, ChevronDown, FileText, FileSpreadsheet,
    X, Calendar, BookOpen, Target
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Performance({
    kpis = {},
    performanceByGrade = [],
    performanceByGroup = [],
    performanceBySubject = [],
    periodComparison = null,
    ranking = { top_performers: [], worst_performers: [], highest_failure: [] },
    gradeDistribution = {},
    atRiskStudents = [],
    periods = [],
    grades = [],
    selectedPeriod = null,
    previousPeriod = null,
    filters = {},
    error = null
}) {
    const [selectedTab, setSelectedTab] = useState('overview');
    const [sortBy, setSortBy] = useState('average');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('pdf');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPeriodId, setSelectedPeriodId] = useState(selectedPeriod?.id || '');
    const [selectedGradeId, setSelectedGradeId] = useState(filters?.grade_id || '');

    const performanceByGradeArray = Array.isArray(performanceByGrade)
        ? performanceByGrade : Object.values(performanceByGrade || {});
    const performanceByGroupArray = Array.isArray(performanceByGroup)
        ? performanceByGroup : Object.values(performanceByGroup || {});
    const performanceBySubjectArray = Array.isArray(performanceBySubject)
        ? performanceBySubject : Object.values(performanceBySubject || {});
    const atRiskStudentsArray = Array.isArray(atRiskStudents)
        ? atRiskStudents : Object.values(atRiskStudents || {});

    if (error) {
        return (
            <Layout title="Rendimiento Institucional">
                <Head title="Rendimiento" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <p className="text-xl font-bold text-gray-700">{error}</p>
                        <p className="text-sm text-gray-500 mt-2">Por favor, crea un periodo académico para continuar</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const handleApplyFilters = () => {
        router.get(route('rector.performance'), { period_id: selectedPeriodId, grade_id: selectedGradeId });
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setSelectedPeriodId(selectedPeriod?.id || '');
        setSelectedGradeId('');
        router.get(route('rector.performance'), { period_id: selectedPeriod?.id });
        setShowFilters(false);
    };

    const confirmExport = () => {
        const url = exportFormat === 'pdf'
            ? route('rector.performance.export.pdf')
            : route('rector.performance.export.excel');
        const params = new URLSearchParams({ period_id: selectedPeriod.id });
        if (selectedGradeId) params.append('grade_id', selectedGradeId);
        window.location.href = `${url}?${params.toString()}`;
        setShowExportModal(false);
    };

    const getTrendIcon = (trend) => {
        if (trend === 'up') return <TrendingUp className="h-5 w-5 text-green-600" />;
        if (trend === 'down') return <TrendingDown className="h-5 w-5 text-red-600" />;
        return <Minus className="h-5 w-5 text-gray-400" />;
    };

    const sortGroups = (groups) => {
        if (!Array.isArray(groups)) return [];
        return [...groups].sort((a, b) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
    };

    return (
        <Layout title="Rendimiento Institucional">
            <Head title="Rendimiento Académico" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                            <BarChart3 className="h-7 w-7 text-indigo-600" />
                            Rendimiento Institucional
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Análisis estratégico del desempeño académico
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition text-sm"
                        >
                            <Filter className="h-4 w-4" />
                            Filtros
                            {selectedGradeId && (
                                <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm"
                        >
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Filtros Panel */}
                {showFilters && (
                    <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Periodo Académico</label>
                                <select
                                    value={selectedPeriodId}
                                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {periods.map(period => (
                                        <option key={period.id} value={period.id}>
                                            {period.name} {period.is_active && '(Activo)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Grado</label>
                                <select
                                    value={selectedGradeId}
                                    onChange={(e) => setSelectedGradeId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Todos los grados</option>
                                    {grades.map(grade => (
                                        <option key={grade.id} value={grade.id}>{grade.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition text-sm">Limpiar</button>
                            <button onClick={handleApplyFilters} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition text-sm">Aplicar Filtros</button>
                        </div>
                    </div>
                )}

                {/* Periodo Indicador */}
                <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 w-fit">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600 font-medium">Periodo:</span>
                    <span className="font-bold text-indigo-600">{selectedPeriod?.name || 'N/A'}</span>
                    {selectedGradeId && grades.find(g => g.id == selectedGradeId) && (
                        <>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-600 font-medium">Grado:</span>
                            <span className="font-bold text-indigo-600">{grades.find(g => g.id == selectedGradeId)?.nombre}</span>
                        </>
                    )}
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 sm:p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition">
                        <p className="text-xs font-semibold uppercase opacity-80 mb-1">Promedio Institucional</p>
                        <p className="text-3xl sm:text-4xl font-bold">{kpis.institutional_average || 0}</p>
                        <p className="text-xs mt-1.5 opacity-90">{kpis.total_students || 0} estudiantes</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 sm:p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition">
                        <p className="text-xs font-semibold uppercase opacity-80 mb-1">Tasa de Aprobación</p>
                        <p className="text-3xl sm:text-4xl font-bold">{kpis.approval_rate || 0}%</p>
                        <p className="text-xs mt-1.5 opacity-90">{kpis.approved_students || 0} aprobados</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 sm:p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition">
                        <p className="text-xs font-semibold uppercase opacity-80 mb-1">Tasa de Reprobación</p>
                        <p className="text-3xl sm:text-4xl font-bold">{kpis.failure_rate || 0}%</p>
                        <p className="text-xs mt-1.5 opacity-90">{kpis.failed_students || 0} reprobados</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 sm:p-5 rounded-xl text-white shadow-lg hover:shadow-xl transition">
                        <p className="text-xs font-semibold uppercase opacity-80 mb-1">Estudiantes en Riesgo</p>
                        <p className="text-3xl sm:text-4xl font-bold">{atRiskStudentsArray.length || 0}</p>
                        <p className="text-xs mt-1.5 opacity-90">Requieren atención</p>
                    </div>
                </div>

                {/* Comparación Periodo */}
                {periodComparison && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
                            <h3 className="text-base font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Comparativa con Periodo Anterior
                            </h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Periodo Anterior</p>
                                <p className="text-2xl font-bold text-gray-700">{periodComparison.previous_period.average}</p>
                                <p className="text-xs text-gray-500">{previousPeriod?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Periodo Actual</p>
                                <p className="text-2xl font-bold text-indigo-600">{periodComparison.current_period.average}</p>
                                <p className="text-xs text-gray-500">{selectedPeriod?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Variación</p>
                                <div className="flex items-center gap-2">
                                    {getTrendIcon(periodComparison.trend)}
                                    <p className={`text-2xl font-bold ${
                                        periodComparison.trend === 'up' ? 'text-green-600' :
                                        periodComparison.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                        {periodComparison.variation > 0 ? '+' : ''}{periodComparison.variation}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1">
                        <div className="flex overflow-x-auto gap-1">
                            {[
                                { id: 'overview', label: 'Vista General', icon: BarChart3 },
                                { id: 'groups', label: 'Por Grupo', icon: Users },
                                { id: 'subjects', label: 'Por Asignatura', icon: BookOpen },
                                { id: 'risk', label: 'En Riesgo', icon: AlertTriangle },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-sm transition whitespace-nowrap rounded-xl ${
                                            selectedTab === tab.id
                                                ? 'bg-white text-indigo-700 shadow-md'
                                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {/* Vista General */}
                        {selectedTab === 'overview' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-4">Rendimiento por Grado</h3>
                                    {performanceByGradeArray.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {performanceByGradeArray.map((grade, index) => (
                                                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Grado {grade.grade}</p>
                                                    <p className="text-3xl font-bold text-indigo-600">{grade.average}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{grade.student_count} estudiantes</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500 py-8 text-sm">No hay datos de rendimiento por grado</p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-4">Distribución de Calificaciones</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                        {Object.entries(gradeDistribution).map(([range, count]) => {
                                            let bgColor = 'from-red-50 to-red-100'; let textColor = 'text-red-600';
                                            if (range === '3.0-3.9') { bgColor = 'from-yellow-50 to-yellow-100'; textColor = 'text-yellow-600'; }
                                            else if (range === '4.0-4.5') { bgColor = 'from-blue-50 to-blue-100'; textColor = 'text-blue-600'; }
                                            else if (range === '4.6-5.0') { bgColor = 'from-green-50 to-green-100'; textColor = 'text-green-600'; }
                                            return (
                                                <div key={range} className={`bg-gradient-to-br ${bgColor} p-4 rounded-xl text-center border border-gray-200 hover:shadow-md transition`}>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{range}</p>
                                                    <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
                                                    <p className="text-xs text-gray-500 mt-1">estudiantes</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Award className="h-5 w-5 text-green-600" />
                                            Top 5 Mejores Grupos
                                        </h3>
                                        <div className="space-y-2">
                                            {ranking.top_performers?.slice(0, 5).map((group, idx) => (
                                                <div key={group.group_id} className="flex items-center justify-between bg-green-50 p-3.5 rounded-xl hover:bg-green-100 transition border border-green-100">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center justify-center h-7 w-7 bg-green-600 text-white font-bold rounded-full text-sm">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-semibold text-gray-800 text-sm">{group.group_name}</span>
                                                    </div>
                                                    <span className="font-bold text-green-700">{group.average}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                            Mayor Reprobación
                                        </h3>
                                        <div className="space-y-2">
                                            {ranking.highest_failure?.slice(0, 5).map((group, idx) => (
                                                <div key={group.group_id} className="flex items-center justify-between bg-red-50 p-3.5 rounded-xl hover:bg-red-100 transition border border-red-100">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center justify-center h-7 w-7 bg-red-600 text-white font-bold rounded-full text-sm">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-semibold text-gray-800 text-sm">{group.group_name}</span>
                                                    </div>
                                                    <span className="font-bold text-red-700">{group.failed_percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Por Grupo */}
                        {selectedTab === 'groups' && (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                    <h3 className="text-base font-bold text-gray-900">Desempeño por Grupo</h3>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="average">Ordenar por Promedio</option>
                                        <option value="failed_percentage">Ordenar por Reprobación</option>
                                        <option value="student_count">Ordenar por Cantidad</option>
                                    </select>
                                </div>
                                {performanceByGroupArray.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grupo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grado</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Promedio</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">% Reprobados</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Nota Más Alta</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Nota Más Baja</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estudiantes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {sortGroups(performanceByGroupArray).map((group) => (
                                                    <tr key={group.group_id} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{group.group_name}</td>
                                                        <td className="px-4 py-3 text-gray-600 text-sm">{group.grade}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="font-bold text-indigo-600">{group.average}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-semibold text-sm ${group.failed_percentage > 20 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                {group.failed_percentage}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-green-600 font-semibold hidden sm:table-cell">{group.highest_grade}</td>
                                                        <td className="px-4 py-3 text-center text-red-600 font-semibold hidden sm:table-cell">{group.lowest_grade}</td>
                                                        <td className="px-4 py-3 text-center text-gray-600 font-semibold text-sm">{group.student_count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8 text-sm">No hay datos de rendimiento por grupo</p>
                                )}
                            </div>
                        )}

                        {/* Por Asignatura */}
                        {selectedTab === 'subjects' && (
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-4">Desempeño por Asignatura</h3>
                                {performanceBySubjectArray.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignatura</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Docente</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Promedio</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">% Reprobación</th>
                                                    {previousPeriod && (
                                                        <>
                                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Anterior</th>
                                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Variación</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {performanceBySubjectArray.map((subject) => (
                                                    <tr key={subject.subject_id} className="hover:bg-blue-50/30 transition">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-semibold text-gray-800 text-sm">{subject.subject_name}</p>
                                                                <p className="text-xs text-gray-400">{subject.subject_code}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{subject.teacher_name}</td>
                                                        <td className="px-4 py-3 text-center font-bold text-indigo-600">{subject.average}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-semibold text-sm ${subject.failure_rate > 30 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                {subject.failure_rate}%
                                                            </span>
                                                        </td>
                                                        {previousPeriod && (
                                                            <>
                                                                <td className="px-4 py-3 text-center text-gray-600 font-semibold hidden md:table-cell">
                                                                    {subject.previous_average || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-center hidden md:table-cell">
                                                                    {subject.variation !== null && (
                                                                        <span className={`font-semibold flex items-center justify-center gap-1 text-sm ${
                                                                            subject.variation > 0 ? 'text-green-600' :
                                                                            subject.variation < 0 ? 'text-red-600' : 'text-gray-600'
                                                                        }`}>
                                                                            {subject.variation > 0 ? <ChevronUp className="h-4 w-4" /> :
                                                                             subject.variation < 0 ? <ChevronDown className="h-4 w-4" /> : null}
                                                                            {subject.variation > 0 ? '+' : ''}{subject.variation}%
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8 text-sm">No hay datos de rendimiento por asignatura</p>
                                )}
                            </div>
                        )}

                        {/* Estudiantes en Riesgo */}
                        {selectedTab === 'risk' && (
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Estudiantes en Riesgo Académico ({atRiskStudentsArray.length})
                                </h3>
                                {atRiskStudentsArray.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-red-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase">Estudiante</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase hidden sm:table-cell">Grupo</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-red-700 uppercase">Promedio</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-red-700 uppercase">Mat. Perdidas</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-red-700 uppercase hidden md:table-cell">% Inasistencia</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase hidden lg:table-cell">Factores de Riesgo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-100">
                                                {atRiskStudentsArray.map((student) => (
                                                    <tr key={student.student_id} className="hover:bg-red-50 transition">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-semibold text-gray-800 text-sm">{student.student_name}</p>
                                                                <p className="text-xs text-gray-400">{student.document_number}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{student.group_name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="font-bold text-red-600">{student.average}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-semibold text-gray-700 text-sm">{student.failed_subjects}</td>
                                                        <td className="px-4 py-3 text-center font-semibold text-gray-700 text-sm hidden md:table-cell">{student.absence_rate}%</td>
                                                        <td className="px-4 py-3 hidden lg:table-cell">
                                                            <div className="flex flex-wrap gap-1">
                                                                {student.risk_reasons?.map((reason, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                                                        {reason}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-semibold">No hay estudiantes en riesgo académico</p>
                                        <p className="text-sm text-gray-400 mt-1">¡Excelente trabajo del equipo docente!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold">Exportar Reporte</h2>
                                <button onClick={() => setShowExportModal(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${exportFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                <input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={(e) => setExportFormat(e.target.value)} className="mr-3" />
                                <FileText className="h-5 w-5 text-red-600 mr-3" />
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">PDF</p>
                                    <p className="text-xs text-gray-500">Documento portable con formato profesional</p>
                                </div>
                            </label>
                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${exportFormat === 'excel' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                                <input type="radio" name="format" value="excel" checked={exportFormat === 'excel'} onChange={(e) => setExportFormat(e.target.value)} className="mr-3" />
                                <FileSpreadsheet className="h-5 w-5 text-green-600 mr-3" />
                                <div>
                                    <p className="font-semibold text-gray-800 text-sm">Excel</p>
                                    <p className="text-xs text-gray-500">Hoja de cálculo editable con múltiples pestañas</p>
                                </div>
                            </label>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button onClick={() => setShowExportModal(false)} className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">Cancelar</button>
                            <button onClick={confirmExport} className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-md text-sm">Exportar</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}