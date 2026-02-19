import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';
import { BookOpen, Users, ArrowRight, GraduationCap, Calendar, User } from 'lucide-react';

export default function Index() {
    const { props } = usePage();
    const { asignaciones = [] } = props;

    const openClass = (subject_id, group_id) => {
        router.visit(route('estudiante.clases.show', { subject_id, group_id }));
    };

    return (
        <Layout>
            <Head title="Mis Clases" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 -m-6 sm:-m-8 p-6 sm:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <GraduationCap className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Mis Clases</h1>
                                <p className="text-gray-600 text-sm sm:text-base mt-1">
                                    Accede a tus asignaturas y actividades
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grid de clases */}
                    {asignaciones.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-12 sm:p-16 text-center border border-gray-100">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                                No hay clases asignadas
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                Cuando tengas clases asignadas, aparecerán aquí para que puedas acceder a ellas
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {asignaciones.map((clase, idx) => (
                                <div
                                    key={`${clase.subject_id}-${clase.group_id}-${idx}`}
                                    onClick={() => openClass(clase.subject_id, clase.group_id)}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
                                >
                                    {/* Header con gradiente */}
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/10 transform -skew-y-3 origin-top-right"></div>

                                        <div className="relative">
                                            <div className="flex items-center justify-between text-white mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                                        <BookOpen className="h-4 w-4 text-white" />
                                                    </div>
                                                    <span className="text-sm font-semibold tracking-wide">
                                                        {clase.subject_code || 'CURSO'}
                                                    </span>
                                                </div>
                                                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300" />
                                            </div>

                                            <h3 className="text-xl font-bold text-white line-clamp-2 mb-1">
                                                {clase.subject_name}
                                            </h3>
                                            <p className="text-blue-100 text-sm">Grupo {clase.group_name}</p>
                                        </div>
                                    </div>

                                    {/* Contenido */}
                                    <div className="p-5">
                                        {/* Información del profesor */}
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500 font-medium">Profesor</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {clase.teacher_name || 'No asignado'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botón de acción */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openClass(clase.subject_id, clase.group_id);
                                            }}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                        bg-gradient-to-r from-blue-500 to-blue-600 
                        text-white font-semibold 
                        hover:from-blue-600 hover:to-blue-700 
                        transform hover:scale-[1.02] active:scale-[0.98]
                        transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            Ver clase
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Efecto hover en el borde */}
                                    <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}