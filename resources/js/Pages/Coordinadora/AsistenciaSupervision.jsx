import { Head, router } from '@inertiajs/react';
import { Share2, FileText, Download, AlertTriangle, Users, Calendar, Search, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function ControlAsistencia({ stats, current_period, groups }) {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        if (selectedGroup) {
            setLoading(true);
            fetch(route('coordinadora.asistencia.grupo', selectedGroup))
                .then(res => res.json())
                .then(data => {
                    setGroupData(data);
                    setLoading(false);
                });
        }
    }, [selectedGroup]);

    const getAttendanceColor = (rate) => {
        if (rate >= 95) return 'text-green-600';
        if (rate >= 85) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'absent': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'late': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default: return null;
        }
    };

    const handleExport = () => {
        window.location.href = route('coordinadora.asistencia.export', { group_id: selectedGroup });
    };

    return (
        <Layout title="Control de Asistencia">
            <Head title="Control de Asistencia" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Control de Asistencia</h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Supervisión de puntualidad y permanencia escolar</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        <Download className="h-5 w-5" />
                        <span>Exportar Reporte</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4"><Users className="h-8 w-8 text-blue-600" /></div>
                    <p className="text-3xl font-black text-gray-800">{stats.overallAttendance}%</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Asistencia Total</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-yellow-50 rounded-xl w-fit mb-4"><AlertTriangle className="h-8 w-8 text-yellow-600" /></div>
                    <p className="text-3xl font-black text-gray-800">{stats.todayAbsences}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Ausencias Hoy</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-red-50 rounded-xl w-fit mb-4"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
                    <p className="text-3xl font-black text-gray-800">{stats.criticalStudents.length}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Estudiantes en Alerta</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-green-50 rounded-xl w-fit mb-4"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
                    <p className="text-3xl font-black text-gray-800">{current_period?.name || 'N/A'}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Periodo Vigente</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-50">
                <div className="flex space-x-1 p-1.5 bg-gray-100/80 rounded-2xl w-fit mb-8">
                    <button onClick={() => setActiveTab('summary')} className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Resumen Institucional</button>
                    <button onClick={() => setActiveTab('analysis')} className={`px-8 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'analysis' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Análisis por Grupo</button>
                </div>

                {activeTab === 'summary' && (
                    <div className="animate-in fade-in slide-in-from-left-5 duration-700">
                        <h3 className="text-2xl font-black text-gray-800 flex items-center mb-6">
                            <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                            Alertas de Inasistencia Crítica
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="overflow-hidden border border-red-100 rounded-3xl">
                                <table className="min-w-full">
                                    <thead className="bg-red-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-red-800 uppercase italic">Estudiante</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-red-800 uppercase italic">Inasistencias</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-red-800 uppercase italic">Tasa %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-50">
                                        {stats.criticalStudents.map((std, idx) => (
                                            <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-black text-gray-800">{std.name}</p>
                                                    <p className="text-xs font-bold text-gray-400 mt-0.5">{std.group}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center text-red-700 font-black">{std.absences}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-black">{std.rate}%</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="bg-indigo-50/30 rounded-3xl p-8 border border-indigo-100">
                                <h4 className="text-xl font-extrabold text-indigo-900 mb-4">Recomendaciones de Gestión</h4>
                                <ul className="space-y-4">
                                    <li className="flex items-start space-x-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg"><AlertTriangle className="h-4 w-4 text-indigo-600" /></div>
                                        <p className="text-sm font-bold text-indigo-800 leading-relaxed">Se recomienda citación inmediata a acudientes de alumnos con menos del 85% de asistencia.</p>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg"><Share2 className="h-4 w-4 text-indigo-600" /></div>
                                        <p className="text-sm font-bold text-indigo-800 leading-relaxed">Hay {stats.highRiskGroups} grupos con deserción potencial por inasistencias prolongadas.</p>
                                    </li>
                                </ul>
                                <button className="w-full mt-8 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">Generar Alertas Automáticas</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="animate-in fade-in slide-in-from-right-5 duration-700">
                        <div className="mb-8 max-w-md">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Seleccione un Grupo para Auditoría</label>
                            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full appearance-none bg-gray-50 border-2 border-gray-100 text-gray-800 font-bold py-3.5 px-5 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none">
                                <option value="">--- Escoja un grupo ---</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        {loading ? (
                            <div className="p-24 text-center"><div className="animate-spin rounded-full h-20 w-20 border-t-4 border-indigo-600 border-solid mx-auto"></div></div>
                        ) : groupData ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white border-2 border-gray-50 p-6 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Promedio Grupo</p>
                                        <p className={`text-4xl font-black ${getAttendanceColor(groupData.average)}`}>{groupData.average}%</p>
                                    </div>
                                    <div className="bg-white border-2 border-gray-50 p-6 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Registros</p>
                                        <p className="text-4xl font-black text-gray-800">{groupData.totalRecords}</p>
                                    </div>
                                    <div className="bg-white border-2 border-gray-50 p-6 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Habilitado por</p>
                                        <p className="text-sm font-black text-indigo-600 mt-2">{groupData.director || 'Sin Director'}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Alumno</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">Tasa</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">P</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">F</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase">R</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {groupData.students.map((s, i) => (
                                                <tr key={i} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-700">{s.name}</td>
                                                    <td className={`px-6 py-4 text-center font-black ${getAttendanceColor(s.rate)}`}>{s.rate}%</td>
                                                    <td className="px-6 py-4 text-center text-green-600 font-bold">{s.present}</td>
                                                    <td className="px-6 py-4 text-center text-red-600 font-bold">{s.absent}</td>
                                                    <td className="px-6 py-4 text-center text-yellow-600 font-bold">{s.late}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-32 text-center bg-gray-50/50 border-4 border-dashed border-gray-100 rounded-[3rem]">
                                <MapPin className="h-20 w-20 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-gray-300">Seleccione un grupo para visualizar el reporte</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
