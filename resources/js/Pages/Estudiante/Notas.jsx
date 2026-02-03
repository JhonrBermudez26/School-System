import { Head } from '@inertiajs/react';
import { BookOpen, TrendingUp, Award, FileText } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Notas() {
    // Datos de ejemplo - deberás reemplazarlos con datos reales del backend
    const materias = [
        {
            id: 1,
            name: 'Matemáticas',
            code: 'MAT-801',
            notas: [
                { id: 1, nombre: 'Quiz 1', valor: 4.5, porcentaje: 20, fecha: '2025-01-15' },
                { id: 2, nombre: 'Taller 1', valor: 4.8, porcentaje: 15, fecha: '2025-01-22' },
                { id: 3, nombre: 'Parcial', valor: 4.3, porcentaje: 30, fecha: '2025-01-29' },
            ],
            promedio: 4.5
        },
        {
            id: 2,
            name: 'Español',
            code: 'ESP-801',
            notas: [
                { id: 1, nombre: 'Ensayo', valor: 4.2, porcentaje: 25, fecha: '2025-01-18' },
                { id: 2, nombre: 'Lectura Crítica', valor: 4.3, porcentaje: 20, fecha: '2025-01-25' },
            ],
            promedio: 4.2
        },
        {
            id: 3,
            name: 'Ciencias Naturales',
            code: 'CIE-801',
            notas: [
                { id: 1, nombre: 'Laboratorio 1', valor: 4.6, porcentaje: 20, fecha: '2025-01-20' },
                { id: 2, nombre: 'Quiz 1', valor: 4.4, porcentaje: 15, fecha: '2025-01-27' },
                { id: 3, nombre: 'Proyecto', valor: 4.3, porcentaje: 25, fecha: '2025-02-01' },
            ],
            promedio: 4.4
        },
    ];

    const promedioGeneral = 4.3;

    const getGradeColor = (grade) => {
        if (grade >= 4.5) return 'text-green-600';
        if (grade >= 4.0) return 'text-blue-600';
        if (grade >= 3.5) return 'text-yellow-600';
        if (grade >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBg = (grade) => {
        if (grade >= 4.5) return 'bg-green-50 border-green-200';
        if (grade >= 4.0) return 'bg-blue-50 border-blue-200';
        if (grade >= 3.5) return 'bg-yellow-50 border-yellow-200';
        if (grade >= 3.0) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    };

    return (
        <Layout>
            <Head title="Mis Calificaciones" />

            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Mis Calificaciones</h1>
                    <p className="text-gray-600 mt-2">Registro de notas del periodo actual</p>
                </div>

                {/* Promedio General */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm mb-1">Promedio General del Periodo</p>
                            <p className="text-5xl font-bold">{promedioGeneral.toFixed(1)}</p>
                            <p className="text-blue-100 mt-2">
                                {promedioGeneral >= 4.0 ? '¡Excelente desempeño!' : 
                                 promedioGeneral >= 3.5 ? '¡Buen trabajo!' : 
                                 '¡Sigue esforzándote!'}
                            </p>
                        </div>
                        <div className="bg-white bg-opacity-20 p-4 rounded-full">
                            <TrendingUp className="w-12 h-12" />
                        </div>
                    </div>
                </div>

                {/* Notas por Materia */}
                <div className="space-y-6">
                    {materias.map((materia) => (
                        <div key={materia.id} className="bg-white rounded-lg shadow">
                            {/* Header de la materia */}
                            <div className={`p-4 border-b border-gray-200 flex items-center justify-between ${getGradeBg(materia.promedio)}`}>
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{materia.name}</h3>
                                        <p className="text-sm text-gray-600">{materia.code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Promedio</p>
                                    <p className={`text-3xl font-bold ${getGradeColor(materia.promedio)}`}>
                                        {materia.promedio.toFixed(1)}
                                    </p>
                                </div>
                            </div>

                            {/* Tabla de notas */}
                            <div className="p-6">
                                {materia.notas.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">
                                        No hay calificaciones registradas
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Evaluación</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Porcentaje</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Nota</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {materia.notas.map((nota, idx) => (
                                                    <tr 
                                                        key={nota.id} 
                                                        className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                                                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                        }`}
                                                    >
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center space-x-2">
                                                                <FileText className="w-4 h-4 text-gray-400" />
                                                                <span className="font-medium text-gray-800">{nota.nombre}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded">
                                                                {nota.porcentaje}%
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                                                            {formatDate(nota.fecha)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`text-xl font-bold ${getGradeColor(nota.valor)}`}>
                                                                {nota.valor.toFixed(1)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mensaje si no hay materias */}
                {materias.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay calificaciones disponibles</h3>
                        <p className="text-gray-600">Aún no tienes calificaciones registradas para este periodo</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}