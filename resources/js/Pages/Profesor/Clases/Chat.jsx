import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  Search, User, Users, Send, Paperclip, Phone, X, MessageSquare,
  GraduationCap, BookOpen, ClipboardList
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      console.log('📡 Conectándose al canal:', `conversation.${selectedConversation.id}`);

      const channel = window.Echo.channel(`conversation.${selectedConversation.id}`);

      channel.listen('.message.sent', (data) => {
        console.log('📨 Mensaje recibido:', data);

        // ✅ SOLO agregar si NO es del usuario actual
        if (data.message.user_id !== user.id) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === data.message.id);
            if (exists) return prev;
            return [...prev, data.message];
          });
        }

        fetchConversations();
      });

      return () => {
        console.log('🔌 Desconectándose del canal:', `conversation.${selectedConversation.id}`);
        window.Echo.leave(`conversation.${selectedConversation.id}`);
      };
    }
  }, [selectedConversation, user.id]);

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

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      performSearch();
    }
  };

  const performSearch = () => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    setIsSearching(true);

    router.get(route('profesor.chat.search'), { query: searchQuery }, {
      preserveState: true,
      onSuccess: (page) => {
        setSearchedUsers(page.props.users || []);
        setIsSearching(false);
      },
      onError: () => {
        setIsSearching(false);
      }
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
      onSuccess: () => {
        fetchConversations();
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
      onSuccess: () => {
        setShowNewGroup(false);
        setGroupName('');
        setGroupParticipants([]);
        fetchConversations();
      }
    });
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
  };

  const fetchMessages = (convId) => {
    router.get(route('profesor.chat.show', convId), {}, {
      preserveState: true,
      onSuccess: (page) => {
        setMessages(page.props.conversation?.messages || []);
      }
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() && !file) return;

    const formData = new FormData();
    formData.append('body', newMessage);
    formData.append('type', file ? 'file' : 'text');
    if (file) formData.append('file', file);

    // ✅ Crear un mensaje temporal para mostrar inmediatamente
    const tempMessage = {
      id: `temp-${Date.now()}`, // ID temporal único
      user_id: user.id,
      body: newMessage,
      type: file ? 'file' : 'text',
      created_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        last_name: user.last_name,
        photo: user.photo
      }
    };

    // ✅ Agregar mensaje temporalmente
    setMessages(prev => [...prev, tempMessage]);
    const messageText = newMessage;
    setNewMessage('');
    setFile(null);

    router.post(route('profesor.chat.message', selectedConversation.id), formData, {
      forceFormData: true,
      onSuccess: (page) => {
        // ✅ Reemplazar el mensaje temporal con el real del servidor
        const realMessage = page.props.conversation?.messages?.slice(-1)[0];
        if (realMessage) {
          setMessages(prev =>
            prev.map(m => m.id === tempMessage.id ? realMessage : m)
          );
        }
        fetchConversations();
      },
      onError: () => {
        // ✅ Si falla, quitar el mensaje temporal y restaurar el texto
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
      onSuccess: () => {
        // No fetchMessages, el evento lo maneja
        fetchConversations();
      }
    });
  };

  const addToGroup = (userId) => {
    if (!groupParticipants.includes(userId)) {
      setGroupParticipants([...groupParticipants, userId]);
    }
  };

  const removeFromGroup = (userId) => {
    setGroupParticipants(groupParticipants.filter(id => id !== userId));
  };

  return (
    <Layout title="Chat - Profesor">
      {/* Contenedor principal del chat */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex h-[calc(100vh-180px)]">
          {/* Sidebar: Lista de conversaciones */}
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            {/* Buscador */}
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Buscar usuarios... (presiona Enter)"
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

              {/* Filtros opcionales */}
              {!searchQuery && (
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1.5 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                    No leído
                  </button>
                  <button className="px-3 py-1.5 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                    Chats
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

            {/* Contenido dinámico: Resultados de búsqueda O Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                // Indicador de carga
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Buscando...</p>
                  </div>
                </div>
              ) : searchQuery && searchedUsers.length > 0 ? (
                // RESULTADOS DE BÚSQUEDA (cuando hay búsqueda activa)
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
                        {/* Avatar */}
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
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        {/* Info del usuario */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition">
                            {u.name} {u.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {u.email}
                          </p>
                        </div>

                        {/* Icono de mensaje */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery && searchedUsers.length === 0 && !isSearching ? (
                // No se encontraron resultados
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                  <Search className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="font-medium">No se encontraron usuarios</p>
                  <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                </div>
              ) : conversations.length === 0 ? (
                // No hay conversaciones
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="font-medium">No hay conversaciones aún</p>
                  <p className="text-sm mt-1">Busca un usuario o crea un grupo</p>
                </div>
              ) : (
                // LISTA DE CONVERSACIONES (vista normal)
                conversations.map(conv => {
                  const otherParticipant = conv.type === 'personal'
                    ? conv.participants.find(p => p.user_id !== user.id)?.user
                    : null;

                  return (
                    <div
                      key={conv.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      onClick={() => selectConversation(conv)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
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
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {conv.type === 'group'
                                ? conv.name
                                : otherParticipant
                                  ? `${otherParticipant.name} ${otherParticipant.last_name}`
                                  : 'Usuario desconocido'}
                            </p>
                            {conv.last_message_at && (
                              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                {new Date(conv.last_message_at).toLocaleTimeString('es-CO', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conv.messages?.[0] ? (
                              <>
                                {conv.messages[0].user_id === user.id ? (
                                  <span className="font-medium text-gray-700">Tú: </span>
                                ) : (
                                  <span className="font-medium text-gray-700">
                                    {conv.type === 'group'
                                      ? `${conv.messages[0].user?.name || 'Usuario'}: `
                                      : `${otherParticipant?.name || 'Usuario'}: `
                                    }
                                  </span>
                                )}
                                <span>
                                  {conv.messages[0].type === 'text'
                                    ? conv.messages[0].body
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
                  <button
                    onClick={startCall}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </button>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                      <p>Aún no hay mensajes en esta conversación</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${msg.user_id === user.id
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white rounded-bl-none border border-gray-200'
                            }`}
                        >
                          {msg.type === 'text' && <p className="leading-relaxed">{msg.body}</p>}
                          {msg.type === 'file' && (
                            <a
                              href={`/storage/${msg.attachment}`}
                              download
                              className="flex items-center gap-3 hover:underline"
                            >
                              <Paperclip className="h-5 w-5" />
                              <span>Archivo adjunto</span>
                            </a>
                          )}
                          {msg.type === 'call' && (
                            <p className="italic flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {msg.body} (Link: {msg.attachment})
                            </p>
                          )}
                          <p className="text-xs mt-2 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Barra de escritura */}
                <div className="p-4 border-t bg-white flex items-center gap-3">
                  <label
                    htmlFor="chat-file"
                    className="cursor-pointer p-3 hover:bg-gray-100 rounded-full transition"
                  >
                    <Paperclip className="h-5 w-5 text-gray-600" />
                  </label>
                  <input
                    type="file"
                    id="chat-file"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <input
                    className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() && !file}
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
        </div>
      </div>

      {/* Modal Crear Grupo */}
      {/* Modal Crear Grupo */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Crear nuevo grupo</h3>
              <button
                onClick={() => setShowNewGroup(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Contenido scrollable */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Nombre del grupo */}
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

              {/* Buscador de participantes */}
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

                      // Limpiar resultados automáticamente si se borra el texto
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

                {/* Resultados de búsqueda - con scroll si hay muchos */}
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

                {/* Mensaje cuando no hay resultados pero se buscó */}
                {searchQuery.trim().length >= 2 && searchedUsers.length === 0 && !isSearching && (
                  <div className="mt-4 text-center text-gray-500 py-6">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No se encontraron usuarios</p>
                    <p className="text-sm">Intenta con otro nombre o correo</p>
                  </div>
                )}
              </div>

              {/* Participantes seleccionados */}
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

            {/* Footer fijo */}
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




// falta hacer en en visto y demas
// //editar la info del grupo, participantes y demas
//arreglar la parte del archivo
//arreglar el estilo, y agregar enviar audios
//quitar filtro ese o hacerlo util
