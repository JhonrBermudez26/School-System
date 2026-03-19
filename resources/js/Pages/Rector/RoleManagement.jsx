import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Plus, Lock, CheckCircle, Trash2, Edit, AlertCircle, Info, Key } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout.jsx';

export default function RoleManagement({ roles, permissions }) {
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const roleForm = useForm({ name: '', guard_name: 'web' });
    const permissionsForm = useForm({ permissions: [] });

    const handleRoleSubmit = (e) => {
        e.preventDefault();
        if (editingRole) {
            roleForm.put(route('rector.roles.update', editingRole.id), {
                onSuccess: () => { setShowRoleModal(false); setEditingRole(null); roleForm.reset(); }
            });
        } else {
            roleForm.post(route('rector.roles.store'), {
                onSuccess: () => { setShowRoleModal(false); roleForm.reset(); }
            });
        }
    };

    const handleAssignPermissions = (e) => {
        e.preventDefault();
        permissionsForm.post(route('rector.roles.assign', selectedRole.id), {
            onSuccess: () => { setShowPermissionsModal(false); setSelectedRole(null); }
        });
    };

    const handleDeleteRole = (role) => {
        router.delete(route('rector.roles.destroy', role.id), {
            onSuccess: () => setShowDeleteConfirm(null)
        });
    };

    const openPermissionsModal = (role) => {
        setSelectedRole(role);
        permissionsForm.setData('permissions', role.permissions.map(p => p.name));
        setShowPermissionsModal(true);
    };

    const togglePermission = (permName) => {
        const current = [...permissionsForm.data.permissions];
        if (current.includes(permName)) {
            permissionsForm.setData('permissions', current.filter(p => p !== permName));
        } else {
            permissionsForm.setData('permissions', [...current, permName]);
        }
    };

    const isProtectedRole = (roleName) => {
        return ['rector', 'coordinadora', 'secretaria', 'profesor', 'estudiante'].includes(roleName);
    };

    return (
        <Layout title="Gestión de Roles">
            <Head title="RBAC - Roles y Permisos" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Roles y Permisos
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base flex items-center gap-1.5">
                            <Lock className="h-4 w-4 text-indigo-500" />
                            Control de Acceso Basado en Roles (RBAC)
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingRole(null); roleForm.reset(); setShowRoleModal(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Rol
                    </button>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`bg-white rounded-2xl shadow-xl border flex flex-col h-full hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                                isProtectedRole(role.name) ? 'border-amber-200' : 'border-gray-100 hover:border-blue-200'
                            }`}
                        >
                            {/* Card Header */}
                            <div className={`px-5 py-4 ${isProtectedRole(role.name) ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100'}`}>
                                <div className="flex justify-between items-start">
                                    <div className={`p-2.5 rounded-xl ${isProtectedRole(role.name) ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                        <Shield className={`h-6 w-6 ${isProtectedRole(role.name) ? 'text-amber-600' : 'text-blue-600'}`} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => { setEditingRole(role); roleForm.setData('name', role.name); setShowRoleModal(true); }}
                                            disabled={role.name === 'rector'}
                                            className={`p-1.5 rounded-lg transition ${role.name === 'rector' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        {!isProtectedRole(role.name) && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(role)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                {isProtectedRole(role.name) && (
                                    <div className="mb-3 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit">
                                        <Lock className="h-3 w-3" />
                                        Rol del Sistema
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-gray-800 capitalize mb-1">{role.name}</h3>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">
                                    Nivel: {role.guard_name}
                                </p>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                                        Permisos Asignados ({role.permissions.length})
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {role.permissions.slice(0, 5).map((p) => (
                                            <span key={p.id} className="px-2 py-0.5 bg-gray-50 text-xs font-medium text-gray-600 rounded-lg border border-gray-200">
                                                {p.name}
                                            </span>
                                        ))}
                                        {role.permissions.length > 5 && (
                                            <span className="px-2 py-0.5 bg-indigo-50 text-xs font-semibold text-indigo-600 rounded-lg border border-indigo-100">
                                                +{role.permissions.length - 5} más
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => openPermissionsModal(role)}
                                    disabled={role.name === 'rector'}
                                    className={`w-full mt-5 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm ${
                                        role.name === 'rector'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                                    }`}
                                >
                                    <Key className="h-4 w-4" />
                                    Gestionar Permisos
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete Confirm Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <h2 className="text-lg font-bold">¿Eliminar Rol?</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-5">
                                Estás a punto de eliminar el rol <strong className="text-gray-800">"{showDeleteConfirm.name}"</strong>. Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteRole(showDeleteConfirm)}
                                    className="flex-1 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                            <h2 className="text-lg font-bold">{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                        </div>
                        <form onSubmit={handleRoleSubmit} className="p-6">
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del Rol</label>
                                <input
                                    type="text"
                                    value={roleForm.data.name}
                                    onChange={e => roleForm.setData('name', e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                                    placeholder="Ej: coordinador_academico"
                                    required
                                    disabled={editingRole?.name === 'rector'}
                                />
                                {roleForm.errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{roleForm.errors.name}</p>}
                                <p className="text-xs text-gray-400 mt-1.5">Solo minúsculas y guiones bajos (_)</p>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowRoleModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:text-gray-800 transition text-sm">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={roleForm.processing}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-md disabled:opacity-50 text-sm"
                                >
                                    {roleForm.processing ? 'Guardando...' : (editingRole ? 'Actualizar' : 'Crear Rol')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-bold">Configurar Permisos</h2>
                                    <p className="text-blue-100 text-sm mt-0.5 capitalize">Rol: {selectedRole.name}</p>
                                </div>
                                <div className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-semibold">
                                    {permissionsForm.data.permissions.length} seleccionados
                                </div>
                            </div>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(
                                    permissions.reduce((acc, p) => {
                                        const group = p.name.split('.')[0];
                                        if (!acc[group]) acc[group] = [];
                                        acc[group].push(p);
                                        return acc;
                                    }, {})
                                ).map(([category, perms]) => (
                                    <div key={category} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                                            {category}
                                        </h4>
                                        <div className="space-y-2.5">
                                            {perms.map(p => (
                                                <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex-shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={permissionsForm.data.permissions.includes(p.name)}
                                                            onChange={() => togglePermission(p.name)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-9 h-5 rounded-full transition-colors ${permissionsForm.data.permissions.includes(p.name) ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                                        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${permissionsForm.data.permissions.includes(p.name) ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition truncate">
                                                        {p.name.split('.')[1]}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 bg-white border-t border-gray-100 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowPermissionsModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:text-gray-800 transition text-sm">Cancelar</button>
                            <button
                                onClick={handleAssignPermissions}
                                disabled={permissionsForm.processing}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-md disabled:opacity-50 text-sm"
                            >
                                {permissionsForm.processing ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}