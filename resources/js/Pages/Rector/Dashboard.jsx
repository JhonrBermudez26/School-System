import { Head, Link, router } from '@inertiajs/react';
import {
    LayoutDashboard, Users, BookOpen, TrendingUp, TrendingDown,
    AlertCircle, Activity, Shield, Settings, History, Lock,
    Clock, CheckCircle, FileText
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function Dashboard({ kpis, performance, attendance, discipline, recentActivity }) {
    const getTrendIcon = (trend) => {
        if (!trend) return null;
        return trend > 0
            ? <TrendingUp className="h-4 w-4 text-green-500" />
            : <TrendingDown className="h-4 w-4 text-red-500" />;
    };

    return (
        <Layout title="Dashboard - Rector">
            <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 pb-12">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel Ejecutivo de Rectoría</h1>
                            <p className="text-blue-100 mt-1 text-sm sm:text-base">Monitoreo en tiempo real de la gestión institucional</p>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href={route('rector.auditoria')}
                                className="bg-white/20 hover:bg-white/30 p-2.5 rounded-xl transition backdrop-blur-sm"
                                title="Auditoría de Sistemas"
                            >
                                <Shield className="h-5 w-5" />
                            </Link>
                            <Link
                                href={route('rector.configuracion')}
                                className="bg-white/20 hover:bg-white/30 p-2.5 rounded-xl transition backdrop-blur-sm"
                                title="Configuración Global"
                            >
                                <Settings className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Primary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100 hover:border-blue-200 transition">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2.5 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium truncate">Estudiantes</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-2xl font-bold text-gray-800">{kpis.totalStudents}</p>
                                    {getTrendIcon(kpis.studentsTrend)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100 hover:border-green-200 transition">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2.5 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium truncate">Promedio Global</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-2xl font-bold text-gray-800">{kpis.overallAverage?.toFixed(2)}</p>
                                    {getTrendIcon(kpis.performanceTrend)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100 hover:border-orange-200 transition">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2.5 rounded-lg">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium truncate">Asistencia %</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-2xl font-bold text-gray-800">{kpis.attendanceRate}%</p>
                                    {getTrendIcon(kpis.attendanceTrend)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100 hover:border-red-200 transition">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2.5 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium truncate">Casos Disciplina</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-2xl font-bold text-gray-800">{kpis.openDisciplineRecords}</p>
                                    <span className="text-red-500 text-xs font-semibold">Activos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                            <h3 className="text-base font-bold">Desempeño Institucional</h3>
                            <Link href={route('rector.performance')} className="text-blue-100 text-xs font-semibold hover:text-white transition uppercase">
                                Ver Detalle →
                            </Link>
                        </div>
                        <div className="p-5 sm:p-6 space-y-5">
                            {performance.byGrade?.map((g, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                                        <span>Grado {g.name}</span>
                                        <span>{g.average?.toFixed(2)} / 5.0</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-1000 ${g.average < 3 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                            style={{ width: `${(g.average / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                            <Activity className="absolute -bottom-4 -right-4 h-28 w-28 text-white/5" />
                            <h3 className="text-base font-bold mb-4">Acciones de Control</h3>
                            <div className="space-y-2.5">
                                <Link href={route('rector.roles')} className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition group">
                                    <Lock className="h-5 w-5 mr-3 text-blue-200" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">Roles y Permisos</p>
                                        <p className="text-xs text-blue-200">Seguridad RBAC</p>
                                    </div>
                                    <CheckCircle className="h-4 w-4 opacity-0 group-hover:opacity-100 transition text-blue-200" />
                                </Link>
                                <Link href={route('rector.usuarios')} className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition group">
                                    <Users className="h-5 w-5 mr-3 text-blue-200" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">Gestión Humana</p>
                                        <p className="text-xs text-blue-200">Personal Administrativo</p>
                                    </div>
                                    <CheckCircle className="h-4 w-4 opacity-0 group-hover:opacity-100 transition text-blue-200" />
                                </Link>
                                <Link href={route('rector.auditoria')} className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition group">
                                    <History className="h-5 w-5 mr-3 text-blue-200" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">Bitácora de Eventos</p>
                                        <p className="text-xs text-blue-200">Auditoría General</p>
                                    </div>
                                    <CheckCircle className="h-4 w-4 opacity-0 group-hover:opacity-100 transition text-blue-200" />
                                </Link>
                            </div>
                        </div>

                        {/* Alertas de Convivencia */}
                        <div className="bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-red-100 bg-red-50">
                                <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider">Alertas de Convivencia</h4>
                            </div>
                            <div className="p-4 space-y-3">
                                {discipline.recentCracks?.map((d, i) => (
                                    <div key={i} className="flex gap-3 items-start pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{d.student.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{d.severity_label} · Hace {d.time_ago}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            <h3 className="text-base font-bold">Actividad del Sistema</h3>
                        </div>
                        <Link href={route('rector.auditoria')} className="text-blue-100 text-xs font-semibold hover:text-white transition uppercase">
                            Ver Historial Completo →
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentActivity?.map((act, i) => (
                            <div key={i} className="px-4 sm:px-6 py-4 flex items-center hover:bg-blue-50/30 transition">
                                <div className={`p-2 rounded-xl mr-4 flex-shrink-0 ${
                                    act.action === 'login' ? 'bg-blue-100 text-blue-600' :
                                    act.action === 'delete' ? 'bg-red-100 text-red-600' :
                                    'bg-indigo-100 text-indigo-600'
                                }`}>
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{act.description}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                        <Users className="h-3 w-3" />
                                        {act.user?.name}
                                        <span>·</span>
                                        <Clock className="h-3 w-3" />
                                        {act.created_at_human}
                                    </p>
                                </div>
                                <div className="hidden md:block text-right flex-shrink-0 ml-4">
                                    <span className="text-xs text-gray-400 font-medium">{act.ip_address}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}