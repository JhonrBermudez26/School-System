import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, MessageSquare } from 'lucide-react';

export default function ChatNotification() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 Iniciando escucha de notificaciones para usuario:', user.id);

    // Escuchar el canal privado del usuario
    const userChannel = window.Echo?.private(`user.${user.id}`);
    
    if (userChannel) {
      userChannel.listen('.chat.notification', (data) => {
        console.log('🔔 Nueva notificación de chat recibida:', data);
        
        // Crear notificación
        const newNotification = {
          id: Date.now(),
          conversationId: data.conversation_id,
          senderName: data.sender_name,
          message: data.message,
          timestamp: new Date(),
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);

        // Reproducir sonido de notificación (opcional)
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            console.log('No se pudo reproducir el sonido de notificación');
          });
        } catch (e) {
          console.log('Audio no disponible');
        }
      });
    }

    return () => {
      if (userChannel) {
        console.log('🔌 Desconectando escucha de notificaciones');
        userChannel.stopListening('.chat.notification');
      }
    };
  }, [user?.id]);

  const handleNotificationClick = (conversationId) => {
    router.visit(route('profesor.chat.show', conversationId));
    setNotifications(prev => prev.filter(n => n.conversationId !== conversationId));
  };

  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="pointer-events-auto bg-white rounded-xl shadow-2xl border-l-4 border-l-blue-500 p-4 min-w-[320px] max-w-[400px] cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.02] animate-slide-in"
          onClick={() => handleNotificationClick(notification.conversationId)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-gray-900 truncate text-sm">
                  {notification.senderName}
                </p>
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
              <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                {notification.message}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                Hace un momento
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}