import { useMemo, useEffect, useRef, useState } from 'react';
import Layout from '@/Components/Layout/Layout.jsx';
import { useForm, usePage, router } from "@inertiajs/react";
import {
    Users, User, Calendar, ChevronRight, Clock,
    Printer, GripVertical, X, Edit2, AlertCircle, Plus, Search
} from 'lucide-react';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const DAY_LABELS = {
    Lunes: 'Lunes', Martes: 'Martes', Miercoles: 'Miércoles', Jueves: 'Jueves', Viernes: 'Viernes',
};

export default function Horarios() {
    const {
        groups = [], teachers = [], subjects = [], time_slots = [],
        timetable_slots = [], all_timetable_slots = [], teacher_timetable_slots = [],
        available_assignments = [], filters = {}, flash, error,
        generation_locked = false, current_year, can = {},
    } = usePage().props;

    const { data, setData } = useForm({
        group_id: filters.group_id || '',
        mode: filters.mode || 'group',
        teacher_id: filters.teacher_id || '',
    });

    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverCell, setDragOverCell] = useState(null);
    const [addingCell, setAddingCell] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const horarioRef = useRef(null);

    const grid = useMemo(() => {
        const map = {};
        for (const d of DAYS) map[d] = {};
        for (const ts of timetable_slots) {
            if (!map[ts.day]) map[ts.day] = {};
            map[ts.day][ts.time_slot_id] = ts;
        }
        return map;
    }, [timetable_slots]);

    const teacherGrid = useMemo(() => {
        const map = {};
        for (const d of DAYS) map[d] = {};
        for (const ts of teacher_timetable_slots) {
            if (!map[ts.day]) map[ts.day] = {};
            map[ts.day][ts.time_slot_id] = ts;
        }
        return map;
    }, [teacher_timetable_slots]);

    const occupiedSlots = useMemo(() => {
        const occupied = { byTeacher: {}, byGroup: {} };
        for (const slot of all_timetable_slots) {
            if (slot.user_id) {
                if (!occupied.byTeacher[slot.day]) occupied.byTeacher[slot.day] = {};
                if (!occupied.byTeacher[slot.day][slot.time_slot_id]) occupied.byTeacher[slot.day][slot.time_slot_id] = new Set();
                occupied.byTeacher[slot.day][slot.time_slot_id].add(slot.user_id);
            }
            if (slot.group_id) {
                if (!occupied.byGroup[slot.day]) occupied.byGroup[slot.day] = {};
                if (!occupied.byGroup[slot.day][slot.time_slot_id]) occupied.byGroup[slot.day][slot.time_slot_id] = new Set();
                occupied.byGroup[slot.day][slot.time_slot_id].add(slot.group_id);
            }
        }
        return occupied;
    }, [all_timetable_slots]);

    const isSlotAvailable = (day, timeSlotId, teacherId, excludeCurrentGroup = false) => {
        const teacherBusy = occupiedSlots.byTeacher[day]?.[timeSlotId]?.has(teacherId);
        let groupBusy = false;
        if (!excludeCurrentGroup && data.group_id) {
            groupBusy = occupiedSlots.byGroup[day]?.[timeSlotId]?.has(parseInt(data.group_id));
        }
        return !teacherBusy && !groupBusy;
    };

    const getAvailableSubjectsForSlot = (day, timeSlotId, currentSubjectId = null) => {
        if (!available_assignments || available_assignments.length === 0) return [];
        return available_assignments.filter(assignment => {
            if (currentSubjectId && assignment.subject_id === currentSubjectId) return true;
            return isSlotAvailable(day, timeSlotId, assignment.user_id, true);
        });
    };

    const filteredSubjects = useMemo(() => {
        let list = [];
        if (addingCell) list = getAvailableSubjectsForSlot(addingCell.day, addingCell.timeSlotId);
        else if (editingCell) list = getAvailableSubjectsForSlot(editingCell.day, editingCell.timeSlotId, editingCell.subject_id);
        if (searchTerm && list.length > 0) return list.filter(a => a.subject_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return list;
    }, [available_assignments, searchTerm, addingCell, editingCell, occupiedSlots]);

    const canDropHere = (day, timeSlotId) => {
        if (!draggedItem) return false;
        const teacherId = draggedItem.cell?.user_id;
        if (!teacherId) return false;
        return isSlotAvailable(day, timeSlotId, teacherId, true);
    };

    useEffect(() => {
        const handleNavigate = () => {
            if (horarioRef.current && ((data.mode === 'group' && data.group_id) || (data.mode === 'teacher' && data.teacher_id))) {
                setTimeout(() => { horarioRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
            }
        };
        document.addEventListener('inertia:navigate', handleNavigate);
        return () => document.removeEventListener('inertia:navigate', handleNavigate);
    }, [data.group_id, data.teacher_id, data.mode]);

    const switchMode = (nextMode) => {
        setAddingCell(null); setEditingCell(null); setSearchTerm('');
        setDraggedItem(null); setDragOverCell(null);
        setData(prev => ({ ...prev, mode: nextMode, group_id: nextMode === 'group' ? prev.group_id : '', teacher_id: nextMode === 'teacher' ? prev.teacher_id : '' }));
        router.get(route('coordinadora.horarios'), { mode: nextMode }, { preserveState: true, replace: true });
    };

    const selectItem = (id, type) => {
        setAddingCell(null); setEditingCell(null); setSearchTerm('');
        setDraggedItem(null); setDragOverCell(null);
        if (type === 'group') {
            setData('group_id', id);
            router.get(route('coordinadora.horarios'), { group_id: id, mode: 'group' }, { preserveState: true, replace: true });
        } else {
            setData('teacher_id', id);
            router.get(route('coordinadora.horarios'), { teacher_id: id, mode: 'teacher' }, { preserveState: true, replace: true });
        }
    };

    const handlePrint = () => {
        const params = data.mode === 'group' ? { group_id: data.group_id, mode: 'group' } : { teacher_id: data.teacher_id, mode: 'teacher' };
        window.open(route('coordinadora.horarios.print', params), '_blank');
    };

    const handleAddClick = (day, timeSlotId) => {
        if (!can.create || data.mode !== 'group') return;
        if (grid[day]?.[timeSlotId]) return;
        setEditingCell(null); setAddingCell({ day, timeSlotId }); setSearchTerm('');
    };

    const handleAddSubject = async (subjectId, userId) => {
        if (!addingCell) return;
        setIsLoading(true);
        await router.post(route('coordinadora.horarios.add-slot'), {
            group_id: data.group_id, day: addingCell.day,
            time_slot_id: addingCell.timeSlotId, subject_id: subjectId, user_id: userId,
        }, {
            preserveState: false, preserveScroll: true,
            onSuccess: () => { setAddingCell(null); setSearchTerm(''); },
            onFinish: () => setIsLoading(false),
        });
    };

    const handleDragStart = (e, day, timeSlotId, cell) => {
        if (!can.update || data.mode !== 'group') return;
        setDraggedItem({ day, timeSlotId, cell });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, day, timeSlotId) => {
        if (!can.update || data.mode !== 'group') return;
        e.preventDefault();
        if (canDropHere(day, timeSlotId)) { e.dataTransfer.dropEffect = 'move'; setDragOverCell({ day, timeSlotId }); }
        else { e.dataTransfer.dropEffect = 'none'; setDragOverCell(null); }
    };

    const handleDragLeave = () => setDragOverCell(null);

    const handleDrop = async (e, targetDay, targetTimeSlotId) => {
        e.preventDefault();
        if (!draggedItem || !can.update || data.mode !== 'group') return;
        const { day: sourceDay, timeSlotId: sourceTimeSlotId } = draggedItem;
        if (sourceDay === targetDay && sourceTimeSlotId === targetTimeSlotId) { setDraggedItem(null); setDragOverCell(null); return; }
        if (!canDropHere(targetDay, targetTimeSlotId)) {
            alert('⚠️ No se puede mover aquí: el profesor o el grupo ya tienen clase en este horario');
            setDraggedItem(null); setDragOverCell(null); return;
        }
        setIsLoading(true);
        await router.post(route('coordinadora.horarios.move'), {
            group_id: data.group_id, source_day: sourceDay, source_time_slot_id: sourceTimeSlotId,
            target_day: targetDay, target_time_slot_id: targetTimeSlotId,
        }, {
            preserveState: false, preserveScroll: true,
            onSuccess: () => { setDraggedItem(null); setDragOverCell(null); },
            onFinish: () => setIsLoading(false),
        });
    };

    const handleDragEnd = () => { setDraggedItem(null); setDragOverCell(null); };

    const handleEditSlot = (day, timeSlotId, cell) => {
        if (!can.update || data.mode !== 'group') return;
        setAddingCell(null); setEditingCell({ day, timeSlotId, subject_id: cell.subject_id }); setSearchTerm('');
    };

    const handleChangeSubject = async (newSubjectId) => {
        if (!editingCell) return;
        const assignment = available_assignments.find(a => a.subject_id === newSubjectId);
        if (!assignment) { alert('No hay profesor asignado a esta asignatura en este grupo'); return; }
        setIsLoading(true);
        await router.put(route('coordinadora.horarios.update-slot'), {
            group_id: data.group_id, day: editingCell.day,
            time_slot_id: editingCell.timeSlotId, subject_id: newSubjectId, user_id: assignment.user_id,
        }, {
            preserveState: false, preserveScroll: true,
            onSuccess: () => { setEditingCell(null); setSearchTerm(''); },
            onFinish: () => setIsLoading(false),
        });
    };

    const handleDeleteSlot = async (day, timeSlotId) => {
        if (!can.delete || data.mode !== 'group') return;
        if (!confirm('¿Estás seguro de eliminar esta clase del horario?')) return;
        setIsLoading(true);
        await router.delete(route('coordinadora.horarios.delete-slot'), {
            data: { group_id: data.group_id, day, time_slot_id: timeSlotId },
            preserveState: false, preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const hasSelection = (data.mode === 'group' && data.group_id) || (data.mode === 'teacher' && data.teacher_id);

    return (
        <Layout title="Gestión de Horarios">
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Horarios Escolares
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {can.update && data.mode === 'group'
                                ? 'Haz clic en celdas vacías para agregar, arrastra para reorganizar'
                                : 'Selecciona un grupo o docente para ver su horario'}
                        </p>
                    </div>
                </div>

                {/* Mensajes */}
                {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /><span>{error}</span>
                    </div>
                )}
                {flash?.success && (
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl">✅ {flash.success}</div>
                )}
                {flash?.error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /><span>{flash.error}</span>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-white rounded-xl p-6 shadow-2xl text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto" />
                            <p className="mt-4 text-gray-700 font-medium">Actualizando horario...</p>
                        </div>
                    </div>
                )}

                {/* Generación automática */}
                {can.create && (
                    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Generación Automática
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                disabled={generation_locked || isLoading}
                                onClick={() => {
                                    if (confirm('¿Generar horarios para todos los grupos?')) {
                                        router.post(route('coordinadora.horarios.generate'), { reset: true });
                                    }
                                }}
                                className={`px-5 py-2.5 rounded-lg font-medium text-sm shadow transition-all hover:scale-105 ${
                                    generation_locked || isLoading
                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                }`}
                            >
                                Generar Todos
                            </button>
                            <button
                                disabled={isLoading}
                                onClick={() => {
                                    if (confirm('⚠️ ¿Regenerar TODOS los horarios? Se perderán los cambios manuales.')) {
                                        router.post(route('coordinadora.horarios.generate'), { reset: true, force: true });
                                    }
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium text-sm shadow hover:from-orange-600 hover:to-amber-700 transition-all hover:scale-105 disabled:opacity-50"
                            >
                                Regenerar
                            </button>
                        </div>
                    </div>
                )}

                {/* Switch + Tarjetas */}
                <div className="space-y-5">
                    <div className="flex justify-center">
                        <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-inner">
                            <button
                                onClick={() => switchMode('group')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                                    data.mode === 'group' ? 'bg-white shadow-md text-blue-700' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <Users className="h-4 w-4" /> Grupos
                            </button>
                            <button
                                onClick={() => switchMode('teacher')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                                    data.mode === 'teacher' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <User className="h-4 w-4" /> Docentes
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
                                                <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                    {data.mode === 'group'
                                                        ? item.nombre
                                                        : `${item.name || ''} ${item.last_name || ''}`}
                                                </h3>
                                                {data.mode === 'group' && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {item.grade?.nombre || '?'} – {item.course?.nombre || '?'}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-transform ${
                                                isSelected ? 'text-blue-600 rotate-90' : 'text-gray-400 group-hover:text-blue-500'
                                            }`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabla del horario */}
                {hasSelection && (
                    <div ref={horarioRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden scroll-mt-24">
                        {/* Banner */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Calendar className="h-6 w-6" />
                                        {data.mode === 'group' ? 'Horario del Grupo' : 'Horario del Docente'}
                                    </h2>
                                    <p className="mt-1 text-sm opacity-90">
                                        {data.mode === 'group'
                                            ? groups.find(g => g.id === data.group_id)?.nombre
                                            : `${teachers.find(t => t.id === data.teacher_id)?.name || ''} ${teachers.find(t => t.id === data.teacher_id)?.last_name || ''}`}
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

                        {/* Cuerpo */}
                        <div className="p-5 space-y-5">
                            {time_slots.map((slot) => {
                                const daySlots = DAYS.map(day => ({
                                    day,
                                    cell: data.mode === 'group' ? grid[day]?.[slot.id] : teacherGrid[day]?.[slot.id],
                                }));
                                return (
                                    <div key={slot.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
                                            <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold">
                                                {slot.start_time} – {slot.end_time}
                                            </div>
                                            <Clock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div className="grid grid-cols-5 gap-3 text-center">
                                            {daySlots.map(({ day, cell }) => {
                                                const isAdding = addingCell?.day === day && addingCell?.timeSlotId === slot.id;
                                                const isEditing = editingCell?.day === day && editingCell?.timeSlotId === slot.id;
                                                const isDragOver = dragOverCell?.day === day && dragOverCell?.timeSlotId === slot.id;
                                                const isDragging = draggedItem?.day === day && draggedItem?.timeSlotId === slot.id;

                                                return (
                                                    <div
                                                        key={day}
                                                        onDragOver={(e) => handleDragOver(e, day, slot.id)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, day, slot.id)}
                                                        className={`min-h-[100px] transition-all ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 scale-105 rounded-lg' : ''}`}
                                                    >
                                                        <div className="text-xs font-medium text-gray-500 mb-1.5">{DAY_LABELS[day]}</div>

                                                        {isAdding ? (
                                                            <div className="bg-indigo-50 p-2 rounded-lg border-2 border-indigo-400 max-h-60 overflow-y-auto">
                                                                <div className="relative mb-2">
                                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <input type="text" placeholder="Buscar..." value={searchTerm}
                                                                        onChange={e => setSearchTerm(e.target.value)}
                                                                        className="w-full text-xs px-6 py-1 border rounded" autoFocus />
                                                                </div>
                                                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                                                    {filteredSubjects.length > 0 ? filteredSubjects.map(asg => (
                                                                        <button key={asg.subject_id} onClick={() => handleAddSubject(asg.subject_id, asg.user_id)}
                                                                            className="w-full text-left px-2 py-1 text-xs bg-white hover:bg-indigo-100 rounded border border-indigo-200 transition-colors">
                                                                            <div className="font-semibold truncate">{asg.subject_name}</div>
                                                                            <div className="text-gray-500 text-[10px] truncate">{asg.teacher_name} {asg.teacher_last_name}</div>
                                                                        </button>
                                                                    )) : (
                                                                        <p className="text-xs text-gray-500 py-2">
                                                                            {available_assignments.length === 0 ? 'No hay asignaturas asignadas' : 'No hay profesores disponibles'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button onClick={() => { setAddingCell(null); setSearchTerm(''); }}
                                                                    className="mt-2 w-full bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500">
                                                                    <X className="h-3 w-3 inline mr-1" /> Cancelar
                                                                </button>
                                                            </div>
                                                        ) : isEditing ? (
                                                            <div className="bg-blue-50 p-2 rounded-lg border-2 border-blue-400 max-h-60 overflow-y-auto">
                                                                <div className="relative mb-2">
                                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                    <input type="text" placeholder="Buscar..." value={searchTerm}
                                                                        onChange={e => setSearchTerm(e.target.value)}
                                                                        className="w-full text-xs px-6 py-1 border rounded" autoFocus />
                                                                </div>
                                                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                                                    {filteredSubjects.length > 0 ? filteredSubjects.map(asg => (
                                                                        <button key={asg.subject_id} onClick={() => handleChangeSubject(asg.subject_id)}
                                                                            className={`w-full text-left px-2 py-1 text-xs rounded border transition-colors ${
                                                                                asg.subject_id === editingCell.subject_id
                                                                                    ? 'bg-blue-200 border-blue-400 font-semibold'
                                                                                    : 'bg-white hover:bg-blue-100 border-blue-200'
                                                                            }`}>
                                                                            <div className="font-semibold truncate">{asg.subject_name}</div>
                                                                            <div className="text-gray-500 text-[10px] truncate">{asg.teacher_name} {asg.teacher_last_name}</div>
                                                                        </button>
                                                                    )) : (
                                                                        <p className="text-xs text-gray-500 py-2">No hay profesores disponibles</p>
                                                                    )}
                                                                </div>
                                                                <button onClick={() => { setEditingCell(null); setSearchTerm(''); }}
                                                                    className="mt-2 w-full bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500">
                                                                    <X className="h-3 w-3 inline mr-1" /> Cancelar
                                                                </button>
                                                            </div>
                                                        ) : cell ? (
                                                            <div
                                                                draggable={can.update && data.mode === 'group'}
                                                                onDragStart={(e) => handleDragStart(e, day, slot.id, cell)}
                                                                onDragEnd={handleDragEnd}
                                                                className={`group/cell relative bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm transition-all ${
                                                                    can.update && data.mode === 'group' ? 'cursor-move hover:shadow-lg hover:scale-105' : ''
                                                                } ${isDragging ? 'opacity-40' : ''}`}
                                                            >
                                                                {can.update && data.mode === 'group' && (
                                                                    <GripVertical className="absolute top-1 left-1 h-4 w-4 text-gray-400 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                                                )}
                                                                <div className="font-semibold text-blue-800 truncate text-xs">{cell.subject_name || '—'}</div>
                                                                <div className="text-[10px] text-gray-600 mt-1 truncate">
                                                                    {data.mode === 'group'
                                                                        ? cell.teacher_name ? `${cell.teacher_name} ${cell.teacher_last_name || ''}` : 'Sin docente'
                                                                        : `Grupo: ${cell.group_name || '—'}`}
                                                                </div>
                                                                {can.update && can.delete && data.mode === 'group' && (
                                                                    <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity flex gap-1">
                                                                        <button onClick={(e) => { e.stopPropagation(); handleEditSlot(day, slot.id, cell); }}
                                                                            className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600" title="Cambiar asignatura">
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(day, slot.id); }}
                                                                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600" title="Eliminar">
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAddClick(day, slot.id)}
                                                                disabled={!can.create || data.mode !== 'group'}
                                                                className={`w-full h-full text-gray-300 text-xl py-4 rounded-lg transition-all ${
                                                                    can.create && data.mode === 'group'
                                                                        ? 'hover:bg-indigo-50 hover:text-indigo-400 hover:border-2 hover:border-dashed hover:border-indigo-300 cursor-pointer group/add'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {can.create && data.mode === 'group'
                                                                    ? <Plus className="h-6 w-6 mx-auto opacity-0 group-hover/add:opacity-100 transition-opacity" />
                                                                    : '—'}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!hasSelection && (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg p-10 text-center border border-gray-200">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">
                            {data.mode === 'group' ? 'Selecciona un grupo' : 'Selecciona un docente'}
                        </h3>
                        <p className="text-gray-500">Haz clic en una tarjeta para ver el horario correspondiente</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}