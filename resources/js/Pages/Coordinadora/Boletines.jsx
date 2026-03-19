import {
    FileText, Download, Eye, Printer, Filter, Search,
    FileCheck, Clock, CheckCircle, XCircle, TrendingUp,
    Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function Boletines({ boletines, periodos, grupos, stats, filters, can }) {
    const [selectedPeriodo, setSelectedPeriodo] = useState(filters.periodo_id || periodos[0]?.id);
    const [selectedGrado, setSelectedGrado] = useState(filters.grupo_id || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [loading, setLoading] = useState(false);

    const handleFilter = () => {
        router.get(route('coordinadora.boletines'), {
            periodo_id: selectedPeriodo,
            grupo_id: selectedGrado || undefined,
            search: searchTerm || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleGenerarTodos = () => {
        if (!confirm('¿Está seguro de generar todos los boletines pendientes?')) return;
        setLoading(true);
        router.post(route('coordinadora.boletines.generar-todos'), { periodo_id: selectedPeriodo }, {
            onFinish: () => setLoading(false),
        });
    };

    const handleGenerarIndividual = (boletinId) => {
        setLoading(true);
        router.post(route('coordinadora.boletines.generar-individual', boletinId), {}, {
            onFinish: () => setLoading(false),
        });
    };

    const handleConfirmar = (boletinId) => {
        if (!confirm('¿Confirmar este boletín? Quedará habilitado para secretaria y el estudiante.')) return;
        router.patch(route('coordinadora.boletines.confirmar', boletinId), {}, {
            preserveScroll: true,
        });
    };

    const handleConfirmarTodos = () => {
        if (!confirm('¿Confirmar todos los boletines generados? Quedarán visibles para secretaria y estudiantes.')) return;
        setLoading(true);
        router.post(route('coordinadora.boletines.confirmar-todos'), { periodo_id: selectedPeriodo }, {
            onFinish: () => setLoading(false),
        });
    };

    const handleDescargar = (boletinId) => window.open(route('coordinadora.boletines.documento', boletinId), '_blank');

    const handleVistaPrevia = (boletinId) => {
        router.get(route('coordinadora.boletines.vista-previa', boletinId), {}, { preserveState: true });
    };

    const getDesempenoColor = (desempeno) => {
        const colores = {
            'SUPERIOR': 'bg-green-100 text-green-800 border border-green-200',
            'ALTO':     'bg-blue-100 text-blue-800 border border-blue-200',
            'BÁSICO':   'bg-yellow-100 text-yellow-800 border border-yellow-200',
            'BAJO':     'bg-red-100 text-red-800 border border-red-200',
        };
        return colores[desempeno] || 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    // Contadores para los botones de acción masiva
    const pendientesCount = boletines.filter(b => b.estado === 'pendiente').length;
    const generadosSinConfirmar = boletines.filter(b => b.estado === 'generado' && !b.confirmado).length;

    return (
        <Layout title="Boletines Académicos - Coordinadora">
            <div className="space-y-6 w-full px-7 sm:px-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Boletines Académicos
                    </h1>
                    <p className="text-gray-600 mt-1">Gestiona y genera boletines según el Decreto 1290 de 2009</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total',      value: stats.total,                        icon: FileText,   color: 'blue'   },
                        { label: 'Generados',  value: stats.generados,                    icon: CheckCircle, color: 'green'  },
                        { label: 'Confirmados',value: stats.confirmados ?? 0,             icon: FileCheck,   color: 'purple' },
                        { label: 'Pendientes', value: stats.pendientes,                   icon: Clock,       color: 'orange' },
                        { label: 'Aprobados',  value: stats.aprobados,                   icon: TrendingUp,  color: 'green'  },
                        { label: 'Reprobados', value: stats.reprobados,                  icon: XCircle,     color: 'red'    },
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
                                    <input type="text" placeholder="Nombre del estudiante..." value={searchTerm}
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

                        {/* Acciones masivas */}
                        {(pendientesCount > 0 || (can?.confirm && generadosSinConfirmar > 0)) && (
                            <div className="mt-4 flex flex-wrap justify-end gap-3">
                                {can?.generate && pendientesCount > 0 && (
                                    <button onClick={handleGenerarTodos} disabled={loading}
                                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 text-sm font-medium shadow-md">
                                        <FileText className="h-4 w-4" />
                                        {loading ? 'Generando...' : `Generar ${pendientesCount} pendientes`}
                                    </button>
                                )}
                                {can?.confirm && generadosSinConfirmar > 0 && (
                                    <button onClick={handleConfirmarTodos} disabled={loading}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 text-sm font-medium shadow-md">
                                        <FileCheck className="h-4 w-4" />
                                        {loading ? 'Confirmando...' : `Confirmar ${generadosSinConfirmar} boletines`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Leyenda de estados */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span> Pendiente de generar
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> Generado
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Confirmado (visible para secretaria y estudiante)
                    </span>
                </div>

                {/* Tabla desktop */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="hidden lg:block">
                        <table className="w-full table-fixed">
                            <colgroup>
                                <col className="w-[20%]" />
                                <col className="w-[10%]" />
                                <col className="w-[8%]" />
                                <col className="w-[8%]" />
                                <col className="w-[10%]" />
                                <col className="w-[7%]" />
                                <col className="w-[8%]" />
                                <col className="w-[17%]" />
                                <col className="w-[12%]" />
                            </colgroup>
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {['Estudiante','Documento','Grupo','Promedio','Desempeño','Puesto','Asistencia','Estado','Acciones'].map(h => (
                                        <th key={h} className={`px-3 py-3 text-xs font-bold text-white uppercase tracking-wider ${h === 'Acciones' ? 'text-right' : 'text-left'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {boletines.map((boletin) => (
                                    <tr key={boletin.id} className="hover:bg-blue-50/30 transition-colors">
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

                                        {/* Estado con doble badge */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                                    boletin.estado === 'generado'
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-orange-100 text-orange-800 border border-orange-200'
                                                }`}>
                                                    {boletin.estado === 'generado' ? 'Generado' : 'Pendiente'}
                                                </span>
                                                {boletin.estado === 'generado' && (
                                                    <span className={`px-2 py-0.5 inline-flex items-center gap-1 text-xs font-semibold rounded-full ${
                                                        boletin.confirmado
                                                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                        {boletin.confirmado
                                                            ? <><FileCheck className="h-3 w-3" /> Confirmado</>
                                                            : <><Clock className="h-3 w-3" /> Sin confirmar</>
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleVistaPrevia(boletin.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Vista previa">
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {boletin.estado === 'generado' ? (
                                                    <>
                                                        {/* Confirmar individual */}
                                                        {can?.confirm && !boletin.confirmado && (
                                                            <button onClick={() => handleConfirmar(boletin.id)}
                                                                className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                                                title="Confirmar y habilitar para secretaria/estudiante">
                                                                <FileCheck className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {boletin.confirmado && (
                                                            <span className="p-1.5 text-purple-400 cursor-default" title={`Confirmado el ${boletin.fecha_confirmacion}`}>
                                                                <Shield className="h-4 w-4" />
                                                            </span>
                                                        )}
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
                                                    </>
                                                ) : (
                                                    can?.generate && (
                                                        <button onClick={() => handleGenerarIndividual(boletin.id)} disabled={loading}
                                                            className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-medium disabled:opacity-50 transition-all">
                                                            <FileText className="h-3 w-3" /> Generar
                                                        </button>
                                                    )
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
                            <div key={boletin.id} className="p-4 hover:bg-blue-50/20 transition-colors">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{boletin.estudiante}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{boletin.documento}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                            boletin.estado === 'generado'
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                                        }`}>
                                            {boletin.estado === 'generado' ? 'Generado' : 'Pendiente'}
                                        </span>
                                        {boletin.estado === 'generado' && (
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                                                boletin.confirmado
                                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                            }`}>
                                                {boletin.confirmado
                                                    ? <><FileCheck className="h-3 w-3" /> Confirmado</>
                                                    : <><Clock className="h-3 w-3" /> Sin confirmar</>
                                                }
                                            </span>
                                        )}
                                    </div>
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

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button onClick={() => handleVistaPrevia(boletin.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold flex-1 justify-center">
                                        <Eye className="h-3.5 w-3.5" /> Vista previa
                                    </button>

                                    {boletin.estado === 'generado' ? (
                                        <>
                                            {can?.confirm && !boletin.confirmado && (
                                                <button onClick={() => handleConfirmar(boletin.id)}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-xs font-semibold flex-1 justify-center">
                                                    <FileCheck className="h-3.5 w-3.5" /> Confirmar
                                                </button>
                                            )}
                                            {can?.download && (
                                                <button onClick={() => handleDescargar(boletin.id)}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-xs font-semibold flex-1 justify-center">
                                                    <Download className="h-3.5 w-3.5" /> Descargar
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        can?.generate && (
                                            <button onClick={() => handleGenerarIndividual(boletin.id)} disabled={loading}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex-1 justify-center">
                                                <FileText className="h-3.5 w-3.5" /> Generar
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {boletines.length === 0 && (
                        <div className="text-center py-16">
                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-base font-medium text-gray-500">No hay boletines</h3>
                            <p className="text-sm text-gray-400 mt-1">No se encontraron boletines con los filtros seleccionados</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}