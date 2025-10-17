import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
  Users,
  LogOut,
  GraduationCap,
  ChevronDown,
  UserCircle,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";
import SidebarMenu from "./SidebarMenu";

export default function Layout({ title, children }) {
  const { auth } = usePage().props;
  const currentUrl = usePage().url;
  const user = auth?.user;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => router.post("/logout");
  const handleEditProfile = () => router.visit("/perfil/editar");
  const navigateToDashboard = () => {
    const rol = user?.roles?.[0]?.toLowerCase();
    router.visit(`/${rol}/dashboard`);
  };

  return (
    <>
      <Head title={title} />
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Navbar */}
        <nav className="bg-white shadow-md fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo y nombre */}
              <div
                className="flex items-center cursor-pointer"
                onClick={navigateToDashboard}
              >
                <GraduationCap className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                  Colegio San Martín
                </span>
              </div>

              {/* Botón menú móvil */}
              <button
                className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>

              {/* Perfil */}
              <div className="hidden lg:flex items-center space-x-4 relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold border-2 border-blue-300 shadow-md">
                    {user?.photo ? (
                      <img
                        src={`/storage/${user?.photo}`}
                        alt="Foto de perfil"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {user?.name?.charAt(0)}
                        {user?.last_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-600 transition-transform ${
                      showProfileMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        Rol: {user?.roles?.[0] ?? "Sin rol"}
                      </p>
                    </div>
                    <button
                      onClick={handleEditProfile}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span>Editar Perfil</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar + Contenido */}
        <div className="flex flex-1 pt-16">
          {/* Sidebar */}
          <aside
            className={`bg-white shadow-lg lg:w-72 w-64 fixed top-16 z-40 h-full transform transition-transform duration-300 ease-in-out
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div className="p-6">
              <h2 className="text-sm sm:text-base font-semibold text-gray-500 uppercase tracking-wider mb-6">
                Menú Principal
              </h2>

              <nav className="space-y-3">
                {/* Menú según rol */}
                {user?.roles?.map((role, index) => (
                  <div key={index}>
                    <SidebarMenu role={role} />
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 lg:ml-72 p-6 sm:p-8 transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
