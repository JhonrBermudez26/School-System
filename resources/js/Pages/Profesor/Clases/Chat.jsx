import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  Search, User, Users, Send, Paperclip, Phone, X, MessageSquare,
  Mic, StopCircle, Check, CheckCheck, Image, File, Edit2, Trash2,
  UserPlus, Settings, Camera
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
  const [filterChat, setFilterChat] = useState('all');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Sincronizar conversación desde props cuando se carga la página
  useEffect(() => {
    if (props.conversation) {
      console.log('📦 Conversación recibida desde props:', props.conversation);
      setSelectedConversation(props.conversation);
      setMessages(props.conversation.messages || []);
    }
  }, [props.conversation]);

  useEffect(() => {
    fetchConversations();
  }, []);

  // ✅ Efecto separado SOLO para Echo (escucha en tiempo real)
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      console.log('📡 Conectándose al canal:', `conversation.${selectedConversation.id}`);
      const channel = window.Echo.channel(`conversation.${selectedConversation.id}`);
      
      channel.listen('.message.sent', (data) => {
        console.log('📨 Mensaje recibido en tiempo real:', data);
        if (data.message.user_id !== user.id) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
          
          markAsRead(selectedConversation.id);
        }
        fetchConversations();
      });

      return () => {
        console.log('🔌 Desconectándose del canal:', `conversation.${selectedConversation.id}`);
        window.Echo.leave(`conversation.${selectedConversation.id}`);
      };
    }
  }, [selectedConversation?.id, messages.length, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = () => {
    router.get(route('profesor.chat'), {}, {
      preserveState: true,
      onSuccess: (page) => {
        setConversations(page.props.conversations || []);
      }
    });
  };

  const markAsRead = (conversationId) => {
    router.post(route('profesor.chat.read', conversationId), {}, {
      preserveState: true,
      preserveScroll: true,
      only: [],
      onError: (errors) => {
        console.error('Error al marcar como leído:', errors);
      }
    });
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      performSearch();
    }
  };

  const performSearch = () => {
    if (searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    router.get(route('profesor.chat.search'), { query: searchQuery }, {
      preserveState: true,
      onSuccess: (page) => {
        setSearchedUsers(page.props.users || []);
        setIsSearching(false);
      },
      onError: () => setIsSearching(false)
    });
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
      preserveState: false,
      onSuccess: () => {
        clearSearch();
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

  // ✅ Función simplificada para seleccionar conversación
  const selectConversation = (conv) => {
    console.log('👆 Click en conversación:', conv.id);
    
    setShowGroupInfo(false);
    setIsLoadingMessages(true);
    
    // ✅ Navegar usando router.visit con preserveState
    router.visit(route('profesor.chat.show', conv.id), {
      method: 'get',
      preserveState: true,
      preserveScroll: true,
      only: ['conversation'],
      onBefore: () => {
        console.log('⏳ Iniciando carga de mensajes...');
      },
      onSuccess: (page) => {
        console.log('✅ Mensajes cargados exitosamente:', page.props.conversation);
        const conversation = page.props.conversation;
        if (conversation && conversation.messages) {
          console.log('📝 Estableciendo', conversation.messages.length, 'mensajes');
          setMessages(conversation.messages);
          setSelectedConversation(conversation);
          
          // ✅ Marcar como leído después de cargar
          markAsRead(conversation.id);
        } else {
          console.warn('⚠️ No se recibieron mensajes en la respuesta');
        }
        setIsLoadingMessages(false);
      },
      onError: (errors) => {
        console.error('❌ Error al cargar mensajes:', errors);
        setIsLoadingMessages(false);
      }
    });
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

  const sendMessage = () => {
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
      user: {
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        photo: user.photo
      }
    };

    setMessages(prev => [...prev, tempMessage]);
    
    const messageText = newMessage;
    setNewMessage('');
    clearFile();
    setAudioBlob(null);

    router.post(route('profesor.chat.message', selectedConversation.id), formData, {
      forceFormData: true,
      onSuccess: (page) => {
        const realMessage = page.props.conversation?.messages?.slice(-1)[0];
        if (realMessage) {
          setMessages(prev =>
            prev.map(m => m.id === tempMessage.id ? realMessage : m)
          );
        }
        fetchConversations();
      },
      onError: () => {
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageText);
        alert('Error al enviar el mensaje');
      }
    });
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

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
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
        fetchConversations();
        selectConversation(selectedConversation);
      }
    });
  };

  const addParticipantToGroup = (userId) => {
    router.post(route('profesor.chat.add-participant', selectedConversation.id), {
      user_id: userId
    }, {
      onSuccess: () => {
        fetchConversations();
        selectConversation(selectedConversation);
      }
    });
  };

  const getFilteredConversations = () => {
    return conversations.filter(conv => {
      if (filterChat === 'all') return true;
      if (filterChat === 'unread') {
        return conv.unread_count > 0;
      }
      if (filterChat === 'chats') return conv.type === 'personal';
      if (filterChat === 'groups') return conv.type === 'group';
      return true;
    });
  };

  const filteredConversations = getFilteredConversations();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-CO', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  return (
    <Layout title="Chat - Profesor">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex h-[calc(100vh-180px)]">
          {/* Sidebar */}
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            {/* Buscador */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Buscar usuarios... (Enter)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
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
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      filterChat === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterChat('unread')}
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      filterChat === 'unread' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No leído
                  </button>
                  <button
                    onClick={() => setFilterChat('chats')}
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      filterChat === 'chats' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Chats
                  </button>
                  <button
                    onClick={() => setFilterChat('groups')}
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      filterChat === 'groups' 
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
            <div className="flex-1 overflow-y-auto">
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
                      className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition ${
                        selectedConversation?.id === conv.id 
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
                                ) : conv.type === 'group' ? (
                                  <span className="font-medium text-gray-700">
                                    {conv.messages[0].user?.name || 'Usuario'}: 
                                  </span>
                                ) : null}
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

          {/* Área de conversación */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedConversation ? (
              <>
                {/* Header del chat */}
                <div className="p-4 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
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
                      onClick={startCall}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                    >
                      <Phone className="h-4 w-4" />
                      Llamar
                    </button>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                    messages.map(msg => {
                      const isRead = msg.read_by && msg.read_by.length > 1;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                              msg.user_id === user.id
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white rounded-bl-none border border-gray-200'
                            }`}
                          >
                            {selectedConversation.type === 'group' && msg.user_id !== user.id && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {msg.user?.name} {msg.user?.last_name}
                              </p>
                            )}
                            
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
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Preview de archivo */}
                {(filePreview || audioBlob) && (
                  <div className="px-4 py-3 bg-gray-100 border-t flex items-center gap-3">
                    {filePreview && (
                      <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                    )}
                    {audioBlob && (
                      <div className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-blue-600" />
                        <span className="text-sm">Mensaje de voz grabado</span>
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
                <div className="p-4 border-t bg-white flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  
                  <label
                    htmlFor="chat-file"
                    className="cursor-pointer p-3 hover:bg-gray-100 rounded-full transition"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5 text-gray-600" />
                  </label>

                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="p-3 bg-red-100 hover:bg-red-200 rounded-full transition"
                    >
                      <StopCircle className="h-5 w-5 text-red-600" />
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="p-3 hover:bg-gray-100 rounded-full transition"
                    >
                      <Mic className="h-5 w-5 text-gray-600" />
                    </button>
                  )}

                  <input
                    className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    disabled={isRecording}
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() && !file && !audioBlob}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
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
            <div className="w-80 border-l bg-white flex flex-col">
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
                        onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
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
                        onClick={() => setEditingGroup({name: selectedConversation.name})}
                        className="text-sm text-blue-600 hover:underline mt-1"
                      >
                        Editar nombre
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Participantes ({selectedConversation.participants.length})</h4>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        performSearch();
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedConversation.participants.map(participant => (
                      <div key={participant.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
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
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {participant.user?.name} {participant.user?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{participant.user?.email}</p>
                        </div>
                        {participant.user_id === selectedConversation.created_by && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Admin</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Grupo */}
      {showNewGroup && (
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim().length >= 2) {
                        performSearch();
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
                            className={`px-4 py-2 rounded-lg transition font-medium min-w-[90px] text-center ${
                              groupParticipants.includes(u.id)
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
      )}
    </Layout>
  );
}

// arreglar los en visto
// arreglar lo de las llamdas
// los mensajes no se reenderizan automaticamente mientras yo no este en el chatt
// php artisan reverb:start