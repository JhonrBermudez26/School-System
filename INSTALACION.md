# 📖 Guía de Instalación - School System

## ⚠️ IMPORTANTE: Sigue estos pasos en orden

### Paso 1: Crear la Base de Datos

Abre **phpMyAdmin** (http://localhost/phpmyadmin) o MySQL CLI y ejecuta:

```sql
CREATE DATABASE school_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Paso 2: Configurar el archivo .env

1. En la carpeta del proyecto, copia `.env.example` a `.env`:
   ```bash
   copy .env.example .env
   ```

2. Abre el archivo `.env` y modifica estas líneas:

```env
APP_NAME="School System"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_system
DB_USERNAME=root
DB_PASSWORD=
```

**Nota**: Si tu MySQL tiene contraseña, agrégala en `DB_PASSWORD`

### Paso 3: Generar la clave de aplicación

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
php artisan key:generate
```

### Paso 4: Ejecutar las migraciones

Este comando creará todas las tablas en la base de datos:

```bash
php artisan migrate
```

### Paso 5: Ejecutar los seeders

Este comando creará los roles, permisos y usuarios de demostración:

```bash
php artisan db:seed
```

### Paso 6: Compilar los assets de frontend

Abre una **segunda terminal** y ejecuta:

```bash
npm run dev
```

**Deja esta terminal abierta** mientras trabajas en el proyecto.

### Paso 7: Iniciar el servidor

En la **primera terminal**, ejecuta:

```bash
php artisan serve
```

### Paso 8: Acceder al sistema

Abre tu navegador y ve a: **http://localhost:8000**

## 🔑 Credenciales de Acceso

Usa estas credenciales para probar el sistema:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Rector | rector@schoolsystem.com | password |
| Coordinadora | coordinadora@schoolsystem.com | password |
| Secretaria | secretaria@schoolsystem.com | password |
| Profesor | profesor1@schoolsystem.com | password |
| Estudiante | estudiante1@schoolsystem.com | password |

## 🔄 Reiniciar la Base de Datos

Si necesitas empezar de cero:

```bash
php artisan migrate:fresh --seed
```

⚠️ **ADVERTENCIA**: Este comando eliminará TODOS los datos.

## ❌ Solución de Problemas

### Error: "Unknown database 'school_system'"
- Verifica que creaste la base de datos en el Paso 1
- Verifica que el nombre en `.env` coincida exactamente

### Error: "SQLSTATE[HY000] [1045] Access denied"
- Verifica tu usuario y contraseña de MySQL en `.env`
- Por defecto XAMPP usa: usuario=`root`, contraseña=`` (vacía)

### Error: "npm: command not found"
- Instala Node.js desde https://nodejs.org/

### Los estilos no se cargan
- Asegúrate de que `npm run dev` esté ejecutándose
- Refresca el navegador con Ctrl+F5

### Error: "Class 'Spatie\Permission\...' not found"
- Ejecuta: `composer dump-autoload`
- Ejecuta: `php artisan config:clear`

## 📞 Contacto

Si tienes problemas con la instalación, documenta el error y contacta al equipo de desarrollo.
