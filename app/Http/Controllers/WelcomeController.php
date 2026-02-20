<?php
// app/Http/Controllers/WelcomeController.php
namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use App\Models\User;
use App\Models\Subject;
use App\Models\Group;
use App\Models\AcademicPeriod;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        $school = SchoolSetting::first();

        // Estadísticas reales
        $totalEstudiantes = User::role('estudiante')->where('is_active', true)->count();
        $totalProfesores  = User::role('profesor')->where('is_active', true)->count();
        $totalAsignaturas = Subject::where('is_active', true)->count();
        $totalGrupos      = Group::count();

        // Periodo activo
        $periodoActivo = AcademicPeriod::where('status', 'active')
            ->orderBy('start_date', 'desc')
            ->first();

        // Años de existencia
        $anioFundacion = $school?->fecha_fundacion
            ? (int) $school->fecha_fundacion->format('Y')
            : null;
        $aniosExistencia = $anioFundacion
            ? (now()->year - $anioFundacion)
            : null;

        return Inertia::render('Welcome', [
            'school' => $school ? [
                'nombre'            => $school->nombre_colegio,
                'abreviacion'       => $school->abreviacion,
                'lema'              => $school->lema,
                'logo'              => $school->logo_path ? '/storage/' . $school->logo_path : null,
                'direccion'         => $school->direccion,
                'ciudad'            => $school->ciudad,
                'departamento'      => $school->departamento,
                'pais'              => $school->pais,
                'telefono'          => $school->telefono,
                'celular'           => $school->celular,
                'email'             => $school->email,
                'sitio_web'         => $school->sitio_web,
                'rector'            => $school->rector,
                'jornada'           => $school->jornada,
                'nivel_educativo'   => $school->nivel_educativo,
                'caracter'          => $school->caracter,
                'nit'               => $school->nit,
                'dane'              => $school->dane,
                'fecha_fundacion'   => $school->fecha_fundacion?->format('Y'),
                'anios_existencia'  => $aniosExistencia,
                'calendario'        => $school->calendario,
            ] : null,
            'stats' => [
                'estudiantes'  => $totalEstudiantes,
                'profesores'   => $totalProfesores,
                'asignaturas'  => $totalAsignaturas,
                'grupos'       => $totalGrupos,
                'anios'        => $aniosExistencia,
            ],
            'periodo_activo' => $periodoActivo ? [
                'nombre'     => $periodoActivo->name,
                'inicio'     => $periodoActivo->start_date->format('d/m/Y'),
                'fin'        => $periodoActivo->end_date->format('d/m/Y'),
                'progreso'   => $periodoActivo->getProgreso(),
            ] : null,
        ]);
    }
}