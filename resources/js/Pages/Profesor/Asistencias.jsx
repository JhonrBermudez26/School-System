import { useState, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
    Calendar, 
    Users, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertCircle,
    Save,
    History,
    FileText,
    Eye,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Asistencias() {
    const { props } = usePage();
    const { 
        asignaciones = [], 
        estudiantes = [], 
        selectedClass = null,
        classDates = [],
        attendanceHistory = [],
        currentPeriod = null,
        filters,
        error 
    } = props;

    const [selectedSubject, setSelectedSubject] = useState(filters?.subject_id || '');
    const [selectedGroup, setSelectedGroup] = useState(filters?.group_id || '');
    const [selectedDate, setSelectedDate] = useState(filters?.date || '');
    const [currentView, setCurrentView] = useState(filters?.view || 'register');
    const [attendanceData, setAttendanceData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});

    // Inicializar datos de asistencia
    useEffect(() => {
        const initial = {};
        estudiantes.forEach(est => {
            initial[est.id] = {
                status: est.status || 'absent',
                notes: est.notes || ''
            };
        });
        setAttendanceData(initial);
    }, [estudiantes]);

    // Grupos disponibles para la materia seleccionada
    const availableGroups = useMemo(() => {
        if (!selectedSubject) return [];
        return asignaciones.filter(a => a.subject_id === parseInt(selectedSubject));
    }, [selectedSubject, asignaciones]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        if (estudiantes.length === 0) return null;
        
        const statusCounts = estudiantes.reduce((acc, est) => {
            const status = attendanceData[est.id]?.status || est.status || 'absent';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return {
            total: estudiantes.length,
            present: statusCounts.present || 0,
            absent: statusCounts.absent || 0,
            late: statusCounts.late || 0,
            excused: statusCounts.excused || 0,
        };
    }, [estudiantes, attendanceData]);

    const handleSubjectChange = (e) => {
        const subjectId = e.target.value;
        setSelectedSubject(subjectId);
        setSelectedGroup('');
        setSelectedDate('');
    };

    const handleGroupChange = (e) => {
        const groupId = e.target.value;
        setSelectedGroup(groupId);
        setSelectedDate('');
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
        loadData(view);
    };

    const loadData = (view = currentView) => {
        if (!selectedSubject || !selectedGroup) {
            alert('Selecciona una materia y un grupo');
            return;
        }

        const params = {
            subject_id: selectedSubject,
            group_id: selectedGroup,
            view: view,
        };

        if (view === 'register' && selectedDate) {
            params.date = selectedDate;
        }

        router.get(route('profesor.asistencias'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const loadAttendanceForDate = (date) => {
        setSelectedDate(date);
        router.get(
            route('profesor.asistencias'),
            {
                subject_id: selectedSubject,
                group_id: selectedGroup,
                date: date,
                view: 'register',
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const toggleAttendance = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status: status
            }
        }));
    };

    const updateNotes = (studentId, notes) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                notes: notes
            }
        }));
    };

    const saveAttendances = () => {
        if (!selectedSubject || !selectedGroup || !selectedDate) return;

        setIsSaving(true);

        const attendances = Object.entries(attendanceData).map(([userId, data]) => ({
            user_id: parseInt(userId),
            status: data.status,
            notes: data.notes
        }));

        router.post(
            route('profesor.asistencias.bulk'),
            {
                subject_id: selectedSubject,
                group_id: selectedGroup,
                date: selectedDate,
                attendances: attendances
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
                }
            }
        );
    };

    const toggleDateExpansion = (date) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'absent': return 'bg-red-100 text-red-800 border-red-300';
            case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'excused': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />;
            case 'absent': return <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />;
            case 'late': return <Clock className="h-4 w-4 sm:h-5 sm:w-5" />;
            case 'excused': return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />;
            default: return null;
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            present: 'Presente',
            absent: 'Ausente',
            late: 'Tarde',
            excused: 'Excusado'
        };
        return labels[status];
    };

    const getStatusBadge = (status) => {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="hidden sm:inline">{getStatusLabel(status)}</span>
            </span>
        );
    };

    return (
        <Layout title="Asistencias - Profesor">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 lg:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Registro de Asistencias
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Registra asistencias según el período académico activo
                        </p>
                    </div>
                </div>

                {/* Indicador de Período Académico */}
                {currentPeriod && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 border border-blue-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                        {currentPeriod.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        {currentPeriod.formatted_range}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs sm:text-sm">
                                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                                    Período Activo
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mensaje de error si no hay período activo */}
                {error && (
                    <div className="bg-red-50 rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-10 text-center border-l-4 border-red-500">
                        <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-red-900 mb-2 sm:mb-3">
                            Sin Período Académico Activo
                        </h3>
                        <p className="text-sm sm:text-base text-red-700">
                            {error}
                        </p>
                    </div>
                )}

                {/* Selectores */}
                {!error && (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Materia
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={handleSubjectChange}
                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Selecciona una materia</option>
                                    {Array.from(new Set(asignaciones.map(a => a.subject_id))).map(subjectId => {
                                        const asig = asignaciones.find(a => a.subject_id === subjectId);
                                        return (
                                            <option key={subjectId} value={subjectId}>
                                                {asig.subject_name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Grupo
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={handleGroupChange}
                                    disabled={!selectedSubject}
                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Selecciona un grupo</option>
                                    {availableGroups.map(asig => (
                                        <option key={asig.group_id} value={asig.group_id}>
                                            {asig.group_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end sm:col-span-2 lg:col-span-1">
                                <button
                                    onClick={() => loadData()}
                                    disabled={!selectedSubject || !selectedGroup}
                                    className="w-full px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow hover:shadow-lg"
                                >
                                    Cargar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs: Registro vs Historial */}
                {selectedClass && (
                    <div className="flex justify-center">
                        <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-inner w-full sm:w-auto">
                            <button
                                onClick={() => handleViewChange('register')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
                                    currentView === 'register' ? 'bg-white shadow-md text-blue-700' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Registrar</span>
                            </button>
                            <button
                                onClick={() => handleViewChange('history')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
                                    currentView === 'history' ? 'bg-white shadow-md text-indigo-700' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Historial</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* VISTA: REGISTRO */}
                {currentView === 'register' && selectedClass && (
                    <>
                        {/* Resumen estadístico */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-blue-200">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 truncate">{classDates.length}</p>
                                        <p className="text-[10px] sm:text-xs text-blue-700">Clases Totales</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-blue-200">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 truncate">
                                            {classDates.filter(d => d.has_attendance).length}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-blue-700">Registradas</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-orange-200">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900 truncate">
                                            {classDates.filter(d => !d.has_attendance && !d.is_future).length}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-orange-700">Pendientes</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-purple-200">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-600 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900 truncate">{estudiantes.length}</p>
                                        <p className="text-[10px] sm:text-xs text-purple-700">Estudiantes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Fechas de Clase */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 border border-gray-100">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                <span className="truncate">Clases de {selectedClass.subject_name} - {selectedClass.group_name}</span>
                            </h3>
                            
                            {classDates.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {classDates.map((dateInfo) => (
                                        <button
                                            key={dateInfo.date}
                                            onClick={() => loadAttendanceForDate(dateInfo.date)}
                                            disabled={dateInfo.is_future}
                                            className={`group relative rounded-lg sm:rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 p-3 sm:p-4 text-left ${
                                                selectedDate === dateInfo.date
                                                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 scale-105'
                                                    : dateInfo.is_today
                                                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400'
                                                    : dateInfo.is_future
                                                    ? 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                                                    : dateInfo.has_attendance
                                                    ? 'bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200'
                                                    : 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200'
                                            }`}
                                        >
                                            {/* Badge de Estado */}
                                            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                                                {dateInfo.is_today && (
                                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-500 text-white text-[10px] sm:text-xs rounded-full font-bold">
                                                        HOY
                                                    </span>
                                                )}
                                                {dateInfo.has_attendance && !dateInfo.is_today && (
                                                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                                )}
                                                {!dateInfo.has_attendance && !dateInfo.is_future && !dateInfo.is_today && (
                                                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                                                )}
                                            </div>

                                            {/* Día de la semana */}
                                            <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">
                                                {dateInfo.day_name}
                                            </div>

                                            {/* Fecha */}
                                            <div className="text-sm sm:text-base font-bold text-gray-900">
                                                {dateInfo.short_date}
                                            </div>

                                            {/* Horarios */}
                                            <div className="space-y-1 mb-2">
                                                {dateInfo.schedules.map((schedule, idx) => (
                                                    <div key={idx} className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-600 bg-white px-1 py-0.5 sm:py-1 rounded">
                                                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                                        <span className="font-medium truncate">{schedule.start_time} - {schedule.end_time}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Estadísticas de Asistencia */}
                                            {dateInfo.attendance_stats && (
                                                <div className="flex gap-1.5 sm:gap-2 text-[10px] sm:text-xs border-t border-gray-200 pt-2">
                                                    <span className="flex items-center gap-0.5 sm:gap-1 text-blue-700 font-bold">
                                                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        {dateInfo.attendance_stats.present}
                                                    </span>
                                                    <span className="flex items-center gap-0.5 sm:gap-1 text-red-700 font-bold">
                                                        <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        {dateInfo.attendance_stats.absent}
                                                    </span>
                                                    {dateInfo.attendance_stats.late > 0 && (
                                                        <span className="flex items-center gap-0.5 sm:gap-1 text-yellow-700 font-bold">
                                                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                            {dateInfo.attendance_stats.late}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Indicador de pendiente */}
                                            {!dateInfo.has_attendance && !dateInfo.is_future && (
                                                <div className="mt-2 text-[10px] sm:text-xs text-orange-700 font-bold">
                                                    ⚠ Pendiente
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 sm:py-10 text-gray-500">
                                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                                    <p className="text-sm sm:text-lg">No hay fechas de clase en el período actual</p>
                                </div>
                            )}
                        </div>

                        {/* Estadísticas */}
                        {stats && estudiantes.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                                <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-gray-100">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-600">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-blue-200">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{stats.present}</p>
                                            <p className="text-[10px] sm:text-xs text-blue-700">Presentes</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-red-50 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-red-200">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <XCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-900">{stats.absent}</p>
                                            <p className="text-[10px] sm:text-xs text-red-700">Ausentes</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-yellow-200">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900">{stats.late}</p>
                                            <p className="text-[10px] sm:text-xs text-yellow-700">Tarde</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 lg:p-5 border border-blue-200 col-span-2 sm:col-span-3 lg:col-span-1">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{stats.excused}</p>
                                            <p className="text-[10px] sm:text-xs text-blue-700">Excusados</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lista de Estudiantes - Vista Móvil Mejorada */}
                        {selectedDate && estudiantes.length > 0 && (
                            <div className="bg-white rounded-lg sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 text-white">
                                    <h2 className="text-base sm:text-xl font-bold truncate">
                                        {selectedClass.subject_name} - {selectedClass.group_name}
                                    </h2>
                                    <p className="text-xs sm:text-sm opacity-90 mt-1 sm:mt-2">
                                        {classDates.find(d => d.date === selectedDate)?.formatted}
                                    </p>
                                </div>

                                {/* Vista Desktop - Tabla */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {estudiantes.map((estudiante, index) => {
                                                const currentStatus = attendanceData[estudiante.id]?.status || 'absent';
                                                
                                                return (
                                                    <tr key={estudiante.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {estudiante.name} {estudiante.last_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {estudiante.document_number}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center gap-2">
                                                                {['present', 'absent', 'late', 'excused'].map(status => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => toggleAttendance(estudiante.id, status)}
                                                                        className={`p-2 rounded-lg border-2 transition-all ${
                                                                            currentStatus === status
                                                                                ? getStatusColor(status) + ' scale-110 shadow-md'
                                                                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                                                        }`}
                                                                        title={getStatusLabel(status)}
                                                                    >
                                                                        {getStatusIcon(status)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="text"
                                                                value={attendanceData[estudiante.id]?.notes || ''}
                                                                onChange={(e) => updateNotes(estudiante.id, e.target.value)}
                                                                placeholder="Observaciones..."
                                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Vista Móvil/Tablet - Cards */}
                                <div className="lg:hidden divide-y divide-gray-200">
                                    {estudiantes.map((estudiante, index) => {
                                        const currentStatus = attendanceData[estudiante.id]?.status || 'absent';
                                        
                                        return (
                                            <div key={estudiante.id} className="p-3 sm:p-4 space-y-3">
                                                {/* Header del estudiante */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex-shrink-0 text-xs font-bold text-gray-500">#{index + 1}</span>
                                                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                                                {estudiante.name} {estudiante.last_name}
                                                            </h3>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                                            Doc: {estudiante.document_number}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Botones de estado */}
                                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                                    {['present', 'absent', 'late', 'excused'].map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => toggleAttendance(estudiante.id, status)}
                                                            className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-lg border-2 transition-all ${
                                                                currentStatus === status
                                                                    ? getStatusColor(status) + ' scale-105 shadow-md'
                                                                    : 'bg-white border-gray-200 text-gray-400 active:scale-95'
                                                            }`}
                                                        >
                                                            {getStatusIcon(status)}
                                                            <span className="text-[10px] sm:text-xs font-medium leading-tight text-center">
                                                                {getStatusLabel(status)}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Campo de notas */}
                                                <div>
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                                        Observaciones
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={attendanceData[estudiante.id]?.notes || ''}
                                                        onChange={(e) => updateNotes(estudiante.id, e.target.value)}
                                                        placeholder="Escribe observaciones..."
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer con botón guardar */}
                                <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                                    <button
                                        onClick={saveAttendances}
                                        disabled={isSaving}
                                        className="w-full px-4 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-medium"
                                    >
                                        <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                                        {isSaving ? 'Guardando...' : 'Guardar Asistencias'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* VISTA: HISTORIAL */}
                {currentView === 'history' && selectedClass && (
                    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                        {attendanceHistory.length > 0 ? (
                            attendanceHistory.map((record) => (
                                <div key={record.date} className="bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={() => toggleDateExpansion(record.date)}
                                        className="w-full p-3 sm:p-4 lg:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                                            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-700" />
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate">
                                                    {record.formatted_date}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mt-1 sm:mt-2">
                                                    <span className="text-[10px] sm:text-xs text-gray-600">
                                                        Total: <strong>{record.stats.total}</strong>
                                                    </span>
                                                    <span className="text-[10px] sm:text-xs text-blue-700">
                                                        Presentes: <strong>{record.stats.present}</strong>
                                                    </span>
                                                    <span className="text-[10px] sm:text-xs text-red-700">
                                                        Ausentes: <strong>{record.stats.absent}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedDates[record.date] ? 
                                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" /> :
                                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                                        }
                                    </button>

                                    {expandedDates[record.date] && (
                                        <div className="border-t border-gray-200">
                                            {/* Vista Desktop - Tabla */}
                                            <div className="hidden sm:block overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                            <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {record.students.map((student) => (
                                                            <tr key={student.id} className="hover:bg-gray-50">
                                                                <td className="px-4 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900">
                                                                    {student.name} {student.last_name}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-2 sm:py-4">
                                                                    {getStatusBadge(student.status)}
                                                                </td>
                                                                <td className="px-4 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600">
                                                                    {student.notes || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Vista Móvil - Cards */}
                                            <div className="sm:hidden divide-y divide-gray-200">
                                                {record.students.map((student) => (
                                                    <div key={student.id} className="p-3 space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-medium text-gray-900 truncate flex-1">
                                                                {student.name} {student.last_name}
                                                            </span>
                                                            {getStatusBadge(student.status)}
                                                        </div>
                                                        {student.notes && (
                                                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                                {student.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 text-center border border-gray-200">
                                <History className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4 sm:mb-6" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
                                    Sin registros
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                    Aún no hay asistencias registradas para este grupo
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Mensaje inicial */}
                {!selectedClass && !error && (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 text-center border border-gray-200">
                        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4 sm:mb-6" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
                            Selecciona una clase
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                            Elige una materia y grupo para gestionar asistencias
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    );
}