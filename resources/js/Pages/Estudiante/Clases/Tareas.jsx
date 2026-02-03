import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
  ClipboardList, Calendar, Award, Users, FileText, Upload,
  CheckCircle, Clock, AlertCircle, Download, X, Paperclip
} from 'lucide-react';

export default function Tareas({ tasks = [], classInfo }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState([]);

  const getWorkTypeLabel = (type) => {
    const labels = {
      individual: 'Individual',
      pairs: 'En parejas',
      group: 'Grupal'
    };
    return labels[type] || type;
  };

  const getStatusInfo = (task) => {
    if (task.submission) {
      if (task.submission.status === 'graded') {
        return {
          color: 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-700 border border-blue-300',
          text: 'Calificada',
          icon: CheckCircle
        };
      }
      return {
        color: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 border border-green-300',
        text: 'Entregada',
        icon: CheckCircle
      };
    }
    if (task.is_closed) {
      return {
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300',
        text: 'Cerrada',
        icon: AlertCircle
      };
    }
    if (task.is_past_due) {
      return {
        color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300',
        text: 'Vencida',
        icon: AlertCircle
      };
    }
    return {
      color: 'bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-700 border border-orange-300',
      text: 'Pendiente',
      icon: Clock
    };
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    if (task.submission) {
      setSubmissionText(task.submission.content || '');
    }
  };

  const handleShowSubmit = (task) => {
    setSelectedTask(task);
    setShowSubmit(true);
    setSubmissionText(task.submission?.content || '');
    setFiles([]);
  };

  const handleSubmit = () => {
    if (!selectedTask) return;

    const formData = new FormData();
    formData.append('task_id', selectedTask.id);
    formData.append('content', submissionText);
    files.forEach((file, index) => formData.append(`files[${index}]`, file));

    router.post(route('estudiante.tasks.submit'), formData, {
      onSuccess: () => {
        setShowSubmit(false);
        setSelectedTask(null);
        setSubmissionText('');
        setFiles([]);
        router.reload({ only: ['tasks'] });
      },
      onError: (errors) => {
        console.error('Error al enviar:', errors);
        alert('Error al enviar la tarea. Por favor intenta de nuevo.');
      },
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 sm:p-16 text-center border border-gray-100">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClipboardList className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          No hay tareas disponibles
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Cuando tu profesor cree tareas, aparecerán aquí
        </p>
      </div>
    );
  }

  // Modal de detalle/entrega
  if (selectedTask && !showSubmit) {
    const statusInfo = getStatusInfo(selectedTask);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{selectedTask.title}</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${statusInfo.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusInfo.text}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="p-2.5 hover:bg-white rounded-xl transition-colors flex-shrink-0"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Descripción */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">Descripción</h3>
              <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-5 border border-gray-200">
                {selectedTask.description}
              </div>
            </div>

            {/* Información */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Tipo</p>
                  <p className="text-sm font-bold text-gray-900">{getWorkTypeLabel(selectedTask.work_type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Vence</p>
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {new Date(selectedTask.due_date).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <Award className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Puntos</p>
                  <p className="text-sm font-bold text-gray-900">{selectedTask.max_score}</p>
                </div>
              </div>
              {selectedTask.submission?.score !== null && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <Award className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Tu nota</p>
                    <p className="text-sm font-bold text-gray-900">{selectedTask.submission.score}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Archivos adjuntos de la tarea */}
            {selectedTask.attachments?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">Archivos de la tarea</h3>
                <div className="space-y-2">
                  {selectedTask.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.type === 'link' ? att.url : `/storage/${att.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all"
                    >
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900 flex-1 truncate">
                        {att.filename || att.url}
                      </span>
                      <Download className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tu entrega */}
            {selectedTask.submission && (
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Tu entrega
                </h3>
                {selectedTask.submission.content && (
                  <div className="bg-white rounded-xl p-4 mb-4 border border-blue-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.submission.content}</p>
                  </div>
                )}
                {selectedTask.submission.attachments?.length > 0 && (
                  <div className="space-y-2">
                    {selectedTask.submission.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={`/storage/${att.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100 hover:bg-blue-50 transition-all"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900 flex-1 truncate">{att.filename}</span>
                        <Download className="h-4 w-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                )}
                {selectedTask.submission.feedback && (
                  <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-xs font-bold text-gray-800 mb-2">Retroalimentación del profesor:</p>
                    <p className="text-sm text-gray-700">{selectedTask.submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-5 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setSelectedTask(null)}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
            >
              Cerrar
            </button>
            {!selectedTask.submission && !selectedTask.is_closed && (
              <button
                onClick={() => handleShowSubmit(selectedTask)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Entregar tarea
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modal de entrega
  if (showSubmit && selectedTask) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
          <div className="px-6 sm:px-8 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Entregar tarea</h2>
            </div>
            <button
              onClick={() => {
                setShowSubmit(false);
                setSelectedTask(null);
              }}
              className="p-2.5 hover:bg-white rounded-xl transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Respuesta/Comentarios</label>
              <textarea
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none"
                rows={8}
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                placeholder="Escribe tu respuesta o comentarios sobre la tarea..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Paperclip className="h-4.5 w-4.5 text-blue-600" />
                Archivos adjuntos
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all group">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 mb-1">Selecciona archivos</span>
                  <span className="text-xs text-gray-500">PDF, Word, imágenes, hasta 20 MB</span>
                  <input
                    type="file"
                    multiple
                    onChange={e => setFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </div>
              {files.length > 0 && (
                <div className="space-y-2 mt-4">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{f.name}</p>
                          <p className="text-xs text-gray-600">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-t bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={() => {
                setShowSubmit(false);
                setSelectedTask(null);
              }}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!submissionText.trim() && files.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              Enviar tarea
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ClipboardList className="h-7 w-7 text-white" />
          </div>
          Tareas
        </h2>
        <p className="text-gray-600 ml-15">{tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}</p>
      </div>

      <div className="grid gap-5">
        {tasks.map((task) => {
          const statusInfo = getStatusInfo(task);
          const StatusIcon = statusInfo.icon;
          
          return (
            <div
              key={task.id}
              className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
            >
              <div className="p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{task.title}</h3>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 ${statusInfo.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{task.description}</p>
                  </div>
                  <button
                    onClick={() => handleViewTask(task)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all whitespace-nowrap"
                  >
                    Ver detalles
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Tipo</p>
                      <p className="text-sm font-bold text-gray-900">{getWorkTypeLabel(task.work_type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600">Vence</p>
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {new Date(task.due_date).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Puntos</p>
                      <p className="text-sm font-bold text-gray-900">{task.max_score}</p>
                    </div>
                  </div>
                  {task.submission?.score !== null && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <Award className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Tu nota</p>
                        <p className="text-sm font-bold text-gray-900">{task.submission.score}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!task.submission && !task.is_closed && (
                  <button
                    onClick={() => handleShowSubmit(task)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Entregar tarea
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}