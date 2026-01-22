import { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Video, VideoOff, Users, Copy, Check } from 'lucide-react';

export default function Reunion() {
  const { props } = usePage();
  const { classInfo, meeting = null, studentsCount } = props;
  
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const jitsiContainer = useRef(null);
  const jitsiApi = useRef(null);

  const meetingUrl = meeting?.url || '';

  useEffect(() => {
    // Cargar el script de Jitsi
    if (meeting && jitsiContainer.current && !jitsiApi.current) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsi();
      document.body.appendChild(script);

      return () => {
        if (jitsiApi.current) {
          jitsiApi.current.dispose();
          jitsiApi.current = null;
        }
      };
    }
  }, [meeting]);

  const initJitsi = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainer.current && meeting) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: meeting.room_name,
        width: '100%',
        height: 600,
        parentNode: jitsiContainer.current,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          ],
        },
      };

      jitsiApi.current = new window.JitsiMeetExternalAPI(domain, options);
    }
  };

  const createMeeting = () => {
    setIsCreating(true);
    router.post(
      route('profesor.meetings.store'),
      {
        subject_id: classInfo.subject_id,
        group_id: classInfo.group_id,
        // NO enviamos room_name, el backend lo genera automáticamente
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsCreating(false);
          router.reload({ only: ['meeting'] });
        },
        onError: () => setIsCreating(false),
      }
    );
  };

  const endMeeting = () => {
    if (!confirm('¿Finalizar la reunión para todos?')) return;

    router.delete(route('profesor.meetings.destroy', { meeting: meeting.id }), {
      preserveScroll: true,
      onSuccess: () => {
        if (jitsiApi.current) {
          jitsiApi.current.dispose();
          jitsiApi.current = null;
        }
        router.reload({ only: ['meeting'] });
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
        <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay reunión activa</h3>
        <p className="text-gray-600 mb-6">
          Crea una videollamada para reunirte con tus {studentsCount} estudiantes
        </p>
        <button
          onClick={createMeeting}
          disabled={isCreating}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Video className="h-5 w-5 mr-2" />
          {isCreating ? 'Creando...' : 'Iniciar reunión'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info de la reunión */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reunión activa</h3>
            <p className="text-sm text-gray-600 mt-1">
              Iniciada el {new Date(meeting.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={endMeeting}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <VideoOff className="h-4 w-4 mr-2" />
            Finalizar
          </button>
        </div>

        {/* Enlace para compartir */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enlace para estudiantes
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={meetingUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={copyLink}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
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
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{meeting.participants_count || 0} participantes conectados</span>
        </div>
      </div>

      {/* Contenedor de Jitsi */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div ref={jitsiContainer} />
      </div>
    </div>
  );
}