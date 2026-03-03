<?php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use App\Models\SchoolSetting;
use Illuminate\Support\Facades\Schema;
use App\Models\AcademicPeriod;
use App\Observers\AcademicPeriodObserver;
use App\Observers\UserObserver;
use App\Observers\ClassFileObserver;
use App\Observers\TaskSubmissionObserver;
use App\Observers\DisciplineRecordObserver;

use App\Models\User;             
use App\Models\ClassFile;         
use App\Models\TaskSubmission; 
use App\Models\DisciplineRecord;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;




class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        date_default_timezone_set('America/Bogota');
        \Carbon\Carbon::setLocale('es');
        AcademicPeriod::observe(AcademicPeriodObserver::class);
        User::observe(UserObserver::class);
        ClassFile::observe(ClassFileObserver::class);
        TaskSubmission::observe(TaskSubmissionObserver::class);
        DisciplineRecord::observe(DisciplineRecordObserver::class);
        $settings = null;
        if (Schema::hasTable('school_settings')) {
            $settings = SchoolSetting::first();
        }

        Inertia::share([
            'app' => [
                // Usa la abreviación para los títulos de las pestañas/ventanas
                'name' => $settings?->abreviacion ?: ($settings?->nombre_colegio ?: config('app.name')),
                // Nombre completo disponible si se necesita
                'fullName' => $settings?->nombre_colegio ?: config('app.name'),
            ],
            'school' => $settings,
            'modules' => [
                'boletines' => (bool) ($settings?->tiene_boletines ?? true),
            ],
        ]);
        $this->configureRateLimiting();
    }

    /**
     * Configura los rate limiters de la aplicación
     */
    protected function configureRateLimiting(): void
    {
        // Login - muy restrictivo
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Chat (mensajes) - profesor y estudiante
        RateLimiter::for('chat', function (Request $request) {
            return Limit::perMinute(40)->by($request->user()?->id ?: $request->ip());
        });

        // Creación / edición de contenido (posts, tareas, comentarios, etc)
        RateLimiter::for('create-content', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // Subida de archivos y operaciones pesadas
        RateLimiter::for('upload', function (Request $request) {
            return Limit::perMinute(12)->by($request->user()?->id ?: $request->ip());
        });

        // Entrega / submit de tareas por estudiantes
        RateLimiter::for('task-submit', function (Request $request) {
            return Limit::perMinute(12)->by($request->user()?->id ?: $request->ip());
        });

        // Acciones masivas / bulk (asistencias masivas, generar boletines, etc)
        RateLimiter::for('bulk-action', function (Request $request) {
            return Limit::perMinute(8)->by($request->user()?->id ?: $request->ip());
        });

        // En configureRateLimiting() dentro de AppServiceProvider:
        RateLimiter::for('update', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Acciones muy sensibles (suspender usuarios, reset password, force logout, etc)
        RateLimiter::for('sensitive', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Límite general para usuarios autenticados (seguridad extra)
        RateLimiter::for('authenticated', function (Request $request) {
            return Limit::perMinute(200)->by($request->user()?->id ?: $request->ip());
        });
    }
    
}