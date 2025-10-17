import { Head, useForm } from '@inertiajs/react';
import { Settings, Save, Bell, Shield, Database, Mail } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Configuracion() {
    const [activeTab, setActiveTab] = useState('general');

    const { data, setData, post, processing } = useForm({
        // General
        nombre_colegio: 'Colegio San Martín',
        direccion_colegio: 'Calle 123 #45-67',
        telefono_colegio: '+57 1 234 5678',
        email_colegio: 'info@colegiosanmartin.edu.co',
        
        // Notificaciones
        notif_nuevos_estudiantes: true,
        notif_pagos: true,
        notif_notas: false,
        
        // Sistema
        max_estudiantes_grado: 35,
        periodos_año: 4,
        
        // Email
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/secretaria/configuracion/actualizar', {
            onSuccess: () => {
                alert('Configuración actualizada correctamente');
            }
        });
    };

    return (
        <Layout title="Configuración - Secretaria">          
            <div>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                    <p className="text-gray-600 mt-2">Administra las configuraciones generales</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'general'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Settings className="inline h-5 w-5 mr-2" />
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('notificaciones')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'notificaciones'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Bell className="inline h-5 w-5 mr-2" />
                                Notificaciones
                            </button>
                            <button
                                onClick={() => setActiveTab('sistema')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'sistema'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Database className="inline h-5 w-5 mr-2" />
                                Sistema
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'email'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Mail className="inline h-5 w-5 mr-2" />
                                Correo
                            </button>
                        </nav>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Información General del Colegio</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del Colegio
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nombre_colegio}
                                        onChange={(e) => setData('nombre_colegio', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={data.direccion_colegio}
                                        onChange={(e) => setData('direccion_colegio', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.telefono_colegio}
                                            onChange={(e) => setData('telefono_colegio', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email_colegio}
                                            onChange={(e) => setData('email_colegio', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notificaciones Tab */}
                        {activeTab === 'notificaciones' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Preferencias de Notificaciones</h3>
                                <p className="text-sm text-gray-600">Configura qué notificaciones deseas recibir</p>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Nuevos Estudiantes</p>
                                            <p className="text-sm text-gray-600">Recibe notificación cuando se registre un nuevo estudiante</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.notif_nuevos_estudiantes}
                                                onChange={(e) => setData('notif_nuevos_estudiantes', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Pagos Recibidos</p>
                                            <p className="text-sm text-gray-600">Notificación cuando se registre un pago</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.notif_pagos}
                                                onChange={(e) => setData('notif_pagos', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">Carga de Notas</p>
                                            <p className="text-sm text-gray-600">Notificación cuando un profesor cargue notas</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.notif_notas}
                                                onChange={(e) => setData('notif_notas', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sistema Tab */}
                        {activeTab === 'sistema' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Configuración del Sistema</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Máximo de Estudiantes por Grado
                                    </label>
                                    <input
                                        type="number"
                                        value={data.max_estudiantes_grado}
                                        onChange={(e) => setData('max_estudiantes_grado', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        min="1"
                                        max="100"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Número máximo de estudiantes permitidos por grado</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Periodos Académicos por Año
                                    </label>
                                    <select
                                        value={data.periodos_año}
                                        onChange={(e) => setData('periodos_año', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="2">2 Periodos (Semestres)</option>
                                        <option value="3">3 Periodos (Trimestres)</option>
                                        <option value="4">4 Periodos (Bimestres)</option>
                                    </select>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-blue-900">Información de Seguridad</h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                Los cambios en la configuración del sistema afectarán a todos los usuarios. Asegúrate de revisar cuidadosamente antes de guardar.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Tab */}
                        {activeTab === 'email' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Configuración de Correo SMTP</h3>
                                <p className="text-sm text-gray-600">Configura el servidor SMTP para envío de correos</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Servidor SMTP
                                        </label>
                                        <input
                                            type="text"
                                            value={data.smtp_host}
                                            onChange={(e) => setData('smtp_host', e.target.value)}
                                            placeholder="smtp.gmail.com"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Puerto
                                        </label>
                                        <input
                                            type="text"
                                            value={data.smtp_port}
                                            onChange={(e) => setData('smtp_port', e.target.value)}
                                            placeholder="587"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Usuario
                                        </label>
                                        <input
                                            type="email"
                                            value={data.smtp_user}
                                            onChange={(e) => setData('smtp_user', e.target.value)}
                                            placeholder="usuario@gmail.com"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={data.smtp_password}
                                            onChange={(e) => setData('smtp_password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Probar Conexión
                                </button>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" />
                                <span>{processing ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}