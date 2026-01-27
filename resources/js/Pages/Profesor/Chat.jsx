
import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  Search, User, Users, Send, Paperclip, Phone, X, MessageSquare,
  Mic, StopCircle, Check, CheckCheck, Image, File, Edit2, Trash2,
  UserPlus, Settings, ArrowLeft, LogOut, MoreVertical,
  Info, Copy, Clock
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Chat() {
  const { props } = usePage();
  const user = props.auth.user;

  // Estados principales
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Estados para crear grupo
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupParticipants, setGroupParticipants] = useState([]);

  // Estados para archivos y audio
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Estados de UI
  const [filterChat, setFilterChat] = useState('all');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [floatingDate, setFloatingDate] = useState(null);

  // Estados para agregar usuarios al grupo
  const [addingUser, setAddingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);

  // **Estados para gestión de mensajes estilo WhatsApp**
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });


  // Referencias
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const messageMenuRef = useRef(null);

  // Cargar conversaciones
  useEffect(() => {
    fetchConversations();
  }, []);

  // Echo real-time
  useEffect(() => {
    if (!selectedConversation?.id || !window.Echo) return;

    const channel = window.Echo.channel(`conversation.${selectedConversation.id}`);
    channel.listen('.message.sent', (data) => {
      if (data.message.user_id !== user.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
        markAsRead(selectedConversation.id);
      }
    });

    return () => window.Echo.leave(`conversation.${selectedConversation.id}`);
  }, [selectedConversation?.id, user.id]);

  // Búsqueda de usuarios para grupo
  useEffect(() => {
    if (userSearchQuery.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(route('profesor.chat.search'), {
          params: { query: userSearchQuery }
        });
        if (selectedConversation) {
          const existingParticipantIds = selectedConversation.participants.map(p => p.user_id);
          const filteredUsers = (res.data.users || []).filter(
            u => !existingParticipantIds.includes(u.id)
          );
          setUserSearchResults(filteredUsers);
        } else {
          setUserSearchResults(res.data.users || []);
        }
      } catch (error) {
        setUserSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [userSearchQuery, selectedConversation]);

  // Fecha flotante
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handler = () => {
      const separators = el.querySelectorAll('[data-date]');
      let current = null;
      separators.forEach(sep => {
        const rect = sep.getBoundingClientRect();
        if (rect.top < 120) current = sep.dataset.date;
      });
      setFloatingDate(current);
    };

    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [messages]);

  // Notificaciones globales
  useEffect(() => {
    if (!user?.id || !window.Echo) return;

    const userChannel = window.Echo.private(`user.${user.id}`);
    userChannel.listen('.chat.notification', () => fetchConversations());

    return () => window.Echo.leave(`user.${user.id}`);
  }, [user.id]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Búsqueda de usuarios
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchedUsers([]);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(route('profesor.chat.search'), {
          params: { query: searchQuery }
        });
        setSearchedUsers(res.data.users || []);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target)) {
        setShowMessageMenu(false);
      }
    };

    if (showMessageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(route('profesor.chat.conversations.json'));
      setConversations(res.data);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await axios.post(route('profesor.chat.read', conversationId));
    } catch (e) {
      console.error('Error al marcar como leído', e);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchedUsers([]);
    setIsSearching(false);
  };

  const startPersonalChat = (userId) => {
    router.post(route('profesor.chat.create'), {
      type: 'personal',
      participants: [userId],
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setSearchQuery('');
        setSearchedUsers([]);
      }
    });
  };

  const createGroup = () => {
    if (groupParticipants.length < 2) {
      alert('El grupo debe tener al menos 2 participantes');
      return;
    }

    router.post(route('profesor.chat.create'), {
      type: 'group',
      name: groupName,
      participants: groupParticipants,
    }, {
      preserveState: false,
      onSuccess: () => {
        setShowNewGroup(false);
        setGroupName('');
        setGroupParticipants([]);
      }
    });
  };

  const selectConversation = async (conv) => {
    setShowGroupInfo(false);
    setIsLoadingMessages(true);
    setIsMobileView(true);

    try {
      const res = await axios.get(route('profesor.chat.show', conv.id), {
        headers: { Accept: 'application/json' }
      });
      const conversation = res.data.conversation;
      setSelectedConversation(conversation);
      setMessages(conversation.messages);
      markAsRead(conversation.id);
    } catch (e) {
      console.error('Error cargando conversación', e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleBackToConversations = () => {
    setIsMobileView(false);
    setSelectedConversation(null);
    setShowGroupInfo(false);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !file && !audioBlob) return;

    const formData = new FormData();

    // Si estamos editando, usar endpoint diferente
    if (editingMessage) {
      try {
        await axios.put(
          route('profesor.chat.edit-message', editingMessage.id),
          { body: newMessage }
        );
        setMessages(prev => prev.map(m =>
          m.id === editingMessage.id
            ? { ...m, body: newMessage, edited: true }
            : m
        ));
        setNewMessage('');
        cancelEdit();
        fetchConversations();
        return;
      } catch (error) {
        alert('Error al editar el mensaje');
        return;
      }
    }

    formData.append('body', newMessage);
    if (audioBlob) {
      formData.append('type', 'audio');
      formData.append('file', audioBlob, 'audio.webm');
    } else if (file) {
      formData.append('type', 'file');
      formData.append('file', file);
    } else {
      formData.append('type', 'text');
    }

    const tempMessage = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      body: newMessage,
      type: audioBlob ? 'audio' : (file ? 'file' : 'text'),
      created_at: new Date().toISOString(),
      user: user
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    clearFile();
    setAudioBlob(null);

    try {
      const res = await axios.post(
        route('profesor.chat.message', selectedConversation.id),
        formData
      );
      setMessages(prev =>
        prev.map(m => m.id === tempMessage.id ? res.data.message : m)
      );
      fetchConversations();
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Error al enviar el mensaje');
    }
  };

  const startCall = () => {
    router.post(route('profesor.chat.message', selectedConversation.id), {
      type: 'call',
    }, {
      onSuccess: () => fetchConversations()
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setRecordingTime(0);
        clearInterval(recordingIntervalRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const addToGroup = (userId) => {
    if (!groupParticipants.includes(userId)) {
      setGroupParticipants([...groupParticipants, userId]);
    }
  };

  const removeFromGroup = (userId) => {
    setGroupParticipants(groupParticipants.filter(id => id !== userId));
  };

  const updateGroupInfo = () => {
    if (!editingGroup) return;

    router.put(route('profesor.chat.update-group', selectedConversation.id), {
      name: editingGroup.name,
    }, {
      onSuccess: () => {
        setEditingGroup(null);
        selectConversation(selectedConversation);
      }
    });
  };

  const addParticipantToGroup = async (userId) => {
    if (!selectedConversation) return;

    try {
      const response = await axios.post(
        route('profesor.chat.addParticipant', selectedConversation.id),
        { user_id: userId }
      );

      if (response.data.success) {
        setUserSearchQuery('');
        setUserSearchResults([]);
        setAddingUser(false);
        await selectConversation(selectedConversation);
        await fetchConversations();
        alert('Participante agregado exitosamente');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al agregar participante';
      alert(errorMessage);
    }
  };

  const leaveGroup = async () => {
    if (!selectedConversation) return;
    if (!confirm('¿Seguro que deseas salir de este grupo?')) return;

    try {
      const response = await axios.post(
        route('profesor.chat.leave', selectedConversation.id)
      );

      if (response.data.success) {
        setShowGroupInfo(false);
        setSelectedConversation(null);
        setMessages([]);
        setIsMobileView(false);
        await fetchConversations();
        alert('Has salido del grupo exitosamente');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al salir del grupo';
      alert(errorMessage);
    }
  };

  // ========== FUNCIONES ESTILO WHATSAPP ==========

  // Abrir menú contextual del mensaje
  const handleMessageContext = (e, message) => {
    e.preventDefault();

    if (message.deleted) {
      return;
    }

    // Evitar menú en mensajes no-texto o muy antiguos (ej: > 15 min)
    const isRecent = (new Date() - new Date(message.created_at)) < 15 * 60 * 1000;
    const canEditOrDelete = message.user_id === user.id && message.type === 'text' && isRecent;

    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.left + 300;
    if (message.user_id === user.id) {
      x = rect.left + 200; // Menú a la izquierda si es mensaje propio
    }

    setMessageMenuPosition({ x: Math.max(10, x), y: rect.top - 10 });
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  // Eliminar mensaje
  const handleDeleteMessage = async () => {
    if (!selectedMessage || !deleteType) return;

    try {
      await axios.delete(route('profesor.chat.delete-message', selectedMessage.id), {
        data: { delete_for: deleteType }
      });

      if (deleteType === 'everyone') {
        setMessages(prev => prev.map(m =>
          m.id === selectedMessage.id
            ? { ...m, body: 'Este mensaje fue eliminado', deleted: true }
            : m
        ));
      } else {
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
      }

      closeDeleteModal();
      fetchConversations();
    } catch (error) {
      alert('Error al eliminar el mensaje');
    }
  };

  // Editar mensaje
  const handleEditMessage = async () => {
    if (!editingMessage || !editedText.trim()) return;

    try {
      await axios.put(
        route('profesor.chat.edit-message', editingMessage.id),
        { body: editedText }
      );

      setMessages(prev => prev.map(m =>
        m.id === editingMessage.id
          ? { ...m, body: editedText, edited: true }
          : m
      ));

      cancelEdit();
      fetchConversations();
    } catch (error) {
      alert('Error al editar el mensaje');
    }
  };

  // Eliminar chat completo
  const handleDeleteChat = async () => {
    if (!selectedConversation) return;

    try {
      await axios.delete(route('profesor.chat.delete-conversation', selectedConversation.id));

      setShowDeleteChatModal(false);
      setSelectedConversation(null);
      setMessages([]);
      setIsMobileView(false);
      await fetchConversations();
      alert('Chat eliminado exitosamente');
    } catch (error) {
      alert('Error al eliminar el chat');
    }
  };

  const openDeleteModal = (type) => {
    setDeleteType(type);
    setShowDeleteModal(true);
    setShowMessageMenu(false);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteType(null);
    setSelectedMessage(null);
  };

  const startEdit = () => {
    setEditingMessage(selectedMessage);
    setEditedText(selectedMessage.body);
    setShowMessageMenu(false);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditedText('');
  };

  const showInfo = () => {
    setShowMessageInfo(true);
    setShowMessageMenu(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(selectedMessage.body);
    setShowMessageMenu(false);
    alert('Mensaje copiado');
  };

  const getFilteredConversations = () => {
    return conversations.filter(conv => {
      if (filterChat === 'all') return true;
      if (filterChat === 'unread') return conv.unread_count > 0;
      if (filterChat === 'chats') return conv.type === 'personal';
      if (filterChat === 'groups') return conv.type === 'group';
      return true;
    });
  };

  const filteredConversations = getFilteredConversations();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const label = getDateLabel(msg.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  return (
    <Layout title="Chat - Profesor">
      {/* Contenedor con margin negativo para anular el padding del Layout */}
      <div className="-m-6 sm:-m-8 h-[calc(100vh-4rem)]">
        <div className="h-full bg-white">
          <div className="flex h-full">
            {/* Sidebar - Oculto en móvil cuando hay conversación seleccionada */}
            <div className={`w-full lg:w-80 border-r bg-gray-50 flex flex-col ${isMobileView ? 'hidden lg:flex' : 'flex'}`}>
              {/* Buscador */}
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Buscar usuarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                </div>
                {/* Filtros */}
                {!searchQuery && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setFilterChat('all')}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${filterChat === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterChat('unread')}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${filterChat === 'unread'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      No leído
                    </button>
                    <button
                      onClick={() => setFilterChat('chats')}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${filterChat === 'chats'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Chats
                    </button>
                    <button
                      onClick={() => setFilterChat('groups')}
                      className={`px-3 py-1.5 text-xs rounded-full transition ${filterChat === 'groups'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Grupos
                    </button>
                  </div>
                )}
              </div>
              {/* Botón nuevo grupo */}
              {!searchQuery && (
                <div className="p-4 border-b bg-white">
                  <button
                    onClick={() => setShowNewGroup(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    <Users className="h-4 w-4" />
                    Nuevo grupo
                  </button>
                </div>
              )}

              {/* Lista de conversaciones */}
              <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 relative"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500">Buscando...</p>
                    </div>
                  </div>
                ) : searchQuery && searchedUsers.length > 0 ? (
                  <>
                    <div className="px-4 py-3 bg-gray-100 border-b sticky top-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {searchedUsers.length} resultado{searchedUsers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {searchedUsers.map(u => (
                      <div
                        key={u.id}
                        className="px-4 py-4 border-b hover:bg-blue-50 cursor-pointer transition group"
                        onClick={() => startPersonalChat(u.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            {u.photo ? (
                              <img
                                src={`/storage/${u.photo}`}
                                alt={`${u.name} ${u.last_name}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-400 transition">
                                <span className="text-white font-semibold text-sm">
                                  {(u.name?.[0] || '').toUpperCase() + (u.last_name?.[0] || '').toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition">
                              {u.name} {u.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {u.email}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : searchQuery && searchedUsers.length === 0 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                    <Search className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="font-medium">No se encontraron usuarios</p>
                    <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                    <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                    <p className="font-medium">No hay conversaciones</p>
                    <p className="text-sm mt-1">
                      {filterChat === 'unread'
                        ? 'No tienes mensajes sin leer'
                        : 'Busca un usuario o crea un grupo'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map(conv => {
                    const otherParticipant = conv.type === 'personal'
                      ? conv.participants.find(p => p.user_id !== user.id)?.user
                      : null;
                    const hasUnread = conv.unread_count > 0;
                    return (
                      <div
                        key={conv.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition ${selectedConversation?.id === conv.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : ''
                          }`}
                        onClick={() => selectConversation(conv)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            {conv.type === 'group' ? (
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                            ) : otherParticipant?.photo ? (
                              <img
                                src={`/storage/${otherParticipant.photo}`}
                                alt={`${otherParticipant.name}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {otherParticipant
                                    ? (otherParticipant.name?.[0] || '').toUpperCase() +
                                    (otherParticipant.last_name?.[0] || '').toUpperCase()
                                    : 'U'}
                                </span>
                              </div>
                            )}
                            {hasUnread && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{conv.unread_count}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                {conv.type === 'group'
                                  ? conv.name
                                  : otherParticipant
                                    ? `${otherParticipant.name} ${otherParticipant.last_name}`
                                    : 'Usuario desconocido'}
                              </p>
                              {conv.last_message_at && (
                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                  {formatTime(conv.last_message_at)}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate mt-1 ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                              {conv.messages?.[0] ? (
                                <>
                                  {conv.messages[0].user_id === user.id ? (
                                    <span className="font-medium text-gray-700">Tú: </span>
                                  ) : (
                                    <span className="font-medium text-gray-700">
                                      {conv.messages[0].user?.name || 'Usuario'}:{' '}
                                    </span>
                                  )}
                                  <span>
                                    {conv.messages[0].type === 'text'
                                      ? conv.messages[0].body
                                      : conv.messages[0].type === 'audio'
                                        ? '🎤 Mensaje de voz'
                                        : conv.messages[0].type === 'file'
                                          ? '📎 Archivo adjunto'
                                          : '📞 Llamada'
                                    }
                                  </span>
                                </>
                              ) : (
                                'Sin mensajes aún'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* Área de conversación - Visible en móvil solo cuando hay conversación seleccionada */}
            <div className={`flex-1 flex flex-col bg-gray-50 ${!isMobileView && !selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
              {selectedConversation ? (
                <>
                  {/* Header del chat */}
                  <div className="p-4 border-b bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Botón volver (solo móvil/tablet) */}
                      <button
                        onClick={handleBackToConversations}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition -ml-2"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      {(() => {
                        const otherParticipant = selectedConversation.type === 'personal'
                          ? selectedConversation.participants.find(p => p.user_id !== user.id)?.user
                          : null;
                        return (
                          <>
                            {selectedConversation.type === 'group' ? (
                              <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                            ) : otherParticipant?.photo ? (
                              <img
                                src={`/storage/${otherParticipant.photo}`}
                                alt={`${otherParticipant.name}`}
                                className="w-11 h-11 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {otherParticipant
                                    ? (otherParticipant.name?.[0] || '').toUpperCase() +
                                    (otherParticipant.last_name?.[0] || '').toUpperCase()
                                    : 'U'}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {selectedConversation.type === 'group'
                            ? selectedConversation.name
                            : selectedConversation.participants.find(p => p.user_id !== user.id)?.user.name +
                            ' ' +
                            selectedConversation.participants.find(p => p.user_id !== user.id)?.user.last_name}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {selectedConversation.type === 'group'
                            ? `${selectedConversation.participants.length} participantes`
                            : 'Chat personal'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConversation.type === 'group' && (
                        <button
                          onClick={() => setShowGroupInfo(!showGroupInfo)}
                          className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                          <Settings className="h-5 w-5 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteChatModal(true)}
                        className="p-2 hover:bg-red-50 rounded-full transition"
                        title="Eliminar chat"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                      <button
                        onClick={startCall}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="hidden md:inline">Llamar</span>
                      </button>
                      <button
                        onClick={startCall}
                        className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition"
                      >
                        <Phone className="h-5 w-5 text-green-700" />
                      </button>
                    </div>
                  </div>
                  {/* Mensajes */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 relative"
                  >
                    {floatingDate && (
                      <div className="sticky top-2 z-20 flex justify-center pointer-events-none">
                        <span className="px-4 py-1.5 bg-gray-200 text-black text-xs rounded-full shadow">
                          {floatingDate}
                        </span>
                      </div>
                    )}
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-sm text-gray-500">Cargando mensajes...</p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                        <p>Aún no hay mensajes en esta conversación</p>
                      </div>
                    ) : (
                      Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                        <div key={dateLabel}>
                          {/* Separador de fecha */}
                          <div
                            data-date={dateLabel}
                            className="flex justify-center my-4"
                          >
                            <span className="px-4 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                              {dateLabel}
                            </span>
                          </div>

                          {msgs.map(msg => {
                            const isRead = msg.read_by && msg.read_by.length > 1;

                            return (
                              <div
                                key={msg.id}
                                className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                                onContextMenu={(e) => handleMessageContext(e, msg)}
                              >
                                <div
                                  className={`max-w-[85%] sm:max-w-[70%] p-3 mt-1 sm:p-4 rounded-2xl shadow-sm ${msg.user_id === user.id
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white rounded-bl-none border border-gray-300'
                                    }`}
                                >
                                  {selectedConversation.type === 'group' && msg.user_id !== user.id && (
                                    <p className="text-xs font-semibold mb-1 opacity-70">
                                      {msg.user?.name} {msg.user?.last_name}
                                    </p>
                                  )}

                                  {/* Verificar si el mensaje fue eliminado para todos */}
                                  {msg.deleted ? (
                                    <p className="italic opacity-60 flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" />
                                      {msg.body}
                                    </p>
                                  ) : (
                                    <>
                                      {msg.type === 'text' && <p className="leading-relaxed">{msg.body}</p>}
                                      {msg.type === 'audio' && (
                                        <div className="flex items-center gap-3">
                                          <Mic className="h-5 w-5" />
                                          <audio controls src={`/storage/${msg.attachment}`} className="max-w-xs" />
                                        </div>
                                      )}
                                      {msg.type === 'file' && (
                                        <a
                                          href={`/storage/${msg.attachment}`}
                                          download
                                          className="flex items-center gap-3 hover:underline"
                                        >
                                          {msg.attachment?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                            <Image className="h-5 w-5" />
                                          ) : (
                                            <File className="h-5 w-5" />
                                          )}
                                          <span>Ver archivo</span>
                                        </a>
                                      )}
                                      {msg.type === 'call' && (
                                        <p className="italic flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          {msg.body}
                                        </p>
                                      )}
                                    </>
                                  )}

                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs opacity-70">
                                      {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    {msg.user_id === user.id && (
                                      <div className="flex items-center">
                                        {isRead ? (
                                          <CheckCheck className="h-4 w-4 text-blue-300" />
                                        ) : (
                                          <Check className="h-4 w-4 opacity-50" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {showMessageMenu && selectedMessage && (
                    <div
                      ref={messageMenuRef}
                      className="fixed bg-white shadow-xl rounded-xl py-1.5 min-w-[180px] z-[999] border border-gray-200 divide-y divide-gray-100 text-sm"
                      style={{ top: `${messageMenuPosition.y}px`, left: `${messageMenuPosition.x}px` }}
                    >
                      {selectedMessage.user_id === user.id && (
                        <>
                          {/* Copiar solo para mensajes de texto */}
                          {selectedMessage.type === 'text' && (
                            <button
                              onClick={copyMessage}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Copy size={18} /> Copiar
                            </button>
                          )}

                          {/* Editar solo para mensajes de texto */}
                          {selectedMessage.type === 'text' && (
                            <button
                              onClick={startEdit}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                            >
                              <Edit2 size={18} /> Editar
                            </button>
                          )}

                          {/* Eliminar para mí - TODOS LOS TIPOS */}
                          <button
                            onClick={() => openDeleteModal('me')}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-red-600"
                          >
                            <Trash2 size={18} /> Eliminar para mí
                          </button>

                          {/* Eliminar para todos - TODOS LOS TIPOS */}
                          <button
                            onClick={() => openDeleteModal('everyone')}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-red-600"
                          >
                            <Trash2 size={18} /> Eliminar para todos
                          </button>
                        </>
                      )}

                      {/* Info del mensaje - PARA TODOS */}
                      <button
                        onClick={showInfo}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Info size={18} /> Info del mensaje
                      </button>
                    </div>
                  )}
                  {/* Preview de archivo */}
                  {(file || audioBlob) && (
                    <div className="px-4 py-3 bg-gray-100 border-t flex items-center gap-3">
                      {audioBlob && (
                        <div className="flex items-center gap-2">
                          <Mic className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Mensaje de voz listo</span>
                        </div>
                      )}

                      {file && (
                        <div className="flex items-center gap-3">
                          {file.type.startsWith('image/') ? (
                            <Image className="h-6 w-6 text-blue-600" />
                          ) : (
                            <File className="h-6 w-6 text-gray-600" />
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          clearFile();
                          setAudioBlob(null);
                        }}
                        className="ml-auto p-2 hover:bg-gray-200 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {/* Barra de escritura */}
                  <div className="p-3 sm:p-4 border-t bg-white">
                    {/* Indicador de grabación */}
                    {isRecording && (
                      <div className="mb-3 flex items-center justify-between px-4 py-3 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm text-red-700 font-medium">
                            Grabando {recordingTime}s
                          </span>
                        </div>
                        <button
                          onClick={stopRecording}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
                          title="Detener grabación"
                        >
                          <StopCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    {/* Barra de controles */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />

                      {!isRecording && (
                        <label
                          htmlFor="chat-file"
                          className="cursor-pointer p-2 sm:p-3 hover:bg-gray-100 rounded-full transition flex-shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-5 w-5 text-gray-600" />
                        </label>
                      )}

                      <input
                        className="flex-1 px-3 sm:px-5 py-2 sm:py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                        placeholder={editingMessage ? "Editando mensaje..." : "Escribe un mensaje..."}
                        value={editingMessage ? editedText : newMessage}
                        onChange={e => editingMessage ? setEditedText(e.target.value) : setNewMessage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (editingMessage) {
                              handleEditMessage();
                            } else {
                              sendMessage();
                            }
                          } else if (e.key === 'Escape' && editingMessage) {
                            cancelEdit();
                          }
                        }}
                        disabled={isRecording}
                      />

                      {(newMessage.trim() || file || audioBlob || editingMessage) ? (
                        <button
                          onClick={editingMessage ? handleEditMessage : sendMessage}
                          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex-shrink-0"
                          title={editingMessage ? "Guardar cambios" : "Enviar mensaje"}
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      ) : !isRecording ? (
                        <button
                          onClick={startRecording}
                          className="p-3 hover:bg-gray-100 rounded-full transition flex-shrink-0"
                          title="Grabar audio"
                        >
                          <Mic className="h-5 w-5 text-gray-600" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                  <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Bienvenido al Chat</h3>
                  <p className="text-gray-600 max-w-md text-center">
                    Selecciona una conversación existente o inicia una nueva búsqueda para comenzar a comunicarte.
                  </p>
                </div>
              )}
            </div>
            {/* Panel lateral de info de grupo */}
            {showGroupInfo && selectedConversation?.type === 'group' && (
              <div className={`
    fixed inset-y-0 right-0 z-50
    w-[90%] max-w-sm
    bg-white shadow-2xl
    transform transition-transform duration-300
    ${isMobileView ? 'translate-x-0' : 'lg:static lg:translate-x-0'}
  `}>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Información del grupo</h3>
                    <button
                      onClick={() => setShowGroupInfo(false)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-3">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    {editingGroup ? (
                      <div className="w-full">
                        <input
                          type="text"
                          value={editingGroup.name}
                          onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={updateGroupInfo}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h4 className="font-semibold text-lg">{selectedConversation.name}</h4>
                        <button
                          onClick={() => setEditingGroup({ name: selectedConversation.name })}
                          className="text-sm text-blue-600 hover:underline mt-1"
                        >
                          Editar nombre
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-300px)]">
                  {/* ✅ SECCIÓN DE AGREGAR USUARIO (IGUAL QUE CREAR GRUPO) */}
                  {addingUser && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-sm">Agregar participante</h5>
                        <button
                          onClick={() => {
                            setAddingUser(false);
                            setUserSearchQuery('');
                            setUserSearchResults([]);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Buscador */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={e => setUserSearchQuery(e.target.value)}
                          placeholder="Buscar por nombre o correo..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          autoFocus
                        />
                      </div>

                      {/* Resultados de búsqueda */}
                      {userSearchQuery.length >= 2 && (
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {userSearchResults.length > 0 ? (
                            userSearchResults.map(u => (
                              <button
                                key={u.id}
                                onClick={() => addParticipantToGroup(u.id)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-blue-100 rounded-lg transition"
                              >
                                {u.photo ? (
                                  <img
                                    src={`/storage/${u.photo}`}
                                    alt={`${u.name} ${u.last_name}`}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                                    <span className="text-white font-semibold text-sm">
                                      {(u.name?.[0] || '').toUpperCase() + (u.last_name?.[0] || '').toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium text-gray-900">
                                    {u.name} {u.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {u.email}
                                  </p>
                                </div>
                                <UserPlus className="h-4 w-4 text-blue-600" />
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-4 text-sm text-gray-500">
                              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p>No se encontraron usuarios</p>
                            </div>
                          )}
                        </div>
                      )}

                      {userSearchQuery.length < 2 && (
                        <div className="text-center py-4 text-xs text-gray-500">
                          Escribe al menos 2 caracteres para buscar
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de participantes */}
                  {!addingUser && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">
                          Participantes ({selectedConversation.participants.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {selectedConversation.participants.map(participant => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition"
                          >
                            {participant.user?.photo ? (
                              <img
                                src={`/storage/${participant.user.photo}`}
                                alt={participant.user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {(participant.user?.name?.[0] || '').toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {participant.user?.name} {participant.user?.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {participant.user?.email}
                              </p>
                            </div>
                            {participant.user_id === selectedConversation.created_by && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="p-3 border-t gap-5 flex bg-gray-50">
                  {!addingUser && (
                    <button
                      onClick={() => setAddingUser(true)}
                      className="flex-1 w-180px flex items-center justify-center px-4 py-2.5
            bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={leaveGroup}
                    className="flex-1 w-1/2 flex items-center justify-center gap-2 px-4 py-2.5
          bg-red-500 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal Crear Grupo */}
      {
        showNewGroup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl font-bold text-gray-900">Crear nuevo grupo</h3>
                <button
                  onClick={() => setShowNewGroup(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del grupo *
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Matemáticas 10° - Proyecto Final"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar participantes
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre o correo..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        if (value.trim() === '') {
                          setSearchedUsers([]);
                          setIsSearching(false);
                        }
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  {searchedUsers.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-200">
                        {searchedUsers.map(u => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center gap-3">
                              {u.photo ? (
                                <img
                                  src={`/storage/${u.photo}`}
                                  alt={`${u.name} ${u.last_name}`}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {(u.name?.[0] || '').toUpperCase() + (u.last_name?.[0] || '').toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{u.name} {u.last_name}</p>
                                <p className="text-sm text-gray-500 truncate max-w-[180px]">{u.email}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => addToGroup(u.id)}
                              disabled={groupParticipants.includes(u.id)}
                              className={`px-4 py-2 rounded-lg transition font-medium min-w-[90px] text-center ${groupParticipants.includes(u.id)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                              {groupParticipants.includes(u.id) ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {groupParticipants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Participantes ({groupParticipants.length})
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {groupParticipants.map(id => {
                        const participant = props.availableUsers?.find(u => u.id === id);
                        if (!participant) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <span className="font-medium">
                              {participant.name} {participant.last_name}
                            </span>
                            <button
                              onClick={() => removeFromGroup(id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 flex-shrink-0">
                <button
                  onClick={() => setShowNewGroup(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={createGroup}
                  disabled={!groupName.trim() || groupParticipants.length < 2}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear grupo
                </button>
              </div>
            </div>
          </div>
        )
      }


      {
        showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">¿Eliminar mensaje?</h3>
              <p className="text-gray-600 mb-6">
                {deleteType === 'everyone'
                  ? 'Se eliminará para todos los participantes.'
                  : 'Solo se eliminará de tu dispositivo.'}
              </p>
              <div className="flex justify-end gap-4">
                <button onClick={closeDeleteModal} className="px-6 py-2.5 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleDeleteMessage} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
              </div>
            </div>
          </div>
        )
      }

      {
        showMessageInfo && selectedMessage && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold">Info del mensaje</h3>
                <button onClick={() => setShowMessageInfo(false)}><X size={24} /></button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Enviado</p>
                  <p>{new Date(selectedMessage.created_at).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>

                {selectedMessage.user_id === user.id && (
                  <div>
                    <p className="font-medium text-gray-700">Estado</p>
                    <p>
                      {selectedMessage.read_by?.length > 1
                        ? `Leído por ${selectedMessage.read_by.length - 1} personas`
                        : 'Enviado ✓'}
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-medium text-gray-700">Tipo</p>
                  <p>{selectedMessage.type === 'text' ? 'Texto' : selectedMessage.type}</p>
                </div>
              </div>
            </div>


          </div>
        )
      }

      {
        showDeleteChatModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">¿Eliminar chat?</h3>
              <p className="text-gray-600 mb-6">
                {selectedConversation?.type === 'group'
                  ? 'Saldrás del grupo y se eliminará de tu lista de conversaciones.'
                  : 'Se eliminará esta conversación de tu lista.'}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteChatModal(false)}
                  className="px-6 py-2.5 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteChat}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </Layout >
  );
}

//llamadas
// eliminar mensajes, editar y demas
//php artisan reverb:start