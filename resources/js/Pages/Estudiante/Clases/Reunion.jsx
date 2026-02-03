import { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Copy, Check, Monitor, Calendar, 
  Clock, ExternalLink, Loader2, Users
} from 'lucide-react';

export default function Reunion({ meeting = null, classInfo }) {
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
      
      // Obtener el nombre del usuario del contexto
      const userName = classInfo.student_name || 'Estudiante';
      
      const options = {
        roomName: meeting.room_name,
        width: '100%',
        height: 600,
        parentNode: jitsiContainer.current,
        
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          defaultLanguage: 'es',
          resolution: 720,
          constraints: {
            video: {
              height: { ideal: 720, max: 720, min: 240 }
            }
          },
          disableInviteFunctions: true,
          doNotStoreRoom: true,
        },
        
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 
            'camera', 
            'desktop',
            'fullscreen',
            'hangup', 
            'chat', 
            'raisehand',
            'videoquality',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DEFAULT_LOGO_URL: '',
          DEFAULT_WELCOME_PAGE_LOGO_URL: '',
        },
        
        userInfo: {
          displayName: userName,
        }
      };

      jitsiApi.current = new window.JitsiMeetExternalAPI(domain, options);
      
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

  const copyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!meeting) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <VideoOff className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          No hay reunión activa
        </h3>
        <p className="text-gray-600 text-base sm:text-lg max-w-md mx-auto">
          Cuando tu profesor inicie una videollamada, aparecerá aquí para que puedas unirte
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mt-6">
          <Clock className="h-4 w-4" />
          Espera a que el profesor inicie la clase
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info de la reunión */}
      <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-teal-50 rounded-3xl shadow-xl p-5 sm:p-7 border-2 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Video className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Reunión en vivo</h3>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full animate-pulse shadow-md">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                  En vivo
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {new Date(meeting.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {new Date(meeting.created_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enlace de la reunión */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-blue-100">
          <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            Enlace de la reunión
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={meetingUrl}
                readOnly
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl bg-gray-50 
                  text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 
                  focus:border-blue-500 select-all transition-all"
                onClick={(e) => e.target.select()}
              />
              <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={copyLink}
              className={`
                inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 
                font-bold transition-all shadow-md hover:shadow-lg whitespace-nowrap
                ${copied
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar enlace
                </>
              )}
            </button>
          </div>
        </div>

        {/* Participantes */}
        {meeting.participants_count !== undefined && (
          <div className="mt-5 flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md border border-blue-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Participantes activos</p>
              <p className="text-lg font-bold text-gray-900">
                {meeting.participants_count || 0} conectados
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Contenedor de Jitsi */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px] sm:h-[600px] bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Cargando reunión...</p>
            <p className="text-sm text-gray-500">Esto puede tardar unos segundos</p>
          </div>
        ) : (
          <div ref={jitsiContainer} className="w-full" />
        )}
      </div>

      {/* Consejos */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Consejos para la clase virtual
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Mantén tu micrófono silenciado cuando no hables para evitar ruidos de fondo</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Usa auriculares para mejor calidad de audio y evitar eco</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Busca un lugar con buena iluminación para que te vean claramente</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <span>Usa el botón de "levantar la mano" si necesitas participar</span>
          </li>
        </ul>
      </div>
    </div>
  );
}