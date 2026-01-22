import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, Users, CheckSquare, Calendar, LogOut, GraduationCap } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';
export default function Dashboard() {

    const { props } = usePage();
    const { stats = {}, asignaciones = [] } = props;
    const { misMaterias = 0, totalEstudiantes = 0, tareasActivas = 0, porCalificar = 0 } = stats;

    return (
        
            <Layout title="Dashboard - Profesor">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bienvenido, Profesor</h1>
                    <p className="text-gray-600 mt-2">Panel de gestión académica</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Mis Materias</p>
                                <p className="text-3xl font-bold text-gray-900">{misMaterias}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <BookOpen className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-blue-600 text-sm mt-2">Asignadas este periodo</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Estudiantes</p>
                                <p className="text-3xl font-bold text-gray-900">{totalEstudiantes}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Users className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <p className="text-green-600 text-sm mt-2">Total en mis grupos</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Tareas Activas</p>
                                <p className="text-3xl font-bold text-gray-900">{tareasActivas}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <ClipboardList className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-purple-600 text-sm mt-2">En curso</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Por Calificar</p>
                                <p className="text-3xl font-bold text-gray-900">{porCalificar}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <CheckSquare className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-orange-600 text-sm mt-2">Entregas pendientes</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Registrar Notas</p>
                                <p className="text-sm text-gray-600">Cargar calificaciones</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                            <ClipboardList className="h-6 w-6 text-green-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Crear Tarea</p>
                                <p className="text-sm text-gray-600">Nueva actividad</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                            <CheckSquare className="h-6 w-6 text-purple-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Calificar Entregas</p>
                                <p className="text-sm text-gray-600">23 pendientes</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mis Materias y Grupos */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Materias</h2>
                        <div className="space-y-3">
                            {asignaciones.length === 0 && (
                                <p className="text-sm text-gray-600">No tienes asignaciones registradas.</p>
                            )}
                            {asignaciones.map((item, idx) => (
                                <div key={`${item.subject_id}-${item.group_id}-${idx}`} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{item.subject_name}</h3>
                                        <span className="text-sm text-gray-600">{item.group_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{item.students_count} estudiantes</span>
                                        <button className="text-blue-600 hover:text-blue-700 font-medium">Ver grupo</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Tareas Próximas a Vencer</h2>
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">Aún no hay tareas próximas configuradas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
