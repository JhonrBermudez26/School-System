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
  const { auth, app, school } = usePage().props;
  const schoolLogo = school?.logo || null;
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
      <Head title={title ? `${title} | ${appName}` : appFullName}>
        {schoolLogo && (
          <link rel="icon" type="image/png" href={schoolLogo} />
        )}
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Navbar */}
        <nav className="bg-white shadow-md fixed w-full top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">

              {/* Logo */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={navigateToDashboard}
              >
                {schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt={appName}
                    className="h-9 w-9 rounded-lg object-contain shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                )}
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {appName}
                </span>
              </div>

              {/* Desktop: perfil */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none border border-transparent hover:border-gray-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden flex-shrink-0">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Foto de perfil"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">
                          {user?.name?.charAt(0)}{user?.last_name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {user?.name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user?.roles?.[0] ?? "Sin rol"}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Desktop */}
                  {showProfileMenu && (
                    <div className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { handleEditProfile(); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                      >
                        <UserCircle className="h-4 w-4 text-gray-400" />
                        <span>Editar Perfil</span>
                      </button>
                      <button
                        onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: hamburguesa */}
              <button
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden top-16 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Layout */}
        <div className="flex flex-1 pt-16">

          {/* Sidebar */}
          <aside
            className={`bg-white shadow-lg lg:w-72 w-64 fixed top-16 z-40 h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out overflow-y-auto border-r border-gray-100
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          >
            <div className="flex flex-col h-full">

              {/* Perfil mobile */}
              <div className="lg:hidden border-b border-gray-100 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Foto de perfil" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span>{user?.name?.charAt(0)}{user?.last_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      {user?.roles?.[0] ?? "Sin rol"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { handleEditProfile(); setSidebarOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    <span>Editar Perfil</span>
                  </button>
                  <button
                    onClick={() => { handleLogout(); setSidebarOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>

              {/* Menú */}
              <div className="flex-1 p-5 overflow-y-auto">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                  Menú Principal
                </p>
                <nav className="space-y-1 pb-6">
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
          <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 transition-all duration-300">
            {children}
          </main>
        </div>

        {user && <UnifiedNotifications />}
      </div>
    </NotificationProvider>
  );
}