import { Head, useForm } from '@inertiajs/react';
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Periodos() {
    const [showModal, setShowModal] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState(null);

    const { data, setData, post, put, reset, processing } = useForm({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        habilitado: true
    });

    // Datos de ejemplo
    const periodos = [
        { 
            id: 1, 
            nombre: '2025-1', 
            fecha_inicio: '2025-01-15', 
            fecha_fin: '2025-05-30', 
            habilitado: true,
            estado: 'Activo'
        },
        { 
            id: 2, 
            nombre: '2024-4', 
            fecha_inicio: '2024-10-01', 
            fecha_fin: '2024-12-15', 
            habilitado: false,
            estado: 'Finalizado'
        },
        { 
            id: 3, 
            nombre: '2024-3', 
            fecha_inicio: '2024-07-01', 
            fecha_fin: '2024-09-30', 
            habilitado: false,
            estado: 'Finalizado'
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPeriodo) {
            put(`/secretaria/periodos/${editingPeriodo.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setEditingPeriodo(null);
                }
            });
        } else {
            post('/secretaria/periodos/crear', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (periodo) => {
        setEditingPeriodo(periodo);
        setData({
            nombre: periodo.nombre,
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin,
            habilitado: periodo.habilitado
        });
        setShowModal(true);
    };

    const toggleHabilitado = (periodoId) => {
        // Aquí iría la lógica para habilitar/deshabilitar
        console.log('Toggle habilitado para periodo:', periodoId);
    };

    return (
        <Layout title="Periodos Académicos - Secretaria">            
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Periodos Académicos</h1>
                        <p className="text-gray-600 mt-2">Gestiona los periodos y habilita la carga de notas</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPeriodo(null);
                            reset();
                            setShowModal(true);
                        }}
                        className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nuevo Periodo</span>
                    </button>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Periodo Actual</p>
                                <p className="text-2xl font-bold text-green-600">2025-1</p>
                            </div>
                            <Calendar className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Periodos</p>
                                <p className="text-2xl font-bold text-blue-600">{periodos.length}</p>
                            </div>
                            <Calendar className="h-10 w-10 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Carga Habilitada</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {periodos.filter(p => p.habilitado).length}
                                </p>
                            </div>
                            <Unlock className="h-10 w-10 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Periodos List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Periodos</h2>
                        <div className="space-y-4">
                            {periodos.map((periodo) => (
                                <div 
                                    key={periodo.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    Periodo {periodo.nombre}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    periodo.estado === 'Activo' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {periodo.estado}
                                                </span>
                                                {periodo.habilitado ? (
                                                    <span className="flex items-center text-green-600 text-sm">
                                                        <Unlock className="h-4 w-4 mr-1" />
                                                        Carga habilitada
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-red-600 text-sm">
                                                        <Lock className="h-4 w-4 mr-1" />
                                                        Carga bloqueada
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    {new Date(periodo.fecha_inicio).toLocaleDateString('es-CO')} - {new Date(periodo.fecha_fin).toLocaleDateString('es-CO')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => toggleHabilitado(periodo.id)}
                                                className={`p-2 rounded-lg transition ${
                                                    periodo.habilitado 
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                                title={periodo.habilitado ? 'Deshabilitar carga' : 'Habilitar carga'}
                                            >
                                                {periodo.habilitado ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(periodo)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                title="Editar"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    {editingPeriodo ? 'Editar Periodo' : 'Nuevo Periodo'}
                                </h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del Periodo *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.nombre}
                                                onChange={(e) => setData('nombre', e.target.value)}
                                                placeholder="Ej: 2025-1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Fecha de Inicio *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.fecha_inicio}
                                                onChange={(e) => setData('fecha_inicio', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Fecha de Fin *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.fecha_fin}
                                                onChange={(e) => setData('fecha_fin', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.habilitado}
                                                onChange={(e) => setData('habilitado', e.target.checked)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-700">
                                                Habilitar carga de notas
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditingPeriodo(null);
                                                reset();
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            {processing ? 'Guardando...' : (editingPeriodo ? 'Actualizar' : 'Crear Periodo')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}