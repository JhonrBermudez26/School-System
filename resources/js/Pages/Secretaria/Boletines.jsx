import {
    FileText, Download, Eye, Printer, Filter,
    Search, FileCheck, Clock, CheckCircle, XCircle,
    TrendingUp, Shield, Info
} from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';

export default function BoletinesSecretaria({ boletines, periodos, grupos, stats, filters, can }) {
    const [selectedPeriodo, setSelectedPeriodo] = useState(filters.periodo_id || periodos[0]?.id);
    const [selectedGrado, setSelectedGrado] = useState(filters.grupo_id || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleFilter = () => {
        router.get(route('secretaria.boletines'), {
            periodo_id: selectedPeriodo,
            grupo_id: selectedGrado || undefined,
            search: searchTerm || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleDescargar = (boletinId) =>
        window.open(route('secretaria.boletines.documento', boletinId), '_blank');

    const handleVistaPrevia = (boletinId) =>
        router.get(route('secretaria.boletines.vista-previa', boletinId), {}, { preserveState: true });

    const getDesempenoColor = (desempeno) => {
        const colores = {
            'SUPERIOR': 'bg-green-100 text-green-800 border border-green-200',
            'ALTO':     'bg-blue-100 text-blue-800 border border-blue-200',
            'BÁSICO':   'bg-yellow-100 text-yellow-800 border border-yellow-200',
            'BAJO':     'bg-red-100 text-red-800 border border-red-200',
        };
        return colores[desempeno] || 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    return (
        <Layout title="Boletines Académicos - Secretaria">
            <div className="space-y-6 w-full px-4 sm:px-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Boletines Académicos
                    </h1>
                    <p className="text-gray-600 mt-1">Consulta y descarga de boletines confirmados</p>
                </div>

                {/* Aviso informativo */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-purple-700">
                        Solo se muestran boletines <strong>confirmados</strong> por la coordinadora académica.
                        Si no ves un boletín esperado, comunícate con coordinación para que lo confirme.
                    </p>
                </div>

                {/* Stats — solo 4 relevantes para secretaria */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total confirmados', value: stats.total,         icon: FileCheck,   color: 'purple' },
                        { label: 'Promedio general',  value: (stats.promedio_general ?? 0).toFixed(2), icon: TrendingUp, color: 'blue' },
                        { label: 'Aprobados',         value: stats.aprobados,     icon: CheckCircle, color: 'green'  },
                        { label: 'Reprobados',        value: stats.reprobados,    icon: XCircle,     color: 'red'    },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-500 text-xs font-medium">{label}</p>
                                <Icon className={`h-5 w-5 text-${color}-500`} />
                            </div>
                            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Filter className="h-5 w-5" /> Filtros de Búsqueda
                        </h2>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Periodo Académico</label>
                                <select value={selectedPeriodo} onChange={(e) => setSelectedPeriodo(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                    {periodos.map(periodo => (
                                        <option key={periodo.id} value={periodo.id}>{periodo.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grupo</label>
                                <select value={selectedGrado} onChange={(e) => setSelectedGrado(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                                    <option value="">Todos los grupos</option>
                                    {grupos.map(grupo => (
                                        <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar estudiante</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input type="text" placeholder="Nombre del estudiante..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleFilter}
                                    className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium flex items-center justify-center gap-2">
                                    <Filter className="h-4 w-4" /> Filtrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla desktop */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="hidden lg:block">
                        <table className="w-full table-fixed">
                            <colgroup>
                                <col className="w-[22%]" />
                                <col className="w-[12%]" />
                                <col className="w-[9%]" />
                                <col className="w-[9%]" />
                                <col className="w-[11%]" />
                                <col className="w-[8%]" />
                                <col className="w-[9%]" />
                                <col className="w-[12%]" />
                                <col className="w-[8%]" />
                            </colgroup>
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {['Estudiante','Documento','Grupo','Promedio','Desempeño','Puesto','Asistencia','Confirmado','Acciones'].map(h => (
                                        <th key={h} className={`px-3 py-3 text-xs font-bold text-white uppercase tracking-wider ${h === 'Acciones' ? 'text-right' : 'text-left'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {boletines.map((boletin) => (
                                    <tr key={boletin.id} className="hover:bg-purple-50/20 transition-colors">
                                        <td className="px-3 py-3 text-sm font-medium text-gray-900 truncate">{boletin.estudiante}</td>
                                        <td className="px-3 py-3 text-sm text-gray-500 truncate">{boletin.documento}</td>
                                        <td className="px-3 py-3">
                                            <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 truncate max-w-full">
                                                {boletin.grado}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`text-sm font-bold ${boletin.aprobo ? 'text-green-600' : 'text-red-600'}`}>
                                                {boletin.promedio?.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getDesempenoColor(boletin.desempeno)}`}>
                                                {boletin.desempeno}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-500 text-center">
                                            {boletin.puesto}/{boletin.total_estudiantes}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-500 text-center">
                                            {boletin.asistencia?.toFixed(1)}%
                                        </td>

                                        {/* Columna confirmado — siempre true aquí, pero mostramos quién/cuándo */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1 text-xs font-semibold text-purple-700">
                                                    <Shield className="h-3 w-3" /> Confirmado
                                                </span>
                                                {boletin.fecha_confirmacion && (
                                                    <span className="text-[10px] text-gray-400">{boletin.fecha_confirmacion}</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Acciones — solo vista previa, descarga e impresión */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleVistaPrevia(boletin.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Vista previa">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {can?.download && (
                                                    <>
                                                        <button onClick={() => handleDescargar(boletin.id)}
                                                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Descargar">
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDescargar(boletin.id)}
                                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Vista mobile */}
                    <div className="lg:hidden divide-y divide-gray-100">
                        {boletines.map((boletin) => (
                            <div key={boletin.id} className="p-4 hover:bg-purple-50/10 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{boletin.estudiante}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{boletin.documento}</p>
                                    </div>
                                    <span className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                        <Shield className="h-3 w-3" /> Confirmado
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Grupo</p>
                                        <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                            {boletin.grado}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Promedio</p>
                                        <span className={`text-base font-black ${boletin.aprobo ? 'text-green-600' : 'text-red-600'}`}>
                                            {boletin.promedio?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Desempeño</p>
                                        <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${getDesempenoColor(boletin.desempeno)}`}>
                                            {boletin.desempeno}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Puesto / Asist.</p>
                                        <p className="text-xs font-bold text-gray-700">
                                            #{boletin.puesto}/{boletin.total_estudiantes} · {boletin.asistencia?.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                {boletin.fecha_confirmacion && (
                                    <p className="text-[10px] text-gray-400 mb-2">Confirmado el {boletin.fecha_confirmacion}</p>
                                )}

                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleVistaPrevia(boletin.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold flex-1 justify-center">
                                        <Eye className="h-3.5 w-3.5" /> Vista previa
                                    </button>
                                    {can?.download && (
                                        <>
                                            <button onClick={() => handleDescargar(boletin.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-xs font-semibold flex-1 justify-center">
                                                <Download className="h-3.5 w-3.5" /> Descargar
                                            </button>
                                            <button onClick={() => handleDescargar(boletin.id)}
                                                className="p-2 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                                <Printer className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {boletines.length === 0 && (
                        <div className="text-center py-16">
                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-base font-medium text-gray-500">No hay boletines confirmados</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Cuando la coordinadora confirme los boletines, aparecerán aquí disponibles para descarga.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}