import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';
import { MessageSquare, Folder, Video, BookOpen, User, ClipboardList } from 'lucide-react';
import Publicaciones from './Publicaciones';
import Archivos from './Archivos';
import Reunion from './Reunion';
import Tareas from './Tareas';

export default function Show() {
  const { props } = usePage();
  const {
    classInfo,
    publicaciones = [],
    tasks = [],
    folders = [],
    files = [],
    meeting: initialMeeting = null
  } = props;

  // Estado local para la reunión (se actualiza en tiempo real)
  const [localMeeting, setLocalMeeting] = useState(initialMeeting);

  // Sincronizar con el prop inicial cuando cambie (por si hay reload)
  useEffect(() => {
    console.log('[Show Estudiante] Prop meeting inicial:', initialMeeting);
    setLocalMeeting(initialMeeting);
  }, [initialMeeting]);

  // ✅ ESCUCHA EN TIEMPO REAL DE EVENTOS DE REUNIÓN
  useEffect(() => {
    if (!window.Echo || !classInfo?.group_id) {
      console.warn('[Show Estudiante] Echo o group_id no disponible');
      return;
    }

    const channelName = `group.${classInfo.group_id}`;
    console.log('[Show Estudiante] 🔌 Suscribiéndose al canal:', channelName);

    const channel = window.Echo.channel(channelName);

    // ✅ Escuchar cuando se inicia una reunión
    channel.listen('.meeting.started', (event) => {
      console.log('[Show Estudiante] 🎉 meeting.started recibido:', event);
      
      if (event.meeting) {
        setLocalMeeting(event.meeting);
        
        // Mostrar notificación nativa del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nueva reunión iniciada', {
            body: `Tu profesor ha iniciado una videollamada en ${classInfo.subject_name}`,
            icon: '/logo.png'
          });
        }
      }
    });

    // ✅ Escuchar cuando se finaliza una reunión
    channel.listen('.meeting.ended', (event) => {
      console.log('[Show Estudiante] 📴 meeting.ended recibido:', event);
      setLocalMeeting(null);
      
      // Mostrar notificación
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reunión finalizada', {
          body: 'La videollamada ha terminado',
          icon: '/logo.png'
        });
      }
    });

    // Cleanup al desmontar
    return () => {
      console.log('[Show Estudiante] 🔌 Desuscribiéndose del canal:', channelName);
      channel.stopListening('.meeting.started');
      channel.stopListening('.meeting.ended');
      window.Echo.leave(channelName);
    };
  }, [classInfo?.group_id, classInfo?.subject_name]);

  // Solicitar permiso de notificaciones al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const tabs = [
    { key: 'publicaciones', label: 'Publicaciones', icon: MessageSquare, component: Publicaciones },
    { key: 'tareas', label: 'Tareas', icon: ClipboardList, component: Tareas },
    { key: 'archivos', label: 'Archivos', icon: Folder, component: Archivos },
    { key: 'reunion', label: 'Reunión', icon: Video, component: Reunion },
  ];

  const [active, setActive] = useState('publicaciones');

  return (
    <Layout title={`${classInfo.subject_name} - ${classInfo.group_name}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 -m-4 sm:-m-6 md:-m-8 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-4 sm:mb-6 border border-gray-100">
            
            {/* Banner superior con gradiente */}
            <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
              {/* Efectos decorativos */}
              <div className="absolute inset-0 bg-white/10 transform -skew-y-6 origin-top-left"></div>
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32"></div>
              <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full -ml-16 sm:-ml-24 -mb-16 sm:-mb-24"></div>
              
              {/* Información de la clase */}
              <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 relative z-10">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6">
                  
                  {/* Icono de la clase */}
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 xs:h-20 xs:w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl flex items-center justify-center border-3 sm:border-4 border-white">
                      <BookOpen className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-blue-600" />
                    </div>
                    {/* Indicador de reunión activa */}
                    {localMeeting && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-3 sm:border-4 border-white flex items-center justify-center animate-pulse">
                        <Video className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Detalles de la clase */}
                  <div className="flex-1 w-full sm:w-auto">
                    {/* Badge del código */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-[11px] xs:text-xs sm:text-sm font-semibold">
                        {classInfo.subject_code || 'CURSO'}
                      </span>
                      {localMeeting && (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-green-500 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white text-[11px] xs:text-xs sm:text-sm font-semibold animate-pulse">
                          <Video className="h-3 w-3" />
                          Reunión en vivo
                        </span>
                      )}
                    </div>
                    
                    {/* Título */}
                    <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2 leading-tight break-words">
                      {classInfo.subject_name}
                    </h1>
                    
                    {/* Subtítulos */}
                    <p className="text-white/90 text-xs xs:text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span>Grupo {classInfo.group_name}</span>
                    </p>
                    <p className="text-white/80 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Prof. {classInfo.teacher_name}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6">
              
              {/* Versión móvil: Scroll horizontal */}
              <div className="sm:hidden">
                <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-2 min-w-max">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = active === tab.key;
                      const hasActiveCall = tab.key === 'reunion' && localMeeting;
                      
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActive(tab.key)}
                          className={`
                            relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl 
                            font-semibold transition-all duration-300 whitespace-nowrap text-sm
                            ${isActive 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                            }
                          `}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                          {hasActiveCall && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Versión tablet y desktop */}
              <div className="hidden sm:grid sm:grid-cols-2 md:flex md:flex-row gap-2 md:gap-3">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = active === tab.key;
                  const hasActiveCall = tab.key === 'reunion' && localMeeting;
                  
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActive(tab.key)}
                      className={`
                        relative md:flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 
                        rounded-xl font-semibold transition-all duration-300 overflow-hidden
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-105' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
                        }
                      `}
                    >
                      {/* Efecto de brillo */}
                      <div className={`absolute inset-0 bg-white transition-opacity duration-300 ${isActive ? 'opacity-10' : 'opacity-0'}`}></div>
                      
                      <Icon className="h-4 w-4 md:h-5 md:w-5 relative z-10 flex-shrink-0" />
                      <span className="relative z-10 text-sm md:text-base">{tab.label}</span>
                      
                      {/* Indicador de reunión activa */}
                      {hasActiveCall && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                      
                      {/* Indicador activo */}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido dinámico */}
          <div className="animate-fadeIn">
            {active === 'publicaciones' && <Publicaciones publicaciones={publicaciones} classInfo={classInfo} />}
            {active === 'tareas' && <Tareas tasks={tasks} classInfo={classInfo} />}
            {active === 'archivos' && <Archivos folders={folders} files={files} />}
            {active === 'reunion' && (
              <Reunion 
                meeting={localMeeting} 
                classInfo={classInfo} 
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}