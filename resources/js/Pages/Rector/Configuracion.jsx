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

        // Reglas de Evaluación
        min_grade: settings?.grading_scale?.min || 1.0,
        max_grade: settings?.grading_scale?.max || 5.0,
        passing_grade: settings?.grading_scale?.passing || 3.0,
        attendance_threshold: settings?.attendance_threshold || 80,

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
        post(route('rector.institucion.update'), {
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
            <Head title="Parámetros Institucionales" />
            <div className="max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center space-x-6 mb-3">
                        <div className="p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-100 rotate-3">
                            <School className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                                Configuración Institucional
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium italic underline decoration-indigo-200 decoration-4 underline-offset-4">
                                Parámetros globales y reglas de evaluación del sistema
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Columna izquierda - Logo y datos básicos */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Logo */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 p-8 border border-gray-50">
                                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                                    <Upload className="h-6 w-6 mr-3 text-indigo-600" />
                                    Identidad Visual
                                </h3>

                                <div className="flex flex-col items-center">
                                    {previewLogo ? (
                                        <div className="relative group p-2 bg-gray-50 rounded-3xl">
                                            <img
                                                src={previewLogo}
                                                alt="Logo"
                                                className="w-48 h-48 object-contain rounded-2xl border-4 border-white shadow-sm transition group-hover:scale-105"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute -top-3 -right-3 bg-red-500 text-white p-3 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-52 h-52 border-[3px] border-dashed border-gray-200 rounded-[3rem] flex items-center justify-center bg-gray-50">
                                            <School className="h-24 w-24 text-gray-200" />
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
                                        className="mt-8 cursor-pointer bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-black transition flex items-center space-x-3 shadow-xl"
                                    >
                                        <Upload className="h-5 w-5 text-indigo-400" />
                                        <span className="font-black">Actualizar Logo</span>
                                    </label>
                                    <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
                                        Formatos admitidos: PNG, JPG (máx. 2MB)
                                    </p>
                                </div>
                            </div>

                            {/* Reglas Académicas */}
                            <div className="bg-indigo-900 rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-8 text-white">
                                <h3 className="text-xl font-black mb-6 flex items-center">
                                    <Check className="h-6 w-6 mr-3 text-indigo-300" />
                                    Reglas de Evaluación
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Nota Mínima</label>
                                            <input
                                                type="number" step="0.1"
                                                value={data.min_grade}
                                                onChange={(e) => setData('min_grade', e.target.value)}
                                                className="w-full bg-white/10 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-400 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Nota Máxima</label>
                                            <input
                                                type="number" step="0.1"
                                                value={data.max_grade}
                                                onChange={(e) => setData('max_grade', e.target.value)}
                                                className="w-full bg-white/10 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-400 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Nota de Aprobación</label>
                                        <input
                                            type="number" step="0.1"
                                            value={data.passing_grade}
                                            onChange={(e) => setData('passing_grade', e.target.value)}
                                            className="w-full bg-white/10 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-400 font-bold"
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 flex justify-between">
                                            Asistencia Mínima <span>{data.attendance_threshold}%</span>
                                        </label>
                                        <input
                                            type="range" min="50" max="100"
                                            value={data.attendance_threshold}
                                            onChange={(e) => setData('attendance_threshold', e.target.value)}
                                            className="w-full accent-indigo-400"
                                        />
                                        <p className="text-[9px] text-indigo-200 mt-2 italic">* Estudiantes con asistencia menor reprueban automáticamente.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha - Formularios */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Información General */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 p-8 border border-gray-50">
                                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                                    <School className="h-6 w-6 mr-3 text-indigo-600" />
                                    Información General
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nombre del Colegio</label>
                                        <input
                                            type="text"
                                            value={data.nombre_colegio}
                                            onChange={(e) => setData('nombre_colegio', e.target.value)}
                                            className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                                            placeholder="Institución Educativa..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Abreviación</label>
                                        <input
                                            type="text"
                                            value={data.abreviacion}
                                            onChange={(e) => setData('abreviacion', e.target.value.toUpperCase())}
                                            maxLength="20"
                                            className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Carácter</label>
                                        <select
                                            value={data.caracter}
                                            onChange={(e) => setData('caracter', e.target.value)}
                                            className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                                        >
                                            <option value="Mixto">Mixto</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Masculino">Masculino</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lema Institucional</label>
                                        <textarea
                                            value={data.lema}
                                            onChange={(e) => setData('lema', e.target.value)}
                                            rows="2"
                                            className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contacto & Ubicación */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 p-8 border border-gray-50">
                                    <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                                        <Phone className="h-6 w-6 mr-3 text-indigo-600" />
                                        Contacto
                                    </h3>
                                    <div className="space-y-4">
                                        <input
                                            type="tel" value={data.telefono}
                                            onChange={e => setData('telefono', e.target.value)}
                                            placeholder="Teléfono Fijo"
                                            className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 font-bold"
                                        />
                                        <input
                                            type="tel" value={data.celular}
                                            onChange={e => setData('celular', e.target.value)}
                                            placeholder="Celular"
                                            className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 font-bold"
                                        />
                                        <input
                                            type="email" value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="Email institucional"
                                            className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 p-8 border border-gray-50">
                                    <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                                        <MapPin className="h-6 w-6 mr-3 text-indigo-600" />
                                        Sede Principal
                                    </h3>
                                    <div className="space-y-4">
                                        <input
                                            type="text" value={data.direccion}
                                            onChange={e => setData('direccion', e.target.value)}
                                            placeholder="Dirección Completa"
                                            className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 font-bold"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text" value={data.ciudad}
                                                onChange={e => setData('ciudad', e.target.value)}
                                                placeholder="Ciudad"
                                                className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 font-bold"
                                            />
                                            <input
                                                type="text" value={data.departamento}
                                                onChange={e => setData('departamento', e.target.value)}
                                                placeholder="Depto."
                                                className="w-full bg-gray-50 border-0 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Guardar */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center space-x-3 bg-indigo-600 text-white px-12 py-5 rounded-[2rem] hover:bg-indigo-700 transition shadow-2xl shadow-indigo-200 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <Check className="h-6 w-6" />
                                    )}
                                    <span className="font-black text-lg">Guardar Configuración Maestra</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
