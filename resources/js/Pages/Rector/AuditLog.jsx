import { Head, router } from '@inertiajs/react';
import {
    History, Search, Filter, Download, User,
    Shield, Terminal, Calendar, ArrowRight,
    AlertCircle, Activity, Globe, Info
} from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

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
            case 'create': return 'bg-green-100 text-green-800';
            case 'update': return 'bg-blue-100 text-blue-800';
            case 'delete': return 'bg-red-100 text-red-800';
            case 'login': return 'bg-indigo-100 text-indigo-800';
            case 'logout': return 'bg-gray-100 text-gray-800';
            case 'failed_login': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <Layout title="Auditoría de Sistemas">
            <Head title="Auditoría y Seguridad" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center">
                        <Shield className="h-8 w-8 text-indigo-600 mr-3" />
                        Auditoría de Sistemas
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Trazabilidad completa de operaciones sensibles</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                    <Download className="h-5 w-5" />
                    <span>Descargar Bitácora</span>
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Eventos</p>
                    <p className="text-3xl font-black text-gray-800">{stats.total || 0}</p>
                    <div className="flex items-center text-xs text-gray-400 mt-2">
                        <Activity className="h-3 w-3 mr-1" /> Últimos 30 días
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Alertas Seguridad</p>
                    <p className="text-3xl font-black text-red-600">{stats.securityAlerts || 0}</p>
                    <div className="flex items-center text-xs text-red-400 mt-2">
                        <AlertCircle className="h-3 w-3 mr-1" /> Acciones críticas
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Usuarios Activos</p>
                    <p className="text-3xl font-black text-indigo-600">{stats.activeUsers || 0}</p>
                    <div className="flex items-center text-xs text-indigo-400 mt-2">
                        <User className="h-3 w-3 mr-1" /> En el periodo
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tasa de Error</p>
                    <p className="text-3xl font-black text-orange-600">{stats.errorRate}%</p>
                    <div className="flex items-center text-xs text-orange-400 mt-2">
                        <Terminal className="h-3 w-3 mr-1" /> Validaciones fallidas
                    </div>
                </div>
            </div>

            {/* Filters */}
            <form onSubmit={handleFilter} className="bg-white p-6 rounded-3xl shadow-md mb-8 border border-gray-50 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Búsqueda Libre</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Usuario, acción, ID..."
                                className="w-full bg-gray-50 border-0 rounded-xl py-3 pl-10 focus:ring-2 focus:ring-indigo-500 font-medium"
                            />
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Acción</label>
                        <select
                            value={selectedAction}
                            onChange={e => setSelectedAction(e.target.value)}
                            className="w-full bg-gray-50 border-0 rounded-xl py-3 focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700"
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
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Desde</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-xl py-3 focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hasta</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-xl py-3 focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">Filtrar</button>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedAction('');
                                setDateRange({ start: '', end: '' });
                                router.get(route('rector.auditoria'));
                            }}
                            className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition"
                        >
                            <History className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </form>

            {/* Audit Table */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Información de Evento</th>
                                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Acción</th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Detalle / Motivo</th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Ubicación / IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.data.map((log) => (
                                <tr key={log.id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 mr-4 group-hover:scale-110 transition duration-300">
                                                <User className="h-6 w-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{log.user?.name || 'Sistema'}</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" /> {log.created_at_human}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-start max-w-md">
                                            <div className="mt-1 mr-3 text-indigo-200"><ArrowRight className="h-4 w-4" /></div>
                                            <p className="text-sm text-gray-600 leading-snug italic font-medium">"{log.description}"</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-[11px] font-bold text-gray-800 flex items-center">
                                                <Globe className="h-3 w-3 mr-1 text-blue-400" /> {log.ip_address}
                                            </p>
                                            <p className="text-[9px] text-gray-400 mt-1 max-w-[150px] truncate">{log.user_agent}</p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-8 bg-gray-50/30 flex justify-between items-center border-t border-gray-50">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Registros {logs.from} al {logs.to} • Total {logs.total}
                    </div>
                    <div className="flex gap-2">
                        {/* Custom pagination buttons would go here */}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
