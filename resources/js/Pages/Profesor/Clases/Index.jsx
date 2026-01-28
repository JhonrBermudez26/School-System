import { usePage, router } from '@inertiajs/react';
import Layout from '@/Components/Layout/Layout';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

export default function Index() {
  const { props } = usePage();
  const { asignaciones = [] } = props;

  const openClass = (subject_id, group_id) => {
    router.visit(route('profesor.clases.show', { subject_id, group_id }));
  };

  return (
    <Layout title="Mis Clases">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Clases</h1>
          <p className="text-gray-600 mt-2">Selecciona una clase para gestionar publicaciones, archivos y tareas</p>
        </div>

        {/* Grid de clases */}
        {asignaciones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-16 text-center border border-gray-100">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay clases asignadas</h3>
            <p className="text-gray-600">Cuando tengas asignaciones, aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asignaciones.map((clase, idx) => (
              <div
                key={`${clase.subject_id}-${clase.group_id}-${idx}`}
                className="bg-white rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
                onClick={() => openClass(clase.subject_id, clase.group_id)}
              >
                {/* Header de la tarjeta */}
                <div className="bg-blue-600 p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      <span className="text-sm font-medium">{clase.subject_code || 'CURSO'}</span>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                    {clase.subject_name}
                  </h3>
                  <p className="text-gray-600 ">Grupo: {clase.group_name}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">{clase.students_count} estudiantes</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openClass(clase.subject_id, clase.group_id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-800 transition-colors"
                    >
                      Abrir
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}