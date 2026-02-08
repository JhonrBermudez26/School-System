import { useState, useEffect } from 'react';
import {
  ClipboardList, Calendar, Award, Users, FileText, Upload,
  CheckCircle, Clock, AlertCircle, Download, X, Paperclip,
  Eye, Send, Loader2, Trash2, Filter, Bell, UserPlus,
  UserMinus, Edit, Save, XCircle
} from 'lucide-react';

export default function Tareas({ tasks: initialTasks = [], classInfo }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submissionComment, setSubmissionComment] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [notification, setNotification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  
  // Estado para gestión de grupos
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [availableClassmates, setAvailableClassmates] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingClassmates, setLoadingClassmates] = useState(false);

  // ===== MOSTRAR NOTIFICACIÓN TEMPORAL =====
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ===== CARGA INICIAL Y ACTUALIZACIÓN =====
  const loadTasks = async () => {
    try {
      const response = await fetch(
        `/estudiante/tasks?subject_id=${classInfo.subject_id}&group_id=${classInfo.group_id}`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  // ===== CARGAR COMPAÑEROS DISPONIBLES =====
  const loadAvailableClassmates = async (taskId) => {
    setLoadingClassmates(true);
    try {
      const response = await fetch(`/estudiante/tasks/${taskId}/available-classmates`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableClassmates(data);
      }
    } catch (error) {
      console.error('Error cargando compañeros:', error);
    } finally {
      setLoadingClassmates(false);
    }
  };

  // ===== ESCUCHA DE EVENTOS EN TIEMPO REAL =====
  useEffect(() => {
    if (!classInfo.subject_id || !classInfo.group_id) return;
    
    loadTasks();
    console.log(`📡 Estudiante escuchando tareas en grupo: ${classInfo.group_id}`);
    
    const channel = window.Echo?.channel(`group.${classInfo.group_id}`);
    
    if (channel) {
      console.log(`✅ Conectado al canal: group.${classInfo.group_id}`);
      
      channel
        .listen('.task.created', (data) => {
          console.log("✅ Nueva tarea recibida:", data);
          showNotification(`📚 Nueva tarea: ${data.title}`, 'success');
          loadTasks();
        })
        .listen('.task.updated', (data) => {
          console.log("🔄 Tarea actualizada:", data);
          showNotification(`📝 Tarea actualizada: ${data.title}`, 'info');
          loadTasks();
        })
        .listen('.task.deleted', (data) => {
          console.log("🗑️ Tarea eliminada:", data);
          showNotification(`🗑️ ${data.message}`, 'warning');
          loadTasks();
        })
        .listen('.submission.graded', (data) => {
          console.log("⭐ Entrega calificada:", data);
          if (data.affected_students.includes(window.userId)) {
            showNotification(`⭐ ${data.message}`, 'success');
            loadTasks();
          }
        });
    } else {
      console.error('❌ Echo no está disponible');
    }

    return () => {
      if (channel) {
        console.log(`🔌 Desconectando canal: group.${classInfo.group_id}`);
        channel.stopListening('.task.created')
          .stopListening('.task.updated')
          .stopListening('.task.deleted')
          .stopListening('.submission.graded');
      }
    };
  }, [classInfo.subject_id, classInfo.group_id]);

  // ===== UTILIDADES =====
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
          icon: Award,
          badge: '✓'
        };
      }
      if (task.submission.status === 'submitted') {
        return {
          color: 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 border border-green-300',
          text: 'Entregada',
          icon: CheckCircle,
          badge: '✓'
        };
      }
    }
    
    if (task.is_closed) {
      return {
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300',
        text: 'Cerrada',
        icon: AlertCircle,
        badge: '✕'
      };
    }
    
    if (task.is_past_due) {
      return {
        color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300',
        text: 'Vencida',
        icon: AlertCircle,
        badge: '!'
      };
    }
    
    return {
      color: 'bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-700 border border-orange-300',
      text: 'Pendiente',
      icon: Clock,
      badge: '⏱'
    };
  };

  // ===== FILTRADO DE TAREAS =====
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'pending':
        return tasks.filter(t => !t.submission || t.submission.status === 'pending');
      case 'submitted':
        return tasks.filter(t => t.submission?.status === 'submitted');
      case 'graded':
        return tasks.filter(t => t.submission?.status === 'graded');
      case 'overdue':
        return tasks.filter(t => (!t.submission || t.submission.status === 'pending') && t.is_past_due && !t.is_closed);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  // ===== CONTADORES =====
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => !t.submission || t.submission.status === 'pending').length,
    submitted: tasks.filter(t => t.submission?.status === 'submitted').length,
    graded: tasks.filter(t => t.submission?.status === 'graded').length,
    overdue: tasks.filter(t => (!t.submission || t.submission.status === 'pending') && t.is_past_due && !t.is_closed).length,
  };

  // ===== HANDLERS =====
  const handleViewTask = (task) => {
    setSelectedTask(task);
    if (task.submission) {
      setSubmissionComment(task.submission.comment || '');
    }
  };

  const handleShowSubmit = (task, isEdit = false) => {
    setSelectedTask(task);
    setShowSubmit(true);
    setIsEditing(isEdit);
    setEditingSubmissionId(isEdit ? task.submission?.id : null);
    setSubmissionComment(task.submission?.comment || '');
    setFiles([]);
    
    const currentMembers = task.submission?.members?.map(m => m.student_id) || [];
    setSelectedMembers(currentMembers);
    
    if (task.work_type !== 'individual') {
      loadAvailableClassmates(task.id);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`El archivo ${file.name} excede el tamaño máximo de 20MB`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = async (fileId) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;
    
    try {
      const response = await fetch(`/estudiante/tasks/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        showNotification('Archivo eliminado', 'success');
        loadTasks();
        if (selectedTask) {
          const updatedTask = tasks.find(t => t.id === selectedTask.id);
          setSelectedTask(updatedTask);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar el archivo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const toggleMemberSelection = (studentId) => {
    setSelectedMembers(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        const maxMembers = selectedTask.work_type === 'pairs' ? 1 : (selectedTask.max_group_members - 1);
        if (prev.length >= maxMembers) {
          alert(`Solo puedes seleccionar hasta ${maxMembers} compañero(s)`);
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    
    if (!submissionComment.trim() && files.length === 0 && (!isEditing || selectedTask.submission?.files?.length === 0)) {
      alert('Debes escribir un comentario o adjuntar archivos');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('task_id', selectedTask.id);
      formData.append('comment', submissionComment);
      
      if (isEditing && editingSubmissionId) {
        formData.append('submission_id', editingSubmissionId);
      }

      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      if (selectedTask.work_type !== 'individual') {
        selectedMembers.forEach((memberId, index) => {
          formData.append(`member_ids[${index}]`, memberId);
        });
      }

      const response = await fetch('/estudiante/tasks/submit', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        setShowSubmit(false);
        setSelectedTask(null);
        setSubmissionComment('');
        setFiles([]);
        setSelectedMembers([]);
        setIsEditing(false);
        setEditingSubmissionId(null);
        loadTasks();
        showNotification(isEditing ? '✅ Entrega actualizada' : '✅ Tarea entregada exitosamente', 'success');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al enviar la tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar la tarea. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('¿Estás seguro de remover este miembro?')) return;
    
    try {
      const response = await fetch(`/estudiante/tasks/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        showNotification('Miembro removido', 'success');
        loadTasks();
        if (selectedTask) {
          const updatedTask = tasks.find(t => t.id === selectedTask.id);
          setSelectedTask(updatedTask);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al remover miembro');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al remover miembro');
    }
  };

  const downloadFile = (filePath, fileName) => {
    const link = document.createElement('a');
    link.href = `/storage/${filePath}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ===== COMPONENTE SELECTOR DE MIEMBROS =====
  const MemberSelector = () => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200">
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
          <span>Selecciona compañeros para trabajar</span>
        </div>
        <span className="text-xs text-purple-600 sm:ml-auto">
          {selectedMembers.length}/{selectedTask.work_type === 'pairs' ? 1 : (selectedTask.max_group_members - 1)} seleccionados
        </span>
      </h3>
      
      {loadingClassmates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-600" />
        </div>
      ) : availableClassmates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No hay compañeros disponibles</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableClassmates.map((classmate) => (
            <button
              key={classmate.id}
              onClick={() => toggleMemberSelection(classmate.id)}
              className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all ${
                selectedMembers.includes(classmate.id)
                  ? 'bg-purple-100 border-2 border-purple-400'
                  : 'bg-white border-2 border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selectedMembers.includes(classmate.id) ? 'bg-purple-200' : 'bg-gray-200'
                }`}>
                  <Users className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    selectedMembers.includes(classmate.id) ? 'text-purple-700' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{classmate.name}</p>
                  <p className="text-xs text-gray-600 truncate hidden sm:block">{classmate.email}</p>
                </div>
              </div>
              {selectedMembers.includes(classmate.id) && (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ===== RENDER: VACÍO =====
  if (tasks.length === 0) {
    return (
      <>
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 lg:p-16 text-center border border-gray-100">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <ClipboardList className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            No hay tareas disponibles
          </h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
            Cuando tu profesor cree tareas, aparecerán aquí automáticamente
          </p>
        </div>
      </>
    );
  }

  // ===== RENDER: MODAL DE DETALLE =====
  if (selectedTask && !showSubmit) {
    const statusInfo = getStatusInfo(selectedTask);
    const StatusIcon = statusInfo.icon;
    const canEdit = selectedTask.submission?.is_creator &&
      selectedTask.submission?.status !== 'graded' &&
      !selectedTask.is_closed;

    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-h-[98vh] sm:max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">{selectedTask.title}</h2>
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold mt-1 ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                    <span className="hidden xs:inline">{statusInfo.text}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 sm:p-2.5 hover:bg-white rounded-xl transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Descripción */}
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-3">Descripción</h3>
                <div className="prose prose-sm max-w-none text-sm sm:text-base text-gray-700 bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 whitespace-pre-wrap">
                  {selectedTask.description}
                </div>
              </div>

              {/* Información */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-100">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600">Tipo</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{getWorkTypeLabel(selectedTask.work_type)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-100">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
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
                
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl border border-green-100">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Puntos</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{selectedTask.max_score}</p>
                  </div>
                </div>
                
                {selectedTask.submission?.score !== null && selectedTask.submission?.score !== undefined && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-100 col-span-2 lg:col-span-1">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Tu nota</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">
                        {selectedTask.submission.score}/{selectedTask.max_score}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Archivos adjuntos de la tarea */}
              {selectedTask.attachments?.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    <span>Archivos de la tarea ({selectedTask.attachments.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((att) => (
                      <button
                        key={att.id}
                        onClick={() => downloadFile(att.file_path, att.file_name)}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all w-full text-left group"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{att.file_name}</p>
                          <p className="text-xs text-gray-600">{(att.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tu entrega */}
              {selectedTask.submission && selectedTask.submission.status !== 'pending' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <span>Tu entrega</span>
                      {selectedTask.submission.is_creator && (
                        <span className="px-2 py-0.5 bg-blue-200 text-blue-700 text-xs rounded-full">
                          Creador
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-blue-600 sm:ml-auto">
                      {new Date(selectedTask.submission.submitted_at).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </h3>

                  {/* Miembros del grupo */}
                  {selectedTask.submission.members?.length > 0 && (
                    <div className="mb-4 bg-white rounded-xl p-3 sm:p-4 border border-blue-100">
                      <p className="text-xs font-bold text-gray-700 mb-2 sm:mb-3">
                        Trabajo en {selectedTask.work_type === 'pairs' ? 'pareja' : 'grupo'}:
                      </p>
                      <div className="space-y-2">
                        {selectedTask.submission.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{member.student_name}</span>
                              {member.is_creator && (
                                <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full flex-shrink-0">
                                  Creador
                                </span>
                              )}
                            </div>
                            {canEdit && !member.is_creator && (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                                title="Remover miembro"
                              >
                                <UserMinus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comentario */}
                  {selectedTask.submission.comment && (
                    <div className="bg-white rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-blue-100">
                      <p className="text-xs font-bold text-gray-600 mb-2">Comentario:</p>
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.submission.comment}</p>
                    </div>
                  )}

                  {/* Archivos entregados */}
                  {selectedTask.submission.files?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700 mb-2">Archivos entregados:</p>
                      {selectedTask.submission.files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-blue-100">
                          <button
                            onClick={() => downloadFile(file.file_path, file.file_name)}
                            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 hover:bg-blue-50 transition-all text-left group"
                          >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-gray-900 flex-1 truncate">{file.file_name}</span>
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteExistingFile(file.id)}
                              className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                              title="Eliminar archivo"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Retroalimentación del profesor */}
                  {selectedTask.submission.teacher_feedback && (
                    <div className="mt-3 sm:mt-4 bg-yellow-50 rounded-xl p-3 sm:p-4 border-2 border-yellow-200">
                      <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
                        Retroalimentación del profesor:
                      </p>
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.submission.teacher_feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors text-sm sm:text-base"
              >
                Cerrar
              </button>
              
              {(!selectedTask.submission || selectedTask.submission.status === 'pending') && !selectedTask.is_closed && (
                <button
                  onClick={() => handleShowSubmit(selectedTask, false)}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  Entregar tarea
                </button>
              )}
              
              {selectedTask.submission?.is_creator &&
                selectedTask.submission?.status !== 'graded' &&
                !selectedTask.is_closed && (
                  <button
                    onClick={() => handleShowSubmit(selectedTask, true)}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                    Editar entrega
                  </button>
                )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== RENDER: MODAL DE ENTREGA/EDICIÓN =====
  if (showSubmit && selectedTask) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-h-[98vh] sm:max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  {isEditing ? <Edit className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" /> : <Upload className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                    {isEditing ? 'Editar entrega' : 'Entregar tarea'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedTask.title}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSubmit(false);
                  setSelectedTask(null);
                  setIsEditing(false);
                  setEditingSubmissionId(null);
                }}
                className="p-2 sm:p-2.5 hover:bg-white rounded-xl transition-colors flex-shrink-0"
                disabled={submitting}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Selector de miembros */}
              {selectedTask.work_type !== 'individual' && (
                <MemberSelector />
              )}

              {/* Comentario */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
                  Comentario sobre tu entrega
                </label>
                <textarea
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none transition-all text-sm sm:text-base"
                  rows={5}
                  value={submissionComment}
                  onChange={e => setSubmissionComment(e.target.value)}
                  placeholder="Escribe aquí tu respuesta, reflexión o comentarios sobre la tarea..."
                  disabled={submitting}
                />
              </div>

              {/* Archivos existentes */}
              {isEditing && selectedTask.submission?.files?.length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-3">
                    Archivos actuales
                  </label>
                  <div className="space-y-2">
                    {selectedTask.submission.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{file.file_name}</p>
                            <p className="text-xs text-gray-600">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteExistingFile(file.id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          disabled={submitting}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivos nuevos */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-blue-600" />
                  {isEditing ? 'Agregar más archivos' : 'Archivos adjuntos'}
                </label>
                
                <div className="flex items-center justify-center w-full mb-3 sm:mb-4">
                  <label className="w-full flex flex-col items-center px-4 sm:px-6 py-8 sm:py-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl sm:rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 mb-1">Selecciona archivos</span>
                    <span className="text-xs text-gray-500 text-center px-2">PDF, Word, imágenes, hasta 20 MB por archivo</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
                      disabled={submitting}
                    />
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 mb-2">
                      Archivos nuevos ({files.length})
                    </p>
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{f.name}</p>
                            <p className="text-xs text-gray-600">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          disabled={submitting}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowSubmit(false);
                  setSelectedTask(null);
                  setIsEditing(false);
                  setEditingSubmissionId(null);
                }}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors text-sm sm:text-base"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!submissionComment.trim() && files.length === 0 && (!isEditing || selectedTask.submission?.files?.length === 0))}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    {isEditing ? 'Actualizando...' : 'Enviando...'}
                  </>
                ) : (
                  <>
                    {isEditing ? <Save className="h-4 w-4 sm:h-5 sm:w-5" /> : <Send className="h-4 w-4 sm:h-5 sm:w-5" />}
                    {isEditing ? 'Guardar cambios' : 'Entregar tarea'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== RENDER: LISTA PRINCIPAL =====
  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
            </div>
            <span className="truncate">Tareas</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-15">
            {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'} • {counts.pending} pendiente{counts.pending !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tabs de filtro */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 sm:border-2 p-2 sm:p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2">
            {[
              { key: 'all', label: 'Todas', count: counts.all, icon: ClipboardList },
              { key: 'pending', label: 'Pendientes', count: counts.pending, icon: Clock },
              { key: 'submitted', label: 'Entregadas', count: counts.submitted, icon: CheckCircle },
              { key: 'graded', label: 'Calificadas', count: counts.graded, icon: Award },
              { key: 'overdue', label: 'Vencidas', count: counts.overdue, icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold transition-all relative overflow-hidden text-sm sm:text-base
                    ${activeTab === tab.key
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sm:shadow-xl scale-105'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm lg:text-base truncate">{tab.label.split(' ')[0]}</span>
                  </div>
                  <span className={`
                    absolute -top-1 -right-1 sm:relative sm:top-auto sm:right-auto sm:ml-1 sm:inline-flex px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold
                    ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'}
                  `}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de tareas */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Filter className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No hay tareas en esta categoría</h3>
            <p className="text-sm sm:text-base text-gray-500">Prueba con otro filtro</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {filteredTasks.map((task) => {
              const statusInfo = getStatusInfo(task);
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 sm:border-2 overflow-hidden hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
                >
                  <div className="p-4 sm:p-5 lg:p-7">
                    <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{task.title}</h3>
                          <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 sm:gap-1.5 ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden xs:inline">{statusInfo.text}</span>
                          </span>
                          {task.submission?.members?.length > 0 && (
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="hidden xs:inline">{task.work_type === 'pairs' ? 'En pareja' : 'En grupo'}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">{task.description}</p>
                      </div>
                      <button
                        onClick={() => handleViewTask(task)}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all whitespace-nowrap shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver detalles</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-100">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-600">Tipo</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{getWorkTypeLabel(task.work_type)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-100">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
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

                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl border border-green-100">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-600">Puntos</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-900">{task.max_score}</p>
                        </div>
                      </div>

                      {task.submission?.score !== null && task.submission?.score !== undefined && (
                        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-100 col-span-2 lg:col-span-1">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">Tu nota</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900">
                              {task.submission.score}/{task.max_score}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {(!task.submission || task.submission.status === 'pending') && !task.is_closed && (
                      <button
                        onClick={() => handleShowSubmit(task, false)}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 sm:py-3.5 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                        Entregar tarea
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}