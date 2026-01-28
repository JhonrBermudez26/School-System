import { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Video, VideoOff, Users, Copy, Check, Monitor } from 'lucide-react';

export default function Reunion() {
  const { props } = usePage();
  const { classInfo, meeting = null, studentsCount } = props;
  
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const jitsiContainer = useRef(null);
  const jitsiApi = useRef(null);
  
  const meetingUrl = meeting?.url || '';

  useEffect(() => {
    if (meeting && jitsiContainer.current && !jitsiApi.current) {
      loadJitsiScript();
    }

    return () => {
      if (jitsiApi.current) {
        jitsiApi.current.dispose();
        jitsiApi.current = null;
      }
    };
  }, [meeting]);

  const loadJitsiScript = () => {
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }

    setIsLoading(true);
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      setIsLoading(false);
      initJitsi();
    };
    script.onerror = () => {
      setIsLoading(false);
      alert('Error cargando Jitsi. Verifica tu conexión.');
    };
    document.body.appendChild(script);
  };

  const initJitsi = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainer.current && meeting) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: meeting.room_name,
        width: '100%',
        height: 600,
        parentNode: jitsiContainer.current,
        
        // Configuración mejorada
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false, // Entrar directo sin preview
          disableDeepLinking: true,
          defaultLanguage: 'es', // Español
          
          // Optimizaciones de rendimiento
          resolution: 720, // 720p máximo
          constraints: {
            video: {
              height: { ideal: 720, max: 720, min: 240 }
            }
          },
          
          // Desactivar características no necesarias
          disableInviteFunctions: true, // Sin invitar externos
          doNotStoreRoom: true, // No guardar en historial
        },
        
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 
            'camera', 
            'desktop', // Compartir pantalla
            'fullscreen',
            'hangup', 
            'chat', 
            'raisehand',
            'videoquality', 
            'tileview', // Vista mosaico
            'stats', // Estadísticas de conexión
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_LOGO_URL: '', // Tu logo aquí
          DEFAULT_WELCOME_PAGE_LOGO_URL: '',
        },
        
        // Info del usuario
        userInfo: {
          displayName: classInfo.teacher_name || 'Profesor',
        }
      };

      jitsiApi.current = new window.JitsiMeetExternalAPI(domain, options);
      
      // Eventos útiles
      jitsiApi.current.on('participantJoined', (participant) => {
        console.log('Usuario conectado:', participant);
      });
      
      jitsiApi.current.on('participantLeft', (participant) => {
        console.log('Usuario desconectado:', participant);
      });
      
      jitsiApi.current.on('videoConferenceLeft', () => {
        console.log('Saliste de la reunión');
      });
    }
  };

  const createMeeting = () => {
    setIsCreating(true);
    router.post(
      route('profesor.meetings.store'),
      {
        subject_id: classInfo.subject_id,
        group_id: classInfo.group_id,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsCreating(false);
        },
        onError: () => {
          setIsCreating(false);
          alert('Error creando la reunión');
        },
      }
    );
  };

  const endMeeting = () => {
    if (!confirm('¿Finalizar la reunión para todos?')) return;
    
    router.delete(route('profesor.meetings.destroy', { meeting: meeting.id }), {
      preserveScroll: true,
      onSuccess: () => {
        if (jitsiApi.current) {
          jitsiApi.current.executeCommand('hangup');
          jitsiApi.current.dispose();
          jitsiApi.current = null;
        }
      },
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!meeting) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
        <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Video className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No hay reunión activa
        </h3>
        <p className="text-gray-600 mb-6">
          Inicia una videollamada para conectarte con tus <strong>{studentsCount}</strong> estudiantes
        </p>
        <button
          onClick={createMeeting}
          disabled={isCreating}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          <Video className="h-5 w-5 mr-2" />
          {isCreating ? 'Creando reunión...' : 'Iniciar reunión virtual'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info de la reunión */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-md p-6 border border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Video className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Reunión activa</h3>
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full animate-pulse">
                  En vivo
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Iniciada {new Date(meeting.created_at).toLocaleString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={endMeeting}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow hover:shadow-lg"
          >
            <VideoOff className="h-4 w-4 mr-2" />
            Finalizar
          </button>
        </div>

        {/* Enlace para compartir */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Enlace para estudiantes
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={meetingUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 select-all"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={copyLink}
              className={`inline-flex items-center px-4 py-2 rounded-lg border transition-all ${
                copied
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Participantes */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            {meeting.participants_count || 0} participantes conectados
          </span>
        </div>
      </div>

      {/* Contenedor de Jitsi */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        {isLoading && (
          <div className="flex items-center justify-center h-[600px] bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando reunión...</p>
            </div>
          </div>
        )}
        <div ref={jitsiContainer} className={isLoading ? 'hidden' : ''} />
      </div>
    </div>
  );
}