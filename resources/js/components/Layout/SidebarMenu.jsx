import { usePage, router } from "@inertiajs/react";
import {
  Users,
  UserPlus,
  Calendar,
  FileText,
  Settings,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserCheck,
  UserCog,
  Book,
  MessageSquare,
  ShieldAlert,
  History,
  TrendingUp,
  Scale,
  Shield,
} from "lucide-react";

export default function SidebarMenu({ role }) {
  const rol = role.toLowerCase();
  const { props } = usePage();
  const modules = props.modules || {};

  const sections = {
    rector: [
      { icon: GraduationCap, label: "Dashboard", path: "/rector/dashboard" },
      { icon: UserCog, label: "Gestión de usuarios", path: "/rector/usuarios" },
      { icon: Shield, label: "Roles y Permisos", path: "/rector/roles" },
      { icon: History, label: "Auditoría", path: "/rector/auditoria" },
      { icon: TrendingUp, label: "Rendimiento", path: "/rector/performance" },
      { icon: Settings, label: "Configuración", path: "/rector/configuracion" },
    ],
    coordinadora: [
      { icon: GraduationCap, label: "Dashboard", path: "/coordinadora/dashboard" },
      { icon: Calendar, label: "Horarios", path: "/coordinadora/horarios" },
      { icon: FileText, label: "Periodos Académicos", path: "/coordinadora/periodos" },
      { icon: TrendingUp, label: "Supervisión Académica", path: "/coordinadora/supervision" },
      { icon: UserCheck, label: "Control Asistencia", path: "/coordinadora/asistencia" },
      { icon: Scale, label: "Registro Disciplinario", path: "/coordinadora/disciplina" },
      { icon: ClipboardList, label: "Boletines", path: "/coordinadora/boletines" },
    ],
    secretaria: [
      { icon: GraduationCap, label: "Inicio", path: "/secretaria/dashboard" },
      { icon: Users, label: "Gestionar usuarios", path: "/secretaria/usuarios" },
      { icon: Users, label: "Gestionar estudiantes", path: "/secretaria/estudiantes" },
      { icon: Users, label: "Gestionar profesores", path: "/secretaria/profesores" },
      { icon: Book, label: "Gestionar Asignaturas", path: "/secretaria/asignaturas" },
      { icon: ClipboardList, label: "Gestionar Grupos", path: "/secretaria/grupos" },
      { icon: Calendar, label: "Horarios", path: "/secretaria/horarios" },
      { icon: FileText, label: "Boletines confirmados", path: "/secretaria/boletines", module: "boletines" },
    ],
    profesor: [
      { icon: GraduationCap, label: "Inicio", path: "/profesor/dashboard" },
      { icon: MessageSquare, label: "Chat", path: "/profesor/chat" },
      { icon: BookOpen, label: "Mis clases", path: "/profesor/clases" },
      { icon: Calendar, label: "Horario", path: "/profesor/horario" },
      { icon: ClipboardList, label: "Registro de notas", path: "/profesor/registrarNotas" },
      { icon: UserCheck, label: "Asistencias", path: "/profesor/asistencias" },
    ],
    estudiante: [
      { icon: GraduationCap, label: "Inicio", path: "/estudiante/dashboard" },
      { icon: MessageSquare, label: "Chat", path: "/estudiante/chat" },
      { icon: BookOpen, label: "Mis clases", path: "/estudiante/clases" },
      { icon: Calendar, label: "Horario", path: "/estudiante/horario" },
      { icon: ClipboardList, label: "Mis notas", path: "/estudiante/notas" },
      { icon: UserCheck, label: "Mis asistencias", path: "/estudiante/asistencias" },
      { icon: Scale, label: "Mi disciplina", path: "/estudiante/disciplina" },
    ],
  };

  const menu = (sections[rol] || []).filter(item => {
    // Si no pide módulo → siempre visible
    if (!item.module) return true;

    // Si pide módulo → mostramos SOLO si existe y es truthy
    return !!modules[item.module];
  });



  if (menu.length === 0) {
    return <p className="text-gray-500 text-sm">No hay menú disponible para este rol</p>;
  }

  return (
    <div className="space-y-2">
      {menu.map((item, index) => (
        <MenuItem key={index} {...item} />
      ))}
    </div>
  );
}

function MenuItem({ icon: Icon, label, path }) {
  const { url } = usePage();
  const isActive = url === path;

  const handleClick = (e) => {
    e.preventDefault();
    router.visit(path);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center space-x-4 px-5 py-3 rounded-lg text-left transition-all duration-200 text-[15px]
        ${isActive
          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold shadow-sm"
          : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
        }`}
    >
      <Icon
        size={20}
        className={`${isActive ? "text-blue-600" : "text-gray-500"}`}
      />
      <span>{label}</span>
    </button>
  );
}
