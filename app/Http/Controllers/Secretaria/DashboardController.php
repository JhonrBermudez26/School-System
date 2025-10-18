<?php

namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Estudiante; // si tienes modelo de estudiantes
use App\Models\AcademicPeriod; // si tienes modelo de periodos
use App\Models\Boletin; // si tienes boletines
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Total de estudiantes (usuarios con rol estudiante)
        $totalEstudiantes = User::role('estudiante')->count();

        // Nuevos estudiantes creados este mes
        $nuevosEsteMes = User::role('estudiante')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        // Periodo académico actual (último registrado o actual)
        $periodoActual = AcademicPeriod::latest('id')->value('name') ?? 'No definido';

        // Cantidad de boletines generados
        $boletines = Boletin::count() ?? 0;

        // Estudiantes recientes
        $estudiantesRecientes = User::role('estudiante')
            ->latest()
            ->take(5)
            ->get(['id', 'name', 'email']);

        return Inertia::render('Secretaria/Dashboard', [
            'stats' => [
                'totalEstudiantes' => $totalEstudiantes,
                'nuevosEsteMes' => $nuevosEsteMes,
                'periodoActual' => $periodoActual,
                'boletines' => $boletines,
            ],
            'estudiantesRecientes' => $estudiantesRecientes,
        ]);
    }
}
