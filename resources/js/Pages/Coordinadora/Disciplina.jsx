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

    // Estados para el buscador de estudiantes
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const dropdownRef = useRef(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        student_id: '',
        type: 'observation',
        description: '',
        date: new Date().toISOString().split('T')[0],
        severity: 'low',
        sanction: '',
    });

    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Filtrar estudiantes según búsqueda
    const filteredStudents = students.filter(student => 
        student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (student.last_name && student.last_name.toLowerCase().includes(studentSearch.toLowerCase())) ||
        student.document_number?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.group?.nombre.toLowerCase().includes(studentSearch.toLowerCase())
    );

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowStudentDropdown(false);
            }
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
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setEditingRecord(null);
                    setSelectedStudent(null);
                    setStudentSearch('');
                },
            });
        } else {
            post(route('coordinadora.disciplina.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setSelectedStudent(null);
                    setStudentSearch('');
                },
            });
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setData({
            student_id: record.student_id,
            type: record.type,
            description: record.description,
            date: record.date,
            severity: record.severity,
            sanction: record.sanction || '',
        });
        
        // Pre-seleccionar estudiante
        const student = students.find(s => s.id === record.student_id);
        if (student) {
            setSelectedStudent(student);
            setStudentSearch(student.full_name);
        }
        
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            router.delete(route('coordinadora.disciplina.destroy', id));
        }
    };

    const handleCloseRecord = (id) => {
        if (confirm('¿Deseas marcar este registro como resuelto/cerrado?')) {
            router.patch(route('coordinadora.disciplina.close', id));
        }
    };

    const viewStudentHistory = (studentId) => {
        setLoadingHistory(true);
        setShowHistoryModal(true);
        fetch(route('coordinadora.disciplina.estudiante', studentId))
            .then(res => res.json())
            .then(data => {
                setStudentHistory(data);
                setLoadingHistory(false);
            })
            .catch(error => {
                console.error('Error:', error);
                setLoadingHistory(false);
            });
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setStudentSearch(student.full_name);
        setData('student_id', student.id);
        setShowStudentDropdown(false);
    };

    const clearStudentSelection = () => {
        setSelectedStudent(null);
        setStudentSearch('');
        setData('student_id', '');
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'low': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    return (
        <Layout title="Gestión Disciplinaria">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión Disciplinaria</h1>
                    <p className="text-gray-600 mt-2">Seguimiento y control de conducta estudiantil</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRecord(null);
                        reset();
                        setSelectedStudent(null);
                        setStudentSearch('');
                        setShowModal(true);
                    }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5" />
                    <span>Nuevo Registro</span>
                </button>
            </div>

            {/* Stats Summary - Con degradados y fondo transparente */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-sm bg-white/80 p-6 border border-indigo-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Casos</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {stats.total || 0}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl">
                            <FileText className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-sm bg-white/80 p-6 border border-yellow-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Abiertos</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                                {stats.open || 0}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl">
                            <AlertCircle className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-sm bg-white/80 p-6 border border-red-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Nivel Crítico</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                                {stats.critical || 0}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-pink-500 p-3 rounded-xl">
                            <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl shadow-lg backdrop-blur-sm bg-white/80 p-6 border border-green-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Mes Actual</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {stats.thisMonth || 0}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                            <Calendar className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg mb-6 flex flex-wrap gap-4 items-center border border-gray-100">
                <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por estudiante, documento o descripción..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </form>
            </div>

            {/* Records List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estudiante</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grupo</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Asunto</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Severidad</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {records.data.map((record) => (
                            <tr key={record.id} className="hover:bg-indigo-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                                            <User className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-gray-900">
                                                {record.student.name} {record.student.last_name || ''}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(record.date).toLocaleDateString('es-ES', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {record.student.current_group ? (
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 text-indigo-600 mr-2" />
                                            <span className="text-sm font-semibold text-gray-900">
                                                {record.student.current_group.nombre}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Sin grupo</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 font-semibold">{record.type_label}</div>
                                    <div className="text-xs text-gray-500 line-clamp-2 mt-1">{record.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${getSeverityBadge(record.severity)}`}>
                                        {record.severity_label}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center text-xs font-bold ${record.status === 'open' ? 'text-yellow-700' : 'text-green-700'}`}>
                                        {record.status === 'open' ? <AlertCircle className="h-4 w-4 mr-1.5" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                                        {record.status === 'open' ? 'Abierto' : 'Resuelto'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button 
                                            onClick={() => viewStudentHistory(record.student_id)} 
                                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" 
                                            title="Historial"
                                        >
                                            <History className="h-5 w-5" />
                                        </button>
                                        {record.status === 'open' && (
                                            <>
                                                <button 
                                                    onClick={() => handleEdit(record)} 
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                                                    title="Editar"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleCloseRecord(record.id)} 
                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" 
                                                    title="Cerrar Caso"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(record.id)} 
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
                <span className="font-medium">Mostrando {records.from}-{records.to} de {records.total} registros</span>
            </div>

            {/* Record Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {editingRecord ? 'Editar Registro' : 'Nuevo Registro Disciplinario'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingRecord(null);
                                        reset();
                                        setSelectedStudent(null);
                                        setStudentSearch('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Buscador de Estudiantes */}
                                <div className="md:col-span-2" ref={dropdownRef}>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Estudiante *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={studentSearch}
                                            onChange={(e) => {
                                                setStudentSearch(e.target.value);
                                                setShowStudentDropdown(true);
                                            }}
                                            onFocus={() => setShowStudentDropdown(true)}
                                            placeholder="Buscar estudiante por nombre, documento, email o grupo..."
                                            className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            disabled={editingRecord}
                                            required
                                        />
                                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                        {selectedStudent && !editingRecord && (
                                            <button
                                                type="button"
                                                onClick={clearStudentSelection}
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}
                                        
                                        {/* Dropdown de resultados */}
                                        {showStudentDropdown && !editingRecord && studentSearch && (
                                            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                                {filteredStudents.length > 0 ? (
                                                    filteredStudents.map((student) => (
                                                        <button
                                                            key={student.id}
                                                            type="button"
                                                            onClick={() => selectStudent(student)}
                                                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-gray-900">
                                                                        {student.full_name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 mt-0.5">
                                                                        {student.document_number} • {student.email}
                                                                    </div>
                                                                </div>
                                                                {student.group && (
                                                                    <div className="ml-3 flex items-center bg-indigo-100 px-3 py-1 rounded-full">
                                                                        <Users className="h-3 w-3 text-indigo-600 mr-1" />
                                                                        <span className="text-xs font-semibold text-indigo-700">
                                                                            {student.group.nombre}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                        No se encontraron estudiantes
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.student_id && <p className="text-red-500 text-xs mt-2 font-medium">{errors.student_id}</p>}
                                    
                                    {/* Mostrar estudiante seleccionado */}
                                    {selectedStudent && (
                                        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                                                        <User className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{selectedStudent.full_name}</div>
                                                        <div className="text-xs text-gray-600">{selectedStudent.email}</div>
                                                    </div>
                                                </div>
                                                {selectedStudent.group && (
                                                    <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-indigo-200">
                                                        <Users className="h-4 w-4 text-indigo-600 mr-1.5" />
                                                        <span className="text-sm font-semibold text-indigo-700">
                                                            {selectedStudent.group.nombre}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Falta *</label>
                                    <select 
                                        value={data.type} 
                                        onChange={e => setData('type', e.target.value)} 
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                                        required
                                    >
                                        <option value="observation">Observación</option>
                                        <option value="minor_fault">Falta Leve</option>
                                        <option value="serious_fault">Falta Grave</option>
                                        <option value="very_serious_fault">Falta Muy Grave</option>
                                    </select>
                                    {errors.type && <p className="text-red-500 text-xs mt-2 font-medium">{errors.type}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Severidad *</label>
                                    <select 
                                        value={data.severity} 
                                        onChange={e => setData('severity', e.target.value)} 
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                                        required
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="critical">Crítica</option>
                                    </select>
                                    {errors.severity && <p className="text-red-500 text-xs mt-2 font-medium">{errors.severity}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
                                    <input 
                                        type="date" 
                                        value={data.date} 
                                        onChange={e => setData('date', e.target.value)} 
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                    {errors.date && <p className="text-red-500 text-xs mt-2 font-medium">{errors.date}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción detallada *</label>
                                    <textarea 
                                        value={data.description} 
                                        onChange={e => setData('description', e.target.value)} 
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none" 
                                        rows="4" 
                                        required 
                                        placeholder="Describa los hechos, testigos y descargos..."
                                    ></textarea>
                                    {errors.description && <p className="text-red-500 text-xs mt-2 font-medium">{errors.description}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Sanción o Acuerdo de Convivencia</label>
                                    <input 
                                        type="text" 
                                        value={data.sanction} 
                                        onChange={e => setData('sanction', e.target.value)} 
                                        className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" 
                                        placeholder="Ej: Suspensión 3 días, Acta de compromiso..." 
                                    />
                                    {errors.sanction && <p className="text-red-500 text-xs mt-2 font-medium">{errors.sanction}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-8">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingRecord(null);
                                        reset();
                                        setSelectedStudent(null);
                                        setStudentSearch('');
                                    }} 
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                                    <History className="h-7 w-7 mr-3 text-indigo-600" />
                                    Historial Disciplinario
                                </h2>
                                <button 
                                    onClick={() => {
                                        setShowHistoryModal(false);
                                        setStudentHistory(null);
                                    }} 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {loadingHistory ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                                    <p className="mt-4 text-gray-600 font-medium">Cargando historial...</p>
                                </div>
                            ) : studentHistory && (
                                <div>
                                    {/* Información del estudiante */}
                                    <div className="relative overflow-hidden rounded-2xl p-6 mb-6 border border-indigo-100">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                                        <div className="relative">
                                            <div className="flex items-center mb-4">
                                                <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                                    <User className="h-8 w-8 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Estudiante</p>
                                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                                        {studentHistory.student.full_name}
                                                    </p>
                                                    <div className="flex items-center mt-2 space-x-4">
                                                        <p className="text-sm text-gray-600">{studentHistory.student.email}</p>
                                                        {studentHistory.student.group && (
                                                            <div className="flex items-center bg-white px-3 py-1 rounded-full border border-indigo-200">
                                                                <Users className="h-4 w-4 text-indigo-600 mr-1.5" />
                                                                <span className="text-sm font-semibold text-indigo-700">
                                                                    {studentHistory.student.group.nombre}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total Registros</p>
                                                    <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-1">
                                                        {studentHistory.history.length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline de registros */}
                                    <div className="space-y-4">
                                        {studentHistory.history.map((h, idx) => (
                                            <div key={idx} className="relative pl-8 py-4 border-l-4 border-indigo-200 hover:border-indigo-400 transition-colors">
                                                <div className="absolute -left-[13px] top-6 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-4 border-white shadow-md"></div>
                                                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-xs text-gray-500 font-bold uppercase">
                                                            {new Date(h.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getSeverityBadge(h.severity)}`}>
                                                            {h.severity_label}
                                                        </span>
                                                    </div>
                                                    <p className="text-base font-bold text-gray-900 mb-2">{h.type_label}</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{h.description}</p>
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