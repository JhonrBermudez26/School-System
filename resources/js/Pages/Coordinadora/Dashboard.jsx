import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen, Users, Calendar, AlertTriangle, TrendingUp,
    Shield, CheckCircle2, Clock, BarChart2, Bell,
    ChevronRight, FileText, Percent, Lock, Activity, GraduationCap,
    Archive
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard({
    current_period,
    periodos_stats,
    academic_stats,
    attendance_stats,
    discipline_stats,
    boletin_stats,
    recent_alerts,
    critical_groups,
    recent_discipline,
}) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const attendanceColor = (rate) => {
        if (rate >= 95) return 'text-emerald-600';
        if (rate >= 85) return 'text-amber-600';
        return 'text-red-600';
    };

    const periodBadge = (status) => {
        switch (status) {
            case 'active':   return { label: 'Activo',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'closed':   return { label: 'Cerrado',   cls: 'bg-red-100 text-red-700 border-red-200' };
            case 'draft':    return { label: 'Borrador',  cls: 'bg-gray-100 text-gray-700 border-gray-200' };
            case 'archived': return { label: 'Archivado', cls: 'bg-purple-100 text-purple-700 border-purple-200' };
            default:         return { label: 'N/A',       cls: 'bg-gray-100 text-gray-600 border-gray-200' };
        }
    };

    const severityColor = (sev) => {
        switch (sev) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high':     return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:         return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const progreso = current_period?.progreso ?? 0;

    return (
        <Layout title="Dashboard - Coordinadora">
            <Head title="Dashboard Coordinadora" />
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">

                {/* ── BIENVENIDA ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Bienvenida, {user?.name || 'Coordinadora'}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Panel de supervisión académica ·{' '}
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    {current_period && (
                        <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-4 py-2.5 shadow-sm">
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-semibold text-gray-700">{current_period.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${periodBadge(current_period.status).cls}`}>
                                {periodBadge(current_period.status).label}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── BARRA DE PROGRESO DEL PERIODO ── */}
                {current_period && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 rounded-xl">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{current_period.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {current_period.start_date} → {current_period.end_date}
                                        {current_period.dias_restantes > 0 && (
                                            <span className="ml-2 text-blue-600 font-semibold">· {current_period.dias_restantes} días restantes</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                {current_period.grade_weight > 0 && (
                                    <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                                        <Percent className="h-4 w-4" /> {current_period.grade_weight}% peso
                                    </span>
                                )}
                                <span className={`flex items-center gap-1.5 font-bold ${current_period.grades_enabled ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {current_period.grades_enabled
                                        ? <><CheckCircle2 className="h-4 w-4" /> Notas habilitadas</>
                                        : <><Lock className="h-4 w-4" /> Notas bloqueadas</>}
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-gray-400 font-medium">
                            <span>Inicio</span>
                            <span className="text-blue-600 font-bold">{progreso}% completado</span>
                            <span>Fin</span>
                        </div>
                    </div>
                )}

                {/* ── KPIs ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Asistencia Global', value: `${attendance_stats?.overall ?? '—'}%`,
                            sub: `${attendance_stats?.total_records ?? 0} registros`,
                            icon: Users, from: 'from-blue-500', to: 'to-indigo-500', border: 'border-blue-50', textColor: 'text-blue-600',
                        },
                        {
                            label: 'Promedio General', value: academic_stats?.overall_average?.toFixed(2) ?? '—',
                            sub: 'Escala 0–5',
                            icon: TrendingUp, from: 'from-emerald-500', to: 'to-green-500', border: 'border-emerald-50', textColor: 'text-emerald-600',
                        },
                        {
                            label: 'En Riesgo', value: academic_stats?.at_risk ?? 0,
                            sub: 'Promedio < 3.0',
                            icon: AlertTriangle, from: 'from-red-500', to: 'to-pink-500', border: 'border-red-50', textColor: 'text-red-600',
                        },
                        {
                            label: 'Casos Disciplina', value: discipline_stats?.open ?? 0,
                            sub: `${discipline_stats?.critical ?? 0} críticos`,
                            icon: Shield, from: 'from-amber-500', to: 'to-orange-500', border: 'border-amber-50', textColor: 'text-amber-600',
                        },
                    ].map(({ label, value, sub, icon: Icon, from, to, border, textColor }) => (
                        <div key={label} className={`relative overflow-hidden rounded-2xl shadow-md bg-white p-5 border ${border}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${from}/8 ${to}/8`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`bg-gradient-to-br ${from} ${to} p-2.5 rounded-xl`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className={`text-2xl font-black ${textColor}`}>{value}</span>
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── RENDIMIENTO ACADÉMICO + BOLETINES ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Distribución de desempeño */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <BarChart2 className="h-4 w-4" /> Rendimiento por Desempeño
                            </h2>
                            <button onClick={() => router.get(route('coordinadora.supervision'))}
                                className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                { label: 'SUPERIOR', key: 'superior', grad: 'from-emerald-500 to-green-500',  bg: 'bg-emerald-50',  text: 'text-emerald-700' },
                                { label: 'ALTO',     key: 'alto',     grad: 'from-blue-500 to-indigo-500',   bg: 'bg-blue-50',    text: 'text-blue-700' },
                                { label: 'BÁSICO',   key: 'basico',   grad: 'from-amber-500 to-yellow-500',  bg: 'bg-amber-50',   text: 'text-amber-700' },
                                { label: 'BAJO',     key: 'bajo',     grad: 'from-red-500 to-pink-500',      bg: 'bg-red-50',     text: 'text-red-700' },
                            ].map(({ label, key, grad, bg, text }) => {
                                const total = academic_stats?.total_students || 1;
                                const count = academic_stats?.by_desempeno?.[key] ?? 0;
                                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                                return (
                                    <div key={key}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bg} ${text}`}>{label}</span>
                                            <span className="text-xs text-gray-500 font-bold">{count} est. · {pct}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div className={`h-2.5 rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-lg font-black text-gray-800">{academic_stats?.total_students ?? 0}</p>
                                    <p className="text-xs text-gray-400 font-medium">Estudiantes</p>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-emerald-600">{academic_stats?.approved ?? 0}</p>
                                    <p className="text-xs text-gray-400 font-medium">Aprobados</p>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-red-600">{academic_stats?.failed ?? 0}</p>
                                    <p className="text-xs text-gray-400 font-medium">Reprobados</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Boletines */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4" /> Boletines
                            </h2>
                            <button onClick={() => router.get(route('coordinadora.boletines'))}
                                className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                Ver <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Donut */}
                            <div className="flex items-center justify-center">
                                <div className="relative w-28 h-28">
                                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#boletinGrad)" strokeWidth="3"
                                            strokeDasharray={`${boletin_stats?.pct_generados ?? 0} ${100 - (boletin_stats?.pct_generados ?? 0)}`}
                                            strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="boletinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#6366f1" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xl font-black text-gray-800">{boletin_stats?.pct_generados ?? 0}%</span>
                                        <span className="text-[10px] text-gray-400 font-semibold">generados</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                                    <p className="text-xl font-black text-emerald-700">{boletin_stats?.generados ?? 0}</p>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Generados</p>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                                    <p className="text-xl font-black text-orange-700">{boletin_stats?.pendientes ?? 0}</p>
                                    <p className="text-[10px] text-orange-600 font-bold uppercase">Pendientes</p>
                                </div>
                            </div>
                            {(boletin_stats?.pendientes ?? 0) > 0 && (
                                <button onClick={() => router.get(route('coordinadora.boletines'))}
                                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
                                    Generar pendientes
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── ASISTENCIA + DISCIPLINA ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Asistencia */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4" /> Control de Asistencia
                            </h2>
                            <button onClick={() => router.get(route('coordinadora.asistencia'))}
                                className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                    { label: 'Ausencias hoy', val: attendance_stats?.today_absences ?? 0, cls: 'bg-red-50 border-red-100 text-red-700' },
                                    { label: 'En alerta',     val: attendance_stats?.critical_students ?? 0, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
                                    { label: 'Grupos riesgo', val: attendance_stats?.high_risk_groups ?? 0, cls: 'bg-amber-50 border-amber-100 text-amber-700' },
                                ].map(({ label, val, cls }) => (
                                    <div key={label} className={`text-center p-3 rounded-xl border ${cls}`}>
                                        <p className="text-xl font-black">{val}</p>
                                        <p className="text-[10px] font-bold uppercase">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Grupos con menor asistencia</p>
                            <div className="space-y-2">
                                {(critical_groups ?? []).slice(0, 4).map((g, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-700 w-20 truncate">{g.name}</span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div className={`h-2 rounded-full transition-all ${g.rate >= 85 ? 'bg-amber-400' : 'bg-red-500'}`}
                                                style={{ width: `${g.rate}%` }} />
                                        </div>
                                        <span className={`text-xs font-black w-10 text-right ${attendanceColor(g.rate)}`}>{g.rate}%</span>
                                    </div>
                                ))}
                                {(!critical_groups || critical_groups.length === 0) && (
                                    <p className="text-xs text-gray-400 text-center py-3">✅ Sin grupos críticos</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Disciplina */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <Shield className="h-4 w-4" /> Gestión Disciplinaria
                            </h2>
                            <button onClick={() => router.get(route('coordinadora.disciplina'))}
                                className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                Ver todos <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {[
                                    { label: 'Total',    val: discipline_stats?.total ?? 0,      cls: 'bg-blue-50 border-blue-100 text-blue-700' },
                                    { label: 'Abiertos', val: discipline_stats?.open ?? 0,       cls: 'bg-amber-50 border-amber-100 text-amber-700' },
                                    { label: 'Críticos', val: discipline_stats?.critical ?? 0,   cls: 'bg-red-50 border-red-100 text-red-700' },
                                    { label: 'Este mes', val: discipline_stats?.this_month ?? 0, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                                ].map(({ label, val, cls }) => (
                                    <div key={label} className={`text-center p-2.5 rounded-xl border ${cls}`}>
                                        <p className="text-lg font-black">{val}</p>
                                        <p className="text-[10px] font-bold uppercase">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Registros recientes</p>
                            <div className="space-y-2">
                                {(recent_discipline ?? []).slice(0, 4).map((rec, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">{rec.student_name}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{rec.type_label}</p>
                                        </div>
                                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(rec.severity)}`}>
                                            {rec.severity_label}
                                        </span>
                                    </div>
                                ))}
                                {(!recent_discipline || recent_discipline.length === 0) && (
                                    <p className="text-xs text-gray-400 text-center py-3">Sin registros recientes</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── PERIODOS + ACCESOS RÁPIDOS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Periodos */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" /> Periodos Académicos
                            </h2>
                            <button onClick={() => router.get(route('coordinadora.periodos'))}
                                className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                Gestionar <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            {[
                                { label: 'Periodo actual', val: periodos_stats?.current_name ?? 'Ninguno', icon: Calendar, cls: 'text-blue-600' },
                                { label: 'Habilitados',    val: periodos_stats?.enabled ?? 0,             icon: CheckCircle2, cls: 'text-emerald-600' },
                                { label: '% disponible',   val: `${periodos_stats?.available_pct ?? 100}%`, icon: Percent,   cls: 'text-indigo-600' },
                                { label: 'Archivados',     val: periodos_stats?.archived ?? 0,            icon: Archive,     cls: 'text-purple-600' },
                            ].map(({ label, val, icon: Icon, cls }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${cls}`} />
                                        <span className="text-xs font-medium text-gray-600">{label}</span>
                                    </div>
                                    <span className="text-xs font-black text-gray-800">{val}</span>
                                </div>
                            ))}
                            {periodos_stats?.used_pct != null && (
                                <div className="pt-1">
                                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                                        <span>Peso usado: {periodos_stats.used_pct}%</span>
                                        <span className="text-blue-600">Disponible: {periodos_stats.available_pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                            style={{ width: `${periodos_stats.used_pct}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Accesos rápidos */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <GraduationCap className="h-4 w-4" /> Accesos Rápidos
                            </h2>
                        </div>
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Horarios',    sub: 'Gestión de franjas',      icon: Clock,       route: 'coordinadora.horarios',   grad: 'from-blue-500 to-indigo-500',   hover: 'hover:border-blue-200 hover:bg-blue-50' },
                                { label: 'Supervisión', sub: 'Rendimiento académico',   icon: TrendingUp,  route: 'coordinadora.supervision', grad: 'from-emerald-500 to-green-500', hover: 'hover:border-emerald-200 hover:bg-emerald-50' },
                                { label: 'Asistencia',  sub: 'Control de presencia',    icon: Users,       route: 'coordinadora.asistencia',  grad: 'from-amber-500 to-orange-500',  hover: 'hover:border-amber-200 hover:bg-amber-50' },
                                { label: 'Disciplina',  sub: 'Registros de conducta',   icon: Shield,      route: 'coordinadora.disciplina',  grad: 'from-red-500 to-pink-500',      hover: 'hover:border-red-200 hover:bg-red-50' },
                                { label: 'Boletines',   sub: 'Informes académicos',     icon: FileText,    route: 'coordinadora.boletines',   grad: 'from-purple-500 to-indigo-500', hover: 'hover:border-purple-200 hover:bg-purple-50' },
                                { label: 'Periodos',    sub: 'Ciclos académicos',       icon: Calendar,    route: 'coordinadora.periodos',    grad: 'from-blue-600 to-indigo-600',   hover: 'hover:border-blue-200 hover:bg-blue-50' },
                            ].map(({ label, sub, icon: Icon, route: r, grad, hover }) => (
                                <button key={label} onClick={() => router.get(route(r))}
                                    className={`flex flex-col items-start gap-2.5 p-4 rounded-xl border border-gray-100 transition-all hover:shadow-md ${hover} group text-left`}>
                                    <div className={`bg-gradient-to-br ${grad} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{label}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── ALERTAS DE INASISTENCIA ── */}
                {recent_alerts && recent_alerts.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-pink-600 px-5 py-4 flex items-center justify-between">
                            <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                                <Bell className="h-4 w-4" /> Alertas de Inasistencia Crítica
                            </h2>
                            <button onClick={() => router.get(route('coordinadora.asistencia'))}
                                className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                                Ver control <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recent_alerts.slice(0, 6).map((alert, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-red-50/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-700 font-black text-xs">
                                                {alert.student_name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{alert.student_name}</p>
                                            <p className="text-xs text-gray-500">{alert.group} · {alert.absent_count} ausencias de {alert.total_classes}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-red-600">{alert.absence_rate}%</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(alert.severity)}`}>
                                            {alert.severity?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}