import { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Calendar,
  AlertCircle,
  Image as ImageIcon,
  File,
  Award,
  Clock,
  Save,
  Loader2
} from 'lucide-react';

// Importar utilidades CSRF
import { fetchWithCsrf, deleteWithCsrf } from '@/Utils/csrf-utils';

export default function TaskForm({ classInfo, onClose, onTaskCreated, editingTask = null }) {
  const [formData, setFormData] = useState({
    title: editingTask?.title || '',
    description: editingTask?.description || '',
    work_type: editingTask?.work_type || 'individual',
    max_group_members: editingTask?.max_group_members || 3,
    due_date: editingTask?.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : '',
    close_date: editingTask?.close_date ? new Date(editingTask.close_date).toISOString().slice(0, 16) : '',
    allow_late_submission: editingTask?.allow_late_submission ?? true,
    max_score: editingTask?.max_score || 100,
  });

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(editingTask?.attachments || []);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const workTypes = [
    { value: 'individual', label: 'Individual', icon: '👤', description: 'Cada estudiante trabaja solo', color: 'from-blue-50 to-blue-100 border-blue-300' },
    { value: 'pairs', label: 'En parejas', icon: '👥', description: 'Trabajo en grupos de 2', color: 'from-purple-50 to-purple-100 border-purple-300' },
    { value: 'group', label: 'Grupal', icon: '👨‍👩‍👧‍👦', description: 'Grupos de 3 o más', color: 'from-green-50 to-green-100 border-green-300' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo ${file.name} excede el tamaño máximo de 10MB`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId) => {
    if (!confirm('¿Eliminar este archivo?')) return;

    try {
      const response = await deleteWithCsrf(`/profesor/clases/tasks/attachments/${attachmentId}`);

      if (response.ok) {
        setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar el archivo');
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alert('Error al eliminar el archivo: ' + error.message);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'El título es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.due_date) newErrors.due_date = 'La fecha de entrega es requerida';

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const now = new Date();

      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dueDateOnly < nowDateOnly) {
        newErrors.due_date = 'La fecha de entrega debe ser hoy o en el futuro';
      }
    }

    // Solo validar close_date si se proporcionó
    if (formData.close_date && formData.due_date) {
      const closeDate = new Date(formData.close_date);
      const dueDate = new Date(formData.due_date);
      if (closeDate <= dueDate) {
        newErrors.close_date = 'La fecha de cierre debe ser posterior a la fecha de entrega';
      }
    }

    if (formData.work_type === 'group' && (!formData.max_group_members || formData.max_group_members < 3)) {
      newErrors.max_group_members = 'Los grupos deben tener al menos 3 integrantes';
    }

    if (formData.max_score < 1) newErrors.max_score = 'La puntuación debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('subject_id', classInfo.subject_id);
      submitData.append('group_id', classInfo.group_id);

      // Agregar campos del formulario
      Object.keys(formData).forEach(key => {
        // No enviar close_date si está vacío
        if (key === 'close_date' && !formData[key]) {
          return;
        }

        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          if (typeof formData[key] === 'boolean') {
            submitData.append(key, formData[key] ? '1' : '0');
          } else {
            submitData.append(key, formData[key]);
          }
        }
      });

      // Agregar archivos adjuntos
      attachments.forEach((file) => {
        submitData.append('attachments[]', file);
      });

      const url = editingTask
        ? `/profesor/clases/tasks/${editingTask.id}`
        : '/profesor/clases/tasks';

      if (editingTask) {
        submitData.append('_method', 'PUT');
      }

      // Usar fetchWithCsrf que maneja automáticamente el token y reintentos
      const response = await fetchWithCsrf(url, {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Tarea guardada:', data);
        onTaskCreated();
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Error desconocido' };
        }

        if (errorData.errors) {
          setErrors(errorData.errors);
        }
        alert(errorData.message || 'Error al guardar la tarea');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      alert('Error al guardar la tarea: ' + (error.message || 'desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-6 sm:px-8 py-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 transform -skew-y-3 origin-top-right"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <FileText className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="relative p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Título de la tarea *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`w-full px-5 py-4 rounded-xl border-2 ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
              } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-base font-medium`}
            placeholder="Ej: Investigación sobre el sistema solar"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Descripción e instrucciones *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={6}
            className={`w-full px-5 py-4 rounded-xl border-2 ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
              } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all resize-none`}
            placeholder="Describe detalladamente lo que deben hacer los estudiantes..."
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Tipo de trabajo */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">
            Tipo de trabajo *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {workTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('work_type', type.value)}
                className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${formData.work_type === type.value
                  ? `bg-gradient-to-br ${type.color} shadow-lg scale-105`
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <div className="font-bold text-gray-900 mb-1">{type.label}</div>
                <div className="text-xs text-gray-600">{type.description}</div>
                {formData.work_type === type.value && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Máximo de integrantes (solo para grupos) */}
        {formData.work_type === 'group' && (
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Máximo de integrantes por grupo *
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={formData.max_group_members}
              onChange={(e) => handleChange('max_group_members', parseInt(e.target.value))}
              className={`w-full px-5 py-4 rounded-xl border-2 ${errors.max_group_members ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all`}
            />
            {errors.max_group_members && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.max_group_members}
              </p>
            )}
          </div>
        )}

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Fecha de entrega *
            </label>
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              className={`w-full px-5 py-4 rounded-xl border-2 ${errors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all`}
            />
            {errors.due_date && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.due_date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Fecha de cierre (opcional)
            </label>
            <input
              type="datetime-local"
              value={formData.close_date}
              onChange={(e) => handleChange('close_date', e.target.value)}
              className={`w-full px-5 py-4 rounded-xl border-2 ${errors.close_date ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all`}
            />
            {errors.close_date && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                {errors.close_date}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Si no se especifica, las entregas tardías estarán permitidas indefinidamente (según configuración)
            </p>
          </div>
        </div>

        {/* Puntuación máxima */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-green-600" />
            Puntuación máxima *
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="5"
            value={formData.max_score}
            onChange={(e) => handleChange('max_score', parseInt(e.target.value))}
            className={`w-full px-5 py-4 rounded-xl border-2 ${errors.max_score ? 'border-red-300 bg-red-50' : 'border-gray-200'
              } focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all`}
          />
          {errors.max_score && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.max_score}
            </p>
          )}
        </div>

        {/* Permitir entregas tardías */}
        <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
          <input
            type="checkbox"
            id="allow_late"
            checked={formData.allow_late_submission}
            onChange={(e) => handleChange('allow_late_submission', e.target.checked)}
            className="w-6 h-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="allow_late" className="text-sm text-gray-800 cursor-pointer font-medium flex-1">
            Permitir entregas con retraso (después de la fecha de entrega pero antes del cierre)
          </label>
        </div>

        {/* Archivos adjuntos */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">
            Archivos adjuntos (opcional)
          </label>

          {/* Archivos existentes */}
          {existingAttachments.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 mb-2">Archivos actuales:</p>
              {existingAttachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      {getFileIcon(file.file_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{file.file_name}</div>
                      <div className="text-xs text-gray-600">
                        {formatFileSize(file.file_size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingAttachment(file.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Nuevos archivos */}
          {attachments.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-green-700 mb-2">Archivos nuevos:</p>
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{file.name}</div>
                      <div className="text-xs text-gray-600">
                        {formatFileSize(file.size)} • Nuevo
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón para subir archivos */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-blue-300 rounded-2xl p-8 hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
          >
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-sm font-bold text-gray-700 mb-1">
              Haz clic para adjuntar archivos
            </div>
            <div className="text-xs text-gray-500">
              Máximo 10MB por archivo • PDF, Word, Excel, imágenes
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {editingTask ? 'Actualizar Tarea' : 'Crear Tarea'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}