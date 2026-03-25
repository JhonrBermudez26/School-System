import { useEffect, useRef, useState } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import {
  Plus, Bold, Italic, Underline, Paperclip, X, Edit, Trash2,
  Link as LinkIcon, MessageSquare, Clock, FileText, Download, Save,
  User
} from 'lucide-react';
import { sanitizeHtml } from '@/Utils/sanitize';

export default function Publicaciones({ publicaciones = [], classInfo }) {
  const { props: inertiaProps } = usePage();
  const editorRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Estados para creación
  const [files, setFiles] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState([]);

  // Estados para edición
  const [editingFilesToAdd, setEditingFilesToAdd] = useState([]);
  const [editingLinksToAdd, setEditingLinksToAdd] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [linksToRemove, setLinksToRemove] = useState([]);

  // Estado local para publicaciones
  const [publicacionesLocal, setPublicacionesLocal] = useState(publicaciones);

  // Sincronizar con props iniciales
  useEffect(() => {
    setPublicacionesLocal(publicaciones);
  }, [publicaciones]);

  // Configurar Echo para tiempo real
  useEffect(() => {
    if (!window.Echo || !classInfo?.subject_id || !classInfo?.group_id) {
      console.warn('Echo o classInfo no disponible');
      return;
    }

    const channelName = `clase.${classInfo.subject_id}.${classInfo.group_id}`;
    console.log('🔌 Suscribiéndose al canal:', channelName);
    const channel = window.Echo.private(channelName);

    channel.listen('.nueva.publicacion', (event) => {
      console.log('📢 Nueva publicación recibida:', event);
      setPublicacionesLocal(prev => {
        const exists = prev.some(p => p.id === event.publicacion.id);
        if (exists) return prev;
        return [event.publicacion, ...prev];
      });
      // CustomEvent como respaldo
      window.dispatchEvent(new CustomEvent('nueva-publicacion', {
        detail: { publicacion: event.publicacion }
      }));
    });

    channel.listen('.publicacion.actualizada', (event) => {
      console.log('✏️ Publicación actualizada:', event);
      setPublicacionesLocal(prev =>
        prev.map(p => p.id === event.publicacion.id ? event.publicacion : p)
      );
      window.dispatchEvent(new CustomEvent('publicacion-actualizada', {
        detail: { publicacion: event.publicacion }
      }));
    });

    channel.listen('.publicacion.eliminada', (event) => {
      console.log('🗑️ Publicación eliminada:', event);
      setPublicacionesLocal(prev =>
        prev.filter(p => p.id !== event.publicacionId)
      );
      window.dispatchEvent(new CustomEvent('publicacion-eliminada', {
        detail: { title: event.title || 'Publicación' }
      }));
    });

    return () => {
      console.log('🔌 Desuscribiéndose del canal:', channelName);
      window.Echo.leave(channelName);
    };
  }, [classInfo?.subject_id, classInfo?.group_id]);

  // Solicitar permisos de notificación
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permiso de notificaciones:', permission);
      });
    }
  }, []);

  const form = useForm({
    subject_id: classInfo.subject_id,
    group_id: classInfo.group_id,
    type: 'post',
    title: '',
    content: '',
  });

  useEffect(() => {
    if (editingId && editorRef.current) {
      const post = publicacionesLocal.find(p => p.id === editingId);
      if (post && post.content) {
        editorRef.current.innerHTML = post.content;
        form.setData('content', post.content);
      }
    }
  }, [editingId]);

  useEffect(() => {
    if (showCreate && editorRef.current) {
      editorRef.current.innerHTML = '';
      form.setData('content', '');
    }
  }, [showCreate]);

  const resetForm = () => {
    setEditingId(null);
    setShowCreate(false);
    setFiles([]);
    setLinks([]);
    setLinkInput('');
    setEditingFilesToAdd([]);
    setEditingLinksToAdd([]);
    setFilesToRemove([]);
    setLinksToRemove([]);
    form.reset();
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  // BUG CORREGIDO: formData.append usaba template literal como función
  const submitCreate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('subject_id', form.data.subject_id);
    formData.append('group_id', form.data.group_id);
    formData.append('type', form.data.type);
    formData.append('title', form.data.title);
    formData.append('content', form.data.content);
    files.forEach((file, index) => formData.append(`files[${index}]`, file));
    links.forEach((link, index) => formData.append(`links[${index}]`, link));

    router.post(route('estudiante.posts.store'), formData, {
      onSuccess: () => {
        resetForm();
        console.log('✅ Publicación creada exitosamente');
      },
      onError: (errors) => {
        console.error('❌ Error al crear:', errors);
        alert('Error al crear la publicación');
      },
    });
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    form.setData({
      subject_id: classInfo.subject_id,
      group_id: classInfo.group_id,
      type: p.type,
      title: p.title || '',
      content: p.content || '',
    });
    setEditingFilesToAdd([]);
    setEditingLinksToAdd([]);
    setFilesToRemove([]);
    setLinksToRemove([]);
  };

  // BUG CORREGIDO: formData.append usaba template literal como función
  const submitUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('title', form.data.title);
    formData.append('content', form.data.content);
    editingFilesToAdd.forEach((file, i) => formData.append(`files[${i}]`, file));
    editingLinksToAdd.forEach((link, i) => formData.append(`links[${i}]`, link));
    filesToRemove.forEach(id => formData.append('files_to_delete[]', id));
    linksToRemove.forEach(id => formData.append('links_to_delete[]', id));

    router.post(route('estudiante.posts.update', { post: editingId }), formData, {
      onSuccess: () => {
        resetForm();
        router.reload({ only: ['publicaciones'] });
      },
      onError: (errors) => {
        console.error('❌ Error al actualizar:', errors);
        alert('Error al actualizar la publicación');
      },
    });
  };

  const destroyPost = (id) => {
    if (!confirm('¿Realmente deseas eliminar esta publicación?')) return;
    router.delete(route('estudiante.posts.destroy', { post: id }), {
      onSuccess: () => {
        setPublicacionesLocal(prev => prev.filter(p => p.id !== id));
        console.log('✅ Publicación eliminada exitosamente');
      },
      onError: (errors) => {
        console.error('❌ Error al eliminar:', errors);
        alert('Error al eliminar la publicación');
      },
    });
  };

  const exec = (cmd) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, null);
      form.setData('content', editorRef.current.innerHTML);
    }
  };

  const onEditorInput = () => {
    if (editorRef.current) {
      form.setData('content', editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    let url = linkInput.trim();
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;
    try {
      new URL(url);
      if (editingId) setEditingLinksToAdd(prev => [...prev, url]);
      else setLinks(prev => [...prev, url]);
      setLinkInput('');
    } catch {
      alert('Por favor ingresa una URL válida');
    }
  };

  const removeNewLink = (index) => {
    if (editingId) setEditingLinksToAdd(prev => prev.filter((_, i) => i !== index));
    else setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'profesor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'estudiante': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'profesor': return 'Profesor';
      case 'estudiante': return 'Estudiante';
      default: return 'Usuario';
    }
  };

  // Renderizar archivos existentes en edición
  const renderEditingAttachments = () => {
    if (!editingId) return null;
    const post = publicacionesLocal.find(p => p.id === editingId);
    if (!post || !post.attachments?.length) return null;

    const existingFiles = post.attachments.filter(a => a.type !== 'link');
    const existingLinks = post.attachments.filter(a => a.type === 'link');

    return (
      <>
        {existingFiles.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Archivos actuales</label>
            {existingFiles.map(att => (
              <div
                key={att.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${filesToRemove.includes(att.id) ? 'bg-red-50 border-red-300 opacity-50' : 'bg-blue-50 border-blue-200'
                  }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{att.filename || att.path}</p>
                    <p className="text-xs text-gray-600">{new Date(att.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFilesToRemove(prev => prev.includes(att.id) ? prev.filter(id => id !== att.id) : [...prev, att.id])}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${filesToRemove.includes(att.id) ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'}`}
                >
                  {filesToRemove.includes(att.id) ? <span className="text-xs font-semibold">Restaurar</span> : <X className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {existingLinks.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">enlaces actuales</label>
            {existingLinks.map(att => (
              <div
                key={att.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${linksToRemove.includes(att.id) ? 'bg-red-50 border-red-300 opacity-50' : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate flex-1 font-medium">{att.url}</a>
                <button
                  type="button"
                  onClick={() => setLinksToRemove(prev => prev.includes(att.id) ? prev.filter(id => id !== att.id) : [...prev, att.id])}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ml-2 ${linksToRemove.includes(att.id) ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'}`}
                >
                  {linksToRemove.includes(att.id) ? <span className="text-xs font-semibold">Restaurar</span> : <X className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Lista de publicaciones */}
      {publicacionesLocal.length === 0 && !showCreate && !editingId ? (
        <div className="bg-white rounded-3xl shadow-lg p-12 sm:p-16 text-center border border-gray-100">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Aún no hay publicaciones</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Cuando tu profesor o tus compañeros publiquen algo, aparecerá aquí. También puedes crear tus propias publicaciones.
          </p>
        </div>
      ) : (
        publicacionesLocal.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden">
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.author_photo ? (
                    <img src={p.author_photo} alt={p.author_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-bold text-gray-900">{p.author_name}</h4>
                    {/* BUG CORREGIDO: className usaba template literal mal formado */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(p.author_role)}`}>
                      {getRoleLabel(p.author_role)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      <MessageSquare className="h-3 w-3" />
                      Publicación
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(p.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                {(p.is_owner || p.can?.update || p.can?.delete) && (
                  <div className="flex items-center gap-2">
                    {(p.is_owner || p.can?.update) && (
                      <button onClick={() => startEdit(p)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group" title="Editar publicación">
                        <Edit className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                      </button>
                    )}
                    {(p.is_owner || p.can?.delete) && (
                      <button onClick={() => destroyPost(p.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group" title="Eliminar publicación">
                        <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {p.content && (
                <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.content) }} />
              )}

              {p.attachments?.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Paperclip className="h-4.5 w-4.5 text-blue-600" />
                    Archivos adjuntos ({p.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {p.attachments.map(att => (
                      <a
                        key={att.id}
                        href={att.type === 'link'
                          ? att.url
                          : route('estudiante.attachments.download', { attachment: att.id })
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-blue-100/50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 group/item"
                      >
                        <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          {att.type === 'link' ? <LinkIcon className="h-5 w-5 text-blue-600" /> : <FileText className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover/item:text-blue-700 transition-colors">
                            {att.type === 'link' ? att.url : (att.filename || att.path)}
                          </p>
                          {att.type !== 'link' && <p className="text-xs text-gray-500 mt-0.5">{new Date(att.created_at).toLocaleDateString()}</p>}
                        </div>
                        <Download className="h-4 w-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Botón flotante crear */}
      {inertiaProps.can?.create_post && !showCreate && !editingId && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-3 px-6 sm:px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold tracking-wide hidden sm:inline">Nueva publicación</span>
        </button>
      )}

      {/* Modal CREAR */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="px-6 sm:px-8 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Crear publicación</h2>
              </div>
              <button onClick={resetForm} className="p-2.5 hover:bg-white rounded-xl transition-colors">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Título *</label>
                <input
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm transition-all text-base"
                  value={form.data.title}
                  onChange={e => form.setData('title', e.target.value)}
                  required
                  placeholder="Ej: Pregunta sobre la tarea"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Contenido</label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
                  <div className="flex gap-1 p-3 bg-gray-50 border-b-2 border-gray-100">
                    <button type="button" onClick={() => exec('bold')} className="p-2.5 hover:bg-white rounded-lg transition-colors"><Bold className="h-5 w-5 text-gray-700" /></button>
                    <button type="button" onClick={() => exec('italic')} className="p-2.5 hover:bg-white rounded-lg transition-colors"><Italic className="h-5 w-5 text-gray-700" /></button>
                    <button type="button" onClick={() => exec('underline')} className="p-2.5 hover:bg-white rounded-lg transition-colors"><Underline className="h-5 w-5 text-gray-700" /></button>
                  </div>
                  <div ref={editorRef} contentEditable onInput={onEditorInput} className="min-h-[220px] p-5 focus:outline-none prose prose-base max-w-none bg-white" data-placeholder="Escribe aquí el contenido..." />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Paperclip className="h-4.5 w-4.5 text-blue-600" />
                  Archivos adjuntos (opcional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all duration-200 group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Paperclip className="h-8 w-8 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 mb-1">Selecciona archivos</span>
                    <span className="text-xs text-gray-500">Hasta 20 MB por archivo</span>
                    <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="hidden" />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{f.name}</p>
                            <p className="text-xs text-gray-600">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <LinkIcon className="h-4.5 w-4.5 text-blue-600" />
                  enlaces (opcional)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="flex-1 px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-sm transition-all"
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    placeholder="https://..."
                  />
                  <button type="button" onClick={addLink} className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors whitespace-nowrap">Agregar</button>
                </div>
                {links.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {links.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <a href={l} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate flex-1 font-medium">{l}</a>
                        <button type="button" onClick={() => removeNewLink(i)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 ml-2">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 border-t bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors">Cancelar</button>
              <button
                type="submit"
                onClick={submitCreate}
                disabled={form.processing || !form.data.title.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                {form.processing ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal EDITAR */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[94vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="px-6 sm:px-8 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Edit className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Editar publicación</h2>
              </div>
              <button onClick={resetForm} className="p-2.5 hover:bg-white rounded-xl transition-colors">
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            <form onSubmit={submitUpdate} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Título *</label>
                <input
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm transition-all"
                  value={form.data.title}
                  onChange={e => form.setData('title', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Contenido</label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <div className="flex gap-1 p-3 bg-gray-50 border-b-2 border-gray-100">
                    <button type="button" onClick={() => exec('bold')} className="p-2.5 hover:bg-white rounded-lg transition-colors"><Bold className="h-5 w-5 text-gray-700" /></button>
                    <button type="button" onClick={() => exec('italic')} className="p-2.5 hover:bg-white rounded-lg transition-colors"><Italic className="h-5 w-5 text-gray-700" /></button>
                    <button type="button" onClick={() => exec('underline')} className="p-2.5 hover:bg-white rounded-lg transition-colors"><Underline className="h-5 w-5 text-gray-700" /></button>
                  </div>
                  <div ref={editorRef} contentEditable onInput={onEditorInput} className="min-h-[240px] p-5 focus:outline-none prose prose-base max-w-none bg-white" />
                </div>
              </div>

              {renderEditingAttachments()}

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Paperclip className="h-4.5 w-4.5 text-blue-600" />
                  Agregar nuevos archivos
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all duration-200 group">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Paperclip className="h-8 w-8 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 mb-1">Selecciona archivos</span>
                    <span className="text-xs text-gray-500">Hasta 20 MB por archivo</span>
                    <input type="file" multiple onChange={e => setEditingFilesToAdd(Array.from(e.target.files || []))} className="hidden" />
                  </label>
                </div>
                {editingFilesToAdd.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {editingFilesToAdd.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{f.name}</p>
                            <p className="text-xs text-gray-600">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setEditingFilesToAdd(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <LinkIcon className="h-4.5 w-4.5 text-blue-600" />
                  Agregar nuevos enlaces
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="flex-1 px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-sm transition-all"
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    placeholder="https://..."
                  />
                  <button type="button" onClick={addLink} className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors whitespace-nowrap">Agregar enlace</button>
                </div>
                {editingLinksToAdd.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {editingLinksToAdd.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <a href={l} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate flex-1 font-medium">{l}</a>
                        <button type="button" onClick={() => removeNewLink(i)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 ml-2">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="px-6 sm:px-8 py-5 border-t bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors">Cancelar</button>
              <button
                type="submit"
                onClick={submitUpdate}
                disabled={form.processing}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                {form.processing ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}