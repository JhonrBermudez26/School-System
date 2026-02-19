import { Head } from '@inertiajs/react';
import { BookOpen, User, Calendar, FileText } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Clases() {
    // Datos de ejemplo - deberás reemplazarlos con datos reales del backend
    const clases = [
        {
            id: 1,
            name: 'Matemáticas',
            code: 'MAT-801',
            teacher: 'Juan Pérez González',
            schedule: 'Lunes y Miércoles 8:00 AM - 10:00 AM',
            promedio: 4.5,
            color: 'blue'
        },
        {
            id: 2,
            name: 'Español',
            code: 'ESP-801',
            teacher: 'Laura Martínez López',
            schedule: 'Martes y Jueves 8:00 AM - 10:00 AM',
            promedio: 4.2,
            color: 'green'
        },
        {
            id: 3,
            name: 'Ciencias Naturales',
            code: 'CIE-801',
            teacher: 'Carlos Rodríguez',
            schedule: 'Lunes y Miércoles 10:00 AM - 12:00 PM',
            promedio: 4.4,
            color: 'purple'
        },
        {
            id: 4,
            name: 'Ciencias Sociales',
            code: 'SOC-801',
            teacher: 'María García',
            schedule: 'Martes y Jueves 10:00 AM - 12:00 PM',
            promedio: 4.3,
            color: 'orange'
        },
    ];

    const getGradeColor = (grade) => {
        if (grade >= 4.5) return 'text-green-600';
        if (grade >= 4.0) return 'text-blue-600';
        if (grade >= 3.5) return 'text-yellow-600';
        if (grade >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const getColorClass = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
        };
        return colors[color] || 'bg-gray-100 text-gray-600';
    };

    return (
        <Layout>
            <Head title="Mis Clases" />

            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Mis Clases</h1>
                    <p className="text-gray-600 mt-2">Asignaturas del periodo actual</p>
                </div>

                {/* Grid de Clases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clases.map((clase) => (
                        <div key={clase.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                            {/* Header de la tarjeta */}
                            <div className={`p-4 rounded-t-lg ${getColorClass(clase.color)} bg-opacity-10`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-lg ${getColorClass(clase.color)}`}>
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{clase.name}</h3>
                                            <p className="text-sm text-gray-600">{clase.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Promedio</p>
                                        <p className={`text-2xl font-bold ${getGradeColor(clase.promedio)}`}>
                                            {clase.promedio.toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido de la tarjeta */}
                            <div className="p-6 space-y-4">
                                {/* Profesor */}
                                <div className="flex items-center space-x-3">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Profesor</p>
                                        <p className="text-sm font-medium text-gray-800">{clase.teacher}</p>
                                    </div>
                                </div>

                                {/* Horario */}
                                <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Horario</p>
                                        <p className="text-sm font-medium text-gray-800">{clase.schedule}</p>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="pt-4 border-t border-gray-200 flex space-x-2">
                                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                                        Ver Contenido
                                    </button>
                                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                                        Ver Notas
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mensaje si no hay clases */}
                {clases.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay clases asignadas</h3>
                        <p className="text-gray-600">Aún no tienes clases registradas para este periodo</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}