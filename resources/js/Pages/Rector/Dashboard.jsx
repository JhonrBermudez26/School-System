import { Head, Link, router } from '@inertiajs/react';
import {
    LayoutDashboard, Users, BookOpen, TrendingUp, TrendingDown,
    AlertCircle, Activity, Shield, Settings, History, Lock,
    Clock, CheckCircle, FileText
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard({ kpis, performance, attendance, discipline, recentActivity }) {

    const getTrendIcon = (trend) => {
        if (!trend) return null;
        return trend > 0
            ? <TrendingUp className="h-4 w-4 text-green-500" />
            : <TrendingDown className="h-4 w-4 text-red-500" />;
    };

    return (
        <Layout title="Dashboard - Rector">
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-800 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Panel Ejecutivo de Rectoría</h1>
                        <p className="text-indigo-200 mt-2 font-medium">Monitoreo en tiempo real de la gestión institucional</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={route('rector.auditoria')}
                            className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition backdrop-blur-sm"
                            title="Auditoría de Sistemas"
                        >
                            <Shield className="h-6 w-6" />
                        </Link>
                        <Link
                            href={route('rector.configuracion')}
                            className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition backdrop-blur-sm"
                            title="Configuración Global"
                        >
                            <Settings className="h-6 w-6" />
                        </Link>
                    </div>
                </div>

                {/* Primary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-50 group hover:border-indigo-200 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl"><Users className="h-6 w-6 text-blue-600" /></div>
                            {getTrendIcon(kpis.studentsTrend)}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estudiantes</p>
                        <p className="text-3xl font-black text-gray-800">{kpis.totalStudents}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-50 group hover:border-green-200 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 rounded-xl"><TrendingUp className="h-6 w-6 text-green-600" /></div>
                            {getTrendIcon(kpis.performanceTrend)}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Promedio Global</p>
                        <p className="text-3xl font-black text-gray-800">{kpis.overallAverage?.toFixed(2)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-50 group hover:border-orange-200 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl"><Clock className="h-6 w-6 text-orange-600" /></div>
                            {getTrendIcon(kpis.attendanceTrend)}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Asistencia %</p>
                        <p className="text-3xl font-black text-gray-800">{kpis.attendanceRate}%</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-50 group hover:border-red-200 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 rounded-xl"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                            <span className="text-red-500 text-xs font-bold">Activos</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Casos Disciplina</p>
                        <p className="text-3xl font-black text-gray-800">{kpis.openDisciplineRecords}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Chart / List */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-800">Desempeño Institucional</h3>
                            <Link href={route('rector.performance')} className="text-indigo-600 text-xs font-bold uppercase hover:underline">Ver Detalle</Link>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                {performance.byGrade?.map((g, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                                            <span>Grado {g.name}</span>
                                            <span>{g.average?.toFixed(2)} / 5.0</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-1000 ${g.average < 3 ? 'bg-red-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${(g.average / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="space-y-6">
                        <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                            <Activity className="absolute -bottom-4 -right-4 h-32 w-32 text-white/5 group-hover:scale-110 transition duration-700" />
                            <h3 className="text-lg font-bold mb-4">Acciones de Control</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <Link href={route('rector.roles')} className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition group/item">
                                    <Lock className="h-5 w-5 mr-3 text-indigo-200" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Roles y Permisos</p>
                                        <p className="text-[10px] text-indigo-300">Seguridad RBAC</p>
                                    </div>
                                    <CheckCircle className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition text-indigo-200" />
                                </Link>
                                <Link href={route('rector.usuarios')} className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition group/item">
                                    <Users className="h-5 w-5 mr-3 text-indigo-200" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Gestión Humana</p>
                                        <p className="text-[10px] text-indigo-300">Personal Administrativo</p>
                                    </div>
                                    <CheckCircle className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition text-indigo-200" />
                                </Link>
                                <Link href={route('rector.auditoria')} className="flex items-center p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition group/item">
                                    <History className="h-5 w-5 mr-3 text-indigo-200" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">Bitácora de Eventos</p>
                                        <p className="text-[10px] text-indigo-300">Auditoría General</p>
                                    </div>
                                    <CheckCircle className="h-4 w-4 opacity-0 group-hover/item:opacity-100 transition text-indigo-200" />
                                </Link>
                            </div>
                        </div>

                        {/* Summary Discipline */}
                        <div className="bg-white rounded-3xl p-6 border border-red-50 shadow-lg">
                            <h4 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4">Alertas de Convivencia</h4>
                            <div className="space-y-4">
                                {discipline.recentCracks?.map((d, i) => (
                                    <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-3 last:border-0">
                                        <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="h-4 w-4 text-red-600" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{d.student.name}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{d.severity_label} - Hace {d.time_ago}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center">
                            <Activity className="h-5 w-5 text-indigo-600 mr-2" />
                            <h3 className="text-xl font-black text-gray-800">Actividad del Sistema</h3>
                        </div>
                        <Link href={route('rector.auditoria')} className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition uppercase">Ver Historial Completo</Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentActivity?.map((act, i) => (
                            <div key={i} className="px-6 py-4 flex items-center group hover:bg-indigo-50/30 transition">
                                <div className={`p-2 rounded-xl mr-4 ${act.action === 'login' ? 'bg-blue-100 text-blue-600' :
                                    act.action === 'delete' ? 'bg-red-100 text-red-600' :
                                        'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{act.description}</p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                                        <Users className="h-3 w-3 mr-1" /> {act.user?.name}
                                        <span className="mx-2">•</span>
                                        <Clock className="h-3 w-3 mr-1" /> {act.created_at_human}
                                    </p>
                                </div>
                                <div className="text-right hidden md:block">
                                    <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{act.ip_address}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
