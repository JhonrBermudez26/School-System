import { Head, router } from '@inertiajs/react';
import { BookOpen, ClipboardList, Users, CheckSquare, Calendar, LogOut, GraduationCap } from 'lucide-react';

export default function Dashboard() {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Dashboard - Profesor" />
            <div className="min-h-screen bg-gray-100">
                {/* Navbar */}
                <nav className="bg-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <GraduationCap className="h-8 w-8 text-indigo-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">Colegio San Martín</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700 font-medium">Profesor</span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                    <p className="text-3xl font-bold text-gray-900">5</p>
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
                                    <p className="text-3xl font-bold text-gray-900">145</p>
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
                                    <p className="text-3xl font-bold text-gray-900">8</p>
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
                                    <p className="text-3xl font-bold text-gray-900">23</p>
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

                    {/* My Classes and Assignments */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Materias</h2>
                            <div className="space-y-3">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">Matemáticas</h3>
                                        <span className="text-sm text-gray-600">Grado 8A</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">30 estudiantes</span>
                                        <button className="text-blue-600 hover:text-blue-700 font-medium">Ver grupo</button>
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">Física</h3>
                                        <span className="text-sm text-gray-600">Grado 10B</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">28 estudiantes</span>
                                        <button className="text-green-600 hover:text-green-700 font-medium">Ver grupo</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Tareas Próximas a Vencer</h2>
                            <div className="space-y-3">
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">Taller de Ecuaciones</h3>
                                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">2 días</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">Matemáticas - Grado 8A</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">12/30 entregas</span>
                                        <button className="text-orange-600 hover:text-orange-700 font-medium">Ver</button>
                                    </div>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">Laboratorio de Movimiento</h3>
                                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">5 días</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">Física - Grado 10B</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">8/28 entregas</span>
                                        <button className="text-yellow-600 hover:text-yellow-700 font-medium">Ver</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
