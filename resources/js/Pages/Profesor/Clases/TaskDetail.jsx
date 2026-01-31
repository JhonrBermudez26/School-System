import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  AlertCircle,
  Star,
  MessageSquare,
  Award,
  TrendingUp,
  UserCheck,
  Loader2,
  Edit3,
  Send
} from 'lucide-react';

export default function TaskDetail({ task: initialTask, onClose, onUpdate }) {
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadTaskDetails();
  }, [initialTask.id]);



  const loadTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/profesor/clases/tasks/${initialTask.id}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setStats(data.stats || {});   // ← guardas stats aparte
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  };



  const getFilteredSubmissions = () => {
    if (!task.submissions) return [];

    switch (activeTab) {
      case 'submitted':
        return task.submissions.filter(s => s.status === 'submitted' || s.status === 'graded');
      case 'pending':
        return task.submissions.filter(s => s.status === 'pending');
      case 'graded':
        return task.submissions.filter(s => s.status === 'graded');
      default:
        return task.submissions;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300',
      submitted: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300',
      graded: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 border border-green-300',
      returned: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      submitted: 'Entregado',
      graded: 'Calificado',
      returned: 'Devuelto',
    };
    return labels[status] || status;
  };

  const downloadFile = (filePath, fileName) => {
    const link = document.createElement('a');
    link.href = `/storage/${filePath}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-12 sm:p-16 text-center border border-gray-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-lg font-semibold text-gray-700 mb-2">Cargando detalles...</p>
        <p className="text-sm text-gray-500">Esto puede tardar unos segundos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-6 sm:px-8 py-6 flex items-center justify-between relative overflow-hidden">
          {/* Efectos decorativos */}
          <div className="absolute inset-0 bg-white/10 transform -skew-y-3 origin-top-right"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {task.title}
              </h2>
              <p className="text-blue-100 text-sm mt-1">Detalles de la tarea</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Descripción */}
          <div className="prose prose-sm sm:prose-base max-w-none mb-6">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </div>
          </div>

          {/* Metadata en grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="text-xs font-semibold text-blue-900">Tipo</div>
              </div>
              <div className="font-bold text-gray-900 text-sm">
                {task.work_type === 'individual' ? 'Individual' :
                  task.work_type === 'pairs' ? 'Parejas' : 'Grupal'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-green-600" />
                <div className="text-xs font-semibold text-green-900">Puntos</div>
              </div>
              <div className="font-bold text-gray-900 text-sm">{task.max_score} pts</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div className="text-xs font-semibold text-orange-900">Entrega</div>
              </div>
              <div className="font-bold text-gray-900 text-xs">
                {new Date(task.due_date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </div>
            </div>

            {task.close_date && (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <div className="text-xs font-semibold text-red-900">Cierre</div>
                </div>
                <div className="font-bold text-gray-900 text-xs">
                  {new Date(task.close_date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Archivos adjuntos */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Archivos adjuntos ({task.attachments.length})
              </h3>
              <div className="grid gap-2">
                {task.attachments.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => downloadFile(file.file_path, file.file_name)}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-bold text-gray-900 truncate">{file.file_name}</div>
                      <div className="text-xs text-gray-600">
                        {(file.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Download className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estadísticas mejoradas */}
          {/* Estadísticas mejoradas */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div>
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {task.stats?.total || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-semibold">Total estudiantes</div>
              </div>

              <div>
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {task.stats?.submitted || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-semibold">Entregadas</div>
              </div>

              <div>
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {task.stats?.graded || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-semibold">Calificadas</div>
              </div>

              <div>
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {task.stats?.pending || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1 font-semibold">Pendientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de filtros mejorados */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-3">
        <div className="grid grid-cols-2 sm:flex gap-2">
          {[
            { key: 'all', label: 'Todas', count: task.submissions?.length || 0, icon: Users },
            { key: 'submitted', label: 'Entregadas', count: task.submissions?.filter(s => s.status === 'submitted' || s.status === 'graded').length || 0, icon: CheckCircle2 },
            { key: 'graded', label: 'Calificadas', count: task.submissions?.filter(s => s.status === 'graded').length || 0, icon: Star },
            { key: 'pending', label: 'Pendientes', count: task.submissions?.filter(s => s.status === 'pending').length || 0, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex-1 px-4 py-3 rounded-xl font-bold transition-all relative overflow-hidden
                  ${activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl scale-105'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </div>
                <span className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                  ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'}
                `}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de entregas mejorada */}
      <div className="space-y-4">
        {getFilteredSubmissions().length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 sm:p-16 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No hay entregas</h3>
            <p className="text-gray-500">No hay entregas en esta categoría</p>
          </div>
        ) : (
          getFilteredSubmissions().map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-5 sm:p-7 hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
            >
              {/* Header del estudiante */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                    {submission.student?.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {submission.student?.name || 'Estudiante'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {submission.student?.email}
                    </div>
                  </div>
                </div>

                {/* Estados */}
                <div className="flex flex-wrap items-center gap-2">
                  {submission.is_late && (
                    <span className="px-4 py-1.5 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-full text-xs font-bold border border-red-300 shadow-sm">
                      Tardía ⏰
                    </span>
                  )}
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(submission.status)}`}>
                    {getStatusLabel(submission.status)}
                  </span>
                </div>
              </div>

              {/* Información de entrega */}
              {submission.submitted_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 px-4 py-3 rounded-xl">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Entregado el {new Date(submission.submitted_at).toLocaleString('es-ES', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}</span>
                </div>
              )}

              {/* Comentario del estudiante */}
              {submission.comment && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div className="text-xs font-bold text-blue-900">Comentario del estudiante:</div>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">{submission.comment}</div>
                </div>
              )}

              {/* Archivos entregados */}
              {submission.files && submission.files.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Archivos entregados ({submission.files.length})
                  </div>
                  <div className="space-y-2">
                    {submission.files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => downloadFile(file.file_path, file.file_name)}
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 transition-all w-full text-left group"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{file.file_name}</span>
                        <Download className="h-5 w-5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calificación */}
              {submission.status === 'graded' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="font-bold text-green-900 text-lg">Calificación</span>
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      {submission.score}<span className="text-2xl text-green-500">/{task.max_score}</span>
                    </div>
                  </div>
                  {submission.teacher_feedback && (
                    <div className="mt-4 pt-4 border-t-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-green-700" />
                        <div className="text-xs font-bold text-green-900">Retroalimentación:</div>
                      </div>
                      <div className="text-sm text-green-900 leading-relaxed">{submission.teacher_feedback}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Acción de calificar */}
              {submission.status === 'submitted' && (
                <button
                  className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                  onClick={() => {
                    alert('Funcionalidad de calificación próximamente');
                  }}
                >
                  <Star className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Calificar entrega
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}