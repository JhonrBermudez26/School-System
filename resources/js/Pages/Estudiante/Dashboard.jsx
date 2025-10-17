import { Head, useForm, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, DollarSign, FileText, Award, TrendingUp, LogOut, GraduationCap } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;
    return (
        <Layout title="Dashboard - Estudiante">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bienvenido, Pedro López</h1>
                    <p className="text-gray-600 mt-2">Grado 8A - Periodo 2025-1</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Promedio General</p>
                                <p className="text-3xl font-bold text-gray-900">4.3</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <TrendingUp className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-blue-600 text-sm mt-2">Excelente rendimiento</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Tareas Pendientes</p>
                                <p className="text-3xl font-bold text-gray-900">3</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <ClipboardList className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-orange-600 text-sm mt-2">Por entregar</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pagos al Día</p>
                                <p className="text-3xl font-bold text-green-600">✓</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <p className="text-green-600 text-sm mt-2">Sin pendientes</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Asistencia</p>
                                <p className="text-3xl font-bold text-gray-900">95%</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Award className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-purple-600 text-sm mt-2">Este periodo</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Mis Notas</p>
                                <p className="text-sm text-gray-600">Ver calificaciones</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition">
                            <ClipboardList className="h-6 w-6 text-orange-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Tareas</p>
                                <p className="text-sm text-gray-600">3 pendientes</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                            <DollarSign className="h-6 w-6 text-green-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Pagos</p>
                                <p className="text-sm text-gray-600">Ver estado</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                            <FileText className="h-6 w-6 text-purple-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Boletines</p>
                                <p className="text-sm text-gray-600">Descargar</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Grades and Assignments */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Notas por Materia</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Matemáticas</p>
                                        <p className="text-sm text-gray-600">Periodo actual</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-green-600">4.5</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Español</p>
                                        <p className="text-sm text-gray-600">Periodo actual</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-blue-600">4.2</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Ciencias</p>
                                        <p className="text-sm text-gray-600">Periodo actual</p>
                                    </div>
                                </div>
                                <span className="text-2xl font-bold text-purple-600">4.4</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Tareas Pendientes</h2>
                        <div className="space-y-3">
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Taller de Ecuaciones</h3>
                                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">2 días</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">Matemáticas - Prof. Juan Pérez</p>
                                <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium">
                                    Entregar Tarea
                                </button>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900">Ensayo sobre el Quijote</h3>
                                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">5 días</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">Español - Prof. Laura Martínez</p>
                                <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-medium">
                                    Entregar Tarea
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </Layout>
    );
}
