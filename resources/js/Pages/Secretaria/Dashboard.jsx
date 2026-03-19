import Layout from '@/Components/Layout/Layout.jsx';
import { Users, UserPlus, Calendar, FileText, BookOpen, AlertCircle } from 'lucide-react';
import { usePage, router } from "@inertiajs/react";

export default function Dashboard() {
  const { auth, stats = {}, estudiantesRecientes = [], error } = usePage().props;
  const user = auth?.user;

  return (
    <Layout title="Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Bienvenida, {user?.name || 'Secretaria'}
          </h1>
          <p className="text-gray-600 mt-1">Gestión administrativa del colegio</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Estudiantes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEstudiantes ?? 0}</p>
                <p className="text-xs text-blue-600 mt-1">Activos en el sistema</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nuevos Este Mes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.nuevosEsteMes ?? 0}</p>
                <p className="text-xs text-green-600 mt-1">Estudiantes inscritos</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Grupos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalGrupos ?? 0}</p>
                <p className="text-xs text-indigo-600 mt-1">Grupos activos</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-md p-5 border ${stats.estudiantesSinGrupo > 0 ? 'border-orange-200 ring-2 ring-orange-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Sin Grupo</p>
                <p className={`text-3xl font-bold ${stats.estudiantesSinGrupo > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{stats.estudiantesSinGrupo ?? 0}</p>
                <p className="text-xs text-orange-600 mt-1">Pendientes de asignar</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Segunda fila de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Periodo Actual */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Periodo Actual</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.periodoActual ?? 'No definido'}</p>
                <p className="text-gray-600 text-sm mt-2">
                  {stats.periodoActualInicio && stats.periodoActualFin
                    ? `${stats.periodoActualInicio} a ${stats.periodoActualFin}`
                    : 'Fechas no definidas'}
                </p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mt-2">
                  En curso
                </span>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Boletines */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Boletines</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.boletines ?? 0}</p>
                <p className="text-blue-600 text-sm mt-2">Generados este periodo</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Estudiantes Recientes */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Estudiantes Recientes</h2>
              <button onClick={() => router.visit(route('secretaria.estudiantes'))}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors">
                Ver todos →
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {estudiantesRecientes.length > 0 ? (
              <div className="space-y-3">
                {estudiantesRecientes.map((est) => (
                  <div key={est.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-sm">
                          {(est.name || 'NA').charAt(0).toUpperCase()}{(est.last_name || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{est.name || 'Sin nombre'} {est.last_name || ''}</p>
                        <p className="text-sm text-gray-500 truncate">{est.email || 'Sin correo'}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {est.group ? (
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            {est.group.nombre}
                          </span>
                          {est.group.grade && <p className="text-xs text-gray-500 mt-1">{est.group.grade.nombre}</p>}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Sin grupo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay estudiantes recientes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerta sin grupo */}
        {stats.estudiantesSinGrupo > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-orange-800">Acción requerida</h3>
                <p className="mt-1 text-sm text-orange-700">
                  Hay {stats.estudiantesSinGrupo} estudiante{stats.estudiantesSinGrupo > 1 ? 's' : ''} sin grupo asignado.
                  <button onClick={() => router.visit(route('secretaria.estudiantes'))} className="ml-2 font-semibold underline hover:text-orange-900">
                    Asignar ahora
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}