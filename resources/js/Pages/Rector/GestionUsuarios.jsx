// resources/js/Pages/Rector/GestionUsuarios.jsx
import { Head, router, useForm } from '@inertiajs/react';
import {
    Users, Search, Shield, CheckCircle, XCircle,
    UserCheck, UserX, History, Key, LogOut, MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function GestionUsuarios({ users, roles, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedRole, setSelectedRole] = useState(filters?.role || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [userHistory, setUserHistory] = useState([]);

    const { data, setData, post, processing, reset } = useForm({
        reason: ''
    });

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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600">
                    <XCircle className="h-3 w-3 mr-1" /> Suspendido
                </span>
            );
        }
        if (user.is_active) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" /> Activo
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-50 text-gray-600">
                <XCircle className="h-3 w-3 mr-1" /> Inactivo
            </span>
        );
    };

    return (
        <Layout title="Gestión de Usuarios">
            <Head title="Gestión de Personal" />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 flex items-center">
                            <Users className="h-10 w-10 text-indigo-600 mr-3" />
                            Gestión de Personal
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium">
                            Control de accesos y administración de usuarios
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase">Total</p>
                        <p className="text-3xl font-black text-indigo-600">{users.total}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl shadow-md mb-8 border border-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                            Búsqueda
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Nombre, email, documento..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            />
                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                            Rol
                        </label>
                        <select
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                            Estado
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500"
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
                            className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition"
                        >
                            Filtrar
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </form>

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase">
                                    Usuario
                                </th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase">
                                    Rol
                                </th>
                                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase">
                                    Último Acceso
                                </th>
                                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-indigo-50/20 transition group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition">
                                                    <Users className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5">
                                            <select
                                                value={user.roles[0]?.name || ''}
                                                onChange={e => handleRoleChange(user.id, user.roles[0]?.name, e.target.value)}
                                                className="bg-gray-50 border-0 rounded-lg py-2 px-3 text-xs font-bold text-indigo-700 uppercase focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.name}>{role.name}</option>
                                                ))}
                                            </select>
                                        </td>

                                        <td className="px-6 py-5 text-center">
                                            {getStatusBadge(user)}
                                        </td>

                                        <td className="px-6 py-5">
                                            <p className="text-xs text-gray-500">
                                                {user.last_login_human || 'Nunca'}
                                            </p>
                                        </td>

                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                {user.suspended_at ? (
                                                    <button
                                                        onClick={() => handleActivate(user)}
                                                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                                        title="Activar"
                                                    >
                                                        <UserCheck className="h-5 w-5" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSuspend(user)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Suspender"
                                                    >
                                                        <UserX className="h-5 w-5" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => viewHistory(user)}
                                                    className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition"
                                                    title="Ver Historial"
                                                >
                                                    <History className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.links && (
                    <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs font-bold text-gray-400 uppercase">
                            {users.from} - {users.to} de {users.total}
                        </div>
                        <div className="flex gap-2">
                            {users.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                    } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Suspend Modal */}
            {showSuspendModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
                        <form onSubmit={confirmSuspension}>
                            <div className="flex items-center mb-6">
                                <div className="p-3 bg-red-100 rounded-2xl mr-4">
                                    <UserX className="h-8 w-8 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Suspender Usuario</h2>
                                    <p className="text-sm text-gray-500">{selectedUser?.name}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                                    Motivo de Suspensión *
                                </label>
                                <textarea
                                    value={data.reason}
                                    onChange={e => setData('reason', e.target.value)}
                                    className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500"
                                    placeholder="Indique la razón de la suspensión..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSuspendModal(false);
                                        setSelectedUser(null);
                                        reset();
                                    }}
                                    className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-red-600 text-white font-black px-8 py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50"
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
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-3 bg-indigo-100 rounded-2xl mr-4">
                                        <History className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">Historial de Actividad</h2>
                                        <p className="text-sm text-gray-500">{selectedUser?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowHistoryModal(false);
                                        setSelectedUser(null);
                                        setUserHistory([]);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {userHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {userHistory.map((log) => (
                                        <div key={log.id} className="bg-gray-50 p-4 rounded-xl">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-800">{log.description}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {log.created_at_human} • {log.ip_address}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                                    {log.action}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
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