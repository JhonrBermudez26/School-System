import { useState, useMemo } from "react";
import { Users, Search, Edit3, Trash2, Save, X, Filter, UserPlus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Layout from "@/Components/Layout/Layout";
import { usePage, router } from "@inertiajs/react";

export default function Usuarios() {
    const { usuarios, can } = usePage().props;
    
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("todos");
    const [filterActive, setFilterActive] = useState("todos");
    const [sortOrder, setSortOrder] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showNewUserForm, setShowNewUserForm] = useState(false);
    const [editData, setEditData] = useState({
        name: "",
        last_name: "",
        email: "",
        role: "",
        password: "",
        is_active: true,
    });
    
    const [newUserData, setNewUserData] = useState({
        name: "",
        last_name: "",
        email: "",
        password: "",
        document_type: "CC",
        document_number: "",
        phone: "",
        address: "",
        birth_date: "",
        role: "",
    });
    const [formErrors, setFormErrors] = useState({});

    const toggleSort = () => {
        if (sortOrder === null) {
            setSortOrder('asc');
        } else if (sortOrder === 'asc') {
            setSortOrder('desc');
        } else {
            setSortOrder(null);
        }
    };

    const filteredUsers = useMemo(() => {
        let result = usuarios.filter((u) => {
            const fullName = `${u.name} ${u.last_name || ''}`.toLowerCase();
            const matchSearch =
                fullName.includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                (u.document_number && u.document_number.includes(search));
            const matchRole =
                filterRole === "todos" || u.roles?.[0]?.name === filterRole;
            const matchActive =
                filterActive === "todos" ||
                (filterActive === "activo" && u.is_active) ||
                (filterActive === "inactivo" && !u.is_active);
            return matchSearch && matchRole && matchActive;
        });

        if (sortOrder !== null) {
            result = [...result].sort((a, b) => {
                const nameA = `${a.name} ${a.last_name || ''}`.toLowerCase();
                const nameB = `${b.name} ${b.last_name || ''}`.toLowerCase();
                
                if (sortOrder === 'asc') {
                    return nameA.localeCompare(nameB);
                } else {
                    return nameB.localeCompare(nameA);
                }
            });
        }
        return result;
    }, [search, filterRole, filterActive, sortOrder, usuarios]);

    const handleDelete = (id) => {
        if (confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) {
            router.delete(route("usuarios.destroy", id));
        }
    };

    const toggleActive = (id, isActive) => {
        router.put(route("usuarios.toggle", id), { is_active: !isActive });
    };

    const handleEditClick = (u) => {
        setEditingUser(u.id);
        setEditData({
            name: u.name,
            last_name: u.last_name || "",
            email: u.email,
            role: u.roles?.[0]?.name || "estudiante",
            password: "",
            is_active: u.is_active,
        });
    };

    const handleEditSubmit = () => {
        router.put(route("usuarios.update", editingUser), editData, {
            onSuccess: () => {
                setEditingUser(null);
                setEditData({
                    name: "",
                    last_name: "",
                    email: "",
                    role: "",
                    password: "",
                    is_active: true,
                });
            },
        });
    };

    const handleNewUserSubmit = (e) => {
        e.preventDefault();
        router.post(route("usuarios.store"), newUserData, {
            onError: (err) => setFormErrors(err),
            onSuccess: () => {
                setShowNewUserForm(false);
                setNewUserData({
                    name: "",
                    last_name: "",
                    email: "",
                    password: "",
                    document_type: "CC",
                    document_number: "",
                    phone: "",
                    address: "",
                    birth_date: "",
                    role: "",
                });
                setFormErrors({});
            },
        });
    };

    const getRoleColor = (role) => {
        const colors = {
            estudiante: 'bg-blue-100 text-blue-800',
            profesor: 'bg-purple-100 text-purple-800',
            secretaria: 'bg-pink-100 text-pink-800',
            coordinadora: 'bg-indigo-100 text-indigo-800',
            rector: 'bg-orange-100 text-orange-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    const getSortIcon = () => {
        if (sortOrder === 'asc') {
            return <ArrowUp className="h-4 w-4 text-green-600" />;
        } else if (sortOrder === 'desc') {
            return <ArrowDown className="h-4 w-4 text-green-600" />;
        } else {
            return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <Layout title="Gestionar Usuarios">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestionar Usuarios</h1>
                    <p className="text-gray-600 mt-2">Administra la información de los usuarios del sistema</p>
                </div>
                
                {/* ✅ Botón solo visible si tiene permiso de crear */}
                {can.create && (
                    <button
                        onClick={() => setShowNewUserForm(!showNewUserForm)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md w-full sm:w-auto justify-center"
                    >
                        <UserPlus className="h-5 w-5" />
                        <span>{showNewUserForm ? 'Ocultar Formulario' : 'Nuevo Usuario'}</span>
                    </button>
                )}
            </div>

            {/* ✅ Formulario solo visible si tiene permiso de crear */}
            {can.create && showNewUserForm && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6 border-2 border-green-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <UserPlus className="text-green-600" />
                            Registrar Nuevo Usuario
                        </h2>
                        <button
                            onClick={() => setShowNewUserForm(false)}
                            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-full transition"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <form onSubmit={handleNewUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                                type="text"
                                value={newUserData.name}
                                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Ej: María"
                                required
                            />
                            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                        </div>

                        {/* Apellido */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                            <input
                                type="text"
                                value={newUserData.last_name}
                                onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Ej: López"
                                required
                            />
                            {formErrors.last_name && <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
                            <input
                                type="email"
                                value={newUserData.email}
                                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="correo@ejemplo.com"
                                required
                            />
                            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                            <input
                                type="password"
                                value={newUserData.password}
                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                        </div>

                        {/* Tipo Documento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
                            <select
                                value={newUserData.document_type}
                                onChange={(e) => setNewUserData({ ...newUserData, document_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="CC">Cédula de Ciudadanía</option>
                                <option value="TI">Tarjeta de Identidad</option>
                                <option value="CE">Cédula de Extranjería</option>
                            </select>
                        </div>

                        {/* Número Documento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
                            <input
                                type="text"
                                value={newUserData.document_number}
                                onChange={(e) => setNewUserData({ ...newUserData, document_number: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Ej: 1006773640"
                                required
                            />
                            {formErrors.document_number && <p className="text-red-500 text-xs mt-1">{formErrors.document_number}</p>}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={newUserData.phone}
                                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Ej: 3114567890"
                            />
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                            <input
                                type="text"
                                value={newUserData.address}
                                onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Ej: Calle 45 #12-34"
                            />
                        </div>

                        {/* Fecha Nacimiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                            <input
                                type="date"
                                value={newUserData.birth_date}
                                onChange={(e) => setNewUserData({ ...newUserData, birth_date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Rol */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                            <select
                                value={newUserData.role}
                                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            >
                                <option value="">Seleccionar rol</option>
                                <option value="estudiante">Estudiante</option>
                                <option value="profesor">Profesor</option>
                                <option value="secretaria">Secretaria</option>
                                <option value="coordinadora">Coordinadora</option>
                                <option value="rector">Rector</option>
                            </select>
                            {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
                        </div>

                        {/* Botones */}
                        <div className="sm:col-span-2 md:col-span-3 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNewUserForm(false);
                                    setFormErrors({});
                                }}
                                className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium order-2 sm:order-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md order-1 sm:order-2"
                            >
                                Guardar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-500 text-xs sm:text-sm">Total Usuarios</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-500 text-xs sm:text-sm">Activos</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {filteredUsers.filter(e => e.is_active).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-500 text-xs sm:text-sm">Inactivos</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                        {filteredUsers.filter(e => !e.is_active).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-gray-500 text-xs sm:text-sm">Roles Únicos</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {new Set(filteredUsers.map(u => u.roles?.[0]?.name).filter(Boolean)).size}
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                            <option value="todos">Todos los roles</option>
                            <option value="estudiante">Estudiante</option>
                            <option value="profesor">Profesor</option>
                            <option value="secretaria">Secretaría</option>
                            <option value="coordinadora">Coordinadora</option>
                            <option value="rector">Rector</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="text-gray-400 h-5 w-5 flex-shrink-0" />
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={toggleSort}
                                        className="flex items-center space-x-2 hover:text-gray-700 transition"
                                        title="Ordenar alfabéticamente"
                                    >
                                        <span>Usuario</span>
                                        {getSortIcon()}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Correo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contraseña
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Documento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        {/* Usuario */}
                                        <td className="px-6 py-4">
                                            {editingUser === u.id ? (
                                                <div className="flex flex-col md:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={editData.name}
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                name: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Nombre"
                                                        className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editData.last_name}
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                last_name: e.target.value,
                                                            })
                                                        }
                                                        placeholder="Apellido"
                                                        className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-blue-600 font-bold text-sm">
                                                            {u.name.charAt(0)}{u.last_name ? u.last_name.charAt(0) : ''}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {u.name} {u.last_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Correo */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {editingUser === u.id ? (
                                                <input
                                                    type="email"
                                                    value={editData.email}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            email: e.target.value,
                                                        })
                                                    }
                                                    className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                />
                                            ) : (
                                                <div className="break-all">{u.email}</div>
                                            )}
                                        </td>

                                        {/* Contraseña */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {editingUser === u.id ? (
                                                <input
                                                    type="password"
                                                    value={editData.password}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            password: e.target.value,
                                                        })
                                                    }
                                                    className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                    placeholder="Nueva contraseña"
                                                />
                                            ) : (
                                                <span className="text-gray-500">******</span>
                                            )}
                                        </td>

                                        {/* Documento */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {u.document_number || 'N/A'}
                                        </td>

                                        {/* Rol */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingUser === u.id ? (
                                                <select
                                                    value={editData.role}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            role: e.target.value,
                                                        })
                                                    }
                                                    className="border border-gray-300 rounded-lg px-3 py-1 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                >
                                                    <option value="estudiante">Estudiante</option>
                                                    <option value="profesor">Profesor</option>
                                                    <option value="secretaria">Secretaría</option>
                                                    <option value="coordinadora">Coordinadora</option>
                                                    <option value="rector">Rector</option>
                                                </select>
                                            ) : (
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(u.roles?.[0]?.name)}`}>
                                                    {u.roles?.[0]?.name || "Sin rol"}
                                                </span>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {u.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>

                                        {/* ✅ Acciones con control de permisos */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {editingUser === u.id ? (
                                                    <>
                                                        <button
                                                            onClick={handleEditSubmit}
                                                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                                                            title="Guardar"
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingUser(null)}
                                                            className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded"
                                                            title="Cancelar"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* ✅ Toggle activo/inactivo - solo con permiso update */}
                                                        {can.update && (
                                                            <button
                                                                onClick={() => toggleActive(u.id, u.is_active)}
                                                                className={`${u.is_active
                                                                        ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                                                        : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                                    } p-2 rounded`}
                                                                title={u.is_active ? 'Desactivar' : 'Activar'}
                                                            >
                                                                <Users className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        
                                                        {/* ✅ Editar - solo con permiso update */}
                                                        {can.update && (
                                                            <button
                                                                onClick={() => handleEditClick(u)}
                                                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                                title="Editar"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        
                                                        {/* ✅ Eliminar - solo con permiso delete */}
                                                        {can.delete && (
                                                            <button
                                                                onClick={() => handleDelete(u.id)}
                                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        
                                                        {/* ✅ Mensaje cuando no hay permisos de acción */}
                                                        {!can.update && !can.delete && (
                                                            <span className="text-gray-400 text-xs italic px-2">Solo lectura</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}