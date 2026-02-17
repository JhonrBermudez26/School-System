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

    // Estados para filtros
    const [selectedPeriodId, setSelectedPeriodId] = useState(selectedPeriod?.id || '');
    const [selectedGradeId, setSelectedGradeId] = useState(filters?.grade_id || '');

    // Convertir performanceByGrade a array si viene como objeto
    const performanceByGradeArray = Array.isArray(performanceByGrade) 
        ? performanceByGrade 
        : Object.values(performanceByGrade || {});

    const performanceByGroupArray = Array.isArray(performanceByGroup)
        ? performanceByGroup
        : Object.values(performanceByGroup || {});

    const performanceBySubjectArray = Array.isArray(performanceBySubject)
        ? performanceBySubject
        : Object.values(performanceBySubject || {});

    const atRiskStudentsArray = Array.isArray(atRiskStudents)
        ? atRiskStudents
        : Object.values(atRiskStudents || {});

    if (error) {
        return (
            <Layout title="Rendimiento Institucional">
                <Head title="Rendimiento" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <p className="text-xl font-bold text-gray-700">{error}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Por favor, crea un periodo académico para continuar
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    const handleApplyFilters = () => {
        router.get(route('rector.performance'), {
            period_id: selectedPeriodId,
            grade_id: selectedGradeId
        });
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setSelectedPeriodId(selectedPeriod?.id || '');
        setSelectedGradeId('');
        router.get(route('rector.performance'), {
            period_id: selectedPeriod?.id
        });
        setShowFilters(false);
    };

    const handleExport = () => {
        setShowExportModal(true);
    };

    const confirmExport = () => {
        const url = exportFormat === 'pdf' 
            ? route('rector.performance.export.pdf')
            : route('rector.performance.export.excel');

        const params = new URLSearchParams({
            period_id: selectedPeriod.id
        });

        if (selectedGradeId) {
            params.append('grade_id', selectedGradeId);
        }

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

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 flex items-center">
                            <BarChart3 className="h-10 w-10 text-indigo-600 mr-3" />
                            Rendimiento Institucional
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            Análisis estratégico del desempeño académico
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold hover:border-indigo-500 hover:text-indigo-600 transition"
                        >
                            <Filter className="h-5 w-5" />
                            Filtros
                            {selectedGradeId && (
                                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">1</span>
                            )}
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                        >
                            <Download className="h-5 w-5" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Panel de Filtros */}
                {showFilters && (
                    <div className="mt-4 bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                                    Periodo Académico
                                </label>
                                <select
                                    value={selectedPeriodId}
                                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    {periods.map(period => (
                                        <option key={period.id} value={period.id}>
                                            {period.name} {period.is_active && '(Activo)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                                    Grado
                                </label>
                                <select
                                    value={selectedGradeId}
                                    onChange={(e) => setSelectedGradeId(e.target.value)}
                                    className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Todos los grados</option>
                                    {grades.map(grade => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleClearFilters}
                                className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition"
                            >
                                Limpiar
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                            >
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Indicador de Periodo Actual */}
            <div className="mb-6 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 font-medium">Periodo:</span>
                <span className="font-black text-indigo-600">{selectedPeriod?.name || 'N/A'}</span>
                {selectedGradeId && grades.find(g => g.id == selectedGradeId) && (
                    <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 font-medium">Grado:</span>
                        <span className="font-black text-indigo-600">
                            {grades.find(g => g.id == selectedGradeId)?.nombre}
                        </span>
                    </>
                )}
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition">
                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Promedio Institucional</p>
                    <p className="text-4xl font-black">{kpis.institutional_average || 0}</p>
                    <p className="text-xs mt-2 opacity-90">{kpis.total_students || 0} estudiantes</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition">
                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Tasa de Aprobación</p>
                    <p className="text-4xl font-black">{kpis.approval_rate || 0}%</p>
                    <p className="text-xs mt-2 opacity-90">{kpis.approved_students || 0} aprobados</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition">
                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Tasa de Reprobación</p>
                    <p className="text-4xl font-black">{kpis.failure_rate || 0}%</p>
                    <p className="text-xs mt-2 opacity-90">{kpis.failed_students || 0} reprobados</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition">
                    <p className="text-xs font-bold uppercase opacity-80 mb-1">Estudiantes en Riesgo</p>
                    <p className="text-4xl font-black">{atRiskStudentsArray.length || 0}</p>
                    <p className="text-xs mt-2 opacity-90">Requieren atención</p>
                </div>
            </div>

            {/* Comparación con Periodo Anterior */}
            {periodComparison && (
                <div className="bg-white p-6 rounded-2xl shadow-md mb-8 border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
                        Comparativa con Periodo Anterior
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Periodo Anterior</p>
                            <p className="text-2xl font-black text-gray-700">{periodComparison.previous_period.average}</p>
                            <p className="text-xs text-gray-500">{previousPeriod?.name || 'N/A'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Periodo Actual</p>
                            <p className="text-2xl font-black text-indigo-600">{periodComparison.current_period.average}</p>
                            <p className="text-xs text-gray-500">{selectedPeriod?.name || 'N/A'}</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Variación</p>
                            <div className="flex items-center gap-2">
                                {getTrendIcon(periodComparison.trend)}
                                <p className={`text-2xl font-black ${
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
            <div className="bg-white rounded-2xl shadow-md mb-8 border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
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
                                    className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition whitespace-nowrap ${
                                        selectedTab === tab.id
                                            ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6">
                    {/* Vista General */}
                    {selectedTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Rendimiento por Grado */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-4">Rendimiento por Grado</h3>
                                {performanceByGradeArray.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {performanceByGradeArray.map((grade, index) => (
                                            <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Grado {grade.grade}</p>
                                                <p className="text-3xl font-black text-indigo-600">{grade.average}</p>
                                                <p className="text-xs text-gray-500 mt-1">{grade.student_count} estudiantes</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No hay datos de rendimiento por grado</p>
                                )}
                            </div>

                            {/* Distribución de Notas */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-4">Distribución de Calificaciones</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(gradeDistribution).map(([range, count]) => {
                                        let bgColor = 'from-red-50 to-red-100';
                                        let textColor = 'text-red-600';
                                        
                                        if (range === '3.0-3.9') {
                                            bgColor = 'from-yellow-50 to-yellow-100';
                                            textColor = 'text-yellow-600';
                                        } else if (range === '4.0-4.5') {
                                            bgColor = 'from-blue-50 to-blue-100';
                                            textColor = 'text-blue-600';
                                        } else if (range === '4.6-5.0') {
                                            bgColor = 'from-green-50 to-green-100';
                                            textColor = 'text-green-600';
                                        }

                                        return (
                                            <div key={range} className={`bg-gradient-to-br ${bgColor} p-5 rounded-xl text-center border border-gray-200 hover:shadow-md transition`}>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{range}</p>
                                                <p className={`text-3xl font-black ${textColor}`}>{count}</p>
                                                <p className="text-xs text-gray-500 mt-1">estudiantes</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Ranking */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                                        <Award className="h-5 w-5 text-green-600 mr-2" />
                                        Top 5 Mejores Grupos
                                    </h3>
                                    <div className="space-y-2">
                                        {ranking.top_performers?.slice(0, 5).map((group, idx) => (
                                            <div key={group.group_id} className="flex items-center justify-between bg-green-50 p-4 rounded-xl hover:bg-green-100 transition">
                                                <div className="flex items-center">
                                                    <span className="flex items-center justify-center h-8 w-8 bg-green-600 text-white font-black rounded-full mr-3">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-gray-800">{group.group_name}</span>
                                                </div>
                                                <span className="font-black text-green-700 text-lg">{group.average}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                                        Mayor Reprobación
                                    </h3>
                                    <div className="space-y-2">
                                        {ranking.highest_failure?.slice(0, 5).map((group, idx) => (
                                            <div key={group.group_id} className="flex items-center justify-between bg-red-50 p-4 rounded-xl hover:bg-red-100 transition">
                                                <div className="flex items-center">
                                                    <span className="flex items-center justify-center h-8 w-8 bg-red-600 text-white font-black rounded-full mr-3">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-gray-800">{group.group_name}</span>
                                                </div>
                                                <span className="font-black text-red-700 text-lg">{group.failed_percentage}%</span>
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black text-gray-900">Desempeño por Grupo</h3>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-gray-50 border-0 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
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
                                                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Grupo</th>
                                                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Grado</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Promedio</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">% Reprobados</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Nota Más Alta</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Nota Más Baja</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Estudiantes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sortGroups(performanceByGroupArray).map((group) => (
                                                <tr key={group.group_id} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3 font-bold text-gray-800">{group.group_name}</td>
                                                    <td className="px-4 py-3 text-gray-600">{group.grade}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-black text-indigo-600 text-lg">{group.average}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${group.failed_percentage > 20 ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {group.failed_percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-green-600 font-bold">{group.highest_grade}</td>
                                                    <td className="px-4 py-3 text-center text-red-600 font-bold">{group.lowest_grade}</td>
                                                    <td className="px-4 py-3 text-center text-gray-600 font-bold">{group.student_count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No hay datos de rendimiento por grupo</p>
                            )}
                        </div>
                    )}

                    {/* Por Asignatura */}
                    {selectedTab === 'subjects' && (
                        <div>
                            <h3 className="text-lg font-black text-gray-900 mb-4">Desempeño por Asignatura</h3>
                            {performanceBySubjectArray.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Asignatura</th>
                                                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase">Docente</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Promedio</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">% Reprobación</th>
                                                {previousPeriod && (
                                                    <>
                                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Anterior</th>
                                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase">Variación</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {performanceBySubjectArray.map((subject) => (
                                                <tr key={subject.subject_id} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{subject.subject_name}</p>
                                                            <p className="text-xs text-gray-500">{subject.subject_code}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{subject.teacher_name}</td>
                                                    <td className="px-4 py-3 text-center font-black text-indigo-600 text-lg">{subject.average}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${subject.failure_rate > 30 ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {subject.failure_rate}%
                                                        </span>
                                                    </td>
                                                    {previousPeriod && (
                                                        <>
                                                            <td className="px-4 py-3 text-center text-gray-600 font-bold">
                                                                {subject.previous_average || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {subject.variation !== null && (
                                                                    <span className={`font-bold flex items-center justify-center gap-1 ${
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
                                <p className="text-center text-gray-500 py-8">No hay datos de rendimiento por asignatura</p>
                            )}
                        </div>
                    )}

                    {/* Estudiantes en Riesgo */}
                    {selectedTab === 'risk' && (
                        <div>
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
                                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                                Estudiantes en Riesgo Académico ({atRiskStudentsArray.length})
                            </h3>

                            {atRiskStudentsArray.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-red-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-black text-red-700 uppercase">Estudiante</th>
                                                <th className="px-4 py-3 text-left text-xs font-black text-red-700 uppercase">Grupo</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-red-700 uppercase">Promedio</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-red-700 uppercase">Materias Perdidas</th>
                                                <th className="px-4 py-3 text-center text-xs font-black text-red-700 uppercase">% Inasistencia</th>
                                                <th className="px-4 py-3 text-left text-xs font-black text-red-700 uppercase">Factores de Riesgo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-100">
                                            {atRiskStudentsArray.map((student) => (
                                                <tr key={student.student_id} className="hover:bg-red-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{student.student_name}</p>
                                                            <p className="text-xs text-gray-500">{student.document_number}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{student.group_name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="font-black text-red-600 text-lg">{student.average}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-700">{student.failed_subjects}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-700">{student.absence_rate}%</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {student.risk_reasons?.map((reason, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
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
                                    <p className="text-gray-500 font-bold">No hay estudiantes en riesgo académico</p>
                                    <p className="text-sm text-gray-400 mt-1">¡Excelente trabajo del equipo docente!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Exportación */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-gray-900">Exportar Reporte</h2>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                                exportFormat === 'pdf' 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-gray-200 hover:border-indigo-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="pdf"
                                    checked={exportFormat === 'pdf'}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="mr-3"
                                />
                                <FileText className="h-5 w-5 text-red-600 mr-3" />
                                <div>
                                    <p className="font-bold text-gray-800">PDF</p>
                                    <p className="text-xs text-gray-500">Documento portable con formato profesional</p>
                                </div>
                            </label>

                            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                                exportFormat === 'excel' 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-gray-200 hover:border-indigo-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="format"
                                    value="excel"
                                    checked={exportFormat === 'excel'}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="mr-3"
                                />
                                <FileSpreadsheet className="h-5 w-5 text-green-600 mr-3" />
                                <div>
                                    <p className="font-bold text-gray-800">Excel</p>
                                    <p className="text-xs text-gray-500">Hoja de cálculo editable con múltiples pestañas</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmExport}
                                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                            >
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}