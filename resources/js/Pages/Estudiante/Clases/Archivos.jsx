import { useState } from 'react';
import {
  Folder, File, Download, Home, ChevronRight, FileText,
  Image, Film, Music, Archive, Code, FileSpreadsheet
} from 'lucide-react';

export default function Archivos({ folders = [], files = [] }) {
  const [selectedFolder, setSelectedFolder] = useState(null);

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
    <div className="space-y-5">
      {/* Breadcrumb */}
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
                  <a
                    href={`/estudiante/files/${file.uuid}/download`}
                    className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all ml-4"
                    onClick={(e) => e.stopPropagation()}
                    title="Descargar archivo"
                  >
                    <Download className="h-5 w-5" />
                  </a>
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
          <p className="text-gray-500 max-w-md mx-auto">
            Cuando tu profesor suba archivos, aparecerán aquí para que puedas descargarlos
          </p>
        </div>
      )}
    </div>
  );
}