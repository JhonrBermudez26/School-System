import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Plus, Lock, CheckCircle, Trash2, Edit, AlertCircle, Info, Key } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function RoleManagement({ roles, permissions }) {
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // ✅ NUEVO

    const roleForm = useForm({
        name: '',
        guard_name: 'web'
    });

    const permissionsForm = useForm({
        permissions: []
    });

    const handleRoleSubmit = (e) => {
        e.preventDefault();
        if (editingRole) {
            roleForm.put(route('rector.roles.update', editingRole.id), {
                onSuccess: () => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                    roleForm.reset();
                }
            });
        } else {
            roleForm.post(route('rector.roles.store'), {
                onSuccess: () => {
                    setShowRoleModal(false);
                    roleForm.reset();
                }
            });
        }
    };

    const handleAssignPermissions = (e) => {
        e.preventDefault();
        permissionsForm.post(route('rector.roles.assign', selectedRole.id), { // ✅ CORREGIDO
            onSuccess: () => {
                setShowPermissionsModal(false);
                setSelectedRole(null);
            }
        });
    };

    // ✅ NUEVO: Función para eliminar rol
    const handleDeleteRole = (role) => {
        router.delete(route('rector.roles.destroy', role.id), {
            onSuccess: () => {
                setShowDeleteConfirm(null);
            }
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

    // ✅ Verificar si el rol está protegido
    const isProtectedRole = (roleName) => {
        return ['rector', 'coordinadora', 'secretaria', 'profesor', 'estudiante'].includes(roleName);
    };

    return (
        <Layout title="Gestión de Roles">
            <Head title="RBAC - Roles y Permisos" />

            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Roles y Permisos</h1>
                    <p className="text-gray-500 mt-2 font-medium flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-indigo-500" />
                        Control de Acceso Basado en Roles (RBAC)
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingRole(null);
                        roleForm.reset();
                        setShowRoleModal(true);
                    }}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100"
                >
                    <Plus className="h-6 w-6" />
                    <span>Nuevo Rol</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {roles.map((role) => (
                    <div key={role.id} className={`bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border flex flex-col h-full group hover:border-indigo-200 transition-all duration-500 ${isProtectedRole(role.name) ? 'border-amber-200 bg-amber-50/30' : 'border-gray-50'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-indigo-50 rounded-3xl group-hover:scale-110 transition duration-500">
                                <Shield className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="flex space-x-1">
                                {/* ✅ Deshabilitar edición de rol rector */}
                                <button
                                    onClick={() => {
                                        setEditingRole(role);
                                        roleForm.setData('name', role.name);
                                        setShowRoleModal(true);
                                    }}
                                    disabled={role.name === 'rector'}
                                    className={`p-2 transition ${role.name === 'rector' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-indigo-600'}`}
                                >
                                    <Edit className="h-5 w-5" />
                                </button>
                                {/* ✅ Implementar eliminación con confirmación */}
                                {!isProtectedRole(role.name) && (
                                    <button 
                                        onClick={() => setShowDeleteConfirm(role)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ✅ Badge de rol protegido */}
                        {isProtectedRole(role.name) && (
                            <div className="mb-4 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg flex items-center w-fit">
                                <Lock className="h-3 w-3 mr-1" />
                                Rol del Sistema
                            </div>
                        )}

                        <h3 className="text-2xl font-black text-gray-800 capitalize mb-2">{role.name}</h3>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Nivel de Acceso: {role.guard_name}</p>

                        <div className="flex-1">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-tight mb-3">Permisos Asignados ({role.permissions.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.slice(0, 5).map((p) => (
                                    <span key={p.id} className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-600 rounded-lg border border-gray-100">{p.name}</span>
                                ))}
                                {role.permissions.length > 5 && (
                                    <span className="px-3 py-1 bg-indigo-50 text-[10px] font-bold text-indigo-600 rounded-lg">+{role.permissions.length - 5} más</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => openPermissionsModal(role)}
                            disabled={role.name === 'rector'} // ✅ Deshabilitar para rector
                            className={`w-full mt-8 font-black py-4 rounded-2xl transition shadow-xl flex items-center justify-center space-x-2 ${
                                role.name === 'rector' 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                        >
                            <Key className="h-5 w-5 text-indigo-400" />
                            <span>Gestionar Permisos</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* ✅ NUEVO: Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 text-center mb-2">¿Eliminar Rol?</h3>
                        <p className="text-gray-600 text-center mb-6">
                            Estás a punto de eliminar el rol <strong>{showDeleteConfirm.name}</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteRole(showDeleteConfirm)}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleRoleSubmit}>
                            <h2 className="text-3xl font-black text-gray-900 mb-8">{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Nombre del Rol</label>
                                    <input
                                        type="text"
                                        value={roleForm.data.name}
                                        onChange={e => roleForm.setData('name', e.target.value)}
                                        className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                                        placeholder="Ej: coordinador_academico"
                                        required
                                        disabled={editingRole?.name === 'rector'} // ✅ Deshabilitar para rector
                                    />
                                    {roleForm.errors.name && <p className="text-red-500 text-xs mt-2 font-bold">{roleForm.errors.name}</p>}
                                    <p className="text-xs text-gray-500 mt-2">Solo minúsculas y guiones bajos (_)</p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-10">
                                <button type="button" onClick={() => setShowRoleModal(false)} className="px-8 py-4 text-gray-500 font-bold hover:text-gray-700 transition">Cancelar</button>
                                <button type="submit" disabled={roleForm.processing} className="bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">
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
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 duration-500">
                        <div className="p-10 border-b border-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">Configurar Permisos</h2>
                                    <p className="text-indigo-600 font-bold mt-1 uppercase tracking-tighter">Rol: {selectedRole.name}</p>
                                </div>
                                <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700 font-black text-sm">
                                    {permissionsForm.data.permissions.length} Seleccionados
                                </div>
                            </div>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 bg-gray-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* ✅ CORREGIDO: Agrupar permisos manualmente */}
                                {Object.entries(
                                    permissions.reduce((acc, p) => {
                                        const group = p.name.split('.')[0];
                                        if (!acc[group]) acc[group] = [];
                                        acc[group].push(p);
                                        return acc;
                                    }, {})
                                ).map(([category, perms]) => (
                                    <div key={category} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">{category}</h4>
                                        <div className="space-y-3">
                                            {perms.map(p => (
                                                <label key={p.id} className="flex items-center group cursor-pointer">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={permissionsForm.data.permissions.includes(p.name)}
                                                            onChange={() => togglePermission(p.name)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-10 h-6 rounded-full transition-colors ${permissionsForm.data.permissions.includes(p.name) ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
                                                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${permissionsForm.data.permissions.includes(p.name) ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                    </div>
                                                    <span className="ml-3 text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition">{p.name.split('.')[1]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-10 bg-white border-t border-gray-100 flex justify-end space-x-4 rounded-b-[3rem]">
                            <button type="button" onClick={() => setShowPermissionsModal(false)} className="px-8 py-4 text-gray-500 font-bold hover:text-gray-700 transition">Cancelar</button>
                            <button
                                onClick={handleAssignPermissions}
                                disabled={permissionsForm.processing}
                                className="bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
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