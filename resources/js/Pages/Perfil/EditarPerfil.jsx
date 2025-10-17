import { Head, useForm, usePage } from "@inertiajs/react";
import { Camera, Save, Mail, Phone, MapPin, User, Lock, IdCard } from "lucide-react";
import { useState } from "react";
import Layout from "../../components/Layout/Layout";

export default function EditarPerfil() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [previewImage, setPreviewImage] = useState(user?.photo ? `/storage/${user.photo}` : null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        document_type: user?.document_type || "",
        document_number: user?.document_number || "",
        phone: user?.phone || "",
        address: user?.address || "",
        birth_date: user?.birth_date || "",
        photo: null,

        // Para cambio de contraseña
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

     const [preview, setPreview] = useState(
    user.photo ? `/storage/${user.photo}` : null
  );
  
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
            <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-8 space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* FOTO DE PERFIL */}
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="relative">
                            {previewImage ? (
                                <img
                                    src={previewImage || "/default-user.png"}
                                    alt="Preview"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-green-500 text-white flex items-center justify-center text-3xl font-bold">
                                    {data.name?.[0]}{data.last_name?.[0]}
                                </div>
                            )}
                            <label
                                htmlFor="photo-upload"
                                className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition"
                            >
                                <Camera className="h-4 w-4 text-white" />
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* DATOS PERSONALES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nombre" icon={<User />} value={data.name} onChange={(e) => setData("name", e.target.value)} error={errors.name} />
                        <Input label="Apellido" icon={<User />} value={data.last_name} onChange={(e) => setData("last_name", e.target.value)} error={errors.last_name} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <IdCard className="mr-2 text-gray-500" /> Tipo de documento
                            </label>
                            <select
                                value={data.document_type}
                                onChange={(e) => setData("document_type", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">Seleccione...</option>
                                <option value="CC">Cédula de Ciudadanía</option>
                                <option value="TI">Tarjeta de Identidad</option>
                                <option value="CE">Cédula de Extranjería</option>
                                <option value="PA">Pasaporte</option>
                            </select>
                            {errors.document_type && <p className="text-red-500 text-sm mt-1">{errors.document_type}</p>}
                        </div>

                        <Input label="Número de documento" icon={<IdCard />} value={data.document_number} onChange={(e) => setData("document_number", e.target.value)} error={errors.document_number} />
                        <Input label="Correo electrónico" icon={<Mail />} type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} error={errors.email} />
                        <Input label="Teléfono" icon={<Phone />} value={data.phone} onChange={(e) => setData("phone", e.target.value)} error={errors.phone} />
                        <Input label="Dirección" icon={<MapPin />} value={data.address} onChange={(e) => setData("address", e.target.value)} error={errors.address} />
                        <Input label="Fecha de nacimiento" type="date" value={data.birth_date} onChange={(e) => setData("birth_date", e.target.value)} error={errors.birth_date} />
                    </div>

                    {/* SECCIÓN DE CREDENCIALES */}
                    <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <Lock className="mr-2 text-green-600" /> Credenciales de acceso
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Si deseas cambiar tu contraseña, completa los siguientes campos.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Contraseña actual" type="password" value={data.current_password} onChange={(e) => setData("current_password", e.target.value)} error={errors.current_password} />
                            <Input label="Nueva contraseña" type="password" value={data.new_password} onChange={(e) => setData("new_password", e.target.value)} error={errors.new_password} />
                            <Input label="Confirmar nueva contraseña" type="password" value={data.new_password_confirmation} onChange={(e) => setData("new_password_confirmation", e.target.value)} error={errors.new_password_confirmation} />
                        </div>
                    </div>

                    {/* BOTÓN DE GUARDADO */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            <span>{processing ? "Guardando..." : "Guardar cambios"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

// COMPONENTE DE INPUT
function Input({ label, icon, value, onChange, error, type = "text" }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                {icon && <span className="mr-2 text-gray-500">{icon}</span>}
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
