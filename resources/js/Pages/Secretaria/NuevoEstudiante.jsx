import { Head, useForm } from '@inertiajs/react';
import { Save, X, User, Mail, Phone, MapPin, Calendar, BookOpen } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function NuevoEstudiante() {
    const { data, setData, post, processing, errors } = useForm({
        // Información Personal
        nombre: '',
        apellido: '',
        documento: '',
        tipo_documento: 'TI',
        fecha_nacimiento: '',
        genero: '',
        
        // Información de Contacto
        direccion: '',
        ciudad: 'Bogotá',
        telefono: '',
        email: '',
        
        // Información del Acudiente
        nombre_acudiente: '',
        telefono_acudiente: '',
        email_acudiente: '',
        parentesco: 'Padre/Madre',
        
        // Información Académica
        grado: '',
        grupo: 'A'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/secretaria/nuevo/estudiante/crear', {
            onSuccess: () => {
                alert('Estudiante registrado correctamente');
                // Opcionalmente redirigir a la lista de estudiantes
                // router.visit('/secretaria/estudiantes');
            },
            onError: () => {
                alert('Error al registrar estudiante. Por favor verifica los datos.');
            }
        });
    };

    return (
        <Layout title="Nuevo Estudiante - Secretaria">            
            <div>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Estudiante</h1>
                    <p className="text-gray-600 mt-2">Complete la información del estudiante</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Información Personal */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <User className="h-5 w-5 mr-2 text-green-600" />
                            Información Personal
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre}
                                    onChange={(e) => setData('nombre', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    value={data.apellido}
                                    onChange={(e) => setData('apellido', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Documento *
                                </label>
                                <select
                                    value={data.tipo_documento}
                                    onChange={(e) => setData('tipo_documento', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="TI">Tarjeta de Identidad</option>
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="RC">Registro Civil</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                </select>
                                {errors.tipo_documento && <p className="text-red-500 text-sm mt-1">{errors.tipo_documento}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de Documento *
                                </label>
                                <input
                                    type="text"
                                    value={data.documento}
                                    onChange={(e) => setData('documento', e.target.value)}
                                    placeholder="Ej: 1234567890"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.documento && <p className="text-red-500 text-sm mt-1">{errors.documento}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="inline h-4 w-4 mr-1" />
                                    Fecha de Nacimiento *
                                </label>
                                <input
                                    type="date"
                                    value={data.fecha_nacimiento}
                                    onChange={(e) => setData('fecha_nacimiento', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.fecha_nacimiento && <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Género *
                                </label>
                                <select
                                    value={data.genero}
                                    onChange={(e) => setData('genero', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                                {errors.genero && <p className="text-red-500 text-sm mt-1">{errors.genero}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Información de Contacto */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-green-600" />
                            Información de Contacto
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dirección *
                                </label>
                                <input
                                    type="text"
                                    value={data.direccion}
                                    onChange={(e) => setData('direccion', e.target.value)}
                                    placeholder="Ej: Calle 123 #45-67"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ciudad *
                                </label>
                                <input
                                    type="text"
                                    value={data.ciudad}
                                    onChange={(e) => setData('ciudad', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="inline h-4 w-4 mr-1" />
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={data.telefono}
                                    onChange={(e) => setData('telefono', e.target.value)}
                                    placeholder="+57 300 123 4567"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="inline h-4 w-4 mr-1" />
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="estudiante@ejemplo.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Información del Acudiente */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <User className="h-5 w-5 mr-2 text-green-600" />
                            Información del Acudiente
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre Completo del Acudiente *
                                </label>
                                <input
                                    type="text"
                                    value={data.nombre_acudiente}
                                    onChange={(e) => setData('nombre_acudiente', e.target.value)}
                                    placeholder="Ej: María Pérez"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.nombre_acudiente && <p className="text-red-500 text-sm mt-1">{errors.nombre_acudiente}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Parentesco *
                                </label>
                                <select
                                    value={data.parentesco}
                                    onChange={(e) => setData('parentesco', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="Padre/Madre">Padre/Madre</option>
                                    <option value="Abuelo/a">Abuelo/a</option>
                                    <option value="Tío/a">Tío/a</option>
                                    <option value="Hermano/a">Hermano/a</option>
                                    <option value="Tutor Legal">Tutor Legal</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                {errors.parentesco && <p className="text-red-500 text-sm mt-1">{errors.parentesco}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="inline h-4 w-4 mr-1" />
                                    Teléfono del Acudiente *
                                </label>
                                <input
                                    type="tel"
                                    value={data.telefono_acudiente}
                                    onChange={(e) => setData('telefono_acudiente', e.target.value)}
                                    placeholder="+57 300 123 4567"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                                {errors.telefono_acudiente && <p className="text-red-500 text-sm mt-1">{errors.telefono_acudiente}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="inline h-4 w-4 mr-1" />
                                    Correo del Acudiente
                                </label>
                                <input
                                    type="email"
                                    value={data.email_acudiente}
                                    onChange={(e) => setData('email_acudiente', e.target.value)}
                                    placeholder="acudiente@ejemplo.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                {errors.email_acudiente && <p className="text-red-500 text-sm mt-1">{errors.email_acudiente}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Información Académica */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                            Información Académica
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grado *
                                </label>
                                <select
                                    value={data.grado}
                                    onChange={(e) => setData('grado', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="1">Primero</option>
                                    <option value="2">Segundo</option>
                                    <option value="3">Tercero</option>
                                    <option value="4">Cuarto</option>
                                    <option value="5">Quinto</option>
                                    <option value="6">Sexto</option>
                                    <option value="7">Séptimo</option>
                                    <option value="8">Octavo</option>
                                    <option value="9">Noveno</option>
                                    <option value="10">Décimo</option>
                                    <option value="11">Once</option>
                                </select>
                                {errors.grado && <p className="text-red-500 text-sm mt-1">{errors.grado}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grupo *
                                </label>
                                <select
                                    value={data.grupo}
                                    onChange={(e) => setData('grupo', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                                {errors.grupo && <p className="text-red-500 text-sm mt-1">{errors.grupo}</p>}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                                <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-900">Información Importante</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Asegúrate de verificar toda la información antes de guardar. Una vez creado el estudiante, podrás editar sus datos desde la sección de gestión de estudiantes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mb-8">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            <X className="h-5 w-5" />
                            <span>Cancelar</span>
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 shadow-md"
                        >
                            <Save className="h-5 w-5" />
                            <span>{processing ? 'Guardando...' : 'Registrar Estudiante'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}