import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';
import { MessageSquare, Folder, Video, BookOpen } from 'lucide-react';
import Publicaciones from './Publicaciones';
import Archivos from './Archivos';
import Reunion from './Reunion';

export default function Show() {
  const { props } = usePage();
  const { classInfo, studentsCount, publicaciones = [], folders = [], files = [], meeting = null } = props;

  const tabs = [
    { key: 'publicaciones', label: 'Publicaciones', icon: MessageSquare, component: Publicaciones, color: 'blue' },
    { key: 'archivos', label: 'Archivos', icon: Folder, component: Archivos, color: 'purple' },
    { key: 'reunion', label: 'Reunión', icon: Video, component: Reunion, color: 'green' },
  ];

  const [active, setActive] = useState('publicaciones');

  return (
    <Layout title={`${classInfo.subject_name} - ${classInfo.group_name}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-">
        <div className="max-w-7xl mx-auto">
          {/* Header mejorado */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-5 border border-gray-100">
            {/* Info de la clase */}
            <div className="px-10 pb-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white">
                    <BookOpen className="h-12 w-12 text-blue-600" />
                  </div>
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full text-blue-700 text-sm font-medium mb-2">
                      {classInfo.subject_code || 'CURSO'}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{classInfo.subject_name}</h1>
                    <p className="text-gray-600 mt-1">Grupo {classInfo.group_name} · {studentsCount} estudiantes</p>
                  </div>
                </div>
              </div>

              {/* Tabs modernos */}
              <div className="mt-8 flex gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = active === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActive(tab.key)}
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-600  from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido dinámico */}
          {active === 'publicaciones' && <Publicaciones publicaciones={publicaciones} classInfo={classInfo} />}
          {active === 'archivos' && <Archivos folders={folders} files={files} classInfo={classInfo} />}
          {active === 'reunion' && <Reunion meeting={meeting} classInfo={classInfo} studentsCount={studentsCount} />}
        </div>
      </div>
    </Layout>
  );
}