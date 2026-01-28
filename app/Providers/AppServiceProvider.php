<?php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use App\Models\SchoolSetting;
use Illuminate\Support\Facades\Schema;

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
    }
}