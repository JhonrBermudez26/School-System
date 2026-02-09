import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, Award, TrendingUp, Calendar, FileText, Clock, User } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard() {
    const { props } = usePage();
    const { stats = {}, studentInfo = {}, materias = [], tareasPendientes = [], proximasEvaluaciones = [] } = props;
    const { promedio = 0, tareasPendientes: pendingCount = 0, asistencia = 0, materiasInscritas = 0 } = stats;

    // Función para navegar a Mis Notas
    const handleVerNotas = () => {
        router.visit('/estudiante/notas');
    };

    // Función para navegar a Mis Clases
    const handleVerClases = () => {
        router.visit('/estudiante/clases');
    };

    // Función para ver perfil académico
    const handleVerPerfil = () => {
        router.visit('/estudiante/perfil');
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    };

    // Calcular días restantes
    const getDaysRemaining = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateString);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Obtener color según días restantes
    const getDaysRemainingColor = (days) => {
        if (days === null) return 'text-gray-600';
        if (days < 0) return 'text-red-600';
        if (days === 0) return 'text-orange-600';
        if (days <= 3) return 'text-yellow-600';
        return 'text-green-600';
    };

    // Obtener color del promedio
    const getGradeColor = (grade) => {
        if (grade >= 4.5) return 'text-green-600';
        if (grade >= 4.0) return 'text-blue-600';
        if (grade >= 3.5) return 'text-yellow-600';
        if (grade >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    // Obtener color de fondo del promedio
    const getGradeBgColor = (grade) => {
        if (grade >= 4.5) return 'bg-green-50 border-green-200';
        if (grade >= 4.0) return 'bg-blue-50 border-blue-200';
        if (grade >= 3.5) return 'bg-yellow-50 border-yellow-200';
        if (grade >= 3.0) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <Layout>
            <Head title="Dashboard Estudiante" />

            {/* Main Content */}
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Bienvenido, {studentInfo.name || 'Estudiante'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {studentInfo.grade || 'Sin grupo asignado'} - {studentInfo.period || 'N/A'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Promedio General</p>
                                <p className="text-3xl font-bold text-gray-800">{promedio.toFixed(1)}</p>
                                <p className={`text-xs font-medium mt-1 ${
                                    promedio >= 4.0 ? 'text-blue-600' : 
                                    promedio >= 3.5 ? 'text-yellow-600' : 'text-orange-600'
                                }`}>
                                    {promedio >= 4.0 ? 'Excelente rendimiento' : 
                                     promedio >= 3.5 ? 'Buen desempeño' : 
                                     promedio > 0 ? 'Puedes mejorar' : 'Sin calificaciones'}
                                </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tareas Pendientes</p>
                                <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
                                <p className="text-xs text-gray-500 mt-1">Por entregar</p>
                            </div>
                            <ClipboardList className="w-12 h-12 text-orange-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Materias Inscritas</p>
                                <p className="text-3xl font-bold text-gray-800">{materiasInscritas}</p>
                                <p className="text-xs text-gray-500 mt-1">Este periodo</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Asistencia</p>
                                <p className="text-3xl font-bold text-gray-800">{asistencia}%</p>
                                <p className="text-xs text-gray-500 mt-1">Este periodo</p>
                            </div>
                            <Award className="w-12 h-12 text-purple-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Accesos Rápidos</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={handleVerNotas}
                            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                            <FileText className="w-10 h-10 text-blue-600 mr-4" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Mis Notas</p>
                                <p className="text-sm text-gray-600">Ver calificaciones</p>
                            </div>
                        </button>

                        <button 
                            onClick={handleVerClases}
                            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition"
                        >
                            <BookOpen className="w-10 h-10 text-green-600 mr-4" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Mis Clases</p>
                                <p className="text-sm text-gray-600">{materiasInscritas} clases</p>
                            </div>
                        </button>

                        <button 
                            onClick={handleVerPerfil}
                            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                        >
                            <User className="w-10 h-10 text-purple-600 mr-4" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Mi Perfil</p>
                                <p className="text-sm text-gray-600">Información académica</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Grid de 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mis Notas por Materia */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Mis Notas por Materia</h2>
                        </div>
                        <div className="p-6">
                            {(!materias || materias.length === 0) && (
                                <p className="text-center text-gray-500 py-8">
                                    No hay materias registradas.
                                </p>
                            )}
                            {materias && materias.slice(0, 5).map((materia, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex items-center justify-between p-4 rounded-lg mb-3 last:mb-0 border ${getGradeBgColor(materia.promedio)}`}
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
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${getGradeColor(materia.promedio)}`}>
                                            {materia.promedio.toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tareas Pendientes */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Tareas Pendientes</h2>
                        </div>
                        <div className="p-6">
                            {(!tareasPendientes || tareasPendientes.length === 0) && (
                                <p className="text-center text-gray-500 py-8">
                                    ¡No tienes tareas pendientes!
                                </p>
                            )}
                            {tareasPendientes && tareasPendientes.map((tarea, idx) => {
                                const daysRemaining = getDaysRemaining(tarea.due_date);
                                const colorClass = getDaysRemainingColor(daysRemaining);
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`p-4 rounded-lg mb-3 last:mb-0 border ${
                                            daysRemaining < 0 ? 'bg-red-50 border-red-200' :
                                            daysRemaining === 0 ? 'bg-orange-50 border-orange-200' :
                                            daysRemaining <= 3 ? 'bg-yellow-50 border-yellow-200' : 
                                            'bg-green-50 border-green-200'
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
                                                'bg-green-200 text-green-800'
                                            }`}>
                                                {daysRemaining < 0 
                                                    ? 'Vencida'
                                                    : daysRemaining === 0 
                                                    ? 'Hoy'
                                                    : `${daysRemaining}d`
                                                }
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
                                        <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
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
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Próximas Evaluaciones</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {proximasEvaluaciones.map((evaluacion, idx) => {
                                const daysRemaining = getDaysRemaining(evaluacion.due_date);
                                const colorClass = getDaysRemainingColor(daysRemaining);

                                return (
                                    <div 
                                        key={idx} 
                                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
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
                                                {daysRemaining === 0 
                                                    ? 'Hoy'
                                                    : `${daysRemaining} días`
                                                }
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