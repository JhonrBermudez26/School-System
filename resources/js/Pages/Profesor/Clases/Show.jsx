// Show.jsx - Versión actualizada con pestaña de Tareas
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';
import { MessageSquare, Folder, Video, BookOpen, GraduationCap, Users, Calendar, ClipboardList } from 'lucide-react';
import Publicaciones from './Publicaciones';
import Archivos from './Archivos';
import Reunion from './Reunion';
import Tareas from './Tareas'; // Nuevo componente

export default function Show() {
  const { props } = usePage();
  const { 
    classInfo, 
    studentsCount, 
    publicaciones = [], 
    folders = [], 
    files = [], 
    meeting = null,
    tasks = [] // Nuevas tareas
  } = props;

  const tabs = [
    { key: 'publicaciones', label: 'Publicaciones', icon: MessageSquare, component: Publicaciones },
    { key: 'tareas', label: 'Tareas', icon: ClipboardList, component: Tareas }, // Nueva pestaña
    { key: 'archivos', label: 'Archivos', icon: Folder, component: Archivos },
    { key: 'reunion', label: 'Reunión', icon: Video, component: Reunion },
  ];

  const [active, setActive] = useState('publicaciones');

  return (
    <Layout title={`${classInfo.subject_name} - ${classInfo.group_name}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 -m-6 sm:-m-8 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header mejorado con diseño moderno */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border border-gray-100">
            {/* Banner superior con gradiente */} 
            <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
              {/* Efectos decorativos */}
              <div className="absolute inset-0 bg-white/10 transform -skew-y-6 origin-top-left"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            </div>

            {/* Información de la clase */}
            <div className="px-4 sm:px-8 lg:px-10 pb-6 -mt-10 sm:-mt-35 relative z-10">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Icono de la clase */}
                <div className="relative">
                  <div className="h-20 w-20 sm:h-28 sm:w-28 bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white">
                    <BookOpen className="h-10 w-10 sm:h-14 sm:w-14 text-blue-600" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>

                {/* Detalles de la clase */}
                <div className="flex-1 mt-12 sm:mt-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 px-3 py-1.5 rounded-full text-blue-700 text-xs sm:text-sm font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      {classInfo.subject_code || 'CURSO'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-indigo-100 px-3 py-1.5 rounded-full text-indigo-700 text-xs sm:text-sm font-semibold">
                      <Users className="h-3.5 w-3.5" />
                      {studentsCount} estudiantes
                    </span>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                    {classInfo.subject_name}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base text-white flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Grupo {classInfo.group_name}
                  </p>
                </div>
              </div>

              {/* Tabs modernos y responsivos */}
              <div className="mt-6 sm:mt-8">
                {/* Versión móvil: Scroll horizontal */}
                <div className="sm:hidden overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex gap-2 min-w-max">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = active === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActive(tab.key)}
                          className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold 
                            transition-all duration-300 whitespace-nowrap
                            ${isActive 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                            }
                          `}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Versión desktop: Tabs completos */}
                <div className="hidden sm:flex gap-3">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = active === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActive(tab.key)}
                        className={`
                          flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl 
                          font-semibold transition-all duration-300 relative overflow-hidden
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl scale-105' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
                          }
                        `}
                      >
                        {/* Efecto de brillo en hover */}
                        <div className={`absolute inset-0 bg-white transition-opacity duration-300 ${isActive ? 'opacity-10' : 'opacity-0'}`}></div>
                        
                        <Icon className="h-5 w-5 relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                        
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
          </div>

          {/* Contenido dinámico con animación */}
          <div className="animate-fadeIn">
            {active === 'publicaciones' && <Publicaciones publicaciones={publicaciones} classInfo={classInfo} />}
            {active === 'tareas' && <Tareas tasks={tasks} classInfo={classInfo} />}
            {active === 'archivos' && <Archivos folders={folders} files={files} classInfo={classInfo} />}
            {active === 'reunion' && <Reunion meeting={meeting} classInfo={classInfo} studentsCount={studentsCount} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}