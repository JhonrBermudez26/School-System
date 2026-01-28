import { useState } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import { Folder, File, Upload, FolderPlus, X, Download, Trash2, ChevronRight, FileText } from 'lucide-react';

export default function Archivos() {
  const { props } = usePage();
  const { classInfo, folders = [], files = [] } = props;

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);

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
      onFinish: () => {
      }
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

  const currentFolders = selectedFolder
    ? folders.filter(f => f.parent_id === selectedFolder)
    : folders.filter(f => !f.parent_id);

  const currentFiles = selectedFolder
    ? files.filter(f => f.folder_id === selectedFolder)
    : files.filter(f => !f.folder_id);

  const currentFolderObj = selectedFolder ? folders.find(f => f.id === selectedFolder) : null;

  // Construir el breadcrumb path completo
  const getBreadcrumbPath = () => {
    if (!selectedFolder) return [];
    
    const path = [];
    let currentId = selectedFolder;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      
      path.unshift(folder); // Agregar al inicio
      currentId = folder.parent_id;
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
        <button 
          onClick={() => setSelectedFolder(null)} 
          className={`hover:text-blue-600 transition-colors ${!selectedFolder ? 'font-medium text-gray-900' : ''}`}
        >
          Raíz
        </button>
        
        {breadcrumbPath.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => setSelectedFolder(folder.id)}
              className={`hover:text-blue-600 transition-colors ${
                index === breadcrumbPath.length - 1 
                  ? 'font-medium text-gray-900' 
                  : ''
              }`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button
         onClick={openCreateFolder}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nueva carpeta
        </button>
        <button
          onClick={() => setShowUploadFile(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir archivos
        </button>
      </div>

      {/* Carpetas */}
      {currentFolders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentFolders.map(folder => (
            <div
              key={folder.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelectedFolder(folder.id)}
            >
              <div className="flex items-start justify-between">
                <Folder className="h-8 w-8 text-blue-500" />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-2 font-medium text-gray-900 truncate">{folder.name}</h3>
              {folder.description && (
                <p className="text-xs text-gray-500 truncate">{folder.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{folder.files_count || 0} archivos</p>
            </div>
          ))}
        </div>
      )}

      {/* Archivos */}
      {currentFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100">
          <div className="divide-y">
            {currentFiles.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                <div className="flex items-center gap-3 flex-1">
                  <File className="h-6 w-6 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.filename}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/storage/${file.path}`}
                    download
                    className="text-blue-600 hover:text-blue-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {currentFolders.length === 0 && currentFiles.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No hay carpetas ni archivos</p>
          <p className="text-sm text-gray-500 mt-1">Crea una carpeta o sube archivos para comenzar</p>
        </div>
      )}

      {/* Modal Crear Carpeta */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Nueva carpeta</h3>
              <button onClick={() => setShowCreateFolder(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={submitFolder} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nombre</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={folderForm.data.name}
                  onChange={e => folderForm.setData('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={folderForm.data.description}
                  onChange={e => folderForm.setData('description', e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  disabled={folderForm.processing}
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Subir Archivos */}
      {showUploadFile && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Subir archivos</h3>
              <button onClick={() => setShowUploadFile(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={submitFiles} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Selecciona archivos
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setUploadFiles(selected);
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      {uploadFiles.length} archivo(s) seleccionado(s):
                    </p>
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[300px]">{file.name}</span>
                        <span className="text-gray-400">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadFile(false)}
                  className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  disabled={fileForm.processing || uploadFiles.length === 0}
                >
                  Subir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}