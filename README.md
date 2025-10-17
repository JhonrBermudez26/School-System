# 🎓 School System - Sistema de Gestión Escolar

Sistema integral de gestión escolar desarrollado con **Laravel 11**, **React 18**, **Inertia.js** y **Tailwind CSS**.

## 🚀 Stack Tecnológico

- **Backend**: Laravel 11
- **Frontend**: React 18 + Inertia.js
- **Estilos**: Tailwind CSS
- **Base de Datos**: MySQL 8.0+
- **Autenticación**: Laravel Sanctum
- **Roles y Permisos**: Spatie Permission
- **Servidor**: Apache (XAMPP)

## 📋 Requisitos Previos

- PHP 8.2 o superior
- Composer
- Node.js 18+ y npm
- MySQL 8.0+
- Apache (XAMPP recomendado)

## 🛠️ Instalación

### 1. Clonar el repositorio o usar el proyecto actual

```bash
cd c:\xampp\htdocs\School-System
```

### 2. Instalar dependencias de PHP

```bash
composer install
```

### 3. Instalar dependencias de Node.js

```bash
npm install
```

### 4. Configurar base de datos

#### Opción A: Crear base de datos manualmente
Abre phpMyAdmin o MySQL CLI y ejecuta:

```sql
CREATE DATABASE school_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Opción B: Usar el script SQL incluido
```bash
mysql -u root -p < database/create_database.sql
```

### 5. Configurar archivo .env

Copia el archivo de ejemplo y configura tus credenciales:

```bash
copy .env.example .env
```

Edita `.env` y configura:

```env
APP_NAME="School System"
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_system
DB_USERNAME=root
DB_PASSWORD=
```

### 6. Generar clave de aplicación

```bash
php artisan key:generate
```

### 7. Ejecutar migraciones y seeders

```bash
php artisan migrate:fresh --seed
```

Esto creará todas las tablas y datos de demostración.

### 8. Compilar assets

#### Desarrollo
```bash
npm run dev
```

#### Producción
```bash
npm run build
```

### 9. Iniciar servidor

```bash
php artisan serve
```

El sistema estará disponible en: `http://localhost:8000`

## 👥 Usuarios de Demostración

Después de ejecutar los seeders, podrás acceder con estas credenciales:

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Rector** | rector@schoolsystem.com | password |
| **Coordinadora** | coordinadora@schoolsystem.com | password |
| **Secretaria** | secretaria@schoolsystem.com | password |
| **Profesor** | profesor1@schoolsystem.com | password |
| **Estudiante** | estudiante1@schoolsystem.com | password |

## 📚 Módulos del Sistema

### 🔐 Autenticación y Roles
- Control de acceso basado en roles (RBAC)
- 5 roles: Rector, Coordinadora, Secretaria, Profesor, Estudiante
- Permisos granulares por módulo

### 👨‍🎓 Módulo Académico
- Gestión de estudiantes
- Gestión de grados y materias
- Registro de notas por periodo
- Gestión de tareas y actividades
- Generación de boletines

### 💰 Módulo Financiero
- Registro de mensualidades y matrículas
- Control de pagos
- Validación de pagos (Coordinadora/Rector)
- Reportes financieros

### 📊 Módulo Administrativo
- Gestión de periodos académicos
- CRUD de usuarios
- Habilitación/deshabilitación de carga de notas
- Reportes y estadísticas

## 🗂️ Estructura de Base de Datos

### Tablas Principales

- `users` - Usuarios del sistema
- `students` - Información de estudiantes
- `grades` - Grados/Cursos
- `subjects` - Materias
- `academic_periods` - Periodos académicos
- `student_grades` - Notas de estudiantes
- `assignments` - Tareas/Actividades
- `assignment_submissions` - Entregas de tareas
- `payments` - Pagos y mensualidades
- `roles` - Roles del sistema (Spatie)
- `permissions` - Permisos (Spatie)

## 🔧 Comandos Útiles

```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Recrear base de datos
php artisan migrate:fresh --seed

# Ver rutas
php artisan route:list

# Compilar assets en modo watch
npm run dev
```

## 📱 Preparación para App Móvil

El sistema está diseñado con arquitectura API-first:

- Rutas API en `routes/api.php` (preparadas para futuro)
- Autenticación con Sanctum
- Responses estandarizadas
- Compatible con React Native o Flutter

## 🎨 Personalización

### Colores del tema
Edita `tailwind.config.js` para cambiar la paleta de colores:

```js
colors: {
  primary: {
    // Tus colores personalizados
  }
}
```

### Logo y branding
- Reemplaza el logo en `public/images/logo.png`
- Actualiza `APP_NAME` en `.env`

## 📄 Licencia

Este proyecto es privado y está desarrollado para uso exclusivo del colegio.

## 🤝 Soporte

Para soporte técnico o consultas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ usando Laravel + React**
