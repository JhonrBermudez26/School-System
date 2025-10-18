import { FileText, Download, Eye, Printer, Filter, Search } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Boletines() {
    const [selectedPeriodo, setSelectedPeriodo] = useState('2025-1');
    const [selectedGrado, setSelectedGrado] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Datos de ejemplo
    const boletines = [
        { id: 1, estudiante: 'Juan Martínez', grado: '5A', periodo: '2025-1', promedio: 4.2, generado: '2025-06-15', estado: 'Generado' },
        { id: 2, estudiante: 'Sofía López', grado: '3B', periodo: '2025-1', promedio: 4.5, generado: '2025-06-15', estado: 'Generado' },
        { id: 3, estudiante: 'Carlos Rodríguez', grado: '8A', periodo: '2025-1', promedio: 3.8, generado: null, estado: 'Pendiente' },
        { id: 4, estudiante: 'Ana García', grado: '6B', periodo: '2025-1', promedio: 4.0, generado: '2025-06-15', estado: 'Generado' },
        { id: 5, estudiante: 'Luis Hernández', grado: '5A', periodo: '2025-1', promedio: 3.9, generado: null, estado: 'Pendiente' },
    ];

    const periodos = ['2025-1', '2024-4', '2024-3'];
    const grados = ['todos', '3B', '5A', '6B', '8A'];

    const filteredBoletines = boletines.filter(bol => {
        const matchesSearch = bol.estudiante.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPeriodo = bol.periodo === selectedPeriodo;
        const matchesGrado = selectedGrado === 'todos' || bol.grado === selectedGrado;
        return matchesSearch && matchesPeriodo && matchesGrado;
    });

    const handleGenerarTodos = () => {
        if (confirm('¿Desea generar todos los boletines pendientes?')) {
            alert('Generando boletines...');
        }
    };

    const handleGenerarIndividual = (boletinId) => {
        alert(`Generando boletín ${boletinId}...`);
    };

    const handleDescargar = (boletinId) => {
        alert(`Descargando boletín ${boletinId}...`);
    };

    const handleVista = (boletinId) => {
        alert(`Vista previa del boletín ${boletinId}...`);
    };

    return (
         <Layout title="Generar Boletines - Secretaria">
            
            <div>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Generar Boletines</h1>
                    <p className="text-gray-600 mt-2">Genera y descarga boletines académicos</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Boletines</p>
                                <p className="text-2xl font-bold text-gray-900">{boletines.length}</p>
                            </div>
                            <FileText className="h-10 w-10 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Generados</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {boletines.filter(b => b.estado === 'Generado').length}
                                </p>
                            </div>
                            <FileText className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pendientes</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {boletines.filter(b => b.estado === 'Pendiente').length}
                                </p>
                            </div>
                            <FileText className="h-10 w-10 text-orange-600" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Promedio General</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {(boletines.reduce((sum, b) => sum + b.promedio, 0) / boletines.length).toFixed(1)}
                                </p>
                            </div>
                            <FileText className="h-10 w-10 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar estudiante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={selectedPeriodo}
                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                {periodos.map(periodo => (
                                    <option key={periodo} value={periodo}>
                                        Periodo {periodo}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select
                                value={selectedGrado}
                                onChange={(e) => setSelectedGrado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                {grados.map(grado => (
                                    <option key={grado} value={grado}>
                                        {grado === 'todos' ? 'Todos los grados' : `Grado ${grado}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleGenerarTodos}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            <FileText className="h-5 w-5" />
                            <span>Generar Todos los Pendientes</span>
                        </button>
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
                                        Grado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Periodo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Promedio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Generación
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBoletines.map((boletin) => (
                                    <tr key={boletin.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {boletin.estudiante}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                {boletin.grado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {boletin.periodo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${
                                                boletin.promedio >= 4.0 ? 'text-green-600' :
                                                boletin.promedio >= 3.0 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                                {boletin.promedio.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                boletin.estado === 'Generado' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {boletin.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {boletin.generado || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {boletin.estado === 'Generado' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleVista(boletin.id)}
                                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                            title="Vista previa"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDescargar(boletin.id)}
                                                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                                                            title="Descargar"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded"
                                                            title="Imprimir"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleGenerarIndividual(boletin.id)}
                                                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        <span>Generar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}