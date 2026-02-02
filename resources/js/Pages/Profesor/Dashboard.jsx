import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, Users, CheckSquare, Calendar, FileText, Eye, Clock } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard() {
    const { props } = usePage();
    const { stats = {}, asignaciones = [], proximasTareas = [] } = props;
    const { misMaterias = 0, totalEstudiantes = 0, tareasActivas = 0, porCalificar = 0 } = stats;

    // Función para navegar a Registrar Notas
    const handleRegistrarNotas = () => {
        router.visit(route('profesor.registrarNotas'));
    };

    // Función para navegar a Mis Clases (donde se pueden crear tareas)
    const handleCrearTarea = () => {
        router.visit(route('profesor.clases.index'));
    };

    // Función para navegar a la primera clase con entregas pendientes
    const handleCalificarEntregas = () => {
        if (asignaciones.length > 0) {
            const firstClass = asignaciones[0];
            router.visit(route('profesor.clases.show', {
                subject_id: firstClass.subject_id,
                group_id: firstClass.group_id
            }));
        } else {
            router.visit(route('profesor.clases.index'));
        }
    };

    // Función para ir al detalle de una clase
    const handleVerGrupo = (subjectId, groupId) => {
        router.visit(route('profesor.clases.show', {
            subject_id: subjectId,
            group_id: groupId
        }));
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

    return (
        <Layout>
            <Head title="Dashboard Profesor" />

            {/* Main Content */}
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Bienvenido, Profesor</h1>
                    <p className="text-gray-600 mt-2">Panel de gestión académica</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Mis Materias</p>
                                <p className="text-3xl font-bold text-gray-800">{misMaterias}</p>
                                <p className="text-xs text-gray-500 mt-1">Asignadas este periodo</p>
                            </div>
                            <BookOpen className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Estudiantes</p>
                                <p className="text-3xl font-bold text-gray-800">{totalEstudiantes}</p>
                                <p className="text-xs text-gray-500 mt-1">Total en mis grupos</p>
                            </div>
                            <Users className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tareas Activas</p>
                                <p className="text-3xl font-bold text-gray-800">{tareasActivas}</p>
                                <p className="text-xs text-gray-500 mt-1">En curso</p>
                            </div>
                            <ClipboardList className="w-12 h-12 text-yellow-500 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Por Calificar</p>
                                <p className="text-3xl font-bold text-gray-800">{porCalificar}</p>
                                <p className="text-xs text-gray-500 mt-1">Entregas pendientes</p>
                            </div>
                            <CheckSquare className="w-12 h-12 text-red-500 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Acciones Rápidas</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={handleRegistrarNotas}
                            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                            <FileText className="w-10 h-10 text-blue-600 mr-4" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Registrar Notas</p>
                                <p className="text-sm text-gray-600">Cargar calificaciones</p>
                            </div>
                        </button>

                        <button 
                            onClick={handleCrearTarea}
                            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition"
                        >
                            <Calendar className="w-10 h-10 text-green-600 mr-4" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Crear Tarea</p>
                                <p className="text-sm text-gray-600">Nueva actividad</p>
                            </div>
                        </button>

                        <button 
                            onClick={handleCalificarEntregas}
                            className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition"
                        >
                            <CheckSquare className="w-10 h-10 text-yellow-600 mr-4" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Calificar Entregas</p>
                                <p className="text-sm text-gray-600">{porCalificar} pendientes</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mis Materias y Grupos */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Mis Materias</h2>
                    </div>
                    <div className="p-6">
                        {asignaciones.length === 0 && (
                            <p className="text-center text-gray-500 py-8">
                                No tienes asignaciones registradas.
                            </p>
                        )}

                        {asignaciones.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3 last:mb-0 hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center">
                                    <div className="bg-blue-500 rounded-lg p-3 mr-4">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.subject_name}</p>
                                        <p className="text-sm text-gray-600">{item.group_name}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <Users className="w-3 h-3 inline mr-1" />
                                            {item.students_count} estudiantes
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleVerGrupo(item.subject_id, item.group_id)}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver grupo
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tareas Próximas a Vencer */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Tareas Próximas a Vencer</h2>
                    </div>
                    <div className="p-6">
                        {(!proximasTareas || proximasTareas.length === 0) && (
                            <p className="text-center text-gray-500 py-8">
                                No hay tareas próximas a vencer.
                            </p>
                        )}

                        {proximasTareas && proximasTareas.map((tarea, idx) => {
                            const daysRemaining = getDaysRemaining(tarea.due_date);
                            const colorClass = getDaysRemainingColor(daysRemaining);

                            return (
                                <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-3 last:mb-0 hover:bg-gray-100 transition"
                                >
                                    <div className="flex items-center flex-1">
                                        <div className={`rounded-lg p-3 mr-4 ${
                                            daysRemaining < 0 ? 'bg-red-100' :
                                            daysRemaining === 0 ? 'bg-orange-100' :
                                            daysRemaining <= 3 ? 'bg-yellow-100' : 'bg-green-100'
                                        }`}>
                                            <ClipboardList className={`w-6 h-6 ${
                                                daysRemaining < 0 ? 'text-red-600' :
                                                daysRemaining === 0 ? 'text-orange-600' :
                                                daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'
                                            }`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{tarea.title}</p>
                                            <p className="text-sm text-gray-600">{tarea.subject_name} - {tarea.group_name}</p>
                                            <div className="flex items-center mt-1 space-x-4">
                                                <p className="text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3 inline mr-1" />
                                                    Vence: {formatDate(tarea.due_date)}
                                                </p>
                                                <p className={`text-xs font-semibold ${colorClass}`}>
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    {daysRemaining < 0 
                                                        ? `Vencida hace ${Math.abs(daysRemaining)} días`
                                                        : daysRemaining === 0 
                                                        ? 'Vence hoy'
                                                        : `${daysRemaining} días restantes`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">
                                            {tarea.submitted_count}/{tarea.total_students} entregas
                                        </p>
                                        <button 
                                            onClick={() => handleVerGrupo(tarea.subject_id, tarea.group_id)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                                        >
                                            Ver detalles →
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Layout>
    );
}