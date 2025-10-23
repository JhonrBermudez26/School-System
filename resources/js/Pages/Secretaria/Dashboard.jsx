import Layout from '@/Components/Layout/Layout';
import { Users, UserPlus, Calendar, FileText, BookOpen, AlertCircle } from 'lucide-react';
import { usePage, router } from "@inertiajs/react";

export default function Dashboard() {
  const { auth, stats = {}, estudiantesRecientes = [], error } = usePage().props;
  const user = auth?.user;

  return (
    <Layout title="Dashboard - Secretaría">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenida, {user?.name || 'Secretaria'}
        </h1>
        <p className="text-gray-600 mt-2">Gestión administrativa del colegio</p>
      </div>

      {/* Mensaje de error si hay */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Estudiantes */}
        <StatCard
          title="Total Estudiantes"
          value={stats.totalEstudiantes ?? 0}
          subtitle="Activos en el sistema"
          icon={<Users className="h-8 w-8 text-blue-600" />}
          color="blue"
        />

        {/* Nuevos este mes */}
        <StatCard
          title="Nuevos Este Mes"
          value={stats.nuevosEsteMes ?? 0}
          subtitle="Estudiantes inscritos"
          icon={<UserPlus className="h-8 w-8 text-green-600" />}
          color="green"
        />

        {/* Total Grupos */}
        <StatCard
          title="Total Grupos"
          value={stats.totalGrupos ?? 0}
          subtitle="Grupos activos"
          icon={<BookOpen className="h-8 w-8 text-purple-600" />}
          color="purple"
        />

        {/* Estudiantes sin grupo */}
        <StatCard
          title="Sin Grupo"
          value={stats.estudiantesSinGrupo ?? 0}
          subtitle="Pendientes de asignar"
          icon={<AlertCircle className="h-8 w-8 text-orange-600" />}
          color="orange"
          alert={stats.estudiantesSinGrupo > 0}
        />
      </div>

      {/* Segunda fila de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Periodo Actual */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Periodo Actual</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.periodoActual ?? 'No definido'}
              </p>
              <p className="text-purple-600 text-sm mt-2">En curso</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Boletines */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Boletines</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.boletines ?? 0}
              </p>
              <p className="text-indigo-600 text-sm mt-2">Generados este periodo</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actividades recientes */}
      <div className="grid md:grid-cols-1 gap-6">
        {/* Estudiantes recientes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Estudiantes Recientes</h2>
            <button
              onClick={() => router.visit(route('secretaria.estudiantes'))}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-3">
            {estudiantesRecientes.length > 0 ? (
              estudiantesRecientes.map((est) => (
                <div
                  key={est.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-lg">
                        {(est.name || 'NA').charAt(0).toUpperCase()}
                        {(est.last_name || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Información del estudiante */}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {est.name || 'Sin nombre'} {est.last_name || ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        {est.email || 'Sin correo'}
                      </p>
                    </div>
                  </div>

                  {/* Grupo del estudiante */}
                  <div className="flex items-center space-x-3">
                    {est.group ? (
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                          {est.group.nombre}
                        </span>
                        {est.group.grade && (
                          <p className="text-xs text-gray-500 mt-1">
                            {est.group.grade.nombre}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                        Sin grupo
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay estudiantes recientes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta si hay estudiantes sin grupo */}
      {stats.estudiantesSinGrupo > 0 && (
        <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Acción requerida
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                Hay {stats.estudiantesSinGrupo} estudiante{stats.estudiantesSinGrupo > 1 ? 's' : ''} sin grupo asignado. 
                <button
                  onClick={() => router.visit(route('secretaria.estudiantes'))}
                  className="ml-2 font-semibold underline hover:text-orange-900"
                >
                  Asignar ahora
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* ✅ Componente reutilizable para tarjetas de estadísticas */
function StatCard({ title, value, subtitle, icon, color, alert = false }) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${alert ? 'ring-2 ring-orange-300' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${alert ? 'text-orange-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className={`text-${color}-600 text-sm mt-2`}>{subtitle}</p>
    </div>
  );
}