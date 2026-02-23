import { Head, router } from '@inertiajs/react';
import {
    Shield, Search, Calendar, User, FileText,
    CheckCircle, AlertCircle, TrendingUp, X, BookOpen
} from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function MiDisciplina({ records, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('estudiante.disciplina'), { search: searchTerm }, { preserveState: true });
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'low':      return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'medium':   return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'high':     return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
            default:         return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    return (
        <Layout title="Mi Registro Disciplinario">
            <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Mi Registro Disciplinario
                    </h1>
                    <p className="text-gray-600 mt-1">Consulta tu historial de conducta y seguimiento</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Registros"
                        value={stats.total}
                        icon={FileText}
                        gradient="from-blue-500 to-indigo-500"
                        border="border-blue-100"
                    />
                    <StatCard
                        label="Abiertos"
                        value={stats.open}
                        icon={AlertCircle}
                        gradient="from-yellow-500 to-orange-500"
                        border="border-yellow-100"
                    />
                    <StatCard
                        label="Resueltos"
                        value={stats.closed}
                        icon={CheckCircle}
                        gradient="from-green-500 to-emerald-500"
                        border="border-green-100"
                    />
                    <StatCard
                        label="Este Mes"
                        value={stats.thisMonth}
                        icon={Calendar}
                        gradient="from-purple-500 to-pink-500"
                        border="border-purple-100"
                    />
                </div>

                {/* Aviso informativo */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                        Este es tu historial disciplinario personal. Solo tú puedes verlo. Si tienes alguna duda
                        sobre algún registro, comunícate con la coordinadora académica.
                    </p>
                </div>

                {/* Búsqueda */}
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-gray-100">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por descripción, tipo o sanción..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium"
                        >
                            Buscar
                        </button>
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); router.get(route('estudiante.disciplina')); }}
                                className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                </div>

                {/* Lista de registros */}
                <div className="space-y-4">
                    {records.data.length === 0 ? (
                        <div className="bg-white/80 rounded-2xl shadow-md border border-gray-100 text-center py-16">
                            <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No tienes registros disciplinarios</p>
                            <p className="text-gray-400 text-sm mt-1">¡Sigue así, excelente conducta!</p>
                        </div>
                    ) : (
                        records.data.map((record) => (
                            <RecordCard
                                key={record.id}
                                record={record}
                                getSeverityBadge={getSeverityBadge}
                            />
                        ))
                    )}
                </div>

                {/* Paginación */}
                {records.total > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-600">
                        <span>
                            Mostrando {records.from}–{records.to} de {records.total} registros
                        </span>
                        <div className="flex gap-2">
                            {records.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        ${link.active
                                            ? 'bg-blue-600 text-white'
                                            : link.url
                                                ? 'bg-white border border-gray-300 hover:bg-gray-50'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

function StatCard({ label, value, icon: Icon, gradient, border }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-md bg-white/80 backdrop-blur-sm p-5 border ${border}`}>
            <div className={`absolute inset-0 bg-gradient-to-br opacity-10`}
                style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-xs font-medium">{label}</p>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mt-1`}>
                        {value}
                    </p>
                </div>
                <div className={`bg-gradient-to-br ${gradient} p-2.5 rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );
}

function RecordCard({ record, getSeverityBadge }) {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Barra de color según severidad */}
            <div className={`h-1.5 w-full ${
                record.severity === 'critical' ? 'bg-red-500' :
                record.severity === 'high'     ? 'bg-orange-400' :
                record.severity === 'medium'   ? 'bg-yellow-400' :
                                                  'bg-blue-400'
            }`} />

            <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Info principal */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-900">{record.type_label}</span>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getSeverityBadge(record.severity)}`}>
                                {record.severity_label}
                            </span>
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                record.status === 'open'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {record.status === 'open'
                                    ? <><AlertCircle className="h-3 w-3" /> Abierto</>
                                    : <><CheckCircle className="h-3 w-3" /> Resuelto</>
                                }
                            </span>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{record.description}</p>

                        {record.sanction && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                                <p className="text-xs font-bold text-orange-600 uppercase mb-0.5">Sanción / Acuerdo</p>
                                <p className="text-sm text-orange-700">{record.sanction}</p>
                            </div>
                        )}
                    </div>

                    {/* Fecha y registrado por */}
                    <div className="flex flex-row sm:flex-col sm:items-end gap-3 sm:gap-1 text-right flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(record.date).toLocaleDateString('es-ES', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </div>
                        {record.creator && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <User className="h-3.5 w-3.5" />
                                {record.creator.name} {record.creator.last_name || ''}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}