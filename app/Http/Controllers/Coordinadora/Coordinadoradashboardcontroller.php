<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Attendance;
use App\Models\Boletin;
use App\Models\DisciplineRecord;
use App\Models\Group;
use App\Models\ManualGradeScore;
use App\Models\TaskSubmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CoordinadoraDashboardController extends Controller
{
    public function index()
{
    // ── PERIODO ACTUAL ────────────────────────────────────────────
    $currentPeriod = AcademicPeriod::where('status', 'active')->latest()->first();
    $periodData = null;

    if ($currentPeriod) {
        $periodData = [
            'id'             => $currentPeriod->id,
            'name'           => $currentPeriod->name,
            'status'         => $currentPeriod->status,
            'start_date'     => $currentPeriod->start_date->format('d/m/Y'),
            'end_date'       => $currentPeriod->end_date->format('d/m/Y'),
            'grades_enabled' => $currentPeriod->grades_enabled,
            'grade_weight'   => $currentPeriod->grade_weight,
            'progreso'       => $currentPeriod->getProgreso(),
            'dias_restantes' => $currentPeriod->getDiasRestantes(),
        ];
    }

    // ── STATS DE PERIODOS ─────────────────────────────────────────────
    $usedPct = AcademicPeriod::sum('grade_weight') ?? 0;
    $periodos_stats = [
        'current_name'  => $currentPeriod?->name ?? 'Ninguno',
        'enabled'       => AcademicPeriod::where('grades_enabled', true)->count(),
        'archived'      => AcademicPeriod::where('status', 'archived')->count(),
        'used_pct'      => $usedPct,
        'available_pct' => max(0, 100 - $usedPct),
    ];

    // ── STATS ACADÉMICOS ──────────────────────────────────────────────
    $totalStudents = User::role('estudiante')->where('is_active', true)->count();

    $scoresQuery = ManualGradeScore::query()
        ->whereNotNull('score')
        ->when($currentPeriod, fn($q) => $q->whereHas('manualGrade', fn($mq) =>
            $mq->where('academic_period_id', $currentPeriod->id)
        ));

    $overallAverage = $scoresQuery->avg('score') ?? 0;

    $boletinesQuery = Boletin::query()
        ->when($currentPeriod, fn($q) => $q->where('academic_period_id', $currentPeriod->id));

    $superior = (clone $boletinesQuery)->where('promedio_general', '>=', 4.6)->count();
    $alto     = (clone $boletinesQuery)->whereBetween('promedio_general', [4.0, 4.599])->count();
    $basico   = (clone $boletinesQuery)->whereBetween('promedio_general', [3.0, 3.999])->count();
    $bajo     = (clone $boletinesQuery)->where('promedio_general', '<', 3.0)->count();

    $approved = $superior + $alto + $basico;
    $failed   = $bajo;
    $atRisk   = (clone $boletinesQuery)->where('promedio_general', '<', 3.0)->count();

    $academic_stats = [
        'total_students'  => $totalStudents,
        'overall_average' => round($overallAverage, 2),
        'at_risk'         => $atRisk,
        'approved'        => $approved,
        'failed'          => $failed,
        'by_desempeno'    => [
            'superior' => $superior,
            'alto'     => $alto,
            'basico'   => $basico,
            'bajo'     => $bajo,
        ],
    ];

    // ── STATS DE ASISTENCIA ───────────────────────────────────────────
    $today          = now()->toDateString();
    $totalRecords   = Attendance::count();
    $presentCount   = Attendance::where('status', 'present')->count();
    $overallAttendance = $totalRecords > 0
        ? round(($presentCount / $totalRecords) * 100, 1)
        : 0;

    $todayAbsences = Attendance::whereDate('date', $today)
        ->where('status', 'absent')
        ->count();

    // CORREGIDO: usar expresiones completas en HAVING
    $criticalStudents = Attendance::select('user_id')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absences')
        ->groupBy('user_id')
        ->havingRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) / COUNT(*) > 0.15')
        ->get()
        ->count();

    // CORREGIDO: usar expresiones completas en HAVING
    $highRiskGroups = Attendance::select('group_id')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present')
        ->groupBy('group_id')
        ->havingRaw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) / COUNT(*) < 0.85')
        ->get()
        ->count();

    $attendance_stats = [
        'overall'          => $overallAttendance,
        'total_records'    => $totalRecords,
        'today_absences'   => $todayAbsences,
        'critical_students'=> $criticalStudents,
        'high_risk_groups' => $highRiskGroups,
    ];

    // ── GRUPOS CRÍTICOS (menor asistencia) ────────────────────────────
    $critical_groups = Attendance::select('group_id')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present')
        ->groupBy('group_id')
        ->having('total', '>', 0)
        ->orderByRaw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) / COUNT(*) ASC')
        ->limit(5)
        ->get()
        ->map(function ($row) {
            $group = Group::find($row->group_id);
            return [
                'name' => $group?->nombre ?? 'Grupo ' . $row->group_id,
                'rate' => round(($row->present / $row->total) * 100, 1),
            ];
        })
        ->filter(fn($g) => $g['rate'] < 95)
        ->values();

    // ── STATS DISCIPLINARIOS ──────────────────────────────────────────
    $discipline_stats = [
        'total'      => DisciplineRecord::count(),
        'open'       => DisciplineRecord::where('status', 'open')->count(),
        'critical'   => DisciplineRecord::where('severity', 'critical')->where('status', 'open')->count(),
        'this_month' => DisciplineRecord::whereMonth('date', now()->month)
                            ->whereYear('date', now()->year)->count(),
    ];

    $recent_discipline = DisciplineRecord::with('student')
        ->where('status', 'open')
        ->orderByDesc('date')
        ->limit(5)
        ->get()
        ->map(fn($r) => [
            'student_name'  => trim(($r->student->name ?? '') . ' ' . ($r->student->last_name ?? '')),
            'type_label'    => $r->type_label,
            'severity'      => $r->severity,
            'severity_label'=> $r->severity_label,
        ]);

    // ── STATS DE BOLETINES ────────────────────────────────────────────
    $boletinesTotal      = (clone $boletinesQuery)->count();
    $boletinesGenerados  = (clone $boletinesQuery)->where('estado', 'generado')->count();
    $boletinesPendientes = $boletinesTotal - $boletinesGenerados;
    $pctGenerados        = $boletinesTotal > 0
        ? round(($boletinesGenerados / $boletinesTotal) * 100)
        : 0;

    $boletin_stats = [
        'total'         => $boletinesTotal,
        'generados'     => $boletinesGenerados,
        'pendientes'    => $boletinesPendientes,
        'pct_generados' => $pctGenerados,
    ];

    // ── ALERTAS DE INASISTENCIA CRÍTICA ──────────────────────────────
    // CORREGIDO: usar expresiones completas en HAVING y ORDER BY
    $recent_alerts = Attendance::select('user_id', 'group_id')
        ->selectRaw('COUNT(*) as total_classes')
        ->selectRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent_count')
        ->groupBy('user_id', 'group_id')
        ->havingRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) / COUNT(*) > 0.15')
        ->orderByRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) / COUNT(*) DESC')
        ->limit(8)
        ->get()
        ->map(function ($row) {
            $student = User::find($row->user_id);
            $group   = Group::find($row->group_id);
            $rate    = round(($row->absent_count / $row->total_classes) * 100, 1);

            return [
                'student_name'  => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'group'         => $group?->nombre ?? '—',
                'absent_count'  => $row->absent_count,
                'total_classes' => $row->total_classes,
                'absence_rate'  => $rate,
                'severity'      => $rate >= 30 ? 'critical' : ($rate >= 20 ? 'high' : 'medium'),
            ];
        });

    return Inertia::render('Coordinadora/Dashboard', [
        'current_period'    => $periodData,
        'periodos_stats'    => $periodos_stats,
        'academic_stats'    => $academic_stats,
        'attendance_stats'  => $attendance_stats,
        'discipline_stats'  => $discipline_stats,
        'boletin_stats'     => $boletin_stats,
        'recent_alerts'     => $recent_alerts,
        'critical_groups'   => $critical_groups,
        'recent_discipline' => $recent_discipline,
    ]);
}
}