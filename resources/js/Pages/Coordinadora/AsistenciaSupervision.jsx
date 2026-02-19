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
                .then(data => { setGroupData(data); setLoading(false); })
                .catch(error => { console.error('Error:', error); setLoading(false); });
        }
    }, [selectedGroup]);

    const getAttendanceColor = (rate) => {
        if (rate >= 95) return 'text-green-600';
        if (rate >= 85) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'crítico': return 'bg-red-100 text-red-800 border-red-200';
            case 'alto':    return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medio':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:        return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (selectedGroup) params.append('group_id', selectedGroup);
        window.location.href = route('coordinadora.asistencia.export') + '?' + params.toString();
    };

    const handleGenerateAlerts = async () => {
        if (generatingAlerts) return;
        if (!confirm('¿Desea generar alertas automáticas para estudiantes con inasistencia superior al 15%?')) return;
        setGeneratingAlerts(true);
        try {
            const response = await fetch(route('coordinadora.asistencia.generar-alertas'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ threshold: 15 }),
            });
            const data = await response.json();
            if (data.success) {
                setAlertsModal({ show: true, alerts: data.alerts || [], count: data.alerts_count || 0 });
            } else {
                alert('Error al generar alertas');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar alertas.');
        } finally {
            setGeneratingAlerts(false);
        }
    };

    return (
        <Layout title="Control de Asistencia">
            <Head title="Control de Asistencia" />
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Control de Asistencia
                        </h1>
                        <p className="text-gray-600 mt-1">Supervisión de puntualidad y permanencia escolar</p>
                    </div>
                    <button onClick={handleExport}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg text-sm font-semibold">
                        <Download className="h-5 w-5" />
                        Exportar Reporte
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-blue-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl w-fit mb-3">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.overallAttendance}%</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Asistencia Total</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-yellow-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl w-fit mb-3">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.todayAbsences}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Ausencias Hoy</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-red-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10"></div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-3 rounded-xl w-fit mb-3">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.criticalStudents.length}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Estudiantes en Alerta</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-green-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl w-fit mb-3">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-xl font-bold text-gray-800">{current_period?.name || 'N/A'}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-1">Periodo Vigente</p>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                        <div className="flex justify-center">
                            <div className="inline-flex rounded-full bg-white/10 p-1">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                                        activeTab === 'summary' ? 'bg-white text-blue-700 shadow-md' : 'text-white/80 hover:text-white'
                                    }`}
                                >
                                    Resumen Institucional
                                </button>
                                <button
                                    onClick={() => setActiveTab('analysis')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                                        activeTab === 'analysis' ? 'bg-white text-blue-700 shadow-md' : 'text-white/80 hover:text-white'
                                    }`}
                                >
                                    Análisis por Grupo
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {activeTab === 'summary' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Alertas críticas */}
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-md">
                                    <div className="p-4 bg-red-50 border-b border-red-100">
                                        <h3 className="text-base font-bold text-red-800 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5" />
                                            Alertas de Inasistencia Crítica
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-red-50/50">
                                                <tr>
                                                    <th className="px-5 py-3 text-left text-xs font-bold text-red-800 uppercase">Estudiante</th>
                                                    <th className="px-5 py-3 text-center text-xs font-bold text-red-800 uppercase">Inasistencias</th>
                                                    <th className="px-5 py-3 text-right text-xs font-bold text-red-800 uppercase">Tasa %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-50">
                                                {stats.criticalStudents.length > 0 ? stats.criticalStudents.map((std, idx) => (
                                                    <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <p className="text-sm font-bold text-gray-800">{std.name}</p>
                                                            <p className="text-xs text-gray-500">{std.group}</p>
                                                        </td>
                                                        <td className="px-5 py-3 text-center text-red-700 font-bold">{std.absences}</td>
                                                        <td className="px-5 py-3 text-right">
                                                            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">{std.rate}%</span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="3" className="px-5 py-8 text-center text-gray-400 text-sm">
                                                            ✅ No hay estudiantes en alerta crítica
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Recomendaciones */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                    <h4 className="text-base font-bold text-blue-900 mb-4">Recomendaciones de Gestión</h4>
                                    <ul className="space-y-4 mb-6">
                                        <li className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                                <AlertTriangle className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <p className="text-sm text-blue-800">
                                                Se recomienda citación inmediata a acudientes de alumnos con menos del 85% de asistencia.
                                            </p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                                <Share2 className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <p className="text-sm text-blue-800">
                                                Hay {stats.highRiskGroups} grupo(s) con deserción potencial por inasistencias prolongadas.
                                            </p>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                                <Bell className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <p className="text-sm text-blue-800">
                                                Genere alertas automáticas para identificar casos que requieren intervención inmediata.
                                            </p>
                                        </li>
                                    </ul>
                                    <button
                                        onClick={handleGenerateAlerts}
                                        disabled={generatingAlerts}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {generatingAlerts ? (
                                            <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div><span>Generando...</span></>
                                        ) : (
                                            <><Bell className="h-5 w-5" /><span>Generar Alertas Automáticas</span></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'analysis' && (
                            <div className="space-y-6">
                                <div className="max-w-sm">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Seleccione un Grupo para Auditoría</label>
                                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
                                        className="w-full border-2 border-gray-200 text-gray-800 py-3 px-4 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                                        <option value="">--- Escoja un grupo ---</option>
                                        {groups && groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name} {g.grade?.name ? `(${g.grade.name})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                {loading ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                                        <p className="mt-4 text-gray-500">Cargando datos del grupo...</p>
                                    </div>
                                ) : groupData ? (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-xl">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Promedio Grupo</p>
                                                <p className={`text-4xl font-bold ${getAttendanceColor(groupData.average)}`}>{groupData.average}%</p>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Registros</p>
                                                <p className="text-4xl font-bold text-gray-800">{groupData.totalRecords}</p>
                                            </div>
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-xl">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Grupo</p>
                                                <p className="text-2xl font-bold text-blue-700 mt-1">{groupData.group?.name || 'N/A'}</p>
                                                <p className="text-sm text-gray-400">{groupData.group?.grade || ''}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-md">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                                            <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase">Alumno</th>
                                                            <th className="px-5 py-3 text-center text-xs font-bold text-white uppercase">Tasa</th>
                                                            <th className="px-5 py-3 text-center text-xs font-bold text-white uppercase">P</th>
                                                            <th className="px-5 py-3 text-center text-xs font-bold text-white uppercase">F</th>
                                                            <th className="px-5 py-3 text-center text-xs font-bold text-white uppercase">R</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {groupData.students?.length > 0 ? groupData.students.map((s, i) => (
                                                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                                                <td className="px-5 py-3 font-medium text-gray-700 text-sm">{s.name}</td>
                                                                <td className={`px-5 py-3 text-center font-bold text-sm ${getAttendanceColor(s.rate)}`}>{s.rate}%</td>
                                                                <td className="px-5 py-3 text-center text-green-600 font-bold text-sm">{s.present}</td>
                                                                <td className="px-5 py-3 text-center text-red-600 font-bold text-sm">{s.absent}</td>
                                                                <td className="px-5 py-3 text-center text-yellow-600 font-bold text-sm">{s.late}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-sm">
                                                                    No hay datos de asistencia para este grupo
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-24 text-center bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-2xl">
                                        <MapPin className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-300">Seleccione un grupo para visualizar el reporte</h3>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Alertas */}
            {alertsModal.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
                        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">
                                    🚨 Alertas Generadas ({alertsModal.count})
                                </h2>
                                <button onClick={() => setAlertsModal({ show: false, alerts: [] })}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                            {alertsModal.alerts?.length > 0 ? (
                                <div className="space-y-3">
                                    {alertsModal.alerts.map((alert, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-md transition-shadow">
                                            <div>
                                                <p className="font-bold text-gray-800">{alert.student_name}</p>
                                                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                                                    <span><strong>Grupo:</strong> {alert.group}</span>
                                                    <span><strong>Grado:</strong> {alert.grade}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-0.5 text-sm">
                                                    <span><strong>Inasistencias:</strong> <span className="text-red-600 font-bold">{alert.absent_count}</span> de {alert.total_classes}</span>
                                                    <span><strong>Tasa:</strong> <span className="text-red-600 font-bold">{alert.absence_rate}%</span></span>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                                                {alert.severity?.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 font-medium">No se generaron alertas</p>
                                    <p className="text-gray-400 text-sm mt-1">Todos los estudiantes están dentro del umbral permitido</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-200">
                            <button onClick={() => setAlertsModal({ show: false, alerts: [] })}
                                className="w-full bg-gray-200 hover:bg-gray-300 py-3 rounded-xl font-semibold transition-all text-gray-700">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}