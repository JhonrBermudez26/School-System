import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, MessageSquare, Bell, FileText } from 'lucide-react';

export default function UnifiedNotifications() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [notifications, setNotifications] = useState([]);

  // Helper para auto-remover notificaciones
  const autoRemove = (id) => {
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
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

  // ===== CHAT NOTIFICATIONS (canal privado por usuario) =====
  useEffect(() => {
    if (!user?.id) return;
    console.log('📡 Iniciando escucha de notificaciones de chat para usuario:', user.id);

    const userChannel = window.Echo?.private(`user.${user.id}`);

    if (userChannel) {
      userChannel.listen('.chat.notification', (data) => {
        console.log('🔔 Nueva notificación de chat recibida:', data);

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
        console.log('🔌 Desconectando escucha de notificaciones de chat');
        userChannel.stopListening('.chat.notification');
      }
    };
  }, [user?.id]);

  // ===== PUBLICATION NOTIFICATIONS (vía CustomEvents) =====
  // Los componentes Publicaciones (profesor/estudiante) ya escuchan Echo en sus canales
  // clase.* y emiten CustomEvents cuando reciben eventos. Este bloque los captura desde
  // aquí, así las notificaciones aparecen sin importar en qué panel estés dentro de esa clase.
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

  // Handlers
  const handleNotificationClick = (notification) => {
    if (notification.type === 'chat' && notification.conversationId) {
      router.visit(route('profesor.chat.show', { conversation: notification.conversationId }));
      closeNotification(notification.id);
    }
  };

  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
    if (type === 'publication-new') return 'border-l-green-500';
    if (type === 'publication-updated') return 'border-l-yellow-500';
    if (type === 'publication-deleted') return 'border-l-red-500';
    return 'border-l-gray-500';
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`pointer-events-auto bg-white rounded-xl shadow-2xl border-l-4 ${getBorderColor(notification.type)} p-4 min-w-[320px] max-w-[400px] transition-all transform hover:scale-[1.02] animate-slide-in ${
            notification.type === 'chat' ? 'cursor-pointer hover:shadow-xl' : ''
          }`}
          onClick={() => handleNotificationClick(notification)}
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

                {/* Botón cerrar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeNotification(notification.id);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Mensaje */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                {notification.message}
              </p>

              {/* Timestamp */}
              <p className={`text-xs font-medium ${
                notification.type === 'chat' ? 'text-blue-600' : 'text-indigo-600'
              }`}>
                Hace un momento
              </p>
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
}