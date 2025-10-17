import { Head, Link, router } from '@inertiajs/react';
import { LayoutDashboard, Users, DollarSign, BookOpen, TrendingUp, LogOut, GraduationCap } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';


export default function Dashboard() {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <Layout title="Dashboard - Rector">
            
            <div className="min-h-screen bg-gray-100">
                {/* Navbar */}
                <nav className="bg-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <GraduationCap className="h-8 w-8 text-blue-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">Colegio San Martín</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700 font-medium">Rector</span>
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
                        <h1 className="text-3xl font-bold text-gray-900">Bienvenido, Rector</h1>
                        <p className="text-gray-600 mt-2">Panel de control general del colegio</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Estudiantes</p>
                                    <p className="text-3xl font-bold text-gray-900">1,245</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Users className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-green-600 text-sm mt-2">↑ 5% vs mes anterior</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Ingresos Mes</p>
                                    <p className="text-3xl font-bold text-gray-900">$45M</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <p className="text-green-600 text-sm mt-2">↑ 12% vs mes anterior</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Promedio General</p>
                                    <p className="text-3xl font-bold text-gray-900">4.2</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <TrendingUp className="h-8 w-8 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-green-600 text-sm mt-2">↑ 0.3 vs periodo anterior</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Profesores</p>
                                    <p className="text-3xl font-bold text-gray-900">85</p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-lg">
                                    <BookOpen className="h-8 w-8 text-orange-600" />
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mt-2">Personal activo</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                                <Users className="h-6 w-6 text-blue-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">Gestión de Usuarios</p>
                                    <p className="text-sm text-gray-600">Administrar personal</p>
                                </div>
                            </button>
                            <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                                <DollarSign className="h-6 w-6 text-green-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">Reportes Financieros</p>
                                    <p className="text-sm text-gray-600">Ver ingresos y gastos</p>
                                </div>
                            </button>
                            <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">Reportes Académicos</p>
                                    <p className="text-sm text-gray-600">Rendimiento general</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Nuevo estudiante inscrito</p>
                                    <p className="text-sm text-gray-600">Juan Pérez - Grado 5A</p>
                                </div>
                                <span className="text-sm text-gray-500">Hace 2 horas</span>
                            </div>
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Pago validado</p>
                                    <p className="text-sm text-gray-600">Mensualidad de María García</p>
                                </div>
                                <span className="text-sm text-gray-500">Hace 5 horas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
