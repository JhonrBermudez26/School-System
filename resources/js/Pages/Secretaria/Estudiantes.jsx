import { Head, router } from '@inertiajs/react';
import { Search, Edit, Trash2, Eye, UserPlus, Download, Filter } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Estudiantes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGrado, setSelectedGrado] = useState('todos');

    // Datos de ejemplo
    const estudiantes = [
        { id: 1, nombre: 'Juan Martínez', grado: '5A', documento: '1234567890', telefono: '300 123 4567', estado: 'Activo' },
        { id: 2, nombre: 'Sofía López', grado: '3B', documento: '0987654321', telefono: '310 987 6543', estado: 'Activo' },
        { id: 3, nombre: 'Carlos Rodríguez', grado: '8A', documento: '1122334455', telefono: '320 456 7890', estado: 'Activo' },
        { id: 4, nombre: 'Ana García', grado: '6B', documento: '5544332211', telefono: '315 234 5678', estado: 'Inactivo' },
        { id: 5, nombre: 'Luis Hernández', grado: '5A', documento: '6677889900', telefono: '305 678 9012', estado: 'Activo' },
    ];

    const grados = ['todos', '3B', '5A', '6B', '8A'];

    const filteredEstudiantes = estudiantes.filter(est => {
        const matchesSearch = est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            est.documento.includes(searchTerm);
        const matchesGrado = selectedGrado === 'todos' || est.grado === selectedGrado;
        return matchesSearch && matchesGrado;
    });

    return (
        <Layout title="Gestionar Estudiantes - Secretaria">
            
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestionar Estudiantes</h1>
                        <p className="text-gray-600 mt-2">Administra la información de los estudiantes</p>
                    </div>
                    <button
                        onClick={() => router.visit('/secretaria/estudiantes/nuevo')}
                        className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md"
                    >
                        <UserPlus className="h-5 w-5" />
                        <span>Nuevo Estudiante</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-sm">Total Estudiantes</p>
                        <p className="text-2xl font-bold text-gray-900">{estudiantes.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-sm">Activos</p>
                        <p className="text-2xl font-bold text-green-600">
                            {estudiantes.filter(e => e.estado === 'Activo').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-sm">Inactivos</p>
                        <p className="text-2xl font-bold text-red-600">
                            {estudiantes.filter(e => e.estado === 'Inactivo').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <p className="text-gray-500 text-sm">Grados</p>
                        <p className="text-2xl font-bold text-blue-600">{grados.length - 1}</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o documento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="text-gray-400 h-5 w-5" />
                            <select
                                value={selectedGrado}
                                onChange={(e) => setSelectedGrado(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                {grados.map(grado => (
                                    <option key={grado} value={grado}>
                                        {grado === 'todos' ? 'Todos los grados' : `Grado ${grado}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estudiante
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Grado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teléfono
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEstudiantes.length > 0 ? (
                                    filteredEstudiantes.map((estudiante) => (
                                        <tr key={estudiante.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-bold text-sm">
                                                            {estudiante.nombre.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {estudiante.nombre}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {estudiante.documento}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {estudiante.grado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {estudiante.telefono}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    estudiante.estado === 'Activo' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {estudiante.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No se encontraron estudiantes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end">
                    <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                        <Download className="h-5 w-5" />
                        <span>Exportar Lista</span>
                    </button>
                </div>
            </div>
        </Layout>
    );
}