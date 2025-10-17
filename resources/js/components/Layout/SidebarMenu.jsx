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
  ChartPie,
} from "lucide-react";

export default function SidebarMenu({ role }) {
  const rol = role.toLowerCase();

  const sections = {
    rector: [
      { icon: GraduationCap, label: "Dashboard", path: "/rector/dashboard" },
      { icon: Users, label: "Gestión de usuarios", path: "/rector/usuarios" },
      { icon: ChartPie, label: "Reportes institucionales", path: "/rector/reportes" },
      { icon: Settings, label: "Configuración general", path: "/rector/configuracion" },
    ],
    coordinadora: [
      { icon: GraduationCap, label: "Dashboard", path: "/coordinadora/dashboard" },
      { icon: ClipboardList, label: "Asignar materias", path: "/coordinadora/materias" },
      { icon: Users, label: "Gestionar docentes", path: "/coordinadora/docentes" },
      { icon: FileText, label: "Planificación académica", path: "/coordinadora/planificacion" },
    ],
    secretaria: [
      { icon: GraduationCap, label: "Inicio", path: "/secretaria/dashboard" },
      { icon: Users, label: "Gestionar estudiantes", path: "/secretaria/estudiantes" },
      { icon: UserPlus, label: "Nuevo estudiante", path: "/secretaria/nuevo/estudiante" },
      { icon: Calendar, label: "Periodos académicos", path: "/secretaria/periodos" },
      { icon: FileText, label: "Generar boletines", path: "/secretaria/boletines" },
      { icon: Settings, label: "Configuración", path: "/secretaria/configuracion" },
    ],
    profesor: [
      { icon: GraduationCap, label: "Dashboard", path: "/profesor/dashboard" },
      { icon: BookOpen, label: "Mis clases", path: "/profesor/clases" },
      { icon: ClipboardList, label: "Registro de notas", path: "/profesor/notas" },
      { icon: UserCheck, label: "Asistencias", path: "/profesor/asistencias" },
      { icon: FileText, label: "Boletines de curso", path: "/profesor/boletines" },
    ],
    estudiante: [
      { icon: GraduationCap, label: "Inicio", path: "/estudiante/dashboard" },
      { icon: BookOpen, label: "Mis materias", path: "/estudiante/materias" },
      { icon: FileText, label: "Boletín", path: "/estudiante/boletin" },
      { icon: UserCog, label: "Perfil académico", path: "/estudiante/perfil" },
    ],
  };

  const menu = sections[rol] || [];
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
        ${
          isActive
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
