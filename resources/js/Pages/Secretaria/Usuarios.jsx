import { useState, useMemo } from "react";
import Layout from "@/Components/Layout/Layout";
import { usePage, router } from "@inertiajs/react";
import { Switch } from "@headlessui/react";
import { Users, Search, Edit3, Trash2, Save, X } from "lucide-react";

export default function Usuarios() {
    const { auth, usuarios } = usePage().props;
    const user = auth?.user;

    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("todos");
    const [filterActive, setFilterActive] = useState("todos");

    const [editingUser, setEditingUser] = useState(null);
    const [editData, setEditData] = useState({
        name: "",
        email: "",
        role: "",
        password: "",
        is_active: true,
    });

    // 🔍 Filtrado dinámico avanzado
    const filteredUsers = useMemo(() => {
        return usuarios.filter((u) => {
            const matchSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            const matchRole =
                filterRole === "todos" || u.roles?.[0]?.name === filterRole;
            const matchActive =
                filterActive === "todos" ||
                (filterActive === "activo" && u.is_active) ||
                (filterActive === "inactivo" && !u.is_active);
            return matchSearch && matchRole && matchActive;
        });
    }, [search, filterRole, filterActive, usuarios]);

    const handleDelete = (id) => {
        if (confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) {
            router.delete(route("secretaria.usuarios.destroy", id));
        }
    };

    const toggleActive = (id, isActive) => {
        router.put(route("secretaria.usuarios.toggle", id), { is_active: !isActive });
    };

    const handleEditClick = (u) => {
        setEditingUser(u.id);
        setEditData({
            name: u.name,
            email: u.email,
            role: u.roles?.[0]?.name || "estudiante",
            password: "",
            is_active: u.is_active,
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        router.put(route("secretaria.usuarios.update", editingUser), editData, {
            onSuccess: () => {
                setEditingUser(null);
                setEditData({
                    name: "",
                    email: "",
                    role: "",
                    password: "",
                    is_active: true,
                });
            },
        });
    };

    return (
        <Layout title="Gestión de Usuarios - Secretaría">
            <div className="p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="text-blue-600 w-8 h-8" /> Gestión de Usuarios
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Controla y administra los usuarios del sistema
                        </p>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="todos">Todos los roles</option>
                            <option value="estudiante">Estudiante</option>
                            <option value="profesor">Profesor</option>
                            <option value="secretaria">Secretaría</option>
                            <option value="coordinadora">Coordinadora</option>
                            <option value="rector">Rector</option>
                        </select>

                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="todos">Todos</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">#</th>
                                <th className="p-3 text-left">Nombre</th>
                                <th className="p-3 text-left">Correo</th>
                                <th className="p-3 text-left">Rol</th>
                                <th className="p-3 text-left">Contraseña</th>
                                <th className="p-3 text-center">Activo</th>
                                <th className="p-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u, index) => (
                                    <tr
                                        key={u.id}
                                        className="border-t hover:bg-gray-50 transition-all"
                                    >
                                        <td className="p-3">{index + 1}</td>

                                        {/* Nombre */}
                                        <td className="p-3 font-medium">
                                            {editingUser === u.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.name}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded-lg px-2 py-1 w-full"
                                                />
                                            ) : (
                                                u.name
                                            )}
                                        </td>

                                        {/* Correo */}
                                        <td className="p-3">
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
                                                    className="border rounded-lg px-2 py-1 w-full"
                                                />
                                            ) : (
                                                u.email
                                            )}
                                        </td>

                                        {/* Rol */}
                                        <td className="p-3 capitalize">
                                            {editingUser === u.id ? (
                                                <select
                                                    value={editData.role}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            role: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded-lg px-2 py-1 w-full"
                                                >
                                                    <option value="estudiante">Estudiante</option>
                                                    <option value="profesor">Profesor</option>
                                                    <option value="secretaria">Secretaría</option>
                                                    <option value="coordinadora">Coordinadora</option>
                                                    <option value="rector">Rector</option>
                                                </select>
                                            ) : (
                                                u.roles?.[0]?.name || "Sin rol"
                                            )}
                                        </td>

                                        {/* Contraseña */}
                                        <td className="p-3">
                                            {editingUser === u.id ? (
                                                <input
                                                    type="password"
                                                    placeholder="••••••"
                                                    value={editData.password}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            password: e.target.value,
                                                        })
                                                    }
                                                    className="border rounded-lg px-2 py-1 w-full"
                                                />
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    No visible
                                                </span>
                                            )}
                                        </td>

                                        {/* Activo */}
                                        <td className="p-3 text-center">
                                            <Switch
                                                checked={u.is_active}
                                                onChange={() =>
                                                    toggleActive(u.id, u.is_active)
                                                }
                                                className={`${
                                                    u.is_active
                                                        ? "bg-green-500"
                                                        : "bg-gray-300"
                                                } relative inline-flex h-6 w-11 items-center rounded-full transition`}
                                            >
                                                <span
                                                    className={`${
                                                        u.is_active
                                                            ? "translate-x-6"
                                                            : "translate-x-1"
                                                    } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                                />
                                            </Switch>
                                        </td>

                                        {/* Acciones */}
                                        <td className="p-3 text-center space-x-2">
                                            {editingUser === u.id ? (
                                                <>
                                                    <button
                                                        onClick={handleEditSubmit}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 inline-flex"
                                                    >
                                                        <Save size={15} /> Guardar
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setEditingUser(null)
                                                        }
                                                        className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 inline-flex"
                                                    >
                                                        <X size={15} /> Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleEditClick(u)
                                                        }
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 inline-flex"
                                                    >
                                                        <Edit3 size={15} /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(u.id)
                                                        }
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 inline-flex"
                                                    >
                                                        <Trash2 size={15} /> Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center p-6 text-gray-500 italic"
                                    >
                                        No se encontraron usuarios.
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
