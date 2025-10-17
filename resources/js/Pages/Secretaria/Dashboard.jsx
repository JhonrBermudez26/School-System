import Layout from '@/Components/Layout/Layout';
import { Users, UserPlus, Calendar, FileText, Settings } from 'lucide-react';

export default function Dashboard() {
  return (
    <Layout title="Dashboard - Secretaría">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenida, Secretaria</h1>
        <p className="text-gray-600 mt-2">Gestión administrativa del colegio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Estudiantes</p>
              <p className="text-3xl font-bold text-gray-900">1,245</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="text-blue-600 text-sm mt-2">Activos en el sistema</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Nuevos Este Mes</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <p className="text-green-600 text-sm mt-2">Estudiantes inscritos</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Periodo Actual</p>
              <p className="text-2xl font-bold text-gray-900">2025-1</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <p className="text-purple-600 text-sm mt-2">Primer periodo</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Boletines</p>
              <p className="text-3xl font-bold text-gray-900">234</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <p className="text-orange-600 text-sm mt-2">Generados este periodo</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estudiantes Recientes</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">JM</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Juan Martínez</p>
                  <p className="text-sm text-gray-600">Grado 5A</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Ver</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tareas Pendientes</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Settings className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Configurar periodo 2025-2</p>
                <p className="text-sm text-gray-600">Fecha límite: 15 Nov</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
