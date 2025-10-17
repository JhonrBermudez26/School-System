import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle, DollarSign, BookOpen, Users, AlertCircle, LogOut, GraduationCap } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;
    return (
        <Layout title="Dashboard - Coordinadora" >
            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bienvenida, Coordinadora</h1>
                    <p className="text-gray-600 mt-2">Supervisión académica y financiera</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pagos Pendientes</p>
                                <p className="text-3xl font-bold text-gray-900">23</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            </div>
                        </div>
                        <p className="text-yellow-600 text-sm mt-2">Requieren validación</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pagos Validados</p>
                                <p className="text-3xl font-bold text-gray-900">156</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <p className="text-green-600 text-sm mt-2">Este mes</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Notas Cargadas</p>
                                <p className="text-3xl font-bold text-gray-900">89%</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <BookOpen className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-blue-600 text-sm mt-2">Periodo actual</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Estudiantes</p>
                                <p className="text-3xl font-bold text-gray-900">1,245</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Users className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-2">Total activos</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Validar Pagos</p>
                                <p className="text-sm text-gray-600">23 pendientes</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Revisar Notas</p>
                                <p className="text-sm text-gray-600">Por curso y materia</p>
                            </div>
                        </button>
                        <button className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Reportes Financieros</p>
                                <p className="text-sm text-gray-600">Ver estadísticas</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Pagos Pendientes de Validación</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-4">
                                <div className="bg-yellow-100 p-2 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">María García - Grado 8A</p>
                                    <p className="text-sm text-gray-600">Mensualidad Octubre - $350,000</p>
                                </div>
                            </div>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                                Validar
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-4">
                                <div className="bg-yellow-100 p-2 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Carlos Rodríguez - Grado 5B</p>
                                    <p className="text-sm text-gray-600">Mensualidad Octubre - $350,000</p>
                                </div>
                            </div>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                                Validar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
}
