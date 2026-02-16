import { Head, router } from '@inertiajs/react';
import { Share2, FileText, Download, AlertTriangle, Users, Calendar, Search, MapPin, CheckCircle2, XCircle, Bell, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function ControlAsistencia({ groups, stats, current_period }) {
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [generatingAlerts, setGeneratingAlerts] = useState(false);
    const [alertsModal, setAlertsModal] = useState({ show: false, alerts: [] });

    useEffect(() => {
        if (selectedGroup) {
            setLoading(true);
            fetch(route('coordinadora.asistencia.grupo', selectedGroup))
                .then(res => res.json())
                .then(data => {
                    setGroupData(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error cargando datos del grupo:', error);
                    alert('Error al cargar datos del grupo');
                    setLoading(false);
                });
        }
    }, [selectedGroup]);

    const getAttendanceColor = (rate) => {
        if (rate >= 95) return 'text-green-600';
        if (rate >= 85) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'crítico':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'alto':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medio':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (selectedGroup) params.append('group_id', selectedGroup);
        
        window.location.href = route('coordinadora.asistencia.export') + '?' + params.toString();
    };

    // ✅ Función mejorada para generar alertas
    const handleGenerateAlerts = async () => {
        if (generatingAlerts) return;

        const confirmed = confirm('¿Desea generar alertas automáticas para estudiantes con inasistencia superior al 15%?');
        if (!confirmed) return;

        setGeneratingAlerts(true);

        try {
            const response = await fetch(route('coordinadora.asistencia.generar-alertas'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({
                    threshold: 15,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setAlertsModal({
                    show: true,
                    alerts: data.alerts || [],
                    count: data.alerts_count || 0,
                });
            } else {
                alert('Error al generar alertas');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar alertas. Por favor intente nuevamente.');
        } finally {
            setGeneratingAlerts(false);
        }
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
                    <button 
                        onClick={handleExport} 
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Download className="h-5 w-5" />
                        <span>Exportar Reporte</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-blue-50 rounded-xl w-fit mb-4">
                        <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-800">{stats.overallAttendance}%</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Asistencia Total</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-yellow-50 rounded-xl w-fit mb-4">
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-800">{stats.todayAbsences}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Ausencias Hoy</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-red-50 rounded-xl w-fit mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-800">{stats.criticalStudents.length}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Estudiantes en Alerta</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                    <div className="p-3 bg-green-50 rounded-xl w-fit mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-800">{current_period?.name || 'N/A'}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Periodo Vigente</p>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-50">
                <div className="flex space-x-1 p-1.5 bg-gray-100/80 rounded-2xl w-fit mb-8">
                    <button 
                        onClick={() => setActiveTab('summary')} 
                        className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
                            activeTab === 'summary' 
                                ? 'bg-white text-indigo-600 shadow-md' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Resumen Institucional
                    </button>
                    <button 
                        onClick={() => setActiveTab('analysis')} 
                        className={`px-8 py-2.5 rounded-xl font-bold transition-all ${
                            activeTab === 'analysis' 
                                ? 'bg-white text-indigo-600 shadow-md' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Análisis por Grupo
                    </button>
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
                                        {stats.criticalStudents.length > 0 ? (
                                            stats.criticalStudents.map((std, idx) => (
                                                <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-black text-gray-800">{std.name}</p>
                                                        <p className="text-xs font-bold text-gray-400 mt-0.5">{std.group}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-red-700 font-black">{std.absences}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-black">
                                                            {std.rate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-gray-400 font-bold">
                                                    ✅ No hay estudiantes en alerta crítica
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-indigo-50/30 rounded-3xl p-8 border border-indigo-100">
                                <h4 className="text-xl font-extrabold text-indigo-900 mb-4">Recomendaciones de Gestión</h4>
                                
                                <ul className="space-y-4 mb-6">
                                    <li className="flex items-start space-x-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <AlertTriangle className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-bold text-indigo-800 leading-relaxed">
                                            Se recomienda citación inmediata a acudientes de alumnos con menos del 85% de asistencia.
                                        </p>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <Share2 className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-bold text-indigo-800 leading-relaxed">
                                            Hay {stats.highRiskGroups} grupo(s) con deserción potencial por inasistencias prolongadas.
                                        </p>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <Bell className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-bold text-indigo-800 leading-relaxed">
                                            Genere alertas automáticas para identificar casos que requieren intervención inmediata.
                                        </p>
                                    </li>
                                </ul>

                                <button 
                                    onClick={handleGenerateAlerts}
                                    disabled={generatingAlerts}
                                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {generatingAlerts ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                                            <span>Generando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Bell className="h-5 w-5" />
                                            <span>Generar Alertas Automáticas</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="animate-in fade-in slide-in-from-right-5 duration-700">
                        <div className="mb-8 max-w-md">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                Seleccione un Grupo para Auditoría
                            </label>
                            <select 
                                value={selectedGroup} 
                                onChange={e => setSelectedGroup(e.target.value)} 
                                className="w-full appearance-none bg-gray-50 border-2 border-gray-100 text-gray-800 font-bold py-3.5 px-5 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none"
                            >
                                <option value="">--- Escoja un grupo ---</option>
                                {groups && groups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.name} {g.grade?.name ? `(${g.grade.name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <div className="p-24 text-center">
                                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-indigo-600 border-solid mx-auto"></div>
                                <p className="mt-4 text-gray-500 font-bold">Cargando datos del grupo...</p>
                            </div>
                        ) : groupData ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white border-2 border-gray-50 p-6 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Promedio Grupo</p>
                                        <p className={`text-4xl font-black ${getAttendanceColor(groupData.average)}`}>
                                            {groupData.average}%
                                        </p>
                                    </div>
                                    <div className="bg-white border-2 border-gray-50 p-6 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Registros</p>
                                        <p className="text-4xl font-black text-gray-800">{groupData.totalRecords}</p>
                                    </div>
                                    <div className="bg-white border-2 border-gray-50 p-6 rounded-3xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Grupo</p>
                                        <p className="text-2xl font-black text-indigo-600 mt-2">
                                            {groupData.group?.name || 'N/A'}
                                        </p>
                                        <p className="text-sm font-bold text-gray-400 mt-1">
                                            {groupData.group?.grade || ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 rounded-3xl p-4 border border-gray-100 overflow-x-auto">
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
                                            {groupData.students && groupData.students.length > 0 ? (
                                                groupData.students.map((s, i) => (
                                                    <tr key={i} className="hover:bg-white transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-700">{s.name}</td>
                                                        <td className={`px-6 py-4 text-center font-black ${getAttendanceColor(s.rate)}`}>
                                                            {s.rate}%
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-green-600 font-bold">{s.present}</td>
                                                        <td className="px-6 py-4 text-center text-red-600 font-bold">{s.absent}</td>
                                                        <td className="px-6 py-4 text-center text-yellow-600 font-bold">{s.late}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 font-bold">
                                                        No hay datos de asistencia para este grupo
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-32 text-center bg-gray-50/50 border-4 border-dashed border-gray-100 rounded-[3rem]">
                                <MapPin className="h-20 w-20 text-gray-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-gray-300">
                                    Seleccione un grupo para visualizar el reporte
                                </h3>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ✅ Modal de Alertas Generadas */}
            {alertsModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900">
                                🚨 Alertas Generadas ({alertsModal.count})
                            </h2>
                            <button 
                                onClick={() => setAlertsModal({ show: false, alerts: [] })}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {alertsModal.alerts && alertsModal.alerts.length > 0 ? (
                            <div className="space-y-4">
                                {alertsModal.alerts.map((alert, idx) => (
                                    <div key={idx} className="border-2 rounded-2xl p-5 flex justify-between items-center hover:shadow-lg transition">
                                        <div className="flex-1">
                                            <p className="font-black text-lg text-gray-800">{alert.student_name}</p>
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <p className="text-gray-600">
                                                    <span className="font-bold">Grupo:</span> {alert.group}
                                                </p>
                                                <p className="text-gray-600">
                                                    <span className="font-bold">Grado:</span> {alert.grade}
                                                </p>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-sm">
                                                <p>
                                                    <span className="font-bold">Inasistencias:</span>{' '}
                                                    <span className="text-red-600 font-black">{alert.absent_count}</span>
                                                    {' '}de {alert.total_classes}
                                                </p>
                                                <p>
                                                    <span className="font-bold">Tasa:</span>{' '}
                                                    <span className="text-red-600 font-black">{alert.absence_rate}%</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-5 py-2 rounded-full text-xs font-black border-2 ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 font-bold text-lg">No se generaron alertas</p>
                                <p className="text-gray-400 text-sm mt-2">Todos los estudiantes están dentro del umbral permitido</p>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setAlertsModal({ show: false, alerts: [] })}
                            className="mt-8 w-full bg-gray-200 hover:bg-gray-300 py-4 rounded-xl font-black transition"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    );
}