import { useMemo } from 'react';
import Layout from '@/Components/Layout/Layout';
import { useForm, usePage, router } from "@inertiajs/react";

export default function Horarios() {
    const { auth, groups = [], teachers = [], time_slots = [], timetable_slots = [], teacher_timetable_slots = [], filters = {}, flash, error, generation_locked = false, current_year } = usePage().props;

    const { data, setData } = useForm({
        group_id: filters.group_id || '',
        mode: filters.mode || 'group',
        teacher_id: filters.teacher_id || '',
    });

    const days = useMemo(() => ['Lunes','Martes','Miercoles','Jueves','Viernes'], []);

    // Construir mapa grupo: map[day][time_slot_id] = slot info
    const grid = useMemo(() => {
        const map = {};
        for (const d of days) map[d] = {};
        for (const ts of timetable_slots) {
            if (!map[ts.day]) map[ts.day] = {};
            map[ts.day][ts.time_slot_id] = ts;
        }
        return map;
    }, [timetable_slots, days]);

    // Construir mapa docente: map[day][time_slot_id] = { subject_name, group_name }
    const teacherGrid = useMemo(() => {
        const map = {};
        for (const d of days) map[d] = {};
        for (const ts of teacher_timetable_slots) {
            if (!map[ts.day]) map[ts.day] = {};
            map[ts.day][ts.time_slot_id] = ts;
        }
        return map;
    }, [teacher_timetable_slots, days]);

    const onChangeGroup = (e) => {
        const value = e.target.value;
        setData('group_id', value);
        router.get(route('secretaria.horarios'), { group_id: value, mode: 'group' }, { preserveState: true, replace: true });
    };

    const onChangeTeacher = (e) => {
        const value = e.target.value;
        setData('teacher_id', value);
        router.get(route('secretaria.horarios'), { teacher_id: value, mode: 'teacher' }, { preserveState: true, replace: true });
    };

    const switchMode = (nextMode) => {
        setData('mode', nextMode);
        if (nextMode === 'group') {
            router.get(route('secretaria.horarios'), { mode: 'group', group_id: data.group_id || '' }, { preserveState: true, replace: true });
        } else {
            router.get(route('secretaria.horarios'), { mode: 'teacher', teacher_id: data.teacher_id || '' }, { preserveState: true, replace: true });
        }
    };

    // no-op form submit (eliminado)

    return (
        <Layout title="Gestionar Horarios">
            <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestionar Horarios</h1>
                        <p className="text-gray-600 mt-2">Genera y consulta los horarios por grupo</p>
                    </div>
                </div>

                {/* Flash / Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>
                )}
                {flash?.success && (
                    <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">✅ {flash.success}</div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">❌ {flash.error}</div>
                )}

                {/* Generación automática */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Generación automática</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => router.post(route('horarios.generate'), { reset: true }, { preserveScroll: true })}
                            className={`px-6 py-2 rounded-lg transition font-medium shadow-md ${generation_locked ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            disabled={generation_locked}
                            title={generation_locked ? `Ya hay horarios generados en ${current_year}. Usa Regenerar si es necesario.` : ''}
                        >
                            Generar horarios para todos los grupos
                        </button>

                        <button
                            onClick={() => router.post(route('horarios.generate'), { reset: true, force: true }, { preserveScroll: true })}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium shadow-sm"
                            title="Forzar regeneración en caso de emergencia"
                        >
                            Regenerar
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Se generarán con base en las asignaciones (subject_group) y las franjas de Time Slots. {generation_locked && current_year ? `(Generación bloqueada en ${current_year}. Puedes usar Regenerar para forzar)` : ''}</p>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
                    {/* Switch visual Grupo/Docente */}
                    <div className="mb-4">
                        <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1 select-none shadow-inner">
                            {/* Indicator */}
                            <span
                                className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow transition-all duration-300 ease-out ${data.mode === 'group' ? 'left-1' : 'left-1/2'}`}
                                aria-hidden="true"
                            />
                            {/* Opciones */}
                            <button
                                type="button"
                                onClick={() => switchMode('group')}
                                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors ${data.mode === 'group' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
                                aria-pressed={data.mode === 'group'}
                                aria-label="Ver por Grupo"
                            >
                                Grupo
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('teacher')}
                                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors ${data.mode === 'teacher' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
                                aria-pressed={data.mode === 'teacher'}
                                aria-label="Ver por Docente"
                            >
                                Docente
                            </button>
                        </div>
                    </div>

                    {data.mode === 'group' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    value={data.group_id || ''}
                                    onChange={onChangeGroup}
                                >
                                    <option value="">Selecciona un grupo</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.nombre} ({g.grade?.nombre}-{g.course?.nombre})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {data.mode === 'teacher' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    value={data.teacher_id || ''}
                                    onChange={onChangeTeacher}
                                >
                                    <option value="">Selecciona un docente</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} {t.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grilla de horario por Grupo */}
                {data.mode === 'group' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franja</th>
                                    {days.map(day => (
                                        <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {!data.group_id && (
                                    <tr>
                                        <td colSpan={1 + days.length} className="px-6 py-10 text-center text-gray-500">Selecciona un grupo para ver su horario generado.</td>
                                    </tr>
                                )}
                                {data.group_id && time_slots.map(slot => (
                                    <tr key={slot.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-800">{slot.start_time} - {slot.end_time}</td>
                                        {days.map(day => {
                                            const cell = grid[day]?.[slot.id];
                                            return (
                                                <td key={day} className="px-6 py-3 align-top">
                                                    {cell ? (
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{cell.subject_name || '-'}</div>
                                                            <div className="text-gray-600">{cell.teacher_name ? `${cell.teacher_name} ${cell.teacher_last_name}` : '-'}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}

                {/* Grilla de horario por Docente */}
                {data.mode === 'teacher' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franja</th>
                                    {days.map(day => (
                                        <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {!data.teacher_id && (
                                    <tr>
                                        <td colSpan={1 + days.length} className="px-6 py-10 text-center text-gray-500">Selecciona un docente para ver su horario.</td>
                                    </tr>
                                )}
                                {data.teacher_id && time_slots.map(slot => (
                                    <tr key={slot.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-800">{slot.start_time} - {slot.end_time}</td>
                                        {days.map(day => {
                                            const cell = teacherGrid[day]?.[slot.id];
                                            return (
                                                <td key={day} className="px-6 py-3 align-top">
                                                    {cell ? (
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{cell.subject_name || '-'}</div>
                                                            <div className="text-gray-600">Grupo: {cell.group_name || '-'}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>
        </Layout>
    );
}
