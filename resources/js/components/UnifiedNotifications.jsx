import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, MessageSquare, Bell, FileText, ClipboardList, Video, Phone, PhoneOff, Users } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function UnifiedNotifications() {
  const { auth } = usePage().props;
  const user = auth?.user;

  const [notifications, setNotifications] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Refs para mantener track de canales suscritos
  const subscribedChannels = useRef(new Set());
  const notificationSound = useRef(null);
  const callSound = useRef(null);
  const audioContext = useRef(null);
  const audioInitialized = useRef(false);

  // ✅ INICIALIZAR AUDIO CON AUDIOCONTEXT Y AUTO-UNLOCK
  useEffect(() => {
    setMounted(true);

    // Crear AudioContext (mejor compatibilidad con autoplay)
    try {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      console.log('✅ AudioContext creado');
    } catch (e) {
      console.warn('⚠️ AudioContext no disponible:', e);
    }

    // Crear instancias de audio
    const notifAudioUrl = '/Notificacion.mp3';
    const callAudioUrl = '/Llamada.mp3';

    notificationSound.current = new Audio(notifAudioUrl);
    notificationSound.current.volume = 0.5;
    notificationSound.current.preload = 'auto';

    callSound.current = new Audio(callAudioUrl);
    callSound.current.volume = 0.5;
    callSound.current.loop = true;
    callSound.current.preload = 'auto';

    // Listeners
    notificationSound.current.addEventListener('canplaythrough', () => {
      console.log('✅ Audio de notificación cargado y listo');
    });

    notificationSound.current.addEventListener('error', (e) => {
      console.error('❌ Error cargando audio de notificación:', e);
    });

    callSound.current.addEventListener('canplaythrough', () => {
      console.log('✅ Audio de llamada cargado y listo');
    });

    callSound.current.addEventListener('error', (e) => {
      console.error('❌ Error cargando audio de llamada:', e);
    });

    // ✅ INTENTAR AUTO-UNLOCK INMEDIATAMENTE
    const tryAutoUnlock = async () => {
      try {
        // Resumir AudioContext si está suspendido
        if (audioContext.current?.state === 'suspended') {
          await audioContext.current.resume();
          console.log('✅ AudioContext resumido');
        }

        // Intentar play/pause para unlock (sin esperar interacción)
        const unlockNotif = notificationSound.current.play();
        if (unlockNotif) {
          unlockNotif
            .then(() => {
              notificationSound.current.pause();
              notificationSound.current.currentTime = 0;
              console.log('✅ Audio de notificación desbloqueado automáticamente');
            })
            .catch(() => {
              console.log('⏳ Audio de notificación necesita interacción');
            });
        }

        const unlockCall = callSound.current.play();
        if (unlockCall) {
          unlockCall
            .then(() => {
              callSound.current.pause();
              callSound.current.currentTime = 0;
              console.log('✅ Audio de llamada desbloqueado automáticamente');
            })
            .catch(() => {
              console.log('⏳ Audio de llamada necesita interacción');
            });
        }
      } catch (err) {
        console.log('⏳ Esperando interacción del usuario');
      }
    };

    // Intentar inmediatamente
    setTimeout(tryAutoUnlock, 100);

    // ✅ UNLOCK CON PRIMERA INTERACCIÓN (BACKUP)
    const unlockOnInteraction = async () => {
      if (audioInitialized.current) return;

      try {
        // Resumir AudioContext
        if (audioContext.current?.state === 'suspended') {
          await audioContext.current.resume();
        }

        // Unlock ambos audios
        if (notificationSound.current) {
          await notificationSound.current.play();
          notificationSound.current.pause();
          notificationSound.current.currentTime = 0;
        }

        if (callSound.current) {
          await callSound.current.play();
          callSound.current.pause();
          callSound.current.currentTime = 0;
        }

        audioInitialized.current = true;
        console.log('✅ Audio completamente desbloqueado vía interacción');

      } catch (err) {
        console.log('ℹ️ Error en unlock:', err.message);
      }
    };

    // Listeners para interacción
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, unlockOnInteraction, { once: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockOnInteraction);
      });

      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
      if (callSound.current) {
        callSound.current.pause();
        callSound.current = null;
      }
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, []);

  // ✅ REPRODUCIR SONIDO DE NOTIFICACIÓN (SIN VERIFICACIONES BLOQUEANTES)
  const playNotificationSound = () => {
    try {
      if (!notificationSound.current) return;

      notificationSound.current.currentTime = 0;

      const playPromise = notificationSound.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Sonido de notificación reproducido');
          })
          .catch(err => {
            console.log('⚠️ No se pudo reproducir sonido:', err.message);
          });
      }

    } catch (err) {
      console.warn('❌ Error reproduciendo notificación:', err);
    }
  };

  // ✅ REPRODUCIR SONIDO DE LLAMADA
  const playCallSound = () => {
    try {
      if (!callSound.current) return;

      callSound.current.currentTime = 0;

      const playPromise = callSound.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('📞 Sonido de llamada reproduciendo...');
          })
          .catch(err => {
            console.log('⚠️ No se pudo reproducir llamada:', err.message);
          });
      }

    } catch (err) {
      console.warn('❌ Error reproduciendo llamada:', err);
    }
  };

  // ✅ DETENER SONIDO DE LLAMADA
  const stopCallSound = () => {
    try {
      if (callSound.current) {
        callSound.current.pause();
        callSound.current.currentTime = 0;
        console.log('🔇 Sonido de llamada detenido');
      }
    } catch (e) {
      console.log('❌ Error al detener audio de llamada:', e);
    }
  };

  // Helper para vibración
  const vibrate = (pattern = [200, 100, 200]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Helper para notificaciones nativas del navegador
  const showBrowserNotification = (title, body, tag, requireInteraction = false) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/logo.png',
          tag,
          requireInteraction,
          badge: '/logo.png',
        });
      } catch (e) {
        console.log('Error mostrando notificación nativa:', e);
      }
    }
  };

  // Helper para auto-remover notificaciones
  const autoRemove = (id, delay = 5000) => {
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, delay);
  };

  // ✅ SUSCRIPCIÓN GLOBAL A TODOS LOS CANALES DEL USUARIO
  useEffect(() => {
    if (!user?.id || !window.Echo) {
      console.warn('[UnifiedNotifications] Usuario o Echo no disponible');
      return;
    }

    console.log('📡 [GLOBAL] Iniciando suscripción a notificaciones globales');
    console.log('[GLOBAL] Usuario:', user);

    const cleanupFunctions = [];

    // =====================================================
    // 1. CANAL PRIVADO DE USUARIO (Chat, grupos agregados)
    // =====================================================
    const userChannelName = `user.${user.id}`;
    if (!subscribedChannels.current.has(userChannelName)) {
      console.log(`🔌 Suscribiendo a canal privado: ${userChannelName}`);
      const userChannel = window.Echo.private(userChannelName);
      subscribedChannels.current.add(userChannelName);

      // Chat notifications
      userChannel.listen('.chat.notification', (data) => {
        console.log('💬 Nueva notificación de chat:', data);

        const notifId = `chat-${Date.now()}`;
        setNotifications(prev => [...prev, {
          id: notifId,
          type: 'chat',
          conversationId: data.conversation_id,
          senderName: data.sender_name,
          message: data.message,
          timestamp: new Date(),
        }]);

        autoRemove(notifId);
        playNotificationSound();
        vibrate();
        showBrowserNotification(
          `Mensaje de ${data.sender_name}`,
          data.message,
          `chat-${data.conversation_id}`
        );
      });

      // Agregado a grupo
      userChannel.listen('.group.added', (data) => {
        console.log('👥 Agregado a grupo:', data);

        const notifId = `group-added-${Date.now()}`;
        setNotifications(prev => [...prev, {
          id: notifId,
          type: 'group-added',
          title: 'Agregado a grupo',
          message: `${data.addedBy} te agregó al grupo "${data.conversationName}"`,
          conversationId: data.conversationId,
          timestamp: new Date(),
        }]);

        autoRemove(notifId);
        playNotificationSound();
        showBrowserNotification(
          'Nuevo grupo',
          `${data.addedBy} te agregó al grupo "${data.conversationName}"`,
          `group-${data.conversationId}`
        );
      });

      cleanupFunctions.push(() => {
        userChannel.stopListening('.chat.notification');
        userChannel.stopListening('.group.added');
        subscribedChannels.current.delete(userChannelName);
      });
    }

    // =====================================================
    // 2. CANALES DE GRUPOS (Reuniones, Tareas, Entregas)
    // =====================================================
    const userGroups = user?.groups || [];

    userGroups.forEach(group => {
      const groupChannelName = `group.${group.id}`;

      if (!subscribedChannels.current.has(groupChannelName)) {
        console.log(`🔌 Suscribiendo a canal de grupo: ${groupChannelName}`);
        const groupChannel = window.Echo.channel(groupChannelName);
        subscribedChannels.current.add(groupChannelName);

        // Reunión iniciada
        groupChannel.listen('.meeting.started', (data) => {
          console.log('📞 Reunión iniciada:', data);

          const isProfessor = user?.roles?.[0]?.toLowerCase() === 'profesor';
          if (isProfessor) {
            console.log('⏭️ Notificación de reunión omitida (eres el profesor que la creó)');
            return;
          }

          const notifId = `meeting-${data.meeting.id}`;
          const subjectName = data.subject_name || 'tu clase';
          const teacherName = data.teacher_name || 'el profesor';

          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'call-incoming',
            title: '📞 Reunión Virtual Iniciada',
            teacherName,
            subjectName,
            message: `${teacherName} inició una videollamada en ${subjectName}`,
            timestamp: new Date(),
            meetingId: data.meeting.id,
            subjectId: data.meeting.subject_id,
            groupId: data.meeting.group_id,
            meetingUrl: data.meeting.url,
            isPersistent: true,
          }]);

          playCallSound();
          vibrate([200, 100, 200, 100, 200]);
          showBrowserNotification(
            '📞 Reunión Virtual Iniciada',
            `${teacherName} inició una videollamada en ${subjectName}`,
            `meeting-${data.meeting.id}`,
            true
          );
        });

        // Reunión finalizada
        groupChannel.listen('.meeting.ended', (data) => {
          console.log('📴 Reunión finalizada:', data);

          const isProfessor = user?.roles?.[0]?.toLowerCase() === 'profesor';
          if (isProfessor) {
            console.log('⏭️ Notificación de reunión finalizada omitida (eres el profesor)');
            setNotifications(prev =>
              prev.filter(n => n.meetingId !== data.meeting_id)
            );
            stopCallSound();
            return;
          }

          setNotifications(prev =>
            prev.filter(n => n.meetingId !== data.meeting_id)
          );

          stopCallSound();

          showBrowserNotification(
            'Reunión Finalizada',
            'La videollamada ha terminado',
            `meeting-${data.meeting_id}`
          );
        });

        // Nueva tarea
        groupChannel.listen('.task.created', (data) => {
          console.log('📝 Nueva tarea:', data);

          const isProfessor = user?.roles?.[0]?.toLowerCase() === 'profesor';
          if (isProfessor && data.teacher_id === user?.id) {
            console.log('⏭️ Notificación omitida (tú creaste esta tarea)');
            return;
          }
          const notifId = `task-new-${Date.now()}`;
          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'task-new',
            title: 'Nueva Tarea Asignada',
            message: `${data.teacher_name} publicó: ${data.title}`,
            subjectName: data.subject_name,
            timestamp: new Date(),
            taskId: data.task_id,
            subjectId: data.subject_id,
            groupId: data.group_id,
          }]);

          autoRemove(notifId, 7000);
          playNotificationSound();
          vibrate();
          showBrowserNotification(
            'Nueva Tarea',
            `${data.teacher_name} publicó: ${data.title}`,
            `task-${data.task_id}`
          );
        });

        // Tarea actualizada
        groupChannel.listen('.task.updated', (data) => {
          console.log('📝 Tarea actualizada:', data);

          const isProfessor = user?.roles?.[0]?.toLowerCase() === 'profesor';
          if (isProfessor && data.teacher_id === user?.id) {
            console.log('⏭️ Notificación omitida (tú actualizaste esta tarea)');
            return;
          }
          const notifId = `task-updated-${Date.now()}`;
          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'task-updated',
            title: 'Tarea Actualizada',
            message: `${data.teacher_name} actualizó: ${data.title}`,
            timestamp: new Date(),
            taskId: data.task_id,
            subjectId: data.subject_id,
            groupId: data.group_id,
          }]);

          autoRemove(notifId);
          playNotificationSound();
        });

        // Tarea eliminada
        groupChannel.listen('.task.deleted', (data) => {
          console.log('🗑️ Tarea eliminada:', data);
          const isProfessor = user?.roles?.[0]?.toLowerCase() === 'profesor';
          if (isProfessor && data.teacher_id === user?.id) {
            console.log('⏭️ Notificación omitida (tú actualizaste esta tarea)');
            return;
          }
          const notifId = `task-deleted-${Date.now()}`;
          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'task-deleted',
            title: 'Tarea Eliminada',
            message: data.message,
            timestamp: new Date(),
          }]);

          autoRemove(notifId);
          playNotificationSound();
        });

        // Entrega creada (solo para profesores)
        if (user?.roles?.[0]?.toLowerCase() === 'profesor') {
          groupChannel.listen('.submission.created', (data) => {
            console.log('📬 Nueva entrega:', data);

            const notifId = `submission-${Date.now()}`;
            setNotifications(prev => [...prev, {
              id: notifId,
              type: 'submission-new',
              title: 'Nueva Entrega',
              message: data.message,
              timestamp: new Date(),
              taskId: data.task_id,
              groupId: data.group_id,
            }]);

            autoRemove(notifId, 7000);
            playNotificationSound();
            showBrowserNotification(
              'Nueva Entrega',
              data.message,
              `submission-${data.submission_id}`
            );
          });

          groupChannel.listen('.submission.updated', (data) => {
            console.log('📝 Entrega actualizada:', data);

            const notifId = `submission-updated-${Date.now()}`;
            setNotifications(prev => [...prev, {
              id: notifId,
              type: 'submission-updated',
              title: 'Entrega Actualizada',
              message: data.message,
              timestamp: new Date(),
            }]);

            autoRemove(notifId);
            playNotificationSound();
          });
        }

        // Entrega calificada (solo para estudiantes)
        if (user?.roles?.[0]?.toLowerCase() === 'estudiante') {
          groupChannel.listen('.submission.graded', (data) => {
            if (data.affected_students?.includes(user.id)) {
              console.log('✅ Tu entrega fue calificada:', data);

              const notifId = `graded-${Date.now()}`;
              setNotifications(prev => [...prev, {
                id: notifId,
                type: 'submission-graded',
                title: 'Entrega Calificada',
                message: data.message,
                score: data.score,
                maxScore: data.max_score,
                timestamp: new Date(),
                taskId: data.task_id,
                groupId: data.group_id,
              }]);

              autoRemove(notifId, 10000);
              playNotificationSound();
              vibrate();
              showBrowserNotification(
                'Entrega Calificada',
                `${data.message} - Nota: ${data.score}/${data.max_score}`,
                `graded-${data.submission_id}`
              );
            }
          });
        }

        cleanupFunctions.push(() => {
          groupChannel.stopListening('.meeting.started');
          groupChannel.stopListening('.meeting.ended');
          groupChannel.stopListening('.task.created');
          groupChannel.stopListening('.task.updated');
          groupChannel.stopListening('.task.deleted');
          groupChannel.stopListening('.submission.created');
          groupChannel.stopListening('.submission.updated');
          groupChannel.stopListening('.submission.graded');
          subscribedChannels.current.delete(groupChannelName);
        });
      }
    });

    // =====================================================
    // 3. CANALES DE CLASE (Publicaciones)
    // =====================================================
    const classChannels = new Set();

    userGroups.forEach(group => {
      const classChannelName = `private-clase.${group.subject_id}.${group.id}`;

      if (!subscribedChannels.current.has(classChannelName) && !classChannels.has(classChannelName)) {
        console.log(`🔌 Suscribiendo a canal de clase: ${classChannelName}`);
        const classChannel = window.Echo.private(`clase.${group.subject_id}.${group.id}`);
        subscribedChannels.current.add(classChannelName);
        classChannels.add(classChannelName);

        // Nueva publicación
        classChannel.listen('.nueva.publicacion', (data) => {
          console.log('📢 Nueva publicación:', data);

          const notifId = `pub-new-${Date.now()}`;
          const pub = data.publicacion;

          if (pub.author_id === user?.id) {
            console.log('⏭️ Notificación omitida (tú creaste esta publicación)');
            return;
          }


          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'publication-new',
            title: 'Nueva Publicación',
            message: `${pub.author_name}: ${pub.title}`,
            avatar: pub.author_photo,
            timestamp: new Date(),
          }]);

          autoRemove(notifId);
          playNotificationSound();
        });

        // Publicación actualizada
        classChannel.listen('.publicacion.actualizada', (data) => {
          console.log('📝 Publicación actualizada:', data);

          const notifId = `pub-updated-${Date.now()}`;
          const pub = data.publicacion;
          if (pub.author_id === user?.id) {
            console.log('⏭️ Notificación omitida (tú creaste esta publicación)');
            return;
          }
          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'publication-updated',
            title: 'Publicación Actualizada',
            message: `${pub.author_name} editó: ${pub.title}`,
            avatar: pub.author_photo,
            timestamp: new Date(),
          }]);

          autoRemove(notifId);
          playNotificationSound();
        });

        // Publicación eliminada
        classChannel.listen('.publicacion.eliminada', (data) => {
          console.log('🗑️ Publicación eliminada:', data);
          const pub = data.publicacion;
          if (pub.author_id === user?.id) {
            console.log('⏭️ Notificación omitida (tú creaste esta publicación)');
            return;
          }
          const notifId = `pub-deleted-${Date.now()}`;
          setNotifications(prev => [...prev, {
            id: notifId,
            type: 'publication-deleted',
            title: 'Publicación Eliminada',
            message: 'Se eliminó una publicación',
            timestamp: new Date(),
          }]);

          autoRemove(notifId);
          playNotificationSound();
        });

        cleanupFunctions.push(() => {
          classChannel.stopListening('.nueva.publicacion');
          classChannel.stopListening('.publicacion.actualizada');
          classChannel.stopListening('.publicacion.eliminada');
          subscribedChannels.current.delete(classChannelName);
        });
      }
    });

    return () => {
      console.log('🔌 Limpiando suscripciones globales');
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [user?.id, user?.groups?.length, user?.roles?.[0]]);

  // ✅ SOLICITAR PERMISO DE NOTIFICACIONES VISUALES
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permiso de notificaciones visuales:', permission);
      });
    }
  }, []);

  // Handlers
  const handleNotificationClick = (notification) => {
    const primaryRole = user?.roles?.[0]?.toLowerCase();

    if (notification.type === 'chat' && notification.conversationId) {
      const routeName = primaryRole === 'estudiante'
        ? 'estudiante.chat.show'
        : 'profesor.chat.show';
      router.visit(route(routeName, { conversation: notification.conversationId }));
      closeNotification(notification.id);
    }

    if ((notification.type === 'call-incoming' || notification.type === 'task-new' || notification.type === 'task-updated')
      && notification.subjectId && notification.groupId) {
      const routeName = primaryRole === 'estudiante'
        ? 'estudiante.clases.show'
        : 'profesor.clases.show';
      router.visit(route(routeName, {
        subject_id: notification.subjectId,
        group_id: notification.groupId
      }));
      closeNotification(notification.id);
    }

    if (notification.type === 'submission-graded' && notification.taskId) {
      router.visit(route('estudiante.tasks.show', { task: notification.taskId }));
      closeNotification(notification.id);
    }

    if (notification.type === 'group-added' && notification.conversationId) {
      const routeName = primaryRole === 'estudiante'
        ? 'estudiante.chat.show'
        : 'profesor.chat.show';
      router.visit(route(routeName, { conversation: notification.conversationId }));
      closeNotification(notification.id);
    }
  };

  const closeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification?.type === 'call-incoming') {
      stopCallSound();
    }
  };

  const acceptCall = (notification) => {
    stopCallSound();
    handleNotificationClick(notification);
  };

  const rejectCall = (id) => {
    stopCallSound();
    closeNotification(id);
  };

  const getNotificationIcon = (notification) => {
    const iconMap = {
      'chat': { Icon: MessageSquare, gradient: 'from-blue-500 to-blue-600' },
      'call-incoming': { Icon: Video, gradient: 'from-green-500 to-green-600', pulse: true },
      'task-new': { Icon: ClipboardList, gradient: 'from-indigo-500 to-purple-600' },
      'task-updated': { Icon: FileText, gradient: 'from-yellow-500 to-orange-600' },
      'task-deleted': { Icon: FileText, gradient: 'from-red-500 to-red-600' },
      'submission-new': { Icon: FileText, gradient: 'from-green-500 to-teal-600' },
      'submission-graded': { Icon: ClipboardList, gradient: 'from-purple-500 to-pink-600' },
      'group-added': { Icon: Users, gradient: 'from-blue-500 to-cyan-600' },
    };

    const config = iconMap[notification.type];

    if (notification.avatar) {
      return (
        <img
          src={notification.avatar}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover shadow-lg"
        />
      );
    }

    if (config) {
      const { Icon, gradient, pulse } = config;
      return (
        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center shadow-lg ${pulse ? 'animate-pulse' : ''}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
        <Bell className="h-5 w-5 text-white" />
      </div>
    );
  };

  const getBorderColor = (type) => {
    const colorMap = {
      'chat': 'border-l-blue-500',
      'call-incoming': 'border-l-green-500',
      'task-new': 'border-l-indigo-600',
      'task-updated': 'border-l-yellow-500',
      'task-deleted': 'border-l-red-500',
      'submission-new': 'border-l-green-500',
      'submission-graded': 'border-l-purple-500',
      'publication-new': 'border-l-green-500',
      'publication-updated': 'border-l-yellow-500',
      'publication-deleted': 'border-l-red-500',
      'group-added': 'border-l-blue-500',
    };
    return colorMap[type] || 'border-l-gray-500';
  };

  if (!mounted || notifications.length === 0) return null;

  const notificationUI = (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none max-h-[90vh] overflow-y-auto">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`pointer-events-auto bg-white rounded-xl shadow-2xl border-l-4 ${getBorderColor(notification.type)} p-4 min-w-[320px] max-w-[400px] transition-all transform hover:scale-[1.02] animate-slide-in ${['chat', 'call-incoming', 'task-new', 'task-updated', 'submission-graded', 'group-added'].includes(notification.type)
            ? 'cursor-pointer hover:shadow-xl'
            : ''
            }`}
          onClick={() => {
            if (notification.type !== 'call-incoming') {
              handleNotificationClick(notification);
            }
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-gray-900 truncate text-sm flex items-center gap-2">
                  {notification.title || notification.senderName}
                  {notification.subjectName && (
                    <span className="text-xs text-gray-500 font-normal">
                      • {notification.subjectName}
                    </span>
                  )}
                </p>

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

              <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                {notification.message}
              </p>

              {notification.type === 'submission-graded' && notification.score !== undefined && (
                <div className="mt-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                  <p className="text-sm font-semibold text-purple-700">
                    Nota: {notification.score}/{notification.maxScore}
                  </p>
                </div>
              )}

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

              {notification.type !== 'call-incoming' && (
                <p className="text-xs text-gray-500 mt-1">
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