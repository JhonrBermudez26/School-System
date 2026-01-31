// Archivos.jsx
import { useState } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import { 
  Folder, File, Upload, FolderPlus, X, Download, Trash2, 
  ChevronRight, FileText, Home, Image, Film, Music,
  Archive, Code, FileSpreadsheet, Edit3, Save, Loader2
} from 'lucide-react';

export default function Archivos() {
  const { props } = usePage();
  const { classInfo, folders = [], files = [] } = props;

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const folderForm = useForm({
    subject_id: classInfo.subject_id,
    group_id: classInfo.group_id,
    name: '',
    description: '',
    parent_id: null,
  });

  const openCreateFolder = () => {
    folderForm.setData({
      name: '',
      description: '',
      parent_id: selectedFolder || null,
      subject_id: classInfo.subject_id,
      group_id: classInfo.group_id,
    });
    setShowCreateFolder(true);
  };

  const fileForm = useForm({
    subject_id: classInfo.subject_id,
    group_id: classInfo.group_id,
    folder_id: null,
    files: [],
  });

  const submitFolder = (e) => {
    e.preventDefault();
    folderForm.setData('parent_id', selectedFolder || null);
    folderForm.post(route('profesor.folders.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreateFolder(false);
        folderForm.reset();
        router.reload({ only: ['folders'] });
      },
      onError: (errors) => {
        console.log('Errores al crear carpeta:', errors);
      }
    });
  };

  const submitFiles = (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    const formData = new FormData();
    formData.append('subject_id', classInfo.subject_id);
    formData.append('group_id', classInfo.group_id);
    if (selectedFolder) {
      formData.append('folder_id', selectedFolder);
    }
    uploadFiles.forEach((file) => {
      formData.append('files[]', file);
    });

    router.post(route('profesor.files.store'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setShowUploadFile(false);
        setUploadFiles([]);
        router.reload({ only: ['files', 'folders'] });
        alert('Archivos subidos correctamente');
      },
      onError: (errors) => {
        console.error('Errores al subir archivos:', errors);
        alert('Hubo un error al subir los archivos. Revisa la consola.');
      },
    });
  };

  const deleteFolder = (id) => {
    if (!confirm('¿Eliminar esta carpeta y todo su contenido?')) return;
    router.delete(route('profesor.folders.destroy', { folder: id }), {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['folders', 'files'] }),
    });
  };

  const deleteFile = (id) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    router.delete(route('profesor.files.destroy', { file: id }), {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['files'] }),
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFiles(Array.from(e.dataTransfer.files));
      setShowUploadFile(true);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconClass = "h-6 w-6";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className={iconClass} />;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
      return <Film className={iconClass} />;
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return <Music className={iconClass} />;
    } else if (['zip', 'rar', '7z'].includes(ext)) {
      return <Archive className={iconClass} />;
    } else if (['js', 'py', 'java', 'cpp', 'html', 'css'].includes(ext)) {
      return <Code className={iconClass} />;
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return <FileSpreadsheet className={iconClass} />;
    }
    return <FileText className={iconClass} />;
  };

  const currentFolders = selectedFolder
    ? folders.filter(f => f.parent_id === selectedFolder)
    : folders.filter(f => !f.parent_id);

  const currentFiles = selectedFolder
    ? files.filter(f => f.folder_id === selectedFolder)
    : files.filter(f => !f.folder_id);

  const getBreadcrumbPath = () => {
    if (!selectedFolder) return [];
    
    const path = [];
    let currentId = selectedFolder;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      
      path.unshift(folder);
      currentId = folder.parent_id;
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  return (
    <div 
      className="space-y-5"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Breadcrumb mejorado */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button 
            onClick={() => setSelectedFolder(null)} 
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
              ${!selectedFolder 
                ? 'bg-blue-100 text-blue-700 font-bold' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
              }
            `}
          >
            <Home className="h-4 w-4" />
            Inicio
          </button>
          
          {breadcrumbPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <button
                onClick={() => setSelectedFolder(folder.id)}
                className={`
                  px-3 py-1.5 rounded-lg transition-all
                  ${index === breadcrumbPath.length - 1 
                    ? 'bg-blue-100 text-blue-700 font-bold' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                  }
                `}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={openCreateFolder}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl 
            bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold
            hover:from-blue-700 hover:to-indigo-700 
            transition-all shadow-lg hover:shadow-xl
            group"
        >
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
            <FolderPlus className="h-5 w-5" />
          </div>
          Nueva carpeta
        </button>
        <button
          onClick={() => setShowUploadFile(true)}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl 
            border-2 border-blue-300 bg-white text-blue-700 font-bold
            hover:bg-blue-50 hover:border-blue-400
            transition-all shadow-md hover:shadow-lg
            group"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
            <Upload className="h-5 w-5" />
          </div>
          Subir archivos
        </button>
      </div>

      {/* Carpetas */}
      {currentFolders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Folder className="h-4 w-4 text-blue-600" />
            Carpetas ({currentFolders.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {currentFolders.map(folder => (
              <div
                key={folder.id}
                className="bg-white rounded-2xl border-2 border-gray-200 p-5 
                  hover:border-blue-400 hover:shadow-xl transition-all duration-200 
                  cursor-pointer group"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Folder className="h-7 w-7 text-blue-600" strokeWidth={2} />
                  </div>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deleteFolder(folder.id); 
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                  {folder.name}
                </h3>
                {folder.description && (
                  <p className="text-xs text-gray-500 truncate mb-2">{folder.description}</p>
                )}
                <p className="text-xs font-medium text-gray-400">
                  {folder.files_count || 0} {folder.files_count === 1 ? 'archivo' : 'archivos'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archivos */}
      {currentFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            Archivos ({currentFiles.length})
          </h3>
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="divide-y-2 divide-gray-100">
              {currentFiles.map(file => (
                <div 
                  key={file.id} 
                  className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {getFileIcon(file.filename)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {file.filename}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="font-medium">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(file.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={`/storage/${file.path}`}
                      download
                      className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                      onClick={(e) => e.stopPropagation()}
                      title="Descargar archivo"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {currentFolders.length === 0 && currentFiles.length === 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-12 sm:p-16 text-center border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Folder className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            No hay contenido aquí
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea una carpeta o sube archivos para comenzar a organizar tu material
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openCreateFolder}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
            >
              <FolderPlus className="h-5 w-5 mr-2" />
              Crear carpeta
            </button>
            <button
              onClick={() => setShowUploadFile(true)}
              className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              <Upload className="h-5 w-5 mr-2" />
              Subir archivos
            </button>
          </div>
        </div>
      )}

      {/* Overlay de drag & drop */}
      {dragActive && (
        <div className="fixed inset-0 z-40 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-dashed border-blue-500">
            <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-gray-900">Suelta los archivos aquí</p>
          </div>
        </div>
      )}

      {/* Modal Crear Carpeta */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FolderPlus className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Nueva carpeta</h3>
              </div>
              <button 
                onClick={() => setShowCreateFolder(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <form onSubmit={submitFolder} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Nombre de la carpeta *
                </label>
                <input
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl 
                    focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                    transition-all text-base"
                  value={folderForm.data.name}
                  onChange={e => folderForm.setData('name', e.target.value)}
                  required
                  placeholder="Ej: Material de clase"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl 
                    focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                    transition-all resize-none"
                  rows={3}
                  value={folderForm.data.description}
                  onChange={e => folderForm.setData('description', e.target.value)}
                  placeholder="Breve descripción del contenido..."
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  disabled={folderForm.processing}
                >
                  {folderForm.processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Crear carpeta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Subir Archivos */}
      {showUploadFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Subir archivos</h3>
              </div>
              <button 
                onClick={() => {
                  setShowUploadFile(false);
                  setUploadFiles([]);
                }}
                className="p-2 hover:bg-white rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <form onSubmit={submitFiles} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Selecciona los archivos
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-6 py-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-3 border-dashed border-blue-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <span className="text-base font-bold text-gray-800 mb-2">
                      Arrastra archivos o haz clic para seleccionar
                    </span>
                    <span className="text-sm text-gray-500">
                      Soporta múltiples archivos • Máximo 20 MB por archivo
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const selected = Array.from(e.target.files || []);
                        setUploadFiles(selected);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {uploadFiles.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-bold text-gray-800 mb-3">
                      {uploadFiles.length} archivo{uploadFiles.length !== 1 ? 's' : ''} seleccionado{uploadFiles.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadFile(false);
                    setUploadFiles([]);
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  disabled={fileForm.processing || uploadFiles.length === 0}
                >
                  {fileForm.processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Subiendo archivos...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Subir {uploadFiles.length} archivo{uploadFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}