import { Head, useForm, usePage, router } from '@inertiajs/react';
import { CheckCircle, DollarSign, BookOpen, Users, AlertCircle, GraduationCap } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <Layout title="Dashboard - Coordinadora">
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Bienvenida, Coordinadora
                    </h1>
                    <p className="text-gray-600 mt-1">Supervisión académica y financiera</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-yellow-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Pagos Pendientes</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mt-1">23</p>
                                <p className="text-xs text-yellow-700 mt-1 font-medium">Requieren validación</p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl">
                                <AlertCircle className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-green-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Pagos Validados</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">156</p>
                                <p className="text-xs text-green-700 mt-1 font-medium">Este mes</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                                <CheckCircle className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-blue-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Notas Cargadas</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">89%</p>
                                <p className="text-xs text-blue-700 mt-1 font-medium">Periodo actual</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl">
                                <BookOpen className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-purple-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Estudiantes</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-1">1,245</p>
                                <p className="text-xs text-purple-700 mt-1 font-medium">Total activos</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                                <Users className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">Acciones Rápidas</h2>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all border border-green-100 hover:border-green-200 hover:shadow-md group">
                            <div className="bg-green-100 group-hover:bg-green-200 p-3 rounded-xl transition-colors">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800 text-sm">Validar Pagos</p>
                                <p className="text-xs text-gray-500 mt-0.5">23 pendientes</p>
                            </div>
                        </button>
                        <button className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 hover:border-blue-200 hover:shadow-md group">
                            <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-xl transition-colors">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800 text-sm">Revisar Notas</p>
                                <p className="text-xs text-gray-500 mt-0.5">Por curso y materia</p>
                            </div>
                        </button>
                        <button className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border border-purple-100 hover:border-purple-200 hover:shadow-md group">
                            <div className="bg-purple-100 group-hover:bg-purple-200 p-3 rounded-xl transition-colors">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800 text-sm">Reportes Financieros</p>
                                <p className="text-xs text-gray-500 mt-0.5">Ver estadísticas</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 className="text-lg font-bold text-white">Pagos Pendientes de Validación</h2>
                    </div>
                    <div className="p-5 space-y-3">
                        {[
                            { name: 'María García', grade: 'Grado 8A', concept: 'Mensualidad Octubre', amount: '$350,000' },
                            { name: 'Carlos Rodríguez', grade: 'Grado 5B', concept: 'Mensualidad Octubre', amount: '$350,000' },
                        ].map((payment, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200 gap-3 hover:bg-yellow-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-yellow-100 p-2.5 rounded-xl flex-shrink-0">
                                        <DollarSign className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{payment.name} — {payment.grade}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">{payment.concept} — {payment.amount}</p>
                                    </div>
                                </div>
                                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-semibold shadow-md self-start sm:self-auto flex-shrink-0">
                                    Validar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}