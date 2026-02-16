import { Head, router } from '@inertiajs/react';
import { Search, Filter, PieChart, BarChart2, TrendingUp, TrendingDown, Users, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function SupervisionAcademica({ active_period, groups, stats }) {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (selectedGroup) {
            fetchReport(selectedGroup);
        }
    }, [selectedGroup]);

    const fetchReport = (groupId) => {
        setLoading(true);
        fetch(route('coordinadora.supervision.grupo', { group_id: groupId }))
            .then(res => res.json())
            .then(data => {
                setPerformanceData(data);
                setLoading(false);
            });
    };

    return (
        <Layout title="Supervisión Académica">
            <Head title="Supervisión Académica" />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Supervisión Académica</h1>
                    <p className="text-gray-600 mt-1">Monitoreo de rendimiento institucional y grupal</p>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">Periodo Actual:</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase">
                        {active_period?.name || 'Ninguno'}
                    </span>
                </div>
            </div>

            {/* Institutional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="h-8 w-8 text-blue-100" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Estudiantes</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalStudents || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Total matriculados</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="h-8 w-8 text-green-100" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Promedio General</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.overallAverage?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-gray-500 mt-1">Escala institucional (0-5)</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border-b-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="h-8 w-8 text-red-100" />
                        <span className="text-xs font-bold text-gray-400 uppercase">En Riesgo</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats.atRiskStudents || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Promedio inferior a 3.0</p>
                </div>
            </div>

            {/* Analysis Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-medium transition ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Vista por Grupo
                </button>
                <button
                    onClick={() => setActiveTab('risk')}
                    className={`px-6 py-3 font-medium transition ${activeTab === 'risk' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Alertas de Desempeño
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm flex flex-wrap gap-6 items-center">
                        <div className="flex-1 min-w-[250px]">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Seleccionar Grupo</label>
                            <select
                                value={selectedGroup}
                                onChange={e => setSelectedGroup(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 py-2.5 text-lg"
                            >
                                <option value="">--- Seleccione un grupo para analizar ---</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name} - Grado {g.grade?.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedGroup && (
                            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition">
                                <Download className="h-5 w-5" />
                                <span>Exportar Informe</span>
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="bg-white p-20 rounded-xl shadow-md text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-500 text-lg">Analizando datos del grupo...</p>
                        </div>
                    ) : performanceData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            {/* Performance List */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800">Rendimiento por Estudiante</h3>
                                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">Top 100</span>
                                </div>
                                <div className="p-2">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Estudiante</th>
                                                <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">Promedio</th>
                                                <th className="px-4 py-3 text-center text-xs text-gray-400 uppercase">Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {performanceData.students.map((s, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{s.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold ${s.average < 3 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {s.average?.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {s.average >= 4.5 ? <TrendingUp className="h-4 w-4 text-green-500 mx-auto" /> :
                                                            s.average < 3 ? <TrendingDown className="h-4 w-4 text-red-500 mx-auto" /> :
                                                                <TrendingUp className="h-4 w-4 text-gray-400 mx-auto opacity-50" />}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Subject Performance */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-800">Rendimiento por Asignatura</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {performanceData.subjects.map((sub, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-gray-700">{sub.name}</span>
                                                <span className="text-xs font-bold text-gray-500">{sub.average?.toFixed(2)} / 5.0</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${sub.average < 3 ? 'bg-red-500' : sub.average >= 4.5 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${(sub.average / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
                                                <span>Bajo</span>
                                                <span>Básico</span>
                                                <span>Alto</span>
                                                <span>Superior</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-20 rounded-xl text-center">
                            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">Seleccione un grupo para visualizar el rendimiento</h3>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'risk' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-red-600">Alerta: Nivel de Desempeño Insuficiente</h3>
                            <p className="text-sm text-gray-500 mt-1">Listado de alumnos con promedio académico inferior a 3.0</p>
                        </div>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Citación de Acudientes</button>
                    </div>
                    <div className="p-0">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-red-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase">Grupo</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-red-800 uppercase">Promedio</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-red-800 uppercase">Materias Perdidas</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-red-800 uppercase">Plan de Mejoramiento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.riskStudentsList?.map((std, idx) => (
                                    <tr key={idx} className="hover:bg-red-50/50">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{std.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{std.group_name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-lg font-black">{std.average?.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-700">{std.failedCount}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-tight">Ver Detalle</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
}
