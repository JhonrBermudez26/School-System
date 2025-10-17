import { Head, useForm, usePage } from '@inertiajs/react';
import { Camera, Save, Mail, Phone, MapPin, User } from 'lucide-react';
import { useState } from 'react';
import Layout from '../../components/Layout/Layout';

export default function EditarPerfil() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [previewImage, setPreviewImage] = useState(user?.photo ? user.photo : null);

    const { data, setData, post, processing, errors } = useForm({
        name: user?.name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
        photo: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/perfil/actualizar', {
            forceFormData: true,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('photo', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <Layout title="Editar Perfil">
            <Head title="Editar Perfil" />

            <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Información Personal</h2>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center space-x-6 mb-6">
                        <div className="relative">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-green-200"
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

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nombre" icon={<User />} value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} />
                        <Input label="Apellido" icon={<User />} value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} error={errors.last_name} />
                        <Input label="Correo Electrónico" icon={<Mail />} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                        <Input label="Teléfono" icon={<Phone />} value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                        <Input label="Dirección" icon={<MapPin />} value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                        <Input label="Ciudad" icon={<MapPin />} value={data.city} onChange={(e) => setData('city', e.target.value)} error={errors.city} />
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            <span>{processing ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}

function Input({ label, icon, value, onChange, error, type = 'text' }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {icon} <span className="ml-1">{label}</span>
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
