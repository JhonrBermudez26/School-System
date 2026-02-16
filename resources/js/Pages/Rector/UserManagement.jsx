import { Head, router, useForm } from '@inertiajs/react';
import {
    Users, Search, Filter, Shield, AlertCircle,
    CheckCircle, XCircle, MoreVertical, Mail,
    Calendar, History, UserCheck, UserX, Trash2
} from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function UserManagement({ users, roles, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || '');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        reason: '',
        role: ''
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('rector.usuarios'), { search: searchTerm, role: selectedRole }, { preserveState: true });
    };

    const handleStatusToggle = (user) => {
        const action = user.is_active ? 'suspend' : 'activate';
        if (action === 'activate') {
            if (confirm(`¿Estás seguro de reactivar a ${user.name}?`)) {
                router.post(route('rector.usuarios.activate', user.id));
            }
        } else {
            setSelectedUser(user);
            setShowStatusModal(true);
        }
    };

    const confirmSuspension = (e) => {
        e.preventDefault();
        post(route('rector.usuarios.suspend', selectedUser.id), {
            onSuccess: () => {
                setShowStatusModal(false);
                setSelectedUser(null);
                reset();
            }
        });
    };

    const handleRoleChange = (userId, newRole) => {
        if (confirm(`¿Cambiar el rol de este usuario a ${newRole}?`)) {
            router.patch(route('rector.usuarios.role', userId), { role: newRole });
        }
    };

    const getStatusBadge = (isActive) => {
        return isActive
            ? <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><CheckCircle className="h-3 w-3 mr-1" /> Activo</span>
            : <span className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><XCircle className="h-3 w-3 mr-1" /> Suspendido</span>;
    };

    return (
        <Layout title="Gestión de Usuarios">
            <Head title="Administración de Personal" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Control de accesos y perfiles administrativos</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center min-w-[120px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Total Personal</p>
                        <p className="text-2xl font-black text-indigo-600">{users.total}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl shadow-md mb-8 border border-gray-50 flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, documento o correo..."
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                    <Search className="absolute left-4 top-4.5 h-6 w-6 text-gray-400" />
                </form>
                <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    className="bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-black text-gray-600 uppercase text-xs"
                >
                    <option value="">Todos los Roles</option>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <button onClick={handleSearch} className="bg-indigo-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">Aplicar</button>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                                <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Rol Asignado</th>
                                <th className="px-8 py-6 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Último Acceso</th>
                                <th className="px-8 py-6 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 bg-indigo-100 rounded-2xl flex items-center justify-center mr-4 group-hover:rotate-6 transition duration-300">
                                                <Users className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-400 flex items-center mt-0.5">
                                                    <Mail className="h-3 w-3 mr-1" /> {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            value={user.roles[0]?.name || ''}
                                            onChange={e => handleRoleChange(user.id, e.target.value)}
                                            className="bg-gray-50 border-0 rounded-xl py-2 px-4 text-xs font-black text-indigo-700 focus:ring-1 focus:ring-indigo-500 uppercase tracking-tighter"
                                        >
                                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {getStatusBadge(user.is_active)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-gray-500 flex items-center">
                                            <Calendar className="h-3 w-3 mr-1 text-gray-300" /> {user.last_login_human || 'Sin registro'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button
                                            onClick={() => handleStatusToggle(user)}
                                            className={`p-3 rounded-xl transition ${user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                            title={user.is_active ? 'Suspender' : 'Activar'}
                                        >
                                            {user.is_active ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                                        </button>
                                        <button
                                            className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition"
                                            title="Ver Historial"
                                        >
                                            <History className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Suspension Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in-95 duration-300">
                        <form onSubmit={confirmSuspension}>
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-4 bg-red-100 rounded-3xl"><AlertCircle className="h-8 w-8 text-red-600" /></div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Suspender Usuario</h2>
                                    <p className="text-sm font-bold text-gray-400">Personal: {selectedUser.name}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Motivo de la Suspensión</label>
                                    <textarea
                                        value={data.reason}
                                        onChange={e => setData('reason', e.target.value)}
                                        className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-red-500 font-bold text-gray-800"
                                        placeholder="Describa la razón del cese temporal de acceso..."
                                        rows="4"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 mt-10">
                                <button type="button" onClick={() => setShowStatusModal(false)} className="px-8 py-4 text-gray-500 font-bold hover:text-gray-700 transition">Cancelar</button>
                                <button type="submit" disabled={processing} className="bg-red-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-red-700 transition shadow-xl shadow-red-100">
                                    {processing ? 'Procesando...' : 'Confirmar Suspensión'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
