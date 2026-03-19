// resources/js/Pages/Rector/GestionUsuarios.jsx
import { Head, router, useForm } from '@inertiajs/react';
import {
    Users, Search, Shield, CheckCircle, XCircle,
    UserCheck, UserX, History, Key, LogOut, MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function GestionUsuarios({ users, roles, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [userHistory, setUserHistory] = useState([]);

    const { data, setData, post, processing, reset } = useForm({ reason: '' });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('rector.usuarios'), {
            search: searchTerm,
            role: selectedRole,
            status: selectedStatus
        }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedRole('');
        setSelectedStatus('');
        router.get(route('rector.usuarios'));
    };

    const handleActivate = (user) => {
        if (confirm(`¿Reactivar acceso de ${user.name}?`)) {
            router.post(route('rector.usuarios.activate', user.id));
        }
    };

    const handleSuspend = (user) => {
        setSelectedUser(user);
        setShowSuspendModal(true);
    };

    const confirmSuspension = (e) => {
        e.preventDefault();
        post(route('rector.usuarios.suspend', selectedUser.id), {
            onSuccess: () => {
                setShowSuspendModal(false);
                setSelectedUser(null);
                reset();
            }
        });
    };

    const handleRoleChange = (userId, currentRole, newRole) => {
        if (currentRole === newRole) return;
        if (confirm(`¿Cambiar rol a "${newRole}"?`)) {
            router.patch(route('rector.usuarios.role', userId), { role: newRole });
        }
    };

    const viewHistory = async (user) => {
        try {
            const response = await fetch(route('rector.usuarios.history', user.id));
            const data = await response.json();
            setUserHistory(data.history);
            setSelectedUser(user);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const getStatusBadge = (user) => {
        if (user.suspended_at) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    <XCircle className="h-3 w-3" /> Suspendido
                </span>
            );
        }
        if (user.is_active) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                    <CheckCircle className="h-3 w-3" /> Activo
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                <XCircle className="h-3 w-3" /> Inactivo
            </span>
        );
    };

    return (
        <Layout title="Gestión de Usuarios">
            <Head title="Gestión de Personal" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Users className="h-7 w-7 text-indigo-600" />
                            Gestión de Personal
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">
                            Control de accesos y administración de usuarios
                        </p>
                    </div>
                    <div className="bg-white px-5 py-3 rounded-xl shadow-md border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 font-medium">Total usuarios</p>
                        <p className="text-2xl font-bold text-indigo-600">{users.total}</p>
                    </div>
                </div>

                {/* Filters */}
                <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Búsqueda</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Nombre, email, documento..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                            <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                            <select
                                value={selectedStatus}
                                onChange={e => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                <option value="active">Activos</option>
                                <option value="suspended">Suspendidos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
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
                                onClick={handleClearFilters}
                                className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </form>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                        <h2 className="text-base font-bold flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Listado de Usuarios
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Último Acceso</th>
                                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-blue-50/30 transition group">
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition">
                                                        <Users className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <select
                                                    value={user.roles[0]?.name || ''}
                                                    onChange={e => handleRoleChange(user.id, user.roles[0]?.name, e.target.value)}
                                                    className="bg-indigo-50 border border-indigo-200 rounded-lg py-1.5 px-2 text-xs font-semibold text-indigo-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.name}>{role.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-center">
                                                {getStatusBadge(user)}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                                <p className="text-xs text-gray-500">{user.last_login_human || 'Nunca'}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.suspended_at ? (
                                                        <button
                                                            onClick={() => handleActivate(user)}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition border border-green-200"
                                                            title="Activar"
                                                        >
                                                            <UserCheck className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSuspend(user)}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-200"
                                                            title="Suspender"
                                                        >
                                                            <UserX className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => viewHistory(user)}
                                                        className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition border border-gray-200"
                                                        title="Ver Historial"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.links && (
                        <div className="px-4 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-xs font-medium text-gray-500">
                                {users.from} - {users.to} de {users.total}
                            </div>
                            <div className="flex gap-1.5 flex-wrap justify-center">
                                {users.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
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
                    )}
                </div>
            </div>

            {/* Suspend Modal */}
            {showSuspendModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <UserX className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Suspender Usuario</h2>
                                    <p className="text-sm text-red-100">{selectedUser?.name}</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={confirmSuspension} className="p-6">
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Motivo de Suspensión *
                                </label>
                                <textarea
                                    value={data.reason}
                                    onChange={e => setData('reason', e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Indique la razón de la suspensión..."
                                    rows="4"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowSuspendModal(false); setSelectedUser(null); reset(); }}
                                    className="px-5 py-2.5 text-gray-600 font-semibold hover:text-gray-800 transition text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-700 transition disabled:opacity-50 text-sm"
                                >
                                    {processing ? 'Procesando...' : 'Confirmar Suspensión'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Historial de Actividad</h2>
                                        <p className="text-sm text-blue-100">{selectedUser?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowHistoryModal(false); setSelectedUser(null); setUserHistory([]); }}
                                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-white text-lg leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {userHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {userHistory.map((log) => (
                                        <div key={log.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{log.description}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {log.created_at_human} · {log.ip_address}
                                                    </p>
                                                </div>
                                                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold flex-shrink-0">
                                                    {log.action}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    No hay historial disponible
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}