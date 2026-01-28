import { useEffect, useRef, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
  Plus, Bold, Italic, Underline, Paperclip, X, Edit, Trash2,
  Link as LinkIcon, MessageSquare, Clock, FileText, Download, Save
} from 'lucide-react';

export default function Publicaciones({ publicaciones = [], classInfo }) {
  const bottomRef = useRef(null);
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

  const form = useForm({
    subject_id: classInfo.subject_id,
    group_id: classInfo.group_id,
    type: 'post',
    title: '',
    content: '',
    due_at: '',
  });

  // Efecto para cargar contenido al editar
  useEffect(() => {
    if (editingId && editorRef.current) {
      const post = publicaciones.find(p => p.id === editingId);
      if (post && post.content) {
        editorRef.current.innerHTML = post.content;
        form.setData('content', post.content);
      }
    }
  }, [editingId]);

  // Efecto para limpiar el editor al crear
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
    form.setData({
      subject_id: classInfo.subject_id,
      group_id: classInfo.group_id,
      type: 'post',
      title: '',
      content: '',
      due_at: '',
    });
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  // Crear publicación
  const submitCreate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('subject_id', form.data.subject_id);
    formData.append('group_id', form.data.group_id);
    formData.append('type', form.data.type);
    formData.append('title', form.data.title);
    formData.append('content', form.data.content);
    if (form.data.due_at) formData.append('due_at', form.data.due_at);

    files.forEach((file, index) => formData.append(`files[${index}]`, file));
    links.forEach((link, index) => formData.append(`links[${index}]`, link));

    router.post(route('profesor.posts.store'), formData, {
      onSuccess: () => {
        resetForm();
        router.reload({ only: ['publicaciones'] });
      },
      onError: (errors) => console.error('Error al crear:', errors),
    });
  };

  // Iniciar edición
  const startEdit = (p) => {
    setEditingId(p.id);
    form.setData({
      subject_id: classInfo.subject_id,
      group_id: classInfo.group_id,
      type: p.type,
      title: p.title || '',
      content: p.content || '',
      due_at: p.due_at ? p.due_at.substring(0, 16) : '',
    });
    setEditingFilesToAdd([]);
    setEditingLinksToAdd([]);
    setFilesToRemove([]);
    setLinksToRemove([]);
  };

  // Actualizar publicación
  const submitUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('title', form.data.title);
    formData.append('content', form.data.content);
    if (form.data.due_at) formData.append('due_at', form.data.due_at);

    editingFilesToAdd.forEach((file, i) => formData.append(`files[${i}]`, file));
    editingLinksToAdd.forEach((link, i) => formData.append(`links[${i}]`, link));
    filesToRemove.forEach(id => formData.append('files_to_delete[]', id));
    linksToRemove.forEach(id => formData.append('links_to_delete[]', id));

    router.post(route('profesor.posts.update', { post: editingId }), formData, {
      onSuccess: () => {
        resetForm();
        router.reload({ only: ['publicaciones'] });
      },
      onError: (errors) => console.error('Error al actualizar:', errors),
    });
  };

  const destroyPost = (id) => {
    if (!confirm('¿Realmente deseas eliminar esta publicación?')) return;
    router.delete(route('profesor.posts.destroy', { post: id }), {
      onSuccess: () => router.reload({ only: ['publicaciones'] }),
    });
  };

  // Funciones del editor
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

  // Manejo de enlaces
  const addLink = () => {
    if (!linkInput.trim()) return;
    let url = linkInput.trim();
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;

    try {
      new URL(url);
      if (editingId) {
        setEditingLinksToAdd(prev => [...prev, url]);
      } else {
        setLinks(prev => [...prev, url]);
      }
      setLinkInput('');
    } catch {
      alert('Por favor ingresa una URL válida');
    }
  };

  const removeNewLink = (index) => {
    if (editingId) {
      setEditingLinksToAdd(prev => prev.filter((_, i) => i !== index));
    } else {
      setLinks(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Lista de publicaciones */}
      {publicaciones.length === 0 && !showCreate && !editingId ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-5" strokeWidth={1.4} />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no hay publicaciones</h3>
          <p className="text-gray-500">Usa el botón inferior para crear tu primera publicación o tarea</p>
        </div>
      ) : (
        publicaciones.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${p.type === 'tarea'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                      {p.type === 'tarea' ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                      {p.type === 'tarea' ? 'Tarea' : 'Publicación'}
                    </span>
                    {p.due_at && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200">
                        <Clock className="h-3.5 w-3.5" />
                        Entrega: {new Date(p.due_at).toLocaleDateString('es-CO', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">{p.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Editar publicación"
                  >
                    <Edit className="h-5 w-5" strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => destroyPost(p.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar publicación"
                  >
                    <Trash2 className="h-5 w-5" strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {p.content && (
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed mt-2 mb-5"
                  dangerouslySetInnerHTML={{ __html: p.content }}
                />
              )}

              {(p.attachments?.length > 0) && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-gray-600" />
                    Adjuntos ({p.attachments.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {p.attachments.map(att => (
                      <a
                        key={att.id}
                        href={att.type === 'link' ? att.url : `/storage/${att.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group/item"
                      >
                        <div className="w-11 h-11 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                          {att.type === 'link' ? (
                            <LinkIcon className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover/item:text-blue-700 transition-colors">
                            {att.type === 'link' ? att.url : (att.filename || att.path)}
                          </p>
                          {att.type !== 'link' && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(att.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Download className="h-4 w-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 text-xs text-gray-500 flex items-center gap-2">
                <span>Publicado el</span>
                <time dateTime={p.created_at}>
                  {new Date(p.created_at).toLocaleString('es-CO', {
                    dateStyle: 'medium', timeStyle: 'short'
                  })}
                </time>
              </div>
            </div>
          </div>
        ))
      )}

      <div ref={bottomRef} />

      {/* Botón flotante crear */}
      {!editingId && !showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-8 left-6 md:left-10 z-50 flex items-center gap-3 px-7 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 transition-all duration-200"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
          <span className="font-semibold tracking-wide">Nueva publicación</span>
        </button>
      )}

      {/* Modal CREAR */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-200/80">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="h-6 w-6 text-blue-600" strokeWidth={2.5} />
                <h2 className="text-xl font-bold text-gray-900">Crear publicación</h2>
              </div>
              <button
                onClick={resetForm}
                className="p-2.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="flex-1 overflow-y-auto p-7 space-y-7">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Título *</label>
                <input
                  className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                  value={form.data.title}
                  onChange={e => form.setData('title', e.target.value)}
                  required
                  placeholder="Ej: Tarea 3 - Matemáticas"
                />
              </div>

              {/* Editor de contenido */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contenido</label>
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  <div className="flex gap-1.5 p-3 bg-gray-50/80 border-b">
                    <button type="button" onClick={() => exec('bold')} className="p-2.5 hover:bg-white rounded-lg transition-colors">
                      <Bold className="h-5 w-5 text-gray-700" />
                    </button>
                    <button type="button" onClick={() => exec('italic')} className="p-2.5 hover:bg-white rounded-lg transition-colors">
                      <Italic className="h-5 w-5 text-gray-700" />
                    </button>
                    <button type="button" onClick={() => exec('underline')} className="p-2.5 hover:bg-white rounded-lg transition-colors">
                      <Underline className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={onEditorInput}
                    className="min-h-[220px] p-5 focus:outline-none prose prose-base max-w-none"
                    data-placeholder="Escribe aquí el contenido de la publicación o instrucciones de la tarea..."
                  />
                </div>
              </div>

              {/* Archivos */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Paperclip className="h-4.5 w-4.5" />
                  Archivos adjuntos
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-6 py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                    <Paperclip className="h-8 w-8 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-600">
                      Arrastra archivos o <span className="text-blue-600">selecciona</span>
                    </span>
                    <span className="text-xs text-gray-500 mt-1">PDF, Word, imágenes, hasta 20 MB por archivo</span>
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
                      <div key={i} className="flex items-center justify-between p-3 bg-blue-50/40 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-xs">{f.name}</p>
                            <p className="text-xs text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enlaces */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <LinkIcon className="h-4.5 w-4.5" />
                  Enlaces externos
                </label>
                <div className="flex gap-3">
                  <input
                    className="flex-1 px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {links.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {links.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <a
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-sm truncate flex-1"
                        >
                          {l}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeNewLink(i)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="px-7 py-5 border-t bg-gray-50 flex justify-end gap-4">
              <button
                onClick={resetForm}
                className="px-7 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitCreate}
                disabled={form.processing || !form.data.title.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[94vh] overflow-hidden flex flex-col border border-gray-200/70">
            <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="h-6 w-6 text-blue-700" strokeWidth={2.3} />
                <h2 className="text-xl font-bold text-gray-900">Editar publicación</h2>
              </div>
              <button
                onClick={resetForm}
                className="p-2.5 hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            <form onSubmit={submitUpdate} className="flex-1 overflow-y-auto p-7 space-y-7">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Título *</label>
                <input
                  className="w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                  value={form.data.title}
                  onChange={e => form.setData('title', e.target.value)}
                  required
                />
              </div>

              {/* Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contenido</label>
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <div className="flex gap-1.5 p-3 bg-gray-50/80 border-b">
                    <button type="button" onClick={() => exec('bold')} className="p-2.5 hover:bg-white rounded-lg transition-colors">
                      <Bold className="h-5 w-5 text-gray-700" />
                    </button>
                    <button type="button" onClick={() => exec('italic')} className="p-2.5 hover:bg-white rounded-lg transition-colors">
                      <Italic className="h-5 w-5 text-gray-700" />
                    </button>
                    <button type="button" onClick={() => exec('underline')} className="p-2.5 hover:bg-white rounded-lg transition-colors">
                      <Underline className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={onEditorInput}
                    className="min-h-[240px] p-5 focus:outline-none prose prose-base max-w-none"
                    data-placeholder="Edita el contenido aquí..."
                  />
                </div>
              </div>

              {/* Archivos existentes + nuevos */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Paperclip className="h-4.5 w-4.5" />
                  Archivos adjuntos
                </label>

                {/* Existentes */}
                {publicaciones.find(p => p.id === editingId)?.attachments?.filter(a => a.type !== 'link')?.length > 0 && (
                  <div className="space-y-2.5">
                    {publicaciones.find(p => p.id === editingId).attachments
                      .filter(a => a.type !== 'link')
                      .map(att => (
                        <div
                          key={att.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${filesToRemove.includes(att.id)
                              ? 'bg-red-50/60 border-red-200 opacity-70'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                              <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{att.filename || att.path}</p>
                              <p className="text-xs text-gray-500">
                                Subido {new Date(att.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFilesToRemove(prev =>
                              prev.includes(att.id) ? prev.filter(id => id !== att.id) : [...prev, att.id]
                            )}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filesToRemove.includes(att.id)
                                ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                : 'text-red-700 hover:bg-red-100'
                              } transition-colors`}
                          >
                            {filesToRemove.includes(att.id) ? 'Deshacer' : 'Eliminar'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Nuevos archivos */}
                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    onChange={e => setEditingFilesToAdd(Array.from(e.target.files || []))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                  />
                  {editingFilesToAdd.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-blue-700">Archivos por agregar:</p>
                      {editingFilesToAdd.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm truncate">{f.name}</p>
                            <p className="text-xs text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Enlaces */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <LinkIcon className="h-4.5 w-4.5" />
                  Enlaces
                </label>

                {/* Enlaces existentes */}
                {publicaciones.find(p => p.id === editingId)?.attachments?.filter(a => a.type === 'link')?.length > 0 && (
                  <div className="space-y-2.5">
                    {publicaciones.find(p => p.id === editingId).attachments
                      .filter(a => a.type === 'link')
                      .map(att => (
                        <div
                          key={att.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${linksToRemove.includes(att.id)
                              ? 'bg-red-50/60 border-red-200 opacity-70'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-sm truncate flex-1"
                          >
                            {att.url}
                          </a>
                          <button
                            type="button"
                            onClick={() => setLinksToRemove(prev =>
                              prev.includes(att.id) ? prev.filter(id => id !== att.id) : [...prev, att.id]
                            )}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${linksToRemove.includes(att.id)
                                ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                : 'text-red-700 hover:bg-red-100'
                              } transition-colors`}
                          >
                            {linksToRemove.includes(att.id) ? 'Deshacer' : 'Eliminar'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Nuevos enlaces */}
                <div className="flex gap-3 mt-4">
                  <input
                    className="flex-1 px-5 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {editingLinksToAdd.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-blue-700">Enlaces por agregar:</p>
                    {editingLinksToAdd.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-blue-50/40 rounded-xl border border-blue-100">
                        <a
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate text-sm flex-1"
                        >
                          {l}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeNewLink(i)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="px-7 py-5 border-t bg-gray-50 flex justify-end gap-4">
              <button
                onClick={resetForm}
                className="px-7 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitUpdate}
                disabled={form.processing}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
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