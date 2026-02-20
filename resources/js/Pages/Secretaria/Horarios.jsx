import { useMemo, useEffect, useRef } from 'react';
import Layout from '@/Components/Layout/Layout';
import { useForm, usePage, router } from "@inertiajs/react";
import { Users, User, Calendar, ChevronRight, Clock, Printer } from 'lucide-react';

const DAY_LABELS = {
  Lunes: 'Lunes',
  Martes: 'Martes',
  Miercoles: 'Miércoles',
  Jueves: 'Jueves',
  Viernes: 'Viernes',
};

export default function Horarios() {
  const {
    groups = [],
    teachers = [],
    subjects = [],
    time_slots = [],
    timetable_slots = [],
    all_timetable_slots = [],
    teacher_timetable_slots = [],
    available_assignments = [],
    filters = {},
    flash,
    error,
    generation_locked = false,
    current_year,
    can = {},
  } = usePage().props;

  const { data, setData } = useForm({
    group_id: filters.group_id || '',
    mode: filters.mode || 'group',
    teacher_id: filters.teacher_id || '',
  });

  const horarioRef = useRef(null);
  const days = useMemo(() => ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'], []);

  const grid = useMemo(() => {
    const map = {};
    for (const d of days) map[d] = {};
    for (const ts of timetable_slots) {
      if (!map[ts.day]) map[ts.day] = {};
      map[ts.day][ts.time_slot_id] = ts;
    }
    return map;
  }, [timetable_slots, days]);

  const teacherGrid = useMemo(() => {
    const map = {};
    for (const d of days) map[d] = {};
    for (const ts of teacher_timetable_slots) {
      if (!map[ts.day]) map[ts.day] = {};
      map[ts.day][ts.time_slot_id] = ts;
    }
    return map;
  }, [teacher_timetable_slots, days]);

  useEffect(() => {
    const handleNavigate = () => {
      if (horarioRef.current && ((data.mode === 'group' && data.group_id) || (data.mode === 'teacher' && data.teacher_id))) {
        setTimeout(() => horarioRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      }
    };
    document.addEventListener('inertia:navigate', handleNavigate);
    return () => document.removeEventListener('inertia:navigate', handleNavigate);
  }, [data.group_id, data.teacher_id, data.mode]);

  const switchMode = (nextMode) => {
    setData((prev) => ({ ...prev, mode: nextMode, group_id: nextMode === 'group' ? prev.group_id : '', teacher_id: nextMode === 'teacher' ? prev.teacher_id : '' }));
    router.get(route('secretaria.horarios'), { mode: nextMode }, { preserveState: true, replace: true });
  };

  const selectItem = (id, type) => {
    if (type === 'group') {
      setData('group_id', id);
      router.get(route('secretaria.horarios'), { group_id: id, mode: 'group' }, { preserveState: true, replace: true });
    } else {
      setData('teacher_id', id);
      router.get(route('secretaria.horarios'), { teacher_id: id, mode: 'teacher' }, { preserveState: true, replace: true });
    }
  };

  const handlePrint = () => {
    const params = data.mode === 'group' ? { group_id: data.group_id, mode: 'group' } : { teacher_id: data.teacher_id, mode: 'teacher' };
    window.open(route('secretaria.horarios.print', params), '_blank');
  };

  const hasSelection = (data.mode === 'group' && data.group_id) || (data.mode === 'teacher' && data.teacher_id);

  return (
    <Layout title="Gestión de Horarios">
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Horarios Escolares
            </h1>
            <p className="text-gray-600 mt-1">Selecciona un grupo o docente para ver su horario</p>
          </div>
        </div>

        {/* Mensajes */}
        {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl">{error}</div>}
        {flash?.success && <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl">✅ {flash.success}</div>}

        {/* Switch + Tarjetas */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-inner">
              <button
                onClick={() => switchMode('group')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${data.mode === 'group' ? 'bg-white shadow-md text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <Users className="inline h-4 w-4 mr-1.5" />
                Grupos
              </button>
              <button
                onClick={() => switchMode('teacher')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${data.mode === 'teacher' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <User className="inline h-4 w-4 mr-1.5" />
                Docentes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(data.mode === 'group' ? groups : teachers).map((item) => {
              const isSelected =
                (data.mode === 'group' && data.group_id === item.id) ||
                (data.mode === 'teacher' && data.teacher_id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => selectItem(item.id, data.mode)}
                  className={`group relative rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300'
                      : 'bg-white border border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                          {data.mode === 'group' ? item.nombre : `${item.name || ''} ${item.last_name || ''}`}
                        </h3>
                        {data.mode === 'group' && (
                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {item.grade?.nombre || '?'} - {item.course?.nombre || '?'}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-transform ${isSelected ? 'text-blue-600 rotate-90' : 'text-gray-400 group-hover:text-blue-500'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner del horario */}
        {hasSelection && (
          <div ref={horarioRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 mt-8 overflow-hidden scroll-mt-24">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    {data.mode === 'group' ? 'Horario del Grupo' : 'Horario del Docente'}
                  </h2>
                  <p className="mt-1 text-sm opacity-90">
                    {data.mode === 'group'
                      ? groups.find((g) => g.id === data.group_id)?.nombre
                      : `${teachers.find((t) => t.id === data.teacher_id)?.name || ''} ${teachers.find((t) => t.id === data.teacher_id)?.last_name || ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                    Año {current_year || 'Actual'}
                  </div>
                  {can.print && (
                    <button onClick={handlePrint}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2" title="Imprimir horario">
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
                  cell: data.mode === 'group' ? grid[day]?.[slot.id] : teacherGrid[day]?.[slot.id],
                }));
                return (
                  <div key={slot.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <Clock className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="grid grid-cols-5 gap-3 text-center">
                      {daySlots.map(({ day, cell }) => (
                        <div key={day}>
                          <div className="text-xs font-medium text-gray-600 mb-1.5">{DAY_LABELS[day]}</div>
                          {cell ? (
                            <div className="bg-blue-50 p-3 rounded-lg text-sm border border-blue-100 hover:bg-blue-100 transition-colors">
                              <div className="font-semibold text-blue-800 truncate">{cell.subject_name || '—'}</div>
                              <div className="text-xs text-gray-700 mt-1 truncate">
                                {data.mode === 'group'
                                  ? cell.teacher_name ? `${cell.teacher_name} ${cell.teacher_last_name || ''}` : 'Sin docente'
                                  : `Grupo: ${cell.group_name || '—'}`}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-300 text-xl py-4 bg-gray-50 rounded-lg">—</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasSelection && (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-10 text-center border border-gray-200 mt-8">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              {data.mode === 'group' ? 'Selecciona un grupo' : 'Selecciona un docente'}
            </h3>
            <p className="text-gray-600">Haz clic en una tarjeta para ver el horario correspondiente</p>
          </div>
        )}
      </div>
    </Layout>
  );
}