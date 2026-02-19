import { Head, useForm, router } from '@inertiajs/react';
import { Shield, Search, Plus, Edit, Trash2, Calendar, User, FileText, CheckCircle, AlertCircle, TrendingUp, History, X, Users } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Layout from '@/Components/Layout/Layout';

export default function GestionDisciplinaria({ records, students, stats, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [studentHistory, setStudentHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const dropdownRef = useRef(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        student_id: '', type: 'observation', description: '',
        date: new Date().toISOString().split('T')[0], severity: 'low', sanction: '',
    });

    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (student.last_name && student.last_name.toLowerCase().includes(studentSearch.toLowerCase())) ||
        student.document_number?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.group?.nombre.toLowerCase().includes(studentSearch.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowStudentDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('coordinadora.disciplina'), { search: searchTerm }, { preserveState: true });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingRecord) {
            put(route('coordinadora.disciplina.update', editingRecord.id), {
                onSuccess: () => { setShowModal(false); reset(); setEditingRecord(null); setSelectedStudent(null); setStudentSearch(''); },
            });
        } else {
            post(route('coordinadora.disciplina.store'), {
                onSuccess: () => { setShowModal(false); reset(); setSelectedStudent(null); setStudentSearch(''); },
            });
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setData({ student_id: record.student_id, type: record.type, description: record.description, date: record.date, severity: record.severity, sanction: record.sanction || '' });
        const student = students.find(s => s.id === record.student_id);
        if (student) { setSelectedStudent(student); setStudentSearch(student.full_name); }
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) router.delete(route('coordinadora.disciplina.destroy', id));
    };

    const handleCloseRecord = (id) => {
        if (confirm('¿Deseas marcar este registro como resuelto/cerrado?')) router.patch(route('coordinadora.disciplina.close', id));
    };

    const viewStudentHistory = (studentId) => {
        setLoadingHistory(true); setShowHistoryModal(true);
        fetch(route('coordinadora.disciplina.estudiante', studentId))
            .then(res => res.json())
            .then(data => { setStudentHistory(data); setLoadingHistory(false); })
            .catch(() => setLoadingHistory(false));
    };

    const selectStudent = (student) => {
        setSelectedStudent(student); setStudentSearch(student.full_name);
        setData('student_id', student.id); setShowStudentDropdown(false);
    };

    const clearStudentSelection = () => { setSelectedStudent(null); setStudentSearch(''); setData('student_id', ''); };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'low':      return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'medium':   return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'high':     return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
            default:         return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    return (
        <Layout title="Gestión Disciplinaria">
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Gestión Disciplinaria
                        </h1>
                        <p className="text-gray-600 mt-1">Seguimiento y control de conducta estudiantil</p>
                    </div>
                    <button
                        onClick={() => { setEditingRecord(null); reset(); setSelectedStudent(null); setStudentSearch(''); setShowModal(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Registro
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-blue-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Casos</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">{stats.total || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl">
                                <FileText className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-yellow-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Abiertos</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mt-1">{stats.open || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl">
                                <AlertCircle className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-red-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Nivel Crítico</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mt-1">{stats.critical || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-3 rounded-xl">
                                <TrendingUp className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm p-6 border border-green-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Mes Actual</p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-1">{stats.thisMonth || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                                <Calendar className="h-7 w-7 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-gray-100">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por estudiante, documento o descripción..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
                        </div>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium">
                            Buscar
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Grupo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Asunto</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Severidad</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.data.map((record) => (
                                    <tr key={record.id} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{record.student.name} {record.student.last_name || ''}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(record.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.student.current_group ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-semibold text-gray-900">{record.student.current_group.nombre}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Sin grupo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{record.type_label}</div>
                                            <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{record.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${getSeverityBadge(record.severity)}`}>
                                                {record.severity_label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${record.status === 'open' ? 'text-yellow-700' : 'text-green-700'}`}>
                                                {record.status === 'open' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                {record.status === 'open' ? 'Abierto' : 'Resuelto'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => viewStudentHistory(record.student_id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Historial">
                                                    <History className="h-4 w-4" />
                                                </button>
                                                {record.status === 'open' && (
                                                    <>
                                                        <button onClick={() => handleEdit(record)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Editar">
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleCloseRecord(record.id)}
                                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Cerrar Caso">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDelete(record.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {records.data.length === 0 && (
                        <div className="text-center py-16">
                            <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No hay registros disciplinarios</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Mostrando {records.from}–{records.to} de {records.total} registros</span>
                </div>
            </div>

            {/* Record Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="relative flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">
                                            {editingRecord ? 'Editar Registro' : 'Nuevo Registro Disciplinario'}
                                        </h2>
                                        <p className="text-white/80 text-sm">Completa la información del caso</p>
                                    </div>
                                    <button type="button"
                                        onClick={() => { setShowModal(false); setEditingRecord(null); reset(); setSelectedStudent(null); setStudentSearch(''); }}
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {/* Buscador de Estudiantes */}
                                <div ref={dropdownRef}>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Estudiante *</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                        <input type="text" value={studentSearch}
                                            onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                                            onFocus={() => setShowStudentDropdown(true)}
                                            placeholder="Buscar estudiante por nombre, documento o grupo..."
                                            className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            disabled={!!editingRecord} required />
                                        {selectedStudent && !editingRecord && (
                                            <button type="button" onClick={clearStudentSelection}
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}
                                        {showStudentDropdown && !editingRecord && studentSearch && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                                                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                                    <button key={student.id} type="button" onClick={() => selectStudent(student)}
                                                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-bold text-gray-900 text-sm">{student.full_name}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5">{student.document_number} • {student.email}</div>
                                                            </div>
                                                            {student.group && (
                                                                <div className="ml-3 flex items-center bg-blue-100 px-2.5 py-1 rounded-full">
                                                                    <Users className="h-3 w-3 text-blue-600 mr-1" />
                                                                    <span className="text-xs font-semibold text-blue-700">{student.group.nombre}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron estudiantes</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.student_id && <p className="text-red-500 text-xs mt-2 font-medium">{errors.student_id}</p>}
                                    {selectedStudent && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                        <User className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{selectedStudent.full_name}</div>
                                                        <div className="text-xs text-gray-500">{selectedStudent.email}</div>
                                                    </div>
                                                </div>
                                                {selectedStudent.group && (
                                                    <div className="flex items-center bg-white px-2.5 py-1 rounded-full border border-blue-200">
                                                        <Users className="h-3.5 w-3.5 text-blue-600 mr-1" />
                                                        <span className="text-xs font-semibold text-blue-700">{selectedStudent.group.nombre}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Falta *</label>
                                        <select value={data.type} onChange={e => setData('type', e.target.value)}
                                            className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" required>
                                            <option value="observation">Observación</option>
                                            <option value="minor_fault">Falta Leve</option>
                                            <option value="serious_fault">Falta Grave</option>
                                            <option value="very_serious_fault">Falta Muy Grave</option>
                                        </select>
                                        {errors.type && <p className="text-red-500 text-xs mt-2 font-medium">{errors.type}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Severidad *</label>
                                        <select value={data.severity} onChange={e => setData('severity', e.target.value)}
                                            className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" required>
                                            <option value="low">Baja</option>
                                            <option value="medium">Media</option>
                                            <option value="high">Alta</option>
                                            <option value="critical">Crítica</option>
                                        </select>
                                        {errors.severity && <p className="text-red-500 text-xs mt-2 font-medium">{errors.severity}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)}
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
                                    {errors.date && <p className="text-red-500 text-xs mt-2 font-medium">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción detallada *</label>
                                    <textarea value={data.description} onChange={e => setData('description', e.target.value)}
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                                        rows="4" required placeholder="Describa los hechos, testigos y descargos..."></textarea>
                                    {errors.description && <p className="text-red-500 text-xs mt-2 font-medium">{errors.description}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Sanción o Acuerdo de Convivencia</label>
                                    <input type="text" value={data.sanction} onChange={e => setData('sanction', e.target.value)}
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        placeholder="Ej: Suspensión 3 días, Acta de compromiso..." />
                                    {errors.sanction && <p className="text-red-500 text-xs mt-2 font-medium">{errors.sanction}</p>}
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button type="button"
                                    onClick={() => { setShowModal(false); setEditingRecord(null); reset(); setSelectedStudent(null); setStudentSearch(''); }}
                                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-semibold shadow-lg text-sm">
                                    {processing ? 'Guardando...' : 'Guardar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                        <div className="relative p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    <History className="h-6 w-6" /> Historial Disciplinario
                                </h2>
                                <button onClick={() => { setShowHistoryModal(false); setStudentHistory(null); }}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                            {loadingHistory ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-500">Cargando historial...</p>
                                </div>
                            ) : studentHistory && (
                                <div className="space-y-5">
                                    {/* Info del estudiante */}
                                    <div className="relative overflow-hidden rounded-xl p-5 border border-blue-100">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                                <User className="h-7 w-7 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-2xl font-bold text-gray-900">{studentHistory.student.full_name}</p>
                                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                                    <p className="text-sm text-gray-600">{studentHistory.student.email}</p>
                                                    {studentHistory.student.group && (
                                                        <div className="flex items-center bg-white px-2.5 py-1 rounded-full border border-blue-200">
                                                            <Users className="h-3.5 w-3.5 text-blue-600 mr-1" />
                                                            <span className="text-xs font-semibold text-blue-700">{studentHistory.student.group.nombre}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Registros</p>
                                                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                    {studentHistory.history.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="space-y-4">
                                        {studentHistory.history.map((h, idx) => (
                                            <div key={idx} className="relative pl-8 py-4 border-l-4 border-blue-200 hover:border-blue-400 transition-colors">
                                                <div className="absolute -left-[13px] top-5 h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border-4 border-white shadow-md"></div>
                                                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                                        <p className="text-xs text-gray-500 font-bold uppercase">
                                                            {new Date(h.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getSeverityBadge(h.severity)}`}>{h.severity_label}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 mb-1">{h.type_label}</p>
                                                    <p className="text-sm text-gray-700">{h.description}</p>
                                                    {h.sanction && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <p className="text-xs font-bold text-orange-600 uppercase mb-1">Sanción</p>
                                                            <p className="text-sm text-orange-700 font-medium">{h.sanction}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}