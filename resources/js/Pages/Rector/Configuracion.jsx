import { useForm, Head } from '@inertiajs/react';
import { School, MapPin, Phone, Mail, Users, FileText, Upload, X, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function Configuracion({ settings }) {
    const [previewLogo, setPreviewLogo] = useState(
        settings?.logo_path ? `/storage/${settings.logo_path}` : null
    );
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        nombre_colegio: settings?.nombre_colegio || '',
        abreviacion: settings?.abreviacion || '',
        lema: settings?.lema || '',
        logo: null,
        direccion: settings?.direccion || '',
        ciudad: settings?.ciudad || '',
        departamento: settings?.departamento || '',
        pais: settings?.pais || 'Colombia',
        telefono: settings?.telefono || '',
        celular: settings?.celular || '',
        email: settings?.email || '',
        sitio_web: settings?.sitio_web || '',
        rector: settings?.rector || '',
        coordinador: settings?.coordinador || '',
        secretario: settings?.secretario || '',
        calendario: settings?.calendario || 'A',
        jornada: settings?.jornada || 'Completa',
        nivel_educativo: settings?.nivel_educativo || '',
        caracter: settings?.caracter || 'Mixto',
        min_grade: settings?.grading_scale?.min || 1.0,
        max_grade: settings?.grading_scale?.max || 5.0,
        passing_grade: settings?.grading_scale?.passing || 3.0,
        attendance_threshold: settings?.attendance_threshold || 80,
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
            reader.onloadend = () => setPreviewLogo(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('rector.configuracion.actualizar'), { forceFormData: true });
    };

    const removeLogo = () => {
        setPreviewLogo(null);
        setData('logo', null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Layout title="Configuración">
            <Head title="Parámetros Institucionales" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Configuración Institucional
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">
                            Parámetros globales y reglas de evaluación del sistema
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Columna izquierda */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Logo */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
                                    <h3 className="text-base font-bold flex items-center gap-2">
                                        <Upload className="h-5 w-5" />
                                        Identidad Visual
                                    </h3>
                                </div>
                                <div className="p-6 flex flex-col items-center">
                                    {previewLogo ? (
                                        <div className="relative group p-2 bg-gray-50 rounded-2xl">
                                            <img
                                                src={previewLogo}
                                                alt="Logo"
                                                className="w-40 h-40 object-contain rounded-xl border-2 border-white shadow-sm transition group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-44 h-44 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50">
                                            <School className="h-20 w-20 text-gray-200" />
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
                                        className="mt-5 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-md text-sm font-semibold"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span>Actualizar Logo</span>
                                    </label>
                                    <p className="text-xs text-gray-400 mt-3 text-center">
                                        PNG, JPG · máx. 2MB
                                    </p>
                                </div>
                            </div>

                            {/* Reglas Académicas */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
                                <h3 className="text-base font-bold mb-5 flex items-center gap-2">
                                    <Check className="h-5 w-5 text-blue-200" />
                                    Reglas de Evaluación
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1.5">Nota Mínima</label>
                                            <input
                                                type="number" step="0.1"
                                                value={data.min_grade}
                                                onChange={(e) => setData('min_grade', e.target.value)}
                                                className="w-full bg-white/15 border-0 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-white/50 font-semibold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1.5">Nota Máxima</label>
                                            <input
                                                type="number" step="0.1"
                                                value={data.max_grade}
                                                onChange={(e) => setData('max_grade', e.target.value)}
                                                className="w-full bg-white/15 border-0 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-white/50 font-semibold text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1.5">Nota de Aprobación</label>
                                        <input
                                            type="number" step="0.1"
                                            value={data.passing_grade}
                                            onChange={(e) => setData('passing_grade', e.target.value)}
                                            className="w-full bg-white/15 border-0 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-white/50 font-semibold text-sm"
                                        />
                                    </div>
                                    <div className="pt-3 border-t border-white/20">
                                        <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1.5 flex justify-between">
                                            Asistencia Mínima
                                            <span className="text-white font-bold">{data.attendance_threshold}%</span>
                                        </label>
                                        <input
                                            type="range" min="50" max="100"
                                            value={data.attendance_threshold}
                                            onChange={(e) => setData('attendance_threshold', e.target.value)}
                                            className="w-full accent-white"
                                        />
                                        <p className="text-xs text-blue-200 mt-1.5">* Menor a este % implica reprobación automática.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Información General */}
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
                                    <h3 className="text-base font-bold flex items-center gap-2">
                                        <School className="h-5 w-5" />
                                        Información General
                                    </h3>
                                </div>
                                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Nombre del Colegio</label>
                                        <input
                                            type="text"
                                            value={data.nombre_colegio}
                                            onChange={(e) => setData('nombre_colegio', e.target.value)}
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                                            placeholder="Institución Educativa..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Abreviación</label>
                                        <input
                                            type="text"
                                            value={data.abreviacion}
                                            onChange={(e) => setData('abreviacion', e.target.value.toUpperCase())}
                                            maxLength="20"
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Carácter</label>
                                        <select
                                            value={data.caracter}
                                            onChange={(e) => setData('caracter', e.target.value)}
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800"
                                        >
                                            <option value="Mixto">Mixto</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Masculino">Masculino</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Lema Institucional</label>
                                        <textarea
                                            value={data.lema}
                                            onChange={(e) => setData('lema', e.target.value)}
                                            rows="2"
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contacto y Ubicación */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
                                        <h3 className="text-base font-bold flex items-center gap-2">
                                            <Phone className="h-5 w-5" />
                                            Contacto
                                        </h3>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <input
                                            type="tel" value={data.telefono}
                                            onChange={e => setData('telefono', e.target.value)}
                                            placeholder="Teléfono Fijo"
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            type="tel" value={data.celular}
                                            onChange={e => setData('celular', e.target.value)}
                                            placeholder="Celular"
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            type="email" value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="Email institucional"
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
                                        <h3 className="text-base font-bold flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Sede Principal
                                        </h3>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <input
                                            type="text" value={data.direccion}
                                            onChange={e => setData('direccion', e.target.value)}
                                            placeholder="Dirección Completa"
                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text" value={data.ciudad}
                                                onChange={e => setData('ciudad', e.target.value)}
                                                placeholder="Ciudad"
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text" value={data.departamento}
                                                onChange={e => setData('departamento', e.target.value)}
                                                placeholder="Depto."
                                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botón Guardar */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 font-semibold"
                                >
                                    {processing ? (
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <Check className="h-5 w-5" />
                                    )}
                                    <span>Guardar Configuración</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}