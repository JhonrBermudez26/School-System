import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  Eye,
  Trash2,
  Edit,
  Award,
  Bell,
  X,
} from 'lucide-react';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';
import { fetchWithCsrf, deleteWithCsrf } from '@/Utils/csrf-utils';

export default function Tareas({ tasks: initialTasks = [], classInfo }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notification, setNotification] = useState(null);

  // ===== MOSTRAR NOTIFICACIÓN TEMPORAL =====
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(
        `/profesor/clases/tasks?subject_id=${classInfo.subject_id}&group_id=${classInfo.group_id}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  useEffect(() => {
    if (classInfo.subject_id && classInfo.group_id) {
      loadTasks();

      console.log(`📡 Profesor escuchando tareas en grupo: ${classInfo.group_id}`);

      const channel = window.Echo?.channel(`group.${classInfo.group_id}`);

      if (channel) {
        channel
          .listen('.task.created', (data) => {
            console.log("✅ Nueva tarea recibida por Echo:", data);
            showNotification(`📚 Tarea creada: ${data.title}`, 'success');
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
          .listen('.submission.created', (data) => {
            console.log("📥 Nueva entrega recibida:", data);
            showNotification(`📥 ${data.message}`, 'info');
            loadTasks();
          })
          .listen('.submission.updated', (data) => {
            console.log("📝 Entrega actualizada:", data);
            showNotification(`📝 ${data.message}`, 'info');
            loadTasks();
          });
      }

      return () => {
        if (channel) {
          console.log("🔌 Desconectando canal de tareas");
          channel.stopListening('.task.created')
            .stopListening('.task.updated')
            .stopListening('.task.deleted')
            .stopListening('.submission.created')
            .stopListening('.submission.updated');
        }
      };
    }
  }, [classInfo.subject_id, classInfo.group_id]);

  const handleTaskCreated = () => {
    setShowForm(false);
    setEditingTask(null);
    loadTasks();
    showNotification('✅ Tarea guardada exitosamente', 'success');
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea? Se eliminarán todas las entregas asociadas.')) {
      return;
    }

    try {
      const response = await deleteWithCsrf(`/profesor/clases/tasks/${taskId}`);

      if (response.ok) {
        showNotification('🗑️ Tarea eliminada exitosamente', 'success');
        loadTasks();
      } else {
        const data = await response.json();
        alert(data.message || 'Error al eliminar la tarea');
      }
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      alert('Error al eliminar la tarea: ' + error.message);
    }
  };

  const handleViewTask = async (task) => {
    try {
      const response = await fetch(`/profesor/clases/tasks/${task.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // NO necesitas X-CSRF-TOKEN en GET (Laravel lo valida solo en métodos que modifican estado)
        },
        credentials: 'include', // importante si usas cookies/sesión
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', response.status, errorData);
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      setSelectedTask(data.task);
      setShowDetail(true);
    } catch (error) {
      console.error('Error al cargar detalles de tarea:', error);
      alert('Error al cargar los detalles de la tarea: ' + (error.message || 'Revisa la consola'));
    }
  };

  const getWorkTypeLabel = (type) => {
    const labels = {
      individual: 'Individual',
      pairs: 'En parejas',
      group: 'Grupal'
    };
    return labels[type] || type;
  };

  const getStatusColor = (task) => {
    if (task.is_closed) return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300';
    if (task.is_past_due) return 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300';
    return 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-700 border border-green-300';
  };

  const getStatusText = (task) => {
    if (task.is_closed) return 'Cerrada';
    if (task.is_past_due) return 'Vencida';
    return 'Activa';
  };

  // ===== COMPONENTE DE NOTIFICACIÓN =====
  const NotificationBanner = () => {
    if (!notification) return null;

    const bgColors = {
      success: 'bg-green-500',
      info: 'bg-blue-500',
      warning: 'bg-orange-500',
      error: 'bg-red-500'
    };

    return (
      <div className={`fixed top-4 right-4 z-50 ${bgColors[notification.type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in`}>
        <Bell className="h-5 w-5" />
        <span className="font-semibold">{notification.message}</span>
        <button onClick={() => setNotification(null)} className="ml-4 hover:bg-white/20 rounded-lg p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  if (showForm) {
    return (
      <>
        <NotificationBanner />
        <TaskForm
          classInfo={classInfo}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          onTaskCreated={handleTaskCreated}
          editingTask={editingTask}
        />
      </>
    );
  }

  if (showDetail && selectedTask) {
    return (
      <>
        <NotificationBanner />
        <TaskDetail
          task={selectedTask}
          onClose={() => {
            setShowDetail(false);
            setSelectedTask(null);
          }}
          onUpdate={loadTasks}
        />
      </>
    );
  }

  return (
    <>
      <NotificationBanner />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ClipboardList className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                Tareas
              </h2>
              <p className="text-gray-600 ml-15">
                {tasks.length} {tasks.length === 1 ? 'tarea creada' : 'tareas creadas'}
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 rounded-2xl
                bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold
                hover:from-blue-700 hover:to-indigo-700 
                transition-all shadow-xl hover:shadow-2xl
                hover:scale-105 active:scale-95
                group"
            >
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* Lista de tareas */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 sm:p-16 text-center border border-gray-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              No hay tareas creadas
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Crea tu primera tarea para que tus estudiantes puedan comenzar a trabajar
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold
                hover:from-blue-700 hover:to-indigo-700 
                transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Crear Primera Tarea
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-blue-200 transition-all duration-300"
              >
                <div className="p-5 sm:p-7">
                  {/* Header de la tarea */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                          {task.title}
                        </h3>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(task)}`}>
                          {getStatusText(task)}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewTask(task)}
                        className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all group"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowForm(true);
                        }}
                        className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all group"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Información de la tarea */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Tipo</p>
                        <p className="text-sm font-bold text-gray-900">{getWorkTypeLabel(task.work_type)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600 font-medium">Vence</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {new Date(task.due_date).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Puntos</p>
                        <p className="text-sm font-bold text-gray-900">{task.max_score}</p>
                      </div>
                    </div>

                    {task.attachments?.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📎</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Archivos</p>
                          <p className="text-sm font-bold text-gray-900">{task.attachments.length}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estadísticas de entregas */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-100">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                          {task.stats.total}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 font-medium">
                          Total
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">
                          {task.stats.submitted}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 font-medium">
                          Entregadas
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                          {task.stats.graded}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 font-medium">
                          Calificadas
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                          {task.stats.pending}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 font-medium">
                          Pendientes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}