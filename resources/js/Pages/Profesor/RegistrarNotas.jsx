import { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';
import {
  BookOpen, Users, ClipboardList, Plus, Save, Eye, Trash2, Award,
  TrendingUp, ChevronDown, Check, X, Loader2, BarChart3, Search,
  ArrowUpDown, ArrowUp, ArrowDown, Calendar, AlertCircle, FileText
} from 'lucide-react';

export default function RegistrarNotas() {
  const { props } = usePage();
  const {
    asignaciones = [],
    classInfo = null,
    students = [],
    tasks = [],
    manualGrades = [],
    gradeMatrix = []
  } = props;

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showManualGradeForm, setShowManualGradeForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [manualGradeForm, setManualGradeForm] = useState({
    title: '',
    description: '',
    max_score: 5.0,
    weight: 1,
    grade_date: new Date().toISOString().split('T')[0]
  });

  // Filtros y ordenamiento
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  const availableGroups = asignaciones.filter(a => a.subject_id === parseInt(selectedSubject));

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedGroup('');
  };

  const loadGrades = () => {
    if (!selectedSubject || !selectedGroup) {
      alert('Selecciona una materia y un grupo');
      return;
    }
    router.get(
      '/profesor/registrarNotas',
      { subject_id: selectedSubject, group_id: selectedGroup },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleCreateManualGrade = async (e) => {
    e.preventDefault();
    
    if (manualGradeForm.max_score < 0.1 || manualGradeForm.max_score > 5.0) {
      alert('La puntuación máxima debe estar entre 0.1 y 5.0');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/profesor/registrarNotas/manual/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({
          subject_id: classInfo.subject_id,
          group_id: classInfo.group_id,
          ...manualGradeForm
        })
      });

      if (response.ok) {
        setShowManualGradeForm(false);
        setManualGradeForm({
          title: '',
          description: '',
          max_score: 5.0,
          weight: 1,
          grade_date: new Date().toISOString().split('T')[0]
        });
        loadGrades();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al crear el registro');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el registro');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManualGrade = async (manualGradeId, title) => {
    if (!confirm(`¿Estás seguro de eliminar "${title}"? Se perderán todas las calificaciones asociadas.`)) {
      return;
    }

    setDeleting(manualGradeId);
    try {
      const response = await fetch(`/profesor/registrarNotas/manual/${manualGradeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        }
      });

      if (response.ok) {
        loadGrades();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al eliminar el registro');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el registro');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveManualScore = async (manualGradeId, studentId, score) => {
    try {
      const response = await fetch('/profesor/registrarNotas/manual/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({
          manual_grade_id: manualGradeId,
          student_id: studentId,
          score: parseFloat(score)
        })
      });

      if (response.ok) {
        loadGrades();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al guardar la calificación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la calificación');
    }
  };

  const allGradeColumns = useMemo(() => {
    const combined = [
      ...tasks.map(t => ({ 
        ...t, 
        type: 'task', 
        key: `task_${t.id}`,
        sortDate: new Date(t.due_date)
      })),
      ...manualGrades.map(m => ({ 
        ...m, 
        type: 'manual', 
        key: `manual_${m.id}`,
        sortDate: new Date(m.grade_date)
      }))
    ];
    
    return combined.sort((a, b) => b.sortDate - a.sortDate);
  }, [tasks, manualGrades]);

  const filteredGradeMatrix = useMemo(() => {
    let result = gradeMatrix.filter(student => {
      const fullName = student.student_name.toLowerCase();
      const docNumber = (student.document_number || '').toString().toLowerCase();
      const searchTerm = search.toLowerCase();
      
      return fullName.includes(searchTerm) || docNumber.includes(searchTerm);
    });

    if (sortBy === 'nombre') {
      result = [...result].sort((a, b) => {
        const nameA = a.student_name.toLowerCase();
        const nameB = b.student_name.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (sortBy === 'documento') {
      result = [...result].sort((a, b) => {
        const docA = a.document_number || '';
        const docB = b.document_number || '';
        return sortOrder === 'asc' ? docA.localeCompare(docB) : docB.localeCompare(docA);
      });
    } else if (sortBy === 'promedio') {
      result = [...result].sort((a, b) => {
        const avgA = a.average || 0;
        const avgB = b.average || 0;
        return sortOrder === 'asc' ? avgA - avgB : avgB - avgA;
      });
    }

    return result;
  }, [gradeMatrix, search, sortBy, sortOrder]);

  const calculateStats = () => {
    if (filteredGradeMatrix.length === 0) return null;
    const averages = filteredGradeMatrix.map(s => s.average).filter(a => a > 0);
    if (averages.length === 0) return null;

    return {
      classAverage: (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1),
      highestAverage: Math.max(...averages).toFixed(1),
      lowestAverage: Math.min(...averages).toFixed(1),
      studentsWithGrades: averages.length,
      totalStudents: filteredGradeMatrix.length
    };
  };

  const stats = calculateStats();

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />;
  };

  return (
    <Layout title="Registrar Notas">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Registro de Notas
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Vista consolidada: Tareas + Evaluaciones Manuales (0.0 - 5.0)
            </p>
          </div>
        </div>

        {/* Selectores */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Materia
              </label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">Selecciona una materia</option>
                {Array.from(new Set(asignaciones.map(a => a.subject_id))).map(subjectId => {
                  const asig = asignaciones.find(a => a.subject_id === subjectId);
                  return <option key={subjectId} value={subjectId}>{asig.subject_name}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-3 bottom-2 sm:bottom-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Grupo
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                disabled={!selectedSubject}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
              >
                <option value="">Selecciona un grupo</option>
                {availableGroups.map(asig => (
                  <option key={asig.group_id} value={asig.group_id}>{asig.group_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 bottom-2 sm:bottom-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={loadGrades}
                disabled={!selectedSubject || !selectedGroup}
                className="w-full px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>

        {classInfo && (
          <>
            {/* Info de la Clase + Botón Nueva Evaluación */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{classInfo.subject_name}</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Grupo {classInfo.group_name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowManualGradeForm(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-medium"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Nueva Evaluación
                </button>
              </div>

              {/* Estadísticas */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  <StatCard icon={Users} label="Estudiantes" value={stats.totalStudents} color="blue" />
                  <StatCard icon={TrendingUp} label="Promedio" value={stats.classAverage} color="indigo" />
                  <StatCard icon={Award} label="Máximo" value={stats.highestAverage} color="green" />
                  <StatCard icon={BarChart3} label="Mínimo" value={stats.lowestAverage} color="orange" />
                  <StatCard icon={ClipboardList} label="Evaluaciones" value={allGradeColumns.length} color="purple" className="col-span-2 sm:col-span-3 lg:col-span-1" />
                </div>
              )}
            </div>

            {/* Buscador */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 border border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {allGradeColumns.length > 0 ? (
              <>
                {/* Vista Desktop - Tabla */}
                <div className="hidden lg:block bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-auto max-h-[600px]">
                    <table className="w-full border-collapse table-fixed">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600">
                          <th className="w-[200px] px-4 py-4 text-left border-r border-white/20">
                            <button
                              onClick={() => toggleSort('nombre')}
                              className="flex items-center gap-2 hover:text-white/80 text-xs font-bold text-white uppercase group w-full"
                            >
                              <span className="truncate">Estudiante</span>
                              <SortIcon field="nombre" />
                            </button>
                          </th>

                          <th className="w-[120px] px-3 py-4 text-left border-r border-white/20">
                            <button
                              onClick={() => toggleSort('documento')}
                              className="flex items-center gap-2 hover:text-white/80 text-xs font-bold text-white uppercase group w-full"
                            >
                              <span className="truncate">Doc.</span>
                              <SortIcon field="documento" />
                            </button>
                          </th>

                          {allGradeColumns.map((col) => (
                            <th 
                              key={col.key} 
                              className="px-2 py-4 text-center text-xs font-bold text-white border-r border-white/20"
                              style={{ width: `${Math.max(80, 400 / allGradeColumns.length)}px` }}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="font-bold truncate" title={col.title}>{col.title}</div>
                                <div className="text-[10px] text-white/80">Max: {col.max_score.toFixed(1)}</div>
                                <div className="flex flex-col items-center gap-1 text-[10px]">
                                  <span className={`px-2 py-0.5 rounded-full ${col.type === 'task' ? 'bg-blue-400/30' : 'bg-indigo-400/30'}`}>
                                    {col.type === 'task' ? 'Tarea' : 'Manual'}
                                  </span>
                                  <span className="text-white/70 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(col.type === 'task' ? col.due_date : col.grade_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>

                                {col.type === 'manual' && (
                                  <button
                                    onClick={() => handleDeleteManualGrade(col.id, col.title)}
                                    disabled={deleting === col.id}
                                    className="mt-1 px-2 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded text-[10px] transition-colors disabled:opacity-50"
                                    title="Eliminar evaluación"
                                  >
                                    {deleting === col.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                    ) : (
                                      <Trash2 className="w-3 h-3 mx-auto" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}

                          <th className="w-[100px] px-3 py-4 text-center bg-gradient-to-r from-indigo-700 to-blue-700 border-l border-white/20">
                            <button
                              onClick={() => toggleSort('promedio')}
                              className="flex items-center justify-center gap-2 hover:text-white/80 mx-auto text-xs font-bold text-white uppercase"
                            >
                              <span>PROM.</span>
                              <SortIcon field="promedio" />
                            </button>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200">
                        {filteredGradeMatrix.map((student, idx) => (
                          <tr key={student.student_id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                              <div className="truncate" title={student.student_name}>
                                {student.student_name}
                              </div>
                            </td>

                            <td className="px-3 py-3 text-xs text-gray-600 border-r border-gray-200">
                              <div className="truncate">
                                {student.document_number || 'N/A'}
                              </div>
                            </td>

                            {allGradeColumns.map((col) => {
                              const gradeData = student.grades[col.key];
                              return (
                                <td key={col.key} className="px-2 py-3 text-center border-r border-gray-200">
                                  {col.type === 'task' ? (
                                    <div className="flex flex-col items-center gap-1">
                                      {gradeData?.score !== null && gradeData?.score !== undefined ? (
                                        <div className="text-base font-bold text-blue-600">
                                          {gradeData.score.toFixed(1)}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-gray-400 italic">
                                          {gradeData?.status === 'pending' ? 'Pend.' : 'N/A'}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <GradeCell
                                      gradeData={gradeData}
                                      maxScore={col.max_score}
                                      onSave={(score) => handleSaveManualScore(col.id, student.student_id, score)}
                                    />
                                  )}
                                </td>
                              );
                            })}

                            <td className="px-3 py-3 text-center bg-gradient-to-r from-indigo-50 to-blue-50 border-l border-gray-200">
                              <div className={`text-lg font-bold ${student.average >= 3.0 ? 'text-green-600' : student.average > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                {student.average ? student.average.toFixed(1) : '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista Mobile/Tablet - Cards */}
                <div className="lg:hidden space-y-3 sm:space-y-4">
                  {filteredGradeMatrix.map((student) => (
                    <StudentCard
                      key={student.student_id}
                      student={student}
                      allGradeColumns={allGradeColumns}
                      onSaveManualScore={handleSaveManualScore}
                      onDeleteManualGrade={handleDeleteManualGrade}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState onCreateClick={() => setShowManualGradeForm(true)} />
            )}
          </>
        )}

        {!classInfo && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 text-center border border-gray-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Selecciona una clase</h3>
            <p className="text-sm sm:text-base text-gray-600">Elige una materia y grupo para ver el registro de notas</p>
          </div>
        )}
      </div>

      {showManualGradeForm && (
        <ManualGradeFormModal
          form={manualGradeForm}
          setForm={setManualGradeForm}
          onClose={() => setShowManualGradeForm(false)}
          onSubmit={handleCreateManualGrade}
          saving={saving}
        />
      )}
    </Layout>
  );
}

// ✅ StatCard Component
function StatCard({ icon: Icon, label, value, color, className = '' }) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600 text-blue-900',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600 text-indigo-900',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600 text-green-900',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600 text-orange-900',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600 text-purple-900',
  };

  const [gradientClass, borderClass, iconClass, textClass] = colorClasses[color].split(' ');

  return (
    <div className={`bg-gradient-to-br ${gradientClass} rounded-lg sm:rounded-xl p-3 sm:p-4 border ${borderClass} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconClass} flex-shrink-0`} />
        <div className={`text-xs font-semibold ${textClass} truncate`}>{label}</div>
      </div>
      <div className={`text-xl sm:text-2xl font-bold ${textClass}`}>{value}</div>
    </div>
  );
}

// ✅ GradeCell Component
function GradeCell({ gradeData, maxScore, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(gradeData?.score ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const numValue = parseFloat(value);
    
    if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > maxScore)) {
      alert(`La nota debe estar entre 0.0 y ${maxScore.toFixed(1)}`);
      return;
    }
    
    if (value !== '' && numValue > 5.0) {
      alert('La nota no puede ser mayor a 5.0');
      return;
    }

    setSaving(true);
    try {
      await onSave(value === '' ? null : numValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <input
          type="number"
          step="0.1"
          min="0"
          max={Math.min(maxScore, 5.0)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setValue(gradeData?.score ?? '');
            }
          }}
          className="w-14 px-1 py-1 text-center border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs"
          autoFocus
          disabled={saving}
        />
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="p-0.5 text-green-600 hover:bg-green-100 rounded transition-colors"
          title="Guardar (Enter)"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setValue(gradeData?.score ?? '');
          }}
          disabled={saving}
          className="p-0.5 text-red-600 hover:bg-red-100 rounded transition-colors"
          title="Cancelar (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full flex flex-col items-center gap-1 hover:bg-blue-50 rounded-lg p-1 transition-colors group"
      title="Clic para editar"
    >
      {gradeData?.score !== null && gradeData?.score !== undefined ? (
        <div className="text-base font-bold text-blue-600">
          {gradeData.score.toFixed(1)}
        </div>
      ) : (
        <div className="text-[10px] text-gray-400 italic group-hover:text-blue-600">
          Calificar
        </div>
      )}
    </button>
  );
}

// ✅ StudentCard Component (Mobile)
function StudentCard({ student, allGradeColumns, onSaveManualScore, onDeleteManualGrade, deleting }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base sm:text-lg truncate">{student.student_name}</h3>
            <p className="text-white/80 text-xs sm:text-sm">Doc: {student.document_number || 'N/A'}</p>
          </div>

          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-white/80 text-xs mb-1">Promedio</div>
            <div className={`text-xl sm:text-2xl font-bold ${student.average >= 3.0 ? 'text-green-300' : student.average > 0 ? 'text-orange-300' : 'text-white/50'}`}>
              {student.average ? student.average.toFixed(1) : '-'}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
              Ocultar Calificaciones
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 transition-transform" />
              Ver Calificaciones ({allGradeColumns.length})
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-3 sm:p-4 space-y-3">
          {allGradeColumns.map((col) => {
            const gradeData = student.grades[col.key];
            return (
              <div key={col.key} className="border-b border-gray-200 pb-3 last:border-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{col.title}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${col.type === 'task' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {col.type === 'task' ? 'Tarea' : 'Manual'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(col.type === 'task' ? col.due_date : col.grade_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {col.type === 'manual' && (
                        <button
                          onClick={() => onDeleteManualGrade(col.id, col.title)}
                          disabled={deleting === col.id}
                          className="text-xs px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors disabled:opacity-50"
                        >
                          {deleting === col.id ? '...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Máximo: {col.max_score.toFixed(1)}</div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    {col.type === 'task' ? (
                      <div>
                        {gradeData?.score !== null && gradeData?.score !== undefined ? (
                          <div className="text-lg sm:text-xl font-bold text-blue-600">
                            {gradeData.score.toFixed(1)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            {gradeData?.status === 'pending' ? 'Pendiente' : 'Sin calificar'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <GradeCell
                        gradeData={gradeData}
                        maxScore={col.max_score}
                        onSave={(score) => onSaveManualScore(col.id, student.student_id, score)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ✅ EmptyState Component
function EmptyState({ onCreateClick }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 text-center border border-gray-200">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Sin evaluaciones registradas</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        No hay tareas ni evaluaciones manuales para este grupo aún.<br className="hidden sm:block" />
        Crea tareas desde "Mis clases" o agrega una evaluación manual aquí.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-medium"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        Crear evaluación manual
      </button>
    </div>
  );
}

// ✅ ManualGradeFormModal Component
function ManualGradeFormModal({ form, setForm, onClose, onSubmit, saving }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Nueva Evaluación Manual</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Examen Parcial 1, Participación..."
              className="w-full px-4 py-2 sm:py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 sm:py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none text-sm sm:text-base"
              placeholder="Detalles adicionales sobre la evaluación..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Puntuación Máxima *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={form.max_score}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val >= 0.1 && val <= 5.0) {
                    setForm({ ...form, max_score: val });
                  }
                }}
                className="w-full px-4 py-2 sm:py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm sm:text-base"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Rango: 0.1 - 5.0</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Fecha</label>
              <input
                type="date"
                value={form.grade_date}
                onChange={(e) => setForm({ ...form, grade_date: e.target.value })}
                className="w-full px-4 py-2 sm:py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-6 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-medium disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </span>
              ) : (
                'Crear Evaluación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}