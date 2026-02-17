import { FileText, Download, Eye, Printer, Filter, Search, FileCheck, Clock, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';

export default function Boletines({ boletines, periodos, grupos, stats, filters }) {
    const [selectedPeriodo, setSelectedPeriodo] = useState(filters.periodo_id || periodos[0]?.id);
    const [selectedGrado, setSelectedGrado] = useState(filters.grupo_id || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [loading, setLoading] = useState(false);

    const handleFilter = () => {
        router.get(route('coordinadora.boletines'), {
            periodo_id: selectedPeriodo,
            grupo_id: selectedGrado || undefined,
            search: searchTerm || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleGenerarTodos = () => {
        if (!confirm('¿Está seguro de generar todos los boletines pendientes? Este proceso puede tardar varios minutos.')) {
            return;
        }

        setLoading(true);
        router.post(route('coordinadora.boletines.generar-todos'), {
            periodo_id: selectedPeriodo,
        }, {
            onFinish: () => setLoading(false),
        });
    };

    const handleGenerarIndividual = (boletinId) => {
        setLoading(true);
        router.post(route('coordinadora.boletines.generar-individual', boletinId), {}, {
            onFinish: () => setLoading(false),
        });
    };

    const handleDescargar = (boletinId) => {
        window.open(route('coordinadora.boletines.documento', boletinId), '_blank');
    };

    const handleVistaPrevia = (boletinId) => {
        // Implementar modal de vista previa
        router.get(route('coordinadora.boletines.vista-previa', boletinId), {}, {
            preserveState: true,
            onSuccess: (page) => {
                // Mostrar modal con los datos
                console.log('Vista previa:', page.props);
            }
        });
    };

    const getDesempenoColor = (desempeno) => {
        const colores = {
            'SUPERIOR': 'bg-green-100 text-green-800',
            'ALTO': 'bg-blue-100 text-blue-800',
            'BÁSICO': 'bg-yellow-100 text-yellow-800',
            'BAJO': 'bg-red-100 text-red-800',
        };
        return colores[desempeno] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Layout title="Boletines Académicos - Coordinadora">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Boletines Académicos</h1>
                <p className="text-gray-600 mt-2">Gestiona y genera boletines según el Decreto 1290 de 2009</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs">Generados</p>
                            <p className="text-2xl font-bold text-green-600">{stats.generados}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs">Pendientes</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pendientes}</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs">Promedio</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.promedio_general.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs">Aprobados</p>
                            <p className="text-2xl font-bold text-green-600">{stats.aprobados}</p>
                        </div>
                        <FileCheck className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs">Reprobados</p>
                            <p className="text-2xl font-bold text-red-600">{stats.reprobados}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Periodo Académico
                        </label>
                        <select
                            value={selectedPeriodo}
                            onChange={(e) => setSelectedPeriodo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {periodos.map(periodo => (
                                <option key={periodo.id} value={periodo.id}>
                                    {periodo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grupo
                        </label>
                        <select
                            value={selectedGrado}
                            onChange={(e) => setSelectedGrado(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">Todos los grupos</option>
                            {grupos.map(grupo => (
                                <option key={grupo.id} value={grupo.id}>
                                    {grupo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar estudiante
                        </label>
                        <div className="flex space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Nombre del estudiante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handleFilter}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                            >
                                <Filter className="h-5 w-5" />
                                <span>Filtrar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {stats.pendientes > 0 && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleGenerarTodos}
                            disabled={loading}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileText className="h-5 w-5" />
                            <span>{loading ? 'Generando...' : `Generar ${stats.pendientes} Boletines Pendientes`}</span>
                        </button>
                    </div>
                )}
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
                                    Grupo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Promedio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Desempeño
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Puesto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asistencia
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
                            {boletines.map((boletin) => (
                                <tr key={boletin.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {boletin.estudiante}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {boletin.documento}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                            {boletin.grado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-bold ${
                                            boletin.aprobo ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {boletin.promedio.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDesempenoColor(boletin.desempeno)}`}>
                                            {boletin.desempeno}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {boletin.puesto}/{boletin.total_estudiantes}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {boletin.asistencia.toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            boletin.estado === 'generado' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {boletin.estado === 'generado' ? 'Generado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleVistaPrevia(boletin.id)}
                                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                title="Vista previa"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>

                                            {boletin.estado === 'generado' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleDescargar(boletin.id)}
                                                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                                                        title="Descargar"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDescargar(boletin.id)}
                                                        className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded"
                                                        title="Imprimir"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerarIndividual(boletin.id)}
                                                    disabled={loading}
                                                    className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs disabled:opacity-50"
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

                    {boletines.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay boletines</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                No se encontraron boletines con los filtros seleccionados
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}