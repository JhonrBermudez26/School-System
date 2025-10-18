import Layout from '@/Components/Layout/Layout';
import { Users, UserPlus, Calendar, FileText, Settings } from 'lucide-react';
import { usePage } from "@inertiajs/react";

export default function Dashboard() {
  const { auth, stats = {}, estudiantesRecientes = [] } = usePage().props;
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

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Periodo Actual */}
        <StatCard
          title="Periodo Actual"
          value={stats.periodoActual ?? 'No definido'}
          subtitle="En curso"
          icon={<Calendar className="h-8 w-8 text-purple-600" />}
          color="purple"
        />

        {/* Boletines */}
        <StatCard
          title="Boletines"
          value={stats.boletines ?? 0}
          subtitle="Generados este periodo"
          icon={<FileText className="h-8 w-8 text-orange-600" />}
          color="orange"
        />
      </div>

      {/* Actividades recientes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Estudiantes recientes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estudiantes Recientes</h2>

          <div className="space-y-3">
            {estudiantesRecientes.length > 0 ? (
              estudiantesRecientes.map((est) => (
                <div
                  key={est.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {(est.name || 'NA').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {est.name || 'Sin nombre'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {est.grade?.nombre || 'Sin grado'}
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Ver
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay estudiantes recientes.</p>
            )}
          </div>
        </div>

        {/* Tareas pendientes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tareas Pendientes</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Settings className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Configurar nuevo periodo académico
                </p>
                <p className="text-sm text-gray-600">
                  Fecha límite: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ✅ Componente reutilizable para tarjetas de estadísticas */
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className={`text-${color}-600 text-sm mt-2`}>{subtitle}</p>
    </div>
  );
}
