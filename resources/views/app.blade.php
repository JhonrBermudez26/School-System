<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $appName = config('app.name', 'School System');
            $favicon = asset('favicon.ico');
            try {
                if (\Illuminate\Support\Facades\Schema::hasTable('school_settings')) {
                    $__settings = \App\Models\SchoolSetting::first();
                    if ($__settings) {
                        $appName = $__settings->abreviacion ?: ($__settings->nombre_colegio ?: $appName);
                        if (!empty($__settings->logo_path)) {
                            $favicon = asset('storage/' . $__settings->logo_path);
                        }
                    }
                }
            } catch (\Throwable $e) {
                // En caso de que aún no existan tablas durante migración
            }
        @endphp

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- ¡LÍNEA CRUCIAL QUE FALTABA! -->
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ $appName }}</title>
        <link rel="icon" type="image/png" href="{{ $favicon }}" />

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>