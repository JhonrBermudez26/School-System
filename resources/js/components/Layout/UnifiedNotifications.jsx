import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, MessageSquare, Bell, FileText, ClipboardList, Video, Phone, PhoneOff } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function UnifiedNotifications() {
  const { auth } = usePage().props;
  const user = auth?.user;

  const [notifications, setNotifications] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper para auto-remover notificaciones (excepto las persistentes)
  const autoRemove = (id, isPersistent = false) => {
    if (!isPersistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  };

  // Helper para reproducir sonido
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        console.log('No se pudo reproducir el sonido de notificación');
      });
    } catch (e) {
      console.log('Audio no disponible');
    }
  };

  // ✅ NOTIFICACIONES DE REUNIONES GLOBALES
  useEffect(() => {
    if (!user?.id) {
      console.warn('[UnifiedNotifications] Usuario no disponible');
      return;
    }

    console.log('📡 [GLOBAL] Iniciando escucha de notificaciones de reuniones');
    console.log('[GLOBAL] Usuario:', user);
    console.log('[GLOBAL] Grupos del usuario:', user?.groups);

    // Obtener todos los grupos del usuario
    const userGroups = user?.groups || [];

    if (userGroups.length === 0) {
      console.warn('[GLOBAL] ⚠️ Usuario no tiene grupos asignados');
      return;
    }

    const channels = [];

    userGroups.forEach(group => {
      console.log(`🔌 [GLOBAL] Conectando al canal: group.${group.id}`);
      const groupChannel = window.Echo?.channel(`group.${group.id}`);

      if (groupChannel) {
        channels.push(groupChannel);

        // ✅ Escuchar cuando se inicia una reunión
        groupChannel.listen('.meeting.started', (data) => {
          console.log('📞 [GLOBAL] Nueva reunión iniciada:', data);

          const notifId = `call-${Date.now()}`;
          
          // Buscar información del grupo
          const groupInfo = userGroups.find(g => g.id === data.meeting.group_id);
          const subjectName = groupInfo?.subject_name || data.subject_name || 'tu clase';
          const teacherName = groupInfo?.teacher_name || data.teacher_name || 'tu profesor';

          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'call-incoming',
            title: '📞 Reunión Virtual Iniciada',
            teacherName: teacherName,
            subjectName: subjectName,
            message: `${teacherName} inició una videollamada en ${subjectName}`,
            timestamp: new Date(),
            meetingId: data.meeting.id,
            subjectId: data.meeting.subject_id,
            groupId: data.meeting.group_id,
            meetingUrl: data.meeting.url,
            isPersistent: true, // No se auto-elimina
          }]);

          playNotificationSound();

          // Vibración si está disponible
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }

          // Notificación nativa del navegador
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📞 Reunión Virtual Iniciada', {
              body: `${teacherName} inició una videollamada en ${subjectName}`,
              icon: '/logo.png',
              tag: `meeting-${data.meeting.id}`,
              requireInteraction: true,
            });
          }

          // Emitir evento personalizado
          window.dispatchEvent(new CustomEvent('nueva-llamada', {
            detail: {
              meetingId: data.meeting.id,
              groupId: data.meeting.group_id,
              subjectId: data.meeting.subject_id
            }
          }));
        });

        // ✅ Escuchar cuando se finaliza una reunión
        groupChannel.listen('.meeting.ended', (data) => {
          console.log('📴 [GLOBAL] Reunión finalizada:', data);

          // Remover notificación de llamada si existe
          setNotifications(prev => 
            prev.filter(n => n.meetingId !== data.meeting_id)
          );

          // Notificación nativa
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Reunión Finalizada', {
              body: 'La videollamada ha terminado',
              icon: '/logo.png',
              tag: `meeting-${data.meeting_id}`,
            });
          }
        });
      }
    });

    return () => {
      console.log('🔌 [GLOBAL] Desconectando escucha de notificaciones de reuniones');
      channels.forEach(channel => {
        if (channel) {
          channel.stopListening('.meeting.started');
          channel.stopListening('.meeting.ended');
        }
      });
    };
  }, [user?.id, user?.groups?.length]);

  // ===== TASK NOTIFICATIONS =====
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 [GLOBAL] Iniciando escucha de notificaciones de tareas');

    const userGroups = user?.groups || [];
    const channels = [];

    userGroups.forEach(group => {
      const groupChannel = window.Echo?.channel(`group.${group.id}`);

      if (groupChannel) {
        channels.push(groupChannel);

        groupChannel.listen('.task.created', (data) => {
          console.log('🔔 [GLOBAL] Nueva tarea creada:', data);

          const notifId = `task-${Date.now()}`;
          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'task-new',
            title: 'Nueva Tarea Asignada',
            message: `${data.teacher_name} publicó: ${data.title} en ${data.subject_name}`,
            timestamp: new Date(),
            taskId: data.task_id,
            subjectId: data.subject_id,
            groupId: data.group_id,
          }]);

          autoRemove(notifId);
          playNotificationSound();

          window.dispatchEvent(new CustomEvent('nueva-tarea', {
            detail: {
              taskId: data.task_id,
              groupId: data.group_id,
              subjectId: data.subject_id
            }
          }));
        });
      }
    });

    return () => {
      channels.forEach(channel => {
        if (channel) channel.stopListening('.task.created');
      });
    };
  }, [user?.id, user?.groups?.length]);

  // ===== CHAT NOTIFICATIONS =====
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 [GLOBAL] Iniciando escucha de notificaciones de chat');

    const userChannel = window.Echo?.private(`user.${user.id}`);

    if (userChannel) {
      userChannel.listen('.chat.notification', (data) => {
        console.log('🔔 [GLOBAL] Nueva notificación de chat:', data);

        const notifId = `chat-${Date.now()}`;
        const newNotification = {
          id: notifId,
          type: 'chat',
          conversationId: data.conversation_id,
          senderName: data.sender_name,
          message: data.message,
          timestamp: new Date(),
        };

        setNotifications(prev => [...prev, newNotification]);
        autoRemove(notifId);
        playNotificationSound();
      });
    }

    return () => {
      if (userChannel) {
        userChannel.stopListening('.chat.notification');
      }
    };
  }, [user?.id]);

  // ===== PUBLICATION NOTIFICATIONS =====
  useEffect(() => {
    const handleNewPost = (event) => {
      const { publicacion } = event.detail;
      const notifId = `pub-new-custom-${Date.now()}`;
      setNotifications(prev => [
        ...prev,
        {
          id: notifId,
          type: 'publication-new',
          title: 'Nueva publicación',
          message: `${publicacion.author_name}: ${publicacion.title}`,
          avatar: publicacion.author_photo,
        }
      ]);
      autoRemove(notifId);
      playNotificationSound();
    };

    const handleUpdatedPost = (event) => {
      const { publicacion } = event.detail;
      const notifId = `pub-updated-custom-${Date.now()}`;
      setNotifications(prev => [
        ...prev,
        {
          id: notifId,
          type: 'publication-updated',
          title: 'Publicación actualizada',
          message: `${publicacion.author_name} editó: ${publicacion.title}`,
          avatar: publicacion.author_photo,
        }
      ]);
      autoRemove(notifId);
    };

    const handleDeletedPost = (event) => {
      const { title } = event.detail;
      const notifId = `pub-deleted-custom-${Date.now()}`;
      setNotifications(prev => [
        ...prev,
        {
          id: notifId,
          type: 'publication-deleted',
          title: 'Publicación eliminada',
          message: `Se eliminó: ${title}`,
        }
      ]);
      autoRemove(notifId);
    };

    window.addEventListener('nueva-publicacion', handleNewPost);
    window.addEventListener('publicacion-actualizada', handleUpdatedPost);
    window.addEventListener('publicacion-eliminada', handleDeletedPost);

    return () => {
      window.removeEventListener('nueva-publicacion', handleNewPost);
      window.removeEventListener('publicacion-actualizada', handleUpdatedPost);
      window.removeEventListener('publicacion-eliminada', handleDeletedPost);
    };
  }, []);

  // Solicitar permiso de notificaciones al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handlers
  const handleNotificationClick = (notification) => {
    if (notification.type === 'chat' && notification.conversationId) {
      // ✅ CORREGIDO: usar roles[0] en lugar de role
      const primaryRole = user?.roles?.[0]?.toLowerCase();
      const routeName = primaryRole === 'estudiante' 
        ? 'estudiante.chat.show'
        : 'profesor.chat.show';

      router.visit(route(routeName, { conversation: notification.conversationId }));
      closeNotification(notification.id);
    }

    // ✅ Navegación para llamadas
    if (notification.type === 'call-incoming' && notification.subjectId && notification.groupId) {
      const primaryRole = user?.roles?.[0]?.toLowerCase();
      const routeName = primaryRole === 'estudiante' 
        ? 'estudiante.clases.show' 
        : 'profesor.clases.show';

      router.visit(route(routeName, { 
        subject_id: notification.subjectId, 
        group_id: notification.groupId 
      }));
      closeNotification(notification.id);
    }

    // ✅ Navegación para tareas
    if (notification.type === 'task-new' && notification.subjectId && notification.groupId) {
      const primaryRole = user?.roles?.[0]?.toLowerCase();
      const routeName = primaryRole === 'estudiante' 
        ? 'estudiante.clases.show' 
        : 'profesor.clases.show';

      router.visit(route(routeName, { 
        subject_id: notification.subjectId, 
        group_id: notification.groupId 
      }));
      closeNotification(notification.id);
    }
  };

  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ✅ Acciones de llamada
  const acceptCall = (notification) => {
    handleNotificationClick(notification);
  };

  const rejectCall = (id) => {
    closeNotification(id);
  };

  // Renderizar icono según tipo
  const getNotificationIcon = (notification) => {
    if (notification.type === 'chat') {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
      );
    }

    if (notification.type === 'call-incoming') {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <Video className="h-5 w-5 text-white" />
        </div>
      );
    }

    if (notification.type === 'task-new') {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
      );
    }

    if (notification.avatar) {
      return (
        <img
          src={notification.avatar}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
        <FileText className="h-5 w-5 text-white" />
      </div>
    );
  };

  // Obtener color de borde según tipo
  const getBorderColor = (type) => {
    if (type === 'chat') return 'border-l-blue-500';
    if (type === 'call-incoming') return 'border-l-green-500';
    if (type === 'task-new') return 'border-l-indigo-600';
    if (type === 'publication-new') return 'border-l-green-500';
    if (type === 'publication-updated') return 'border-l-yellow-500';
    if (type === 'publication-deleted') return 'border-l-red-500';
    return 'border-l-gray-500';
  };

  if (!mounted || notifications.length === 0) return null;

  // ✅ Usar Portal para renderizar fuera del árbol de componentes
  const notificationUI = (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`pointer-events-auto bg-white rounded-xl shadow-2xl border-l-4 ${getBorderColor(notification.type)} p-4 min-w-[320px] max-w-[400px] transition-all transform hover:scale-[1.02] animate-slide-in ${
            notification.type === 'chat' || notification.type === 'call-incoming' 
              ? 'cursor-pointer hover:shadow-xl' 
              : ''
          }`}
          onClick={() => notification.type !== 'call-incoming' && handleNotificationClick(notification)}
        >
          <div className="flex items-start gap-3">
            {/* Icono */}
            <div className="flex-shrink-0">
              {getNotificationIcon(notification)}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                {/* Título */}
                <div className="flex items-center gap-2">
                  {notification.type === 'chat' ? (
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  ) : notification.type === 'call-incoming' ? (
                    <Phone className="h-4 w-4 text-green-600 animate-bounce" />
                  ) : notification.type === 'task-new' ? (
                    <ClipboardList className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-indigo-600" />
                  )}
                  <p className="font-semibold text-gray-900 truncate text-sm">
                    {notification.type === 'chat'
                      ? notification.senderName
                      : notification.title
                    }
                  </p>
                </div>

                {/* Botón cerrar (solo si no es llamada) */}
                {notification.type !== 'call-incoming' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeNotification(notification.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Mensaje */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                {notification.message}
              </p>

              {/* ✅ Botones para llamadas */}
              {notification.type === 'call-incoming' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptCall(notification);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Unirse
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectCall(notification.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <PhoneOff className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              )}

              {/* Timestamp (solo si no es llamada) */}
              {notification.type !== 'call-incoming' && (
                <p className={`text-xs font-medium ${
                  notification.type === 'chat' ? 'text-blue-600' :
                  notification.type === 'task-new' ? 'text-indigo-600' :
                  'text-indigo-600'
                }`}>
                  Hace un momento
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );

  return createPortal(notificationUI, document.body);
}