import { Head, router } from '@inertiajs/react';
import { Search, PieChart, BarChart2, TrendingUp, TrendingDown, Users, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function SupervisionAcademica({ active_period, groups, stats }) {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (selectedGroup) {
            fetchReport(selectedGroup);
        }
    }, [selectedGroup]);

    const fetchReport = (groupId) => {
        setLoading(true);
        setPerformanceData(null);
        fetch(route('coordinadora.supervision.grupo', { group_id: groupId }))
            .then(res => res.json())
            .then(data => {
                setPerformanceData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    // Genera y descarga el informe del grupo como JSON → abre en nueva pestaña
    // Si tienes una ruta específica de exportación, cámbia la URL aquí.
    const handleExportarInforme = async () => {
        if (!selectedGroup || !performanceData) return;
        setExporting(true);
        try {
            // Llamamos al endpoint de reporte general de rendimiento para el grupo
            const periodId = active_period?.id;
            let url = route('coordinadora.supervision.grupo', { group_id: selectedGroup });
            if (periodId) url += `&period_id=${periodId}`;

            const res = await fetch(url);
            const data = await res.json();

            // Construir CSV simple con los datos del grupo
            const rows = [
                ['Informe de Supervisión Académica'],
                ['Grupo:', data.group?.name || ''],
                ['Grado:', data.group?.grade || ''],
                ['Periodo:', data.period?.name || active_period?.name || 'Actual'],
                [''],
                ['Rendimiento por Estudiante'],
                ['Estudiante', 'Promedio'],
                ...(data.students || []).map(s => [s.name, s.average]),
                [''],
                ['Rendimiento por Asignatura'],
                ['Asignatura', 'Promedio'],
                ...(data.subjects || []).map(s => [s.name, s.average]),
            ];

            const csv = rows.map(r => r.join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `informe_${data.group?.name || 'grupo'}_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            console.error('Error exportando informe:', e);
        } finally {
            setExporting(false);
        }
    };

    return (
        <Layout title="Supervisión Académica">
            <Head title="Supervisión Académica" />
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Supervisión Académica
                        </h1>
                        <p className="text-gray-600 mt-1">Monitoreo de rendimiento institucional y grupal</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">Periodo Actual:</span>
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase border border-indigo-200">
                            {active_period?.name || 'Ninguno'}
                        </span>
                    </div>
                </div>

                {/* Institutional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-blue-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Estudiantes</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                                    {stats.totalStudents || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Total matriculados</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-green-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Promedio General</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">
                                    {stats.overallAverage?.toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Escala institucional (0-5)</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                                <TrendingUp className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-red-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">En Riesgo</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mt-1">
                                    {stats.atRiskStudents || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Promedio inferior a 3.0</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-3 rounded-xl">
                                <AlertCircle className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center">
                    <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-inner w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                                activeTab === 'overview' ? 'bg-white shadow-md text-blue-700' : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Vista por Grupo
                        </button>
                        <button
                            onClick={() => setActiveTab('risk')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                                activeTab === 'risk' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Alertas de Desempeño
                        </button>
                    </div>
                </div>

                {/* Vista por Grupo */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Seleccionar Grupo
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={e => setSelectedGroup(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 px-3 text-sm"
                                >
                                    <option value="">--- Seleccione un grupo para analizar ---</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} - Grado {g.grade?.name}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedGroup && (
                                <button
                                    onClick={handleExportarInforme}
                                    disabled={exporting || !performanceData}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-md"
                                >
                                    {exporting ? (
                                        <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Exportando...</span></>
                                    ) : (
                                        <><Download className="h-4 w-4" /><span>Exportar Informe CSV</span></>
                                    )}
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="bg-white p-20 rounded-xl shadow-md text-center border border-gray-100">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Analizando datos del grupo...</p>
                            </div>
                        ) : performanceData ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Rendimiento por Estudiante */}
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                                        <h3 className="font-bold text-lg">Rendimiento por Estudiante</h3>
                                        <p className="text-xs opacity-80 mt-1">Top 100 estudiantes del grupo</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Promedio</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {performanceData.students.map((s, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{s.name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`font-bold text-sm ${s.average < 3 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {s.average?.toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {s.average >= 4.5
                                                                ? <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                                                                : s.average < 3
                                                                    ? <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                                                                    : <TrendingUp className="h-4 w-4 text-gray-400 mx-auto opacity-50" />}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Rendimiento por Asignatura */}
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                                        <h3 className="font-bold text-lg">Rendimiento por Asignatura</h3>
                                        <p className="text-xs opacity-80 mt-1">Promedios sobre escala 0–5</p>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        {performanceData.subjects.map((sub, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-bold text-gray-700">{sub.name}</span>
                                                    <span className="text-xs font-bold text-gray-500">{sub.average?.toFixed(2)} / 5.0</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            sub.average < 3 ? 'bg-red-500' : sub.average >= 4.5 ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{ width: `${(sub.average / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
                                                    <span>Bajo</span><span>Básico</span><span>Alto</span><span>Superior</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-16 text-center border border-gray-200">
                                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">
                                    Seleccione un grupo para visualizar el rendimiento
                                </h3>
                            </div>
                        )}
                    </div>
                )}

                {/* Alertas de Desempeño */}
                {activeTab === 'risk' && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <AlertCircle className="h-6 w-6" />
                                    Alerta: Nivel de Desempeño Insuficiente
                                </h3>
                                <p className="text-sm opacity-90 mt-1">
                                    Listado de alumnos con promedio académico inferior a 3.0
                                </p>
                            </div>
                            <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-all">
                                Citación de Acudientes
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-red-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase">Estudiante</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase">Grupo</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-red-800 uppercase">Promedio</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-red-800 uppercase">Materias Perdidas</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-red-800 uppercase">Plan de Mejoramiento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.riskStudentsList?.map((std, idx) => (
                                        <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{std.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-medium">{std.group_name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg font-black text-sm">
                                                    {std.average?.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-700">{std.failedCount}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-tight">
                                                    Ver Detalle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}