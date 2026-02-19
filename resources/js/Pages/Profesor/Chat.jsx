import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  Search, User, Users, Send, Paperclip, Phone, X, MessageSquare,
  Mic, StopCircle, Check, CheckCheck, Image, File, Edit2, Trash2,
  UserPlus, Settings, ArrowLeft, LogOut, MoreVertical,
  Info, Copy, Clock, Menu, ChevronDown, Smile
} from 'lucide-react';
import Layout from '@/Components/Layout/Layout';

export default function Chat() {
  const { props } = usePage();
  const user = props.auth.user;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupParticipants, setGroupParticipants] = useState([]);

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const [filterChat, setFilterChat] = useState('all');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [floatingDate, setFloatingDate] = useState(null);

  const [addingUser, setAddingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const messageMenuRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  // FIX: template literals en Echo corregidos
  useEffect(() => {
    if (!selectedConversation?.id || !window.Echo) return;

    const channel = window.Echo.channel(`conversation.${selectedConversation.id}`);

    // ── Mensaje nuevo ──────────────────────────────────────────
    channel.listen('.message.sent', (data) => {
      if (data.message.user_id !== user.id) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });

        if (data.message.type === 'call') {
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Llamada entrante', {
              body: `${data.message.user.name} inició una llamada`,
              icon: '/favicon.ico',
              tag: 'call',
            });
          }
        }

        markAsRead(selectedConversation.id);
      }
    });

    // ── Mensaje editado ────────────────────────────────────────
    channel.listen('.message.edited', (data) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === data.message.id
            ? { ...m, body: data.message.body, edited: data.message.edited }
            : m
        )
      );
    });

    // ── Mensaje eliminado ──────────────────────────────────────
    channel.listen('.message.deleted', (data) => {
      if (data.delete_for === 'everyone') {
        // Marcar como eliminado visualmente para todos
        setMessages(prev =>
          prev.map(m =>
            m.id === data.message_id
              ? { ...m, body: 'Este mensaje fue eliminado', deleted: true, attachment: null }
              : m
          )
        );
      }
      // Si delete_for === 'me' no llega broadcast, solo afecta al autor
    });

    return () => {
      window.Echo.leave(`conversation.${selectedConversation.id}`);
    };
  }, [selectedConversation?.id, user.id]);

  useEffect(() => {
    if (userSearchQuery.length < 2) { setUserSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(route('profesor.chat.search'), { params: { query: userSearchQuery } });
        if (selectedConversation) {
          const existingIds = selectedConversation.participants.map(p => p.user_id);
          setUserSearchResults((res.data.users || []).filter(u => !existingIds.includes(u.id)));
        } else {
          setUserSearchResults(res.data.users || []);
        }
      } catch { setUserSearchResults([]); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, selectedConversation]);

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

  // FIX: template literals en Echo privado corregidos
  useEffect(() => {
    if (!user?.id || !window.Echo) return;
    const userChannel = window.Echo.private(`user.${user.id}`);
    userChannel.listen('.chat.notification', () => { fetchConversations(); });
    userChannel.listen('.group.added', (data) => {
      fetchConversations();
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Nuevo grupo', {
          body: `${data.addedBy} te agregó al grupo "${data.conversationName}"`,
          icon: '/favicon.ico'
        });
      }
    });
    return () => { window.Echo.leave(`user.${user.id}`); };
  }, [user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchedUsers([]); setIsSearching(false); return; }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(route('profesor.chat.search'), { params: { query: searchQuery } });
        setSearchedUsers(res.data.users || []);
      } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messageMenuRef.current && !messageMenuRef.current.contains(e.target)) {
        setShowMessageMenu(false);
      }
    };
    if (showMessageMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(route('profesor.chat.conversations.json'));
      setConversations(res.data);
    } catch (error) { console.error('Error cargando conversaciones:', error); }
  };

  const markAsRead = async (conversationId) => {
    try { await axios.post(route('profesor.chat.read', conversationId)); }
    catch (e) { console.error('Error al marcar como leído', e); }
  };

  const clearSearch = () => { setSearchQuery(''); setSearchedUsers([]); setIsSearching(false); };

  const startPersonalChat = async (userId) => {
    try {
      const response = await axios.post(route('profesor.chat.create'), {
        type: 'personal', participants: [userId],
      });
      setSearchQuery(''); setSearchedUsers([]);
      await fetchConversations();
      if (response.data?.conversation_id) {
        const conv = conversations.find(c => c.id === response.data.conversation_id);
        if (conv) {
          await selectConversation(conv);
        } else {
          const convResponse = await axios.get(
            route('profesor.chat.show', response.data.conversation_id),
            { headers: { Accept: 'application/json' } }
          );
          setSelectedConversation(convResponse.data.conversation);
          setMessages(convResponse.data.conversation.messages);
          setIsMobileView(true);
        }
      }
    } catch (error) { console.error('Error al iniciar chat:', error); alert('Error al iniciar la conversación'); }
  };

  const createGroup = async () => {
    if (groupParticipants.length < 2) { alert('El grupo debe tener al menos 2 participantes'); return; }
    try {
      const response = await axios.post(route('profesor.chat.create'), {
        type: 'group', name: groupName, participants: groupParticipants,
      });
      if (response.data?.success && response.data?.conversation_id) {
        setShowNewGroup(false); setGroupName(''); setGroupParticipants([]);
        setSearchQuery(''); setSearchedUsers([]);
        await fetchConversations();
        const convResponse = await axios.get(
          route('profesor.chat.show', response.data.conversation_id),
          { headers: { Accept: 'application/json' } }
        );
        setSelectedConversation(convResponse.data.conversation);
        setMessages(convResponse.data.conversation.messages);
        setIsMobileView(true);
      }
    } catch (error) {
      console.error('Error al crear grupo:', error);
      alert('Error al crear el grupo: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  const selectConversation = async (conv) => {
    setShowGroupInfo(false); setIsLoadingMessages(true); setIsMobileView(true);
    try {
      const res = await axios.get(route('profesor.chat.show', conv.id), {
        headers: { Accept: 'application/json' }
      });
      const conversation = res.data.conversation;
      setSelectedConversation(conversation);
      setMessages(conversation.messages);
      markAsRead(conversation.id);
    } catch (e) { console.error('Error cargando conversación', e); }
    finally { setIsLoadingMessages(false); }
  };

  const handleBackToConversations = () => {
    setIsMobileView(false); setSelectedConversation(null); setShowGroupInfo(false);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else { setFilePreview(null); }
    }
  };

  const clearFile = () => {
    setFile(null); setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // FIX: handleEditMessage definida correctamente como función separada
  const handleEditMessage = async () => {
    if (!editingMessage) return;
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

  const sendMessage = async () => {
    if (!newMessage.trim() && !file && !audioBlob) return;

    const formData = new FormData();
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
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? res.data.message : m));
      fetchConversations();
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Error al enviar el mensaje');
    }
  };

  const startCall = async () => {
    try {
      const response = await axios.post(
        route('profesor.chat.message', selectedConversation.id),
        { type: 'call' }
      );
      if (response.data?.message) {
        setMessages(prev => [...prev, response.data.message]);
        if (response.data.message.attachment) {
          window.open(response.data.message.attachment, '_blank', 'noopener,noreferrer');
        }
        fetchConversations();
      }
    } catch (error) { console.error('Error al iniciar llamada:', error); alert('Error al iniciar la llamada'); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob); setRecordingTime(0);
        clearInterval(recordingIntervalRef.current);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder); setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { alert('No se pudo acceder al micrófono'); }
  };

  const stopRecording = () => { if (mediaRecorder) { mediaRecorder.stop(); setIsRecording(false); } };

  const addToGroup = (userId) => {
    if (!groupParticipants.includes(userId)) setGroupParticipants([...groupParticipants, userId]);
  };
  const removeFromGroup = (userId) => setGroupParticipants(groupParticipants.filter(id => id !== userId));

  const updateGroupInfo = () => {
    if (!editingGroup) return;
    router.put(route('profesor.chat.update-group', selectedConversation.id), {
      name: editingGroup.name,
    }, { onSuccess: () => { setEditingGroup(null); selectConversation(selectedConversation); } });
  };

  const addParticipantToGroup = async (userId) => {
    if (!selectedConversation) return;
    try {
      const response = await axios.post(
        route('profesor.chat.addParticipant', selectedConversation.id),
        { user_id: userId }
      );
      if (response.data.success) {
        setUserSearchQuery(''); setUserSearchResults([]); setAddingUser(false);
        await selectConversation(selectedConversation);
        await fetchConversations();
        alert('Participante agregado exitosamente');
      }
    } catch (error) { alert(error.response?.data?.message || 'Error al agregar participante'); }
  };

  const leaveGroup = async () => {
    if (!selectedConversation) return;
    if (!confirm('¿Seguro que deseas salir de este grupo?')) return;
    try {
      const response = await axios.post(route('profesor.chat.leave', selectedConversation.id));
      if (response.data.success) {
        setShowGroupInfo(false); setSelectedConversation(null);
        setMessages([]); setIsMobileView(false);
        await fetchConversations();
        alert('Has salido del grupo exitosamente');
      }
    } catch (error) { alert(error.response?.data?.message || 'Error al salir del grupo'); }
  };

  const handleMessageContext = (e, message) => {
    e.preventDefault();
    if (message.deleted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.left + 300;
    if (message.user_id === user.id) x = rect.left + 200;
    setMessageMenuPosition({ x: Math.max(10, x), y: rect.top - 10 });
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

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
    } catch (error) { alert('Error al eliminar el mensaje'); }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversation) return;
    try {
      await axios.delete(route('profesor.chat.delete-conversation', selectedConversation.id));
      setShowDeleteChatModal(false); setSelectedConversation(null);
      setMessages([]); setIsMobileView(false);
      await fetchConversations();
      alert('Chat eliminado exitosamente');
    } catch (error) { alert('Error al eliminar el chat'); }
  };

  const openDeleteModal = (type) => { setDeleteType(type); setShowDeleteModal(true); setShowMessageMenu(false); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setDeleteType(null); setSelectedMessage(null); };

  // FIX: startEdit ahora carga editedText correctamente
  const startEdit = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setEditedText(selectedMessage.body);
    setNewMessage(selectedMessage.body);
    setShowMessageMenu(false);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditedText('');
    setNewMessage('');
  };

  const showInfo = () => { setShowMessageInfo(true); setShowMessageMenu(false); };

  const copyMessage = () => {
    navigator.clipboard.writeText(selectedMessage.body);
    setShowMessageMenu(false);
    alert('Mensaje copiado');
  };

  const getFilteredConversations = () => conversations.filter(conv => {
    if (filterChat === 'all') return true;
    if (filterChat === 'unread') return conv.unread_count > 0;
    if (filterChat === 'chats') return conv.type === 'personal';
    if (filterChat === 'groups') return conv.type === 'group';
    return true;
  });

  const filteredConversations = getFilteredConversations();

  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('es-CO', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const label = getDateLabel(msg.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  return (
    <Layout title="Chat - Profesor">
      <div className="-m-6 sm:-m-8 h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-600 to-blue-700">
        <div className="h-full flex">

          {/* SIDEBAR */}
          <div className={`w-full lg:w-[350px] bg-white flex flex-col shadow-xl ${isMobileView ? 'hidden lg:flex' : 'flex'}`}>

            {/* Header sidebar */}
            <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-3">
                {user.photo ? (
                  <img src={`/storage/${user.photo}`} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-blue-500">
                    <span className="text-white font-semibold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-slate-800">{user.name}</h2>
                  <p className="text-xs text-slate-500">En línea</p>
                </div>
              </div>
              <button onClick={() => setShowNewGroup(true)} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="Nuevo grupo">
                <Users className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Buscador */}
            <div className="px-3 py-2 bg-white border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
                  placeholder="Buscar o empezar un chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition">
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtros */}
            {!searchQuery && (
              <div className="px-1 py-1 flex gap-1 border-b border-slate-200 bg-white overflow-x-auto">
                {[
                  { key: 'all', label: 'Todos', icon: MessageSquare },
                  { key: 'unread', label: 'No leídos', icon: Check },
                  { key: 'chats', label: 'Chats', icon: User },
                  { key: 'groups', label: 'Grupos', icon: Users }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setFilterChat(key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterChat === key ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            )}

            {/* Lista conversaciones */}
            <div className="flex-1 overflow-y-auto bg-white">
              {isSearching ? (
                <div className="flex items-center justify-center h-40">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Buscando...</p>
                  </div>
                </div>
              ) : searchQuery && searchedUsers.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchedUsers.map(u => (
                    <div key={u.id} onClick={() => startPersonalChat(u.id)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3">
                        {u.photo ? (
                          <img src={`/storage/${u.photo}`} alt={`${u.name} ${u.last_name}`} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">{(u.name?.[0] || '').toUpperCase()}{(u.last_name?.[0] || '').toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{u.name} {u.last_name}</p>
                          <p className="text-sm text-slate-500 truncate">{u.email}</p>
                        </div>
                        <MessageSquare className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery && searchedUsers.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <Search className="h-12 w-12 mb-2" />
                  <p className="text-sm">No se encontraron usuarios</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                  <MessageSquare className="h-12 w-12 mb-2" />
                  <p className="text-sm">{filterChat === 'unread' ? 'No hay mensajes sin leer' : 'No hay conversaciones'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredConversations.map(conv => {
                    const otherParticipant = conv.type === 'personal'
                      ? conv.participants.find(p => p.user_id !== user.id)?.user
                      : null;
                    const hasUnread = conv.unread_count > 0;
                    const isSelected = selectedConversation?.id === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`px-4 py-3 cursor-pointer transition-all ${isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'} ${hasUnread ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            {conv.type === 'group' ? (
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                              </div>
                            ) : otherParticipant?.photo ? (
                              <img src={`/storage/${otherParticipant.photo}`} alt={otherParticipant.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {otherParticipant
                                    ? (otherParticipant.name?.[0] || '').toUpperCase() + (otherParticipant.last_name?.[0] || '').toUpperCase()
                                    : 'U'}
                                </span>
                              </div>
                            )}
                            {hasUnread && (
                              <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-blue-500 rounded-full flex items-center justify-center px-1.5">
                                <span className="text-white text-xs font-bold">{conv.unread_count}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2 mb-0.5">
                              {/* FIX: className con template literal correcto */}
                              <p className={`font-semibold truncate ${hasUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                                {conv.type === 'group'
                                  ? conv.name
                                  : otherParticipant
                                    ? `${otherParticipant.name} ${otherParticipant.last_name}`
                                    : 'Usuario desconocido'}
                              </p>
                              {conv.last_message_at && (
                                <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {conv.messages?.[0] && (
                                <>
                                  {conv.messages[0].user_id === user.id && (
                                    <CheckCheck className={`h-3.5 w-3.5 flex-shrink-0 ${conv.messages[0].read_by?.length > 1 ? 'text-blue-500' : 'text-slate-400'}`} />
                                  )}
                                  <p className={`text-sm truncate ${hasUnread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                                    {conv.messages[0].type === 'text' ? conv.messages[0].body
                                      : conv.messages[0].type === 'audio' ? '🎤 Audio'
                                        : conv.messages[0].type === 'file' ? '📎 Archivo'
                                          : conv.messages[0].type === 'call' ? '📞 Llamada'
                                            : conv.messages[0].type === 'system' ? conv.messages[0].body
                                              : 'Mensaje'}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ÁREA DE CHAT */}
          <div className={`flex-1 flex flex-col ${!isMobileView && !selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            {selectedConversation ? (
              <>
                {/* Header chat */}
                <div className="bg-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <button onClick={handleBackToConversations} className="lg:hidden p-2 hover:bg-slate-200 rounded-full transition-colors -ml-2">
                      <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </button>
                    {(() => {
                      const otherParticipant = selectedConversation.type === 'personal'
                        ? selectedConversation.participants.find(p => p.user_id !== user.id)?.user
                        : null;
                      return (
                        <>
                          {selectedConversation.type === 'group' ? (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                          ) : otherParticipant?.photo ? (
                            <img src={`/storage/${otherParticipant.photo}`} alt={otherParticipant.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {otherParticipant
                                  ? (otherParticipant.name?.[0] || '').toUpperCase() + (otherParticipant.last_name?.[0] || '').toUpperCase()
                                  : 'U'}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="cursor-pointer" onClick={() => selectedConversation.type === 'group' && setShowGroupInfo(!showGroupInfo)}>
                      <h2 className="font-semibold text-slate-900 text-sm leading-tight">
                        {selectedConversation.type === 'group'
                          ? selectedConversation.name
                          : selectedConversation.participants.find(p => p.user_id !== user.id)?.user.name + ' ' +
                          selectedConversation.participants.find(p => p.user_id !== user.id)?.user.last_name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedConversation.type === 'group'
                          ? `${selectedConversation.participants.length} participantes`
                          : 'Toca para más info'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={startCall} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="Iniciar llamada">
                      <Phone className="h-5 w-5 text-slate-600" />
                    </button>
                    <div className="relative group">
                      <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <MoreVertical className="h-5 w-5 text-slate-600" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        {selectedConversation.type === 'group' && (
                          <button onClick={() => setShowGroupInfo(!showGroupInfo)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 rounded-t-lg">
                            <Info className="h-4 w-4 text-slate-600" />
                            <span className="text-sm text-slate-700">Info del grupo</span>
                          </button>
                        )}
                        <button onClick={() => setShowDeleteChatModal(true)} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 rounded-b-lg">
                          <Trash2 className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Eliminar chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de mensajes - FIX: sin imagen de fondo que daba 404 */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-6"
                  style={{ background: 'linear-gradient(to bottom, #e5ddd5, #f0ede8)' }}
                >
                  {floatingDate && (
                    <div className="sticky top-2 z-20 flex justify-center pointer-events-none mb-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs rounded-full shadow-sm">{floatingDate}</span>
                    </div>
                  )}
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500">Cargando mensajes...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageSquare className="h-16 w-16 mb-3 opacity-50" />
                      <p className="text-sm">Aún no hay mensajes</p>
                      <p className="text-xs mt-1">Envía un mensaje para comenzar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                        <div key={dateLabel}>
                          <div data-date={dateLabel} className="flex justify-center my-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-600 text-xs rounded-lg shadow-sm">{dateLabel}</span>
                          </div>
                          {msgs.map((msg, index) => {
                            const isOwn = msg.user_id === user.id;
                            const showAvatar = !isOwn && (
                              index === msgs.length - 1 || msgs[index + 1]?.user_id !== msg.user_id
                            );
                            if (msg.type === 'system') {
                              return (
                                <div key={msg.id} className="flex justify-center my-2">
                                  <div className="px-4 py-2 bg-amber-50/80 backdrop-blur-sm rounded-lg max-w-[85%] shadow-sm">
                                    <p className="text-xs text-center text-slate-700">{msg.body}</p>
                                    <p className="text-[10px] text-center text-slate-400 mt-1">{formatTime(msg.created_at)}</p>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                                onContextMenu={(e) => handleMessageContext(e, msg)}
                              >
                                {!isOwn && selectedConversation.type === 'group' && (
                                  <div className="w-8 h-8 flex-shrink-0">
                                    {showAvatar && msg.user?.photo ? (
                                      <img src={`/storage/${msg.user.photo}`} alt={msg.user.name} className="w-8 h-8 rounded-full object-cover" />
                                    ) : showAvatar ? (
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">{(msg.user?.name?.[0] || '').toUpperCase()}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                                <div className={`max-w-[75%] sm:max-w-[65%] rounded-lg shadow-sm ${isOwn ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-slate-900 rounded-bl-none'} ${msg.deleted ? 'opacity-60 italic' : ''}`}>
                                  <div className="px-3 py-2">
                                    {!isOwn && selectedConversation.type === 'group' && !msg.deleted && (
                                      <p className="text-xs font-semibold mb-1 text-blue-600">{msg.user?.name}</p>
                                    )}
                                    {msg.deleted ? (
                                      <p className="text-sm flex items-center gap-2">
                                        <Trash2 className="h-3.5 w-3.5" />{msg.body}
                                      </p>
                                    ) : (
                                      <>
                                        {msg.type === 'text' && (
                                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                            {msg.body}
                                            {msg.edited && <span className="text-xs opacity-70 ml-2">(editado)</span>}
                                          </p>
                                        )}
                                        {msg.type === 'audio' && (
                                          <div className="flex items-center gap-2">
                                            <Mic className="h-4 w-4" />
                                            <audio controls src={`/storage/${msg.attachment}`} className="max-w-[200px]" />
                                          </div>
                                        )}
                                        {msg.type === 'file' && (
                                          <a href={`/storage/${msg.attachment}`} download className="flex items-center gap-2 hover:underline">
                                            {msg.attachment?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                              <><Image className="h-4 w-4" /><span className="text-sm">Ver imagen</span></>
                                            ) : (
                                              <><File className="h-4 w-4" /><span className="text-sm">Descargar archivo</span></>
                                            )}
                                          </a>
                                        )}
                                        {msg.type === 'call' && (
                                          <div className="flex flex-col gap-2">
                                            <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" />Llamada iniciada</p>
                                            {msg.attachment && (
                                              <a href={msg.attachment} target="_blank" rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center transition-colors">
                                                Unirse a la llamada
                                              </a>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                      <span className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-slate-400'}`}>{formatTime(msg.created_at)}</span>
                                      {isOwn && !msg.deleted && (
                                        <div className="flex items-center">
                                          {msg.read_by?.length > 1
                                            ? <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
                                            : <Check className="h-3.5 w-3.5 text-blue-100" />}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Menú contextual */}
                {showMessageMenu && selectedMessage && (
                  <div
                    ref={messageMenuRef}
                    className="fixed bg-white rounded-xl shadow-2xl py-1 min-w-[180px] z-[999] border border-slate-200"
                    style={{ top: `${messageMenuPosition.y}px`, left: `${messageMenuPosition.x}px` }}
                  >
                    {/* FIX: Editar y copiar solo si es texto propio y no eliminado */}
                    {selectedMessage.user_id === user.id && selectedMessage.type === 'text' && !selectedMessage.deleted && (
                      <>
                        <button onClick={copyMessage} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm">
                          <Copy className="h-4 w-4" /> Copiar
                        </button>
                        <button onClick={startEdit} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm">
                          <Edit2 className="h-4 w-4" /> Editar
                        </button>
                      </>
                    )}
                    {selectedMessage.user_id === user.id && !selectedMessage.deleted && (
                      <>
                        <button onClick={() => openDeleteModal('me')} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm text-red-600">
                          <Trash2 className="h-4 w-4" /> Eliminar para mí
                        </button>
                        <button onClick={() => openDeleteModal('everyone')} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm text-red-600">
                          <Trash2 className="h-4 w-4" /> Eliminar para todos
                        </button>
                      </>
                    )}
                    <button onClick={showInfo} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm">
                      <Info className="h-4 w-4" /> Info del mensaje
                    </button>
                  </div>
                )}

                {/* Preview archivo */}
                {(file || audioBlob) && (
                  <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
                    {audioBlob && (
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500 rounded-full"><Mic className="h-4 w-4 text-white" /></div>
                        <span className="text-sm font-medium text-slate-700">Mensaje de voz listo</span>
                      </div>
                    )}
                    {file && (
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${file.type.startsWith('image/') ? 'bg-blue-500' : 'bg-slate-500'}`}>
                          {file.type.startsWith('image/') ? <Image className="h-4 w-4 text-white" /> : <File className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    )}
                    <button onClick={() => { clearFile(); setAudioBlob(null); }} className="ml-auto p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <X className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                )}

                {/* Indicador grabación */}
                {isRecording && (
                  <div className="px-4 py-3 bg-red-50 border-t-2 border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-red-700 font-medium">
                          Grabando {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button onClick={stopRecording} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors">
                        <StopCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Indicador edición */}
                {editingMessage && (
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit2 className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">Editando: "{editingMessage.body?.substring(0, 40)}{editingMessage.body?.length > 40 ? '...' : ''}"</span>
                    </div>
                    <button onClick={cancelEdit} className="p-1 hover:bg-amber-100 rounded-full transition-colors">
                      <X className="h-4 w-4 text-amber-600" />
                    </button>
                  </div>
                )}

                {/* Barra de escritura */}
                <div className="px-3 py-3 bg-slate-100 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    {!isRecording && (
                      <>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0">
                          <Paperclip className="h-5 w-5 text-slate-600" />
                        </button>
                      </>
                    )}
                    <div className="flex-1 relative">
                      <input
                        className="w-full px-4 py-2.5 pr-10 bg-white border-0 rounded-full focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={editingMessage ? "Editando mensaje..." : "Escribe un mensaje"}
                        // FIX: cuando editingMessage, el valor viene de editedText
                        value={editingMessage ? editedText : newMessage}
                        onChange={e => editingMessage ? setEditedText(e.target.value) : setNewMessage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            // FIX: llamar handleEditMessage correctamente
                            editingMessage ? handleEditMessage() : sendMessage();
                          } else if (e.key === 'Escape' && editingMessage) {
                            cancelEdit();
                          }
                        }}
                        disabled={isRecording}
                      />
                    </div>
                    {/* FIX: botón enviar llama handleEditMessage correctamente */}
                    {(editingMessage ? editedText.trim() : (newMessage.trim() || file || audioBlob)) ? (
                      <button
                        onClick={editingMessage ? handleEditMessage : sendMessage}
                        className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex-shrink-0"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    ) : !isRecording ? (
                      <button onClick={startRecording} className="p-2.5 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0">
                        <Mic className="h-5 w-5 text-slate-600" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <MessageSquare className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido al Chat</h3>
                <p className="text-slate-500 text-center max-w-md px-4">Selecciona una conversación para comenzar a chatear o busca usuarios para iniciar una nueva</p>
              </div>
            )}
          </div>

          {/* PANEL INFO GRUPO */}
          {showGroupInfo && selectedConversation?.type === 'group' && (
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col lg:static lg:w-80">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-800">Info del grupo</h3>
                  <button onClick={() => setShowGroupInfo(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  {editingGroup ? (
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        value={editingGroup.name}
                        onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={updateGroupInfo} className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">Guardar</button>
                        <button onClick={() => setEditingGroup(null)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h4 className="font-bold text-lg text-slate-800">{selectedConversation.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">Grupo · {selectedConversation.participants.length} participantes</p>
                      <button onClick={() => setEditingGroup({ name: selectedConversation.name })} className="text-sm text-blue-600 hover:text-blue-700 mt-2 font-medium">Editar nombre</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {addingUser ? (
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-sm text-slate-800">Agregar participante</h5>
                      <button onClick={() => { setAddingUser(false); setUserSearchQuery(''); setUserSearchResults([]); }} className="text-slate-500 hover:text-slate-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        autoFocus
                      />
                    </div>
                    {userSearchQuery.length >= 2 && (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {userSearchResults.length > 0 ? userSearchResults.map(u => (
                          <button key={u.id} onClick={() => addParticipantToGroup(u.id)} className="w-full flex items-center gap-3 p-2 hover:bg-blue-100 rounded-lg transition-colors">
                            {u.photo ? (
                              <img src={`/storage/${u.photo}`} alt={`${u.name} ${u.last_name}`} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">{(u.name?.[0] || '').toUpperCase()}{(u.last_name?.[0] || '').toUpperCase()}</span>
                              </div>
                            )}
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-slate-800">{u.name} {u.last_name}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                            <UserPlus className="h-4 w-4 text-blue-600" />
                          </button>
                        )) : (
                          <div className="text-center py-4">
                            <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No se encontraron usuarios</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-slate-700">Participantes ({selectedConversation.participants.length})</h4>
                    </div>
                    <div className="space-y-1">
                      {selectedConversation.participants.map(participant => (
                        <div key={participant.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                          {participant.user?.photo ? (
                            <img src={`/storage/${participant.user.photo}`} alt={participant.user.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{(participant.user?.name?.[0] || '').toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800 truncate">{participant.user?.name} {participant.user?.last_name}</p>
                            <p className="text-xs text-slate-500 truncate">{participant.user?.email}</p>
                          </div>
                          {participant.user_id === selectedConversation.created_by && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Admin</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-200 flex gap-2 bg-slate-50">
                {!addingUser && (
                  <button onClick={() => setAddingUser(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    <UserPlus className="h-4 w-4" /><span>Agregar</span>
                  </button>
                )}
                <button onClick={leaveGroup} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                  <LogOut className="h-4 w-4" /><span>Salir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALES */}

      {/* Modal Crear Grupo */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Crear nuevo grupo</h3>
              <button onClick={() => setShowNewGroup(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del grupo *</label>
                <input
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Ej: Matemáticas 10°"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar participantes</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    className="w-full pl-12 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Nombre o correo..."
                    value={searchQuery}
                    onChange={(e) => { const v = e.target.value; setSearchQuery(v); if (!v.trim()) { setSearchedUsers([]); setIsSearching(false); } }}
                  />
                  {searchQuery && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors">
                      <X className="h-4 w-4 text-slate-500" />
                    </button>
                  )}
                </div>
                {searchedUsers.length > 0 && (
                  <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {searchedUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {u.photo ? (
                              <img src={`/storage/${u.photo}`} alt={`${u.name} ${u.last_name}`} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">{(u.name?.[0] || '').toUpperCase()}{(u.last_name?.[0] || '').toUpperCase()}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm text-slate-800">{u.name} {u.last_name}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[180px]">{u.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToGroup(u.id)}
                            disabled={groupParticipants.includes(u.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${groupParticipants.includes(u.id) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          >
                            {groupParticipants.includes(u.id) ? '✓ Agregado' : 'Agregar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {groupParticipants.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Participantes seleccionados ({groupParticipants.length})</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {groupParticipants.map(id => {
                      const participant = searchedUsers.find(u => u.id === id) || props.availableUsers?.find(u => u.id === id);
                      if (!participant) return null;
                      return (
                        <div key={id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <span className="font-medium text-sm text-slate-800">{participant.name} {participant.last_name}</span>
                          <button onClick={() => removeFromGroup(id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowNewGroup(false)} className="px-6 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium text-slate-700">Cancelar</button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || groupParticipants.length < 2}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Mensaje */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-3 text-slate-800">¿Eliminar mensaje?</h3>
            <p className="text-slate-600 mb-6">
              {deleteType === 'everyone'
                ? 'El mensaje se eliminará para todos los participantes de la conversación.'
                : 'Solo se eliminará de tu vista. Los demás aún podrán verlo.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="px-6 py-2.5 hover:bg-slate-100 rounded-xl transition-colors font-medium">Cancelar</button>
              <button onClick={handleDeleteMessage} className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Info Mensaje */}
      {showMessageInfo && selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800">Info del mensaje</h3>
              <button onClick={() => setShowMessageInfo(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Enviado</p>
                <p className="text-slate-600">{new Date(selectedMessage.created_at).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}</p>
              </div>
              {selectedMessage.user_id === user.id && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Estado</p>
                  <div className="flex items-center gap-2">
                    {selectedMessage.read_by?.length > 1
                      ? <><CheckCheck className="h-4 w-4 text-blue-500" /><p className="text-slate-600">Leído por {selectedMessage.read_by.length - 1} personas</p></>
                      : <><Check className="h-4 w-4 text-slate-400" /><p className="text-slate-600">Enviado</p></>}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Tipo</p>
                <p className="text-slate-600 capitalize">{selectedMessage.type}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Chat */}
      {showDeleteChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-3 text-slate-800">
              {selectedConversation?.type === 'group' ? '¿Salir del grupo?' : '¿Eliminar chat?'}
            </h3>
            <p className="text-slate-600 mb-6">
              {selectedConversation?.type === 'group'
                ? 'Saldrás del grupo y dejarás de recibir mensajes.'
                : 'El chat solo se eliminará de tu lista. La otra persona seguirá viendo la conversación.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteChatModal(false)} className="px-6 py-2.5 hover:bg-slate-100 rounded-xl transition-colors font-medium">Cancelar</button>
              <button
                onClick={selectedConversation?.type === 'group' ? leaveGroup : handleDeleteChat}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                {selectedConversation?.type === 'group' ? 'Salir' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}