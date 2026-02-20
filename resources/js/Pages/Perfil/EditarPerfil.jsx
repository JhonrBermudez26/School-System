import { useForm, usePage } from "@inertiajs/react";
import {
    Camera, Save, Mail, Phone, MapPin, User, Lock, IdCard,
    AlertTriangle, CheckCircle, Eye, EyeOff, XCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import Layout from "@/Components/Layout/Layout";

// ── Reglas de contraseña segura ──────────────────────────────
const PASSWORD_RULES = [
    { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'Al menos una mayúscula (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'Al menos una minúscula (a-z)', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'Al menos un número (0-9)', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'Al menos un carácter especial (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordInput({ label, value, onChange, error, required = false, showEye = true }) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-gray-400" />
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
            </label>
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    className={`w-full px-3 py-2.5 border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none pr-10 transition-shadow`}
                />
                {showEye && (
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                    >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
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
            <input
                type={type}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2.5 border ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm outline-none transition-shadow`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

export default function EditarPerfil() {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const mustChange = !!(flash?.must_change_password || user?.must_change_password);

    const [previewImage, setPreviewImage] = useState(
        user?.photo ? `/storage/${user.photo}` : null
    );

    const { data, setData, post, processing, errors } = useForm({
        name: user?.name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        document_type: user?.document_type || "",
        document_number: user?.document_number || "",
        phone: user?.phone || "",
        address: user?.address || "",
        birth_date: user?.birth_date || "",
        photo: null,
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    // ── Validación en tiempo real de contraseña ──
    const passwordChecks = useMemo(() =>
        PASSWORD_RULES.map(rule => ({
            ...rule,
            passed: data.new_password ? rule.test(data.new_password) : false,
        })),
        [data.new_password]
    );

    const allChecksPassed = passwordChecks.every(c => c.passed);
    const passwordsMatch = data.new_password && data.new_password === data.new_password_confirmation;
    const passwordMismatch = data.new_password_confirmation && data.new_password !== data.new_password_confirmation;
    const isPasswordReady = allChecksPassed && passwordsMatch;

    // Fuerza visual (0-5)
    const strength = passwordChecks.filter(c => c.passed).length;
    const strengthColors = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
    const strengthLabels = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Segura ✓'];

    // ── Submit: bloquear si mustChange y contraseña no es válida ──
    const handleSubmit = (e) => {
        e.preventDefault();

        // Si debe cambiar contraseña, validar antes de enviar
        if (mustChange) {
            if (!data.current_password || !data.new_password || !data.new_password_confirmation) return;
            if (!isPasswordReady) return;
        }

        post("/perfil/actualizar", {
            forceFormData: true,
            onSuccess: () => {
                // Limpiar campos de contraseña al guardar exitosamente
                setData(prev => ({
                    ...prev,
                    current_password: "",
                    new_password: "",
                    new_password_confirmation: "",
                }));
            },
        });
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

    const showPasswordSection = data.new_password.length > 0;

    return (
        <Layout title="Editar Perfil">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── BANNER OBLIGATORIO ── */}
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
                                sección <strong>Credenciales de Acceso</strong> con una contraseña
                                segura y guarda los cambios para acceder al sistema.
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
                        <div className="p-6 space-y-5">
                            {mustChange ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
                                    Ingresa tu contraseña actual y elige una nueva contraseña que cumpla todos los requisitos.
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                    Deja estos campos en blanco si no deseas cambiar tu contraseña.
                                </p>
                            )}

                            {/* Contraseña actual */}
                            <PasswordInput
                                label="Contraseña actual"
                                value={data.current_password}
                                onChange={(e) => setData("current_password", e.target.value)}
                                error={errors.current_password}
                                required={mustChange}
                            />

                            {/* Nueva contraseña */}
                            <PasswordInput
                                label="Nueva contraseña"
                                value={data.new_password}
                                onChange={(e) => setData("new_password", e.target.value)}
                                error={errors.new_password}
                                required={mustChange}
                            />

                            {/* Barra de fuerza + checklist (aparece al escribir) */}
                            {showPasswordSection && (
                                <div className="space-y-3">
                                    {/* Barra de fuerza */}
                                    <div>
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        {strength > 0 && (
                                            <p className={`text-xs font-medium ${strength >= 5 ? 'text-green-600' : strength >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                {strengthLabels[strength]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Checklist */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Requisitos de contraseña segura:</p>
                                        {passwordChecks.map(({ id, label, passed }) => (
                                            <div key={id} className="flex items-center gap-2">
                                                {passed
                                                    ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    : <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                                }
                                                <span className={`text-xs transition-colors ${passed ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mensaje si lista completa */}
                                    {allChecksPassed && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            <p className="text-xs text-green-700 font-semibold">¡Contraseña segura! Ahora confirma la contraseña.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Confirmar contraseña */}
                            <div>
                                <PasswordInput
                                    label="Confirmar nueva contraseña"
                                    value={data.new_password_confirmation}
                                    onChange={(e) => setData("new_password_confirmation", e.target.value)}
                                    error={errors.new_password_confirmation}
                                    required={mustChange}
                                />
                                {/* Indicador de coincidencia */}
                                {data.new_password_confirmation && (
                                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                                        {passwordsMatch
                                            ? <><CheckCircle className="h-3.5 w-3.5" /> Las contraseñas coinciden</>
                                            : <><XCircle className="h-3.5 w-3.5" /> Las contraseñas no coinciden</>
                                        }
                                    </div>
                                )}
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
                        <button
                            type="submit"
                            disabled={processing || (mustChange && !isPasswordReady)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                            <Save className="h-4 w-4" />
                            {processing
                                ? "Guardando..."
                                : mustChange
                                    ? isPasswordReady
                                        ? "Cambiar contraseña y continuar"
                                        : "Completa los requisitos"
                                    : "Guardar cambios"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}