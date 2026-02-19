import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, Award, TrendingUp, Calendar, FileText, Clock, User } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard() {
    const { props } = usePage();
    const { stats = {}, studentInfo = {}, materias = [], tareasPendientes = [], proximasEvaluaciones = [], can = {} } = props;
    const { promedio = 0, tareasPendientes: pendingCount = 0, asistencia = 0, materiasInscritas = 0 } = stats;

    const handleVerNotas = () => router.visit('/estudiante/notas');
    const handleVerClases = () => router.visit('/estudiante/clases');
    const handleVerPerfil = () => router.visit('/estudiante/perfil');

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysRemaining = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateString);
        dueDate.setHours(0, 0, 0, 0);
        return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    };

    const getDaysRemainingColor = (days) => {
        if (days === null) return 'text-gray-600';
        if (days < 0) return 'text-red-600';
        if (days === 0) return 'text-orange-600';
        if (days <= 3) return 'text-yellow-600';
        return 'text-blue-600';
    };

    const getGradeColor = (grade) => {
        if (grade >= 4.5) return 'text-blue-600';
        if (grade >= 4.0) return 'text-indigo-600';
        if (grade >= 3.5) return 'text-yellow-600';
        if (grade >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBgColor = (grade) => {
        if (grade >= 4.5) return 'bg-blue-50 border-blue-200';
        if (grade >= 4.0) return 'bg-indigo-50 border-indigo-200';
        if (grade >= 3.5) return 'bg-yellow-50 border-yellow-200';
        if (grade >= 3.0) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <Layout>
            <Head title="Dashboard Estudiante" />
            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Bienvenido, {studentInfo.name || 'Estudiante'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {studentInfo.grade || 'Sin grupo asignado'} — {studentInfo.period || 'N/A'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {can.view_grades && (
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 border-l-4 border-l-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Promedio General</p>
                                    <p className="text-3xl font-bold text-gray-800">{promedio.toFixed(1)}</p>
                                    <p className={`text-xs font-medium mt-1 ${promedio >= 4.0 ? 'text-blue-600' : promedio >= 3.5 ? 'text-yellow-600' : 'text-orange-600'}`}>
                                        {promedio >= 4.0 ? 'Excelente rendimiento' : promedio >= 3.5 ? 'Buen desempeño' : promedio > 0 ? 'Puedes mejorar' : 'Sin calificaciones'}
                                    </p>
                                </div>
                                <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                            </div>
                        </div>
                    )}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 border-l-4 border-l-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tareas Pendientes</p>
                                <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
                                <p className="text-xs text-gray-500 mt-1">Por entregar</p>
                            </div>
                            <ClipboardList className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Materias Inscritas</p>
                                <p className="text-3xl font-bold text-gray-800">{materiasInscritas}</p>
                                <p className="text-xs text-gray-500 mt-1">Este periodo</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>
                    {can.view_attendance && (
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 border-l-4 border-l-indigo-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Asistencia</p>
                                    <p className="text-3xl font-bold text-gray-800">{asistencia}%</p>
                                    <p className="text-xs text-gray-500 mt-1">Este periodo</p>
                                </div>
                                <Award className="w-12 h-12 text-indigo-500 opacity-20" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                        <h2 className="text-xl font-bold">Accesos Rápidos</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {can.view_grades && (
                            <button
                                onClick={handleVerNotas}
                                className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                            >
                                <FileText className="w-10 h-10 text-blue-600 mr-4 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">Mis Notas</p>
                                    <p className="text-sm text-gray-600">Ver calificaciones</p>
                                </div>
                            </button>
                        )}
                        <button
                            onClick={handleVerClases}
                            className="flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100"
                        >
                            <BookOpen className="w-10 h-10 text-indigo-600 mr-4 flex-shrink-0" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Mis Clases</p>
                                <p className="text-sm text-gray-600">{materiasInscritas} clases</p>
                            </div>
                        </button>
                        {can.view_schedules && (
                            <button
                                onClick={() => router.visit(route('estudiante.horario'))}
                                className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                            >
                                <Calendar className="w-10 h-10 text-blue-600 mr-4 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">Mi Horario</p>
                                    <p className="text-sm text-gray-600">Ver agenda semanal</p>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid: Notas + Tareas */}
                <div className={`grid grid-cols-1 ${can.view_grades ? 'lg:grid-cols-2' : ''} gap-6`}>

                    {/* Mis Notas por Materia */}
                    {can.view_grades && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-800">Mis Notas por Materia</h2>
                            </div>
                            <div className="p-6">
                                {(!materias || materias.length === 0) && (
                                    <p className="text-center text-gray-500 py-8">No hay materias registradas.</p>
                                )}
                                {materias && materias.slice(0, 5).map((materia, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-4 rounded-xl mb-3 last:mb-0 border ${getGradeBgColor(materia.promedio)}`}
                                    >
                                        <div className="flex items-center flex-1">
                                            <div className="bg-white rounded-lg p-3 mr-4 shadow-sm">
                                                <BookOpen className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{materia.subject_name}</p>
                                                <p className="text-sm text-gray-600">{materia.teacher_name}</p>
                                            </div>
                                        </div>
                                        <p className={`text-2xl font-bold ${getGradeColor(materia.promedio)}`}>
                                            {materia.promedio.toFixed(1)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tareas Pendientes */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800">Tareas Pendientes</h2>
                        </div>
                        <div className="p-6">
                            {(!tareasPendientes || tareasPendientes.length === 0) && (
                                <p className="text-center text-gray-500 py-8">¡No tienes tareas pendientes!</p>
                            )}
                            {tareasPendientes && tareasPendientes.map((tarea, idx) => {
                                const daysRemaining = getDaysRemaining(tarea.due_date);
                                const colorClass = getDaysRemainingColor(daysRemaining);
                                return (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-xl mb-3 last:mb-0 border ${
                                            daysRemaining < 0 ? 'bg-red-50 border-red-200' :
                                            daysRemaining === 0 ? 'bg-orange-50 border-orange-200' :
                                            daysRemaining <= 3 ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-blue-50 border-blue-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">{tarea.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{tarea.subject_name}</p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                daysRemaining < 0 ? 'bg-red-200 text-red-800' :
                                                daysRemaining === 0 ? 'bg-orange-200 text-orange-800' :
                                                daysRemaining <= 3 ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-blue-200 text-blue-800'
                                            }`}>
                                                {daysRemaining < 0 ? 'Vencida' : daysRemaining === 0 ? 'Hoy' : `${daysRemaining}d`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(tarea.due_date)}
                                            </div>
                                            {tarea.max_score && (
                                                <span className="text-gray-600">Valor: {tarea.max_score}</span>
                                            )}
                                        </div>
                                        <button className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow hover:shadow-lg">
                                            Entregar Tarea
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Próximas Evaluaciones */}
                {proximasEvaluaciones && proximasEvaluaciones.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800">Próximas Evaluaciones</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {proximasEvaluaciones.map((evaluacion, idx) => {
                                const daysRemaining = getDaysRemaining(evaluacion.due_date);
                                const colorClass = getDaysRemainingColor(daysRemaining);
                                return (
                                    <div
                                        key={idx}
                                        className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <h3 className="font-semibold text-gray-800 mb-2">{evaluacion.title}</h3>
                                        <p className="text-sm text-gray-600 mb-3">{evaluacion.subject_name}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center text-gray-500">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(evaluacion.due_date)}
                                            </div>
                                            <span className={`font-semibold ${colorClass}`}>
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {daysRemaining === 0 ? 'Hoy' : `${daysRemaining} días`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}