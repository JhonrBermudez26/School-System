import { Head, useForm, usePage } from "@inertiajs/react";
import { Camera, Save, Mail, Phone, MapPin, User, Lock, IdCard, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import Layout from "@/Components/Layout/Layout";

export default function EditarPerfil() {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const mustChange = flash?.must_change_password || user?.must_change_password;

    const [previewImage, setPreviewImage] = useState(
        user?.photo ? `/storage/${user.photo}` : null
    );

    const { data, setData, post, processing, errors } = useForm({
        name:                      user?.name || "",
        last_name:                 user?.last_name || "",
        email:                     user?.email || "",
        document_type:             user?.document_type || "",
        document_number:           user?.document_number || "",
        phone:                     user?.phone || "",
        address:                   user?.address || "",
        birth_date:                user?.birth_date || "",
        photo:                     null,
        current_password:          "",
        new_password:              "",
        new_password_confirmation: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/perfil/actualizar", { forceFormData: true });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("photo", file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <Layout title="Editar Perfil">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── BANNER CAMBIO OBLIGATORIO ── */}
                {mustChange && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 flex items-start gap-4 shadow-md">
                        <div className="bg-yellow-100 p-2.5 rounded-xl flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="font-bold text-yellow-800 text-base">
                                Debes cambiar tu contraseña antes de continuar
                            </p>
                            <p className="text-yellow-700 text-sm mt-1 leading-relaxed">
                                Tu cuenta tiene una contraseña temporal o insegura. Completa la
                                sección <strong>Credenciales de Acceso</strong> más abajo y
                                guarda los cambios para acceder al sistema.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── BANNER ÉXITO ── */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <p className="text-green-800 text-sm font-medium">{flash.success}</p>
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Editar Perfil
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Actualiza tu información personal y credenciales</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── FOTO ── */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <User className="h-4 w-4" /> Foto de Perfil
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-6">
                                <div className="relative flex-shrink-0">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview"
                                            className="w-24 h-24 rounded-2xl object-cover border-4 border-blue-100 shadow-md" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                                            {data.name?.[0]}{data.last_name?.[0]}
                                        </div>
                                    )}
                                    <label htmlFor="photo-upload"
                                        className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-2 cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
                                        <Camera className="h-4 w-4 text-white" />
                                        <input id="photo-upload" type="file" accept="image/*"
                                            onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{data.name} {data.last_name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{data.email}</p>
                                    <p className="text-xs text-blue-600 mt-3 font-medium">Haz clic en el ícono para cambiar tu foto</p>
                                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG. Máximo 2MB.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── DATOS PERSONALES ── */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <User className="h-4 w-4" /> Información Personal
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Input label="Nombre" icon={<User className="h-4 w-4" />}
                                    value={data.name} onChange={(e) => setData("name", e.target.value)} error={errors.name} />
                                <Input label="Apellido" icon={<User className="h-4 w-4" />}
                                    value={data.last_name} onChange={(e) => setData("last_name", e.target.value)} error={errors.last_name} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        <span className="flex items-center gap-1.5">
                                            <IdCard className="h-4 w-4 text-gray-400" /> Tipo de documento
                                        </span>
                                    </label>
                                    <select value={data.document_type} onChange={(e) => setData("document_type", e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none bg-white text-gray-700">
                                        <option value="">Seleccione...</option>
                                        <option value="CC">Cédula de Ciudadanía</option>
                                        <option value="TI">Tarjeta de Identidad</option>
                                        <option value="CE">Cédula de Extranjería</option>
                                        <option value="PA">Pasaporte</option>
                                    </select>
                                    {errors.document_type && <p className="text-red-500 text-xs mt-1">{errors.document_type}</p>}
                                </div>
                                <Input label="Número de documento" icon={<IdCard className="h-4 w-4" />}
                                    value={data.document_number} onChange={(e) => setData("document_number", e.target.value)} error={errors.document_number} />
                                <Input label="Correo electrónico" icon={<Mail className="h-4 w-4" />} type="email"
                                    value={data.email} onChange={(e) => setData("email", e.target.value)} error={errors.email} />
                                <Input label="Teléfono" icon={<Phone className="h-4 w-4" />}
                                    value={data.phone} onChange={(e) => setData("phone", e.target.value)} error={errors.phone} />
                                <Input label="Dirección" icon={<MapPin className="h-4 w-4" />}
                                    value={data.address} onChange={(e) => setData("address", e.target.value)} error={errors.address} />
                                <Input label="Fecha de nacimiento" type="date"
                                    value={data.birth_date} onChange={(e) => setData("birth_date", e.target.value)} error={errors.birth_date} />
                            </div>
                        </div>
                    </div>

                    {/* ── CREDENCIALES ── */}
                    <div className={`bg-white rounded-2xl shadow-md border overflow-hidden ${mustChange ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'}`}>
                        <div className={`px-6 py-4 ${mustChange ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Credenciales de Acceso
                                {mustChange && (
                                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">⚠ Requerido</span>
                                )}
                            </h2>
                        </div>
                        <div className="p-6">
                            {mustChange ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-800">
                                    Ingresa tu contraseña actual y elige una nueva contraseña segura (mínimo 8 caracteres).
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                    Deja estos campos en blanco si no deseas cambiar tu contraseña.
                                </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Input label="Contraseña actual" type="password"
                                    value={data.current_password}
                                    onChange={(e) => setData("current_password", e.target.value)}
                                    error={errors.current_password}
                                    required={!!mustChange} />
                                <Input label="Nueva contraseña" type="password"
                                    value={data.new_password}
                                    onChange={(e) => setData("new_password", e.target.value)}
                                    error={errors.new_password}
                                    required={!!mustChange} />
                                <Input label="Confirmar nueva contraseña" type="password"
                                    value={data.new_password_confirmation}
                                    onChange={(e) => setData("new_password_confirmation", e.target.value)}
                                    error={errors.new_password_confirmation}
                                    required={!!mustChange} />
                            </div>
                        </div>
                    </div>

                    {/* ── BOTONES ── */}
                    <div className="flex justify-end gap-3 pb-4">
                        {!mustChange && (
                            <button type="button" onClick={() => window.history.back()}
                                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                        )}
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 font-semibold text-sm shadow-md hover:shadow-lg">
                            <Save className="h-4 w-4" />
                            {processing
                                ? "Guardando..."
                                : mustChange
                                    ? "Cambiar contraseña y continuar"
                                    : "Guardar cambios"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

function Input({ label, icon, value, onChange, error, type = "text", required = false }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
            </label>
            <input type={type} value={value} onChange={onChange}
                className={`w-full px-3 py-2.5 border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none transition-shadow`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}