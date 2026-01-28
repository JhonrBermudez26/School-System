import { useForm } from '@inertiajs/react';
import { School, MapPin, Phone, Mail, Users, FileText, Upload, X, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Configuracion({ settings }) {
    const [previewLogo, setPreviewLogo] = useState(
        settings?.logo_path ? `/storage/${settings.logo_path}` : null
    );
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        // Información básica
        nombre_colegio: settings?.nombre_colegio || '',
        abreviacion: settings?.abreviacion || '',
        lema: settings?.lema || '',
        logo: null,
        
        // Ubicación
        direccion: settings?.direccion || '',
        ciudad: settings?.ciudad || '',
        departamento: settings?.departamento || '',
        pais: settings?.pais || 'Colombia',
        
        // Contacto
        telefono: settings?.telefono || '',
        celular: settings?.celular || '',
        email: settings?.email || '',
        sitio_web: settings?.sitio_web || '',
        
        // Información administrativa
        rector: settings?.rector || '',
        coordinador: settings?.coordinador || '',
        secretario: settings?.secretario || '',
        
        // Información académica
        calendario: settings?.calendario || 'A',
        jornada: settings?.jornada || 'Completa',
        nivel_educativo: settings?.nivel_educativo || '',
        caracter: settings?.caracter || 'Mixto',
        
        // Legal
        nit: settings?.nit || '',
        dane: settings?.dane || '',
        resolucion: settings?.resolucion || '',
        fecha_fundacion: settings?.fecha_fundacion || '',
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewLogo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/secretaria/configuracion', {
            forceFormData: true,
            onSuccess: () => {
                // Éxito manejado por Laravel
            },
        });
    };

    const removeLogo = () => {
        setPreviewLogo(null);
        setData('logo', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Layout title="Configuración">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                            <School className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">
                                Configuración Institucional
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Administra la información y datos del colegio
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna izquierda - Logo y datos básicos */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Logo */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Upload className="h-5 w-5 mr-2 text-green-600" />
                                    Logo Institucional
                                </h3>
                                
                                <div className="flex flex-col items-center">
                                    {previewLogo ? (
                                        <div className="relative group">
                                            <img
                                                src={previewLogo}
                                                alt="Logo"
                                                className="w-48 h-48 object-contain rounded-xl border-4 border-gray-100 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                                            <School className="h-20 w-20 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="mt-4 cursor-pointer bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center space-x-2 shadow-md"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Subir Logo</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        PNG, JPG o GIF (máx. 2MB)
                                    </p>
                                </div>
                            </div>

                            {/* Información Legal */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                                    Información Legal
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            NIT
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nit}
                                            onChange={(e) => setData('nit', e.target.value)}
                                            placeholder="900.123.456-7"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Código DANE
                                        </label>
                                        <input
                                            type="text"
                                            value={data.dane}
                                            onChange={(e) => setData('dane', e.target.value)}
                                            placeholder="111001234567"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Resolución
                                        </label>
                                        <input
                                            type="text"
                                            value={data.resolucion}
                                            onChange={(e) => setData('resolucion', e.target.value)}
                                            placeholder="Nro. 12345 de 2020"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fecha de Fundación
                                        </label>
                                        <input
                                            type="date"
                                            value={data.fecha_fundacion}
                                            onChange={(e) => setData('fecha_fundacion', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha - Formularios */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Información General */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <School className="h-5 w-5 mr-2 text-green-600" />
                                    Información General
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre del Colegio *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nombre_colegio}
                                            onChange={(e) => setData('nombre_colegio', e.target.value)}
                                            placeholder="Institución Educativa Las Palmas"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Abreviación *
                                        </label>
                                        <input
                                            type="text"
                                            value={data.abreviacion}
                                            onChange={(e) => setData('abreviacion', e.target.value.toUpperCase())}
                                            placeholder="IELPA"
                                            maxLength="20"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Aparecerá en los títulos de las pestañas
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Carácter
                                        </label>
                                        <select
                                            value={data.caracter}
                                            onChange={(e) => setData('caracter', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="Mixto">Mixto</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Masculino">Masculino</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lema Institucional
                                        </label>
                                        <textarea
                                            value={data.lema}
                                            onChange={(e) => setData('lema', e.target.value)}
                                            placeholder="Educando con amor y excelencia"
                                            rows="2"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Ubicación */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <MapPin className="h-5 w-5 mr-2 text-green-600" />
                                    Ubicación
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dirección
                                        </label>
                                        <input
                                            type="text"
                                            value={data.direccion}
                                            onChange={(e) => setData('direccion', e.target.value)}
                                            placeholder="Calle 123 #45-67"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ciudad
                                        </label>
                                        <input
                                            type="text"
                                            value={data.ciudad}
                                            onChange={(e) => setData('ciudad', e.target.value)}
                                            placeholder="Bogotá"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Departamento
                                        </label>
                                        <input
                                            type="text"
                                            value={data.departamento}
                                            onChange={(e) => setData('departamento', e.target.value)}
                                            placeholder="Cundinamarca"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contacto */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Phone className="h-5 w-5 mr-2 text-green-600" />
                                    Información de Contacto
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.telefono}
                                            onChange={(e) => setData('telefono', e.target.value)}
                                            placeholder="(601) 234 5678"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Celular
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.celular}
                                            onChange={(e) => setData('celular', e.target.value)}
                                            placeholder="320 123 4567"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="info@colegio.edu.co"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Sitio Web
                                        </label>
                                        <input
                                            type="url"
                                            value={data.sitio_web}
                                            onChange={(e) => setData('sitio_web', e.target.value)}
                                            placeholder="https://www.colegio.edu.co"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Información Administrativa */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-green-600" />
                                    Equipo Administrativo
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rector(a)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.rector}
                                            onChange={(e) => setData('rector', e.target.value)}
                                            placeholder="Nombre del rector"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Coordinador(a)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.coordinador}
                                            onChange={(e) => setData('coordinador', e.target.value)}
                                            placeholder="Nombre del coordinador"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Secretario(a)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.secretario}
                                            onChange={(e) => setData('secretario', e.target.value)}
                                            placeholder="Nombre del secretario"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Información Académica */}
                            <div className="bg-white rounded-2xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <School className="h-5 w-5 mr-2 text-green-600" />
                                    Información Académica
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Calendario
                                        </label>
                                        <select
                                            value={data.calendario}
                                            onChange={(e) => setData('calendario', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="A">Calendario A</option>
                                            <option value="B">Calendario B</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jornada
                                        </label>
                                        <select
                                            value={data.jornada}
                                            onChange={(e) => setData('jornada', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="Mañana">Mañana</option>
                                            <option value="Tarde">Tarde</option>
                                            <option value="Completa">Completa</option>
                                            <option value="Nocturna">Nocturna</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Niveles Educativos
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nivel_educativo}
                                            onChange={(e) => setData('nivel_educativo', e.target.value)}
                                            placeholder="Preescolar, Básica Primaria, Secundaria, Media"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Guardar */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check className="h-5 w-5" />
                                    <span className="font-semibold">
                                        {processing ? 'Guardando...' : 'Guardar Configuración'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}