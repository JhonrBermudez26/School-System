import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { BookOpen, Calendar, Clock, GraduationCap, Printer } from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Horario() {
    const { props } = usePage();
    const {
        estudent_timetable_slots = [],
        time_slots = [],
        estudent_name = '',
        current_year = '',
        can = {}
    } = props;

    const days = useMemo(() => ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'], []);

    const dayLabels = {
        Lunes: 'Lunes',
        Martes: 'Martes',
        Miercoles: 'Miércoles',
        Jueves: 'Jueves',
        Viernes: 'Viernes'
    };

    // Construir grid del horario del estudiante
    const estudentGrid = useMemo(() => {
        const map = {};
        for (const d of days) map[d] = {};
        for (const ts of estudent_timetable_slots) {
            if (!map[ts.day]) map[ts.day] = {};
            map[ts.day][ts.time_slot_id] = ts;
        }
        return map;
    }, [estudent_timetable_slots, days]);

    const hasSchedule = estudent_timetable_slots.length > 0;

    return (
        <Layout title="Mi Horario - Estudiante">
            <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Mi Horario de Clases
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Consulta tu horario semanal y las materias asignadas
                        </p>
                    </div>
                </div>

                {/* Resumen de carga académica */}
                {hasSchedule && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total de Clases</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {estudent_timetable_slots.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-3 rounded-lg">
                                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Grupos Diferentes</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {new Set(estudent_timetable_slots.map(ts => ts.group_id)).size}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Materias Diferentes</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        {new Set(estudent_timetable_slots.map(ts => ts.subject_id)).size}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner del horario */}
                {hasSchedule ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Calendar className="h-6 w-6" />
                                        {/* Título según el rol */}
                                    </h2>
                                    <p className="mt-1 text-sm opacity-90">{/* Nombre */}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                                        Año {current_year || 'Actual'}
                                    </div>
                                    {/* ✅ Botón de impresión */}
                                    {can?.print && (
                                        <button
                                            onClick={() => window.open(route('estudiante.horario.print'), '_blank')}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                            title="Imprimir mi horario"
                                        >
                                            <Printer className="h-5 w-5" />
                                            <span className="hidden sm:inline text-sm font-medium">Imprimir</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {time_slots.map((slot) => {
                                const daySlots = days.map((day) => ({
                                    day,
                                    cell: estudentGrid[day]?.[slot.id],
                                }));

                                return (
                                    <div
                                        key={slot.id}
                                        className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
                                            <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold">
                                                {slot.start_time} - {slot.end_time}
                                            </div>
                                            <Clock className="h-5 w-5 text-gray-500" />
                                        </div>

                                        <div className="grid grid-cols-5 gap-3 text-center">
                                            {daySlots.map(({ day, cell }) => (
                                                <div key={day}>
                                                    <div className="text-xs font-medium text-gray-600 mb-1.5">
                                                        {dayLabels[day]}
                                                    </div>
                                                    {cell ? (
                                                        <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">
                                                            <div className="font-semibold text-blue-800 truncate flex items-center justify-center gap-1">
                                                                <BookOpen className="h-4 w-4" />
                                                                {cell.subject_name || '—'}
                                                            </div>
                                                            <div className="text-xs text-gray-700 mt-1 truncate">
                                                                👨‍🏫 {cell.teacher_name || 'Sin profesor'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-300 text-xl py-4 bg-gray-50 rounded-lg">
                                                            —
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-10 text-center border border-gray-200">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">
                            Sin Horario Asignado
                        </h3>
                        <p className="text-gray-600">
                            Aún no tienes un horario de clases asignado. Por favor, contacta a la secretaría.
                        </p>
                    </div>
                )}

            </div>
        </Layout>
    );
}