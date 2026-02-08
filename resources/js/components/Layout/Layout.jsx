import { Head, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
  LogOut,
  GraduationCap,
  ChevronDown,
  UserCircle,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";
import SidebarMenu from "./SidebarMenu";
import { NotificationProvider } from '../Notificationprovider';
import UnifiedNotifications from '../UnifiedNotifications';

export default function Layout({ title, children }) {
  const { auth, app } = usePage().props;
  const currentUrl = usePage().url;
  const user = auth?.user;
  const [previewImage, setPreviewImage] = useState(user?.photo ? `/storage/${user.photo}` : null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const appName = app?.name;
  const appFullName = app?.fullName || appName;

  const handleLogout = () => router.post("/logout");
  const handleEditProfile = () => router.visit("/perfil/editar");

  const navigateToDashboard = () => {
    const rol = user?.roles?.[0]?.toLowerCase();
    router.visit(`/${rol}/dashboard`);
  };

  return (
    <NotificationProvider user={user}>
      <Head title={title ? `${title} | ${appName}` : appFullName} />
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
                  {appName}
                </span>
              </div>

              {/* Desktop: Solo menú de perfil */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                      {previewImage ? (
                        <img
                          src={previewImage || "/default-user.png"}
                          alt="Foto de perfil"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">
                          {user?.name?.charAt(0)}
                          {user?.last_name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user?.roles?.[0] ?? "Sin rol"}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-600 transition-transform ${
                        showProfileMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown de perfil - Desktop */}
                  {showProfileMenu && (
                    <div className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleEditProfile();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <UserCircle className="h-5 w-5 text-gray-600" />
                        <span>Editar Perfil</span>
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                      >
                        <LogOut className="h-5 w-5 text-red-600" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: Solo botón menú hamburguesa */}
              <button
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Overlay para cerrar sidebar en mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar + Contenido */}
        <div className="flex flex-1 pt-16">
          {/* Sidebar */}
          <aside
            className={`bg-white shadow-lg lg:w-72 w-64 fixed top-16 z-40 h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out overflow-y-auto
              ${sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
              }`}
          >
            <div className="flex flex-col h-full">
              {/* Perfil en mobile */}
              <div className="lg:hidden border-b border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                    {previewImage ? (
                      <img
                        src={previewImage || "/default-user.png"}
                        alt="Foto de perfil"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {user?.name?.charAt(0)}
                        {user?.last_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {user?.roles?.[0] ?? "Sin rol"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleEditProfile();
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <UserCircle className="h-4 w-4 text-gray-600" />
                    <span>Editar Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-600" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>

              {/* Menú principal */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h2 className="text-sm sm:text-base font-semibold text-gray-500 uppercase tracking-wider mb-6">
                  Menú Principal
                </h2>
                <nav className="space-y-3 pb-6">
                  {user?.roles?.map((role, index) => (
                    <div key={index}>
                      <SidebarMenu role={role} />
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 lg:ml-72 p-6 sm:p-8 transition-all duration-300">
            {children}
          </main>
        </div>

        {/* ✅ Notificaciones globales montadas aquí */}
        {user && <UnifiedNotifications />}
      </div>
    </NotificationProvider>
  );
}