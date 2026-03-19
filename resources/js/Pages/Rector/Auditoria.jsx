import { Head, router } from '@inertiajs/react';
import {
    History, Search, Filter, Download, User,
    Shield, Terminal, Calendar, ArrowRight,
    AlertCircle, Activity, Globe, Info
} from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function AuditLog({ logs, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedAction, setSelectedAction] = useState(filters.action || '');
    const [dateRange, setDateRange] = useState({
        start: filters.start_date || '',
        end: filters.end_date || ''
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('rector.auditoria'), {
            search: searchTerm,
            action: selectedAction,
            start_date: dateRange.start,
            end_date: dateRange.end
        }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = route('rector.auditoria.export', {
            search: searchTerm,
            action: selectedAction,
            start_date: dateRange.start,
            end_date: dateRange.end
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'create': return 'bg-green-100 text-green-800 border border-green-200';
            case 'update': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'delete': return 'bg-red-100 text-red-800 border border-red-200';
            case 'login': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'logout': return 'bg-gray-100 text-gray-700 border border-gray-200';
            case 'failed_login': return 'bg-orange-100 text-orange-800 border border-orange-200';
            default: return 'bg-gray-100 text-gray-600 border border-gray-200';
        }
    };

    return (
        <Layout title="Auditoría de Sistemas">
            <Head title="Auditoría y Seguridad" />

            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Shield className="h-7 w-7 text-indigo-600" />
                            Auditoría de Sistemas
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">
                            Trazabilidad completa de operaciones sensibles
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm"
                    >
                        <Download className="h-4 w-4" />
                        <span>Descargar Bitácora</span>
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2.5 rounded-lg">
                                <Activity className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Total Eventos</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Últimos 30 días</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2.5 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Alertas Seguridad</p>
                                <p className="text-2xl font-bold text-red-600">{stats.securityAlerts || 0}</p>
                                <p className="text-xs text-red-400 mt-0.5">Acciones críticas</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2.5 rounded-lg">
                                <User className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Usuarios Activos</p>
                                <p className="text-2xl font-bold text-indigo-600">{stats.activeUsers || 0}</p>
                                <p className="text-xs text-indigo-400 mt-0.5">En el periodo</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2.5 rounded-lg">
                                <Terminal className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Tasa de Error</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.errorRate}%</p>
                                <p className="text-xs text-orange-400 mt-0.5">Validaciones fallidas</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                Búsqueda Libre
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Usuario, acción, ID..."
                                    className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                                Acción
                            </label>
                            <select
                                value={selectedAction}
                                onChange={e => setSelectedAction(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                            >
                                <option value="">Todas las acciones</option>
                                <option value="create">Creación</option>
                                <option value="update">Actualización</option>
                                <option value="delete">Eliminación</option>
                                <option value="login">Inicios de Sesión</option>
                                <option value="failed_login">Fallos de Seguridad</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Desde</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Hasta</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow hover:shadow-lg text-sm"
                            >
                                Filtrar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedAction('');
                                    setDateRange({ start: '', end: '' });
                                    router.get(route('rector.auditoria'));
                                }}
                                className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition"
                                title="Limpiar filtros"
                            >
                                <History className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </form>

                {/* Audit Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Table Header Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Registro de Eventos del Sistema
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Información de Evento</th>
                                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Detalle / Motivo</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ubicación / IP</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 group-hover:bg-indigo-100 transition">
                                                    <User className="h-5 w-5 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{log.user?.name || 'Sistema'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {log.created_at_human}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-start gap-2 max-w-xs lg:max-w-sm">
                                                <ArrowRight className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-gray-600 leading-snug">"{log.description}"</p>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right hidden lg:table-cell">
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                    <Globe className="h-3 w-3 text-blue-400" />
                                                    {log.ip_address}
                                                </p>
                                                <p className="text-xs text-gray-400 max-w-[140px] truncate">{log.user_agent}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 sm:px-6 py-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-500">
                            Registros {logs.from || 0} al {logs.to || 0} · Total {logs.total || 0}
                        </div>
                        <div className="flex gap-1.5 flex-wrap justify-center">
                            {logs.links?.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => router.get(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 rounded-lg font-medium text-sm transition ${
                                        link.active
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    } ${!link.url && 'opacity-40 cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}