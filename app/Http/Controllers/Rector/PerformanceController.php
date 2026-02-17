<?php
// app/Http/Controllers/Rector/PerformanceController.php

namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Grade;
use App\Services\PerformanceAnalyticsService;
use App\Services\PerformanceExportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PerformanceController extends Controller
{
    protected $analytics;
    protected $exportService;

    public function __construct(
        PerformanceAnalyticsService $analytics,
        PerformanceExportService $exportService
    ) {
        $this->analytics = $analytics;
        $this->exportService = $exportService;
    }

    /**
     * Vista principal de rendimiento
     */
    public function index(Request $request)
    {
        $selectedPeriodId = $request->get('period_id');
        $selectedGradeId = $request->get('grade_id');
        
        $activePeriod = AcademicPeriod::where('is_active', true)->first();
        
        if (!$selectedPeriodId) {
            $selectedPeriodId = $activePeriod?->id;
        }

        if (!$selectedPeriodId) {
            return Inertia::render('Rector/Performance', [
                'error' => 'No hay periodos académicos disponibles',
            ]);
        }

        $selectedPeriod = AcademicPeriod::find($selectedPeriodId);
        $previousPeriod = AcademicPeriod::where('id', '<', $selectedPeriodId)
            ->orderBy('id', 'desc')
            ->first();

        // Obtener todos los datos
        $kpis = $this->analytics->getMainKPIs($selectedPeriodId, $selectedGradeId);
        $performanceByGrade = $this->analytics->getPerformanceByGrade($selectedPeriodId, $selectedGradeId);
        $performanceByGroup = $this->analytics->getPerformanceByGroup($selectedPeriodId, $selectedGradeId);
        $performanceBySubject = $this->analytics->getPerformanceBySubject($selectedPeriodId, $previousPeriod?->id);
        
        $periodComparison = null;
        if ($previousPeriod) {
            $periodComparison = $this->analytics->getPeriodComparison($selectedPeriodId, $previousPeriod->id);
        }

        $ranking = $this->analytics->getInstitutionalRanking($selectedPeriodId);
        $gradeDistribution = $this->analytics->getGradeDistribution($selectedPeriodId);
        $atRiskStudents = $this->analytics->getAtRiskStudents($selectedPeriodId);

        // Datos para filtros
        $periods = AcademicPeriod::orderBy('start_date', 'desc')->get()->map(fn($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'is_active' => $p->is_active,
        ]);

        $grades = Grade::orderBy('nombre')->get()->map(fn($grade) => [
            'id' => $grade->id,
            'nombre' => $grade->nombre,
        ]);

        return Inertia::render('Rector/Performance', [
            'kpis' => $kpis,
            'performanceByGrade' => $performanceByGrade,
            'performanceByGroup' => $performanceByGroup,
            'performanceBySubject' => $performanceBySubject,
            'periodComparison' => $periodComparison,
            'ranking' => $ranking,
            'gradeDistribution' => $gradeDistribution,
            'atRiskStudents' => $atRiskStudents,
            'periods' => $periods,
            'grades' => $grades,
            'selectedPeriod' => [
                'id' => $selectedPeriod->id,
                'name' => $selectedPeriod->name,
            ],
            'previousPeriod' => $previousPeriod ? [
                'id' => $previousPeriod->id,
                'name' => $previousPeriod->name,
            ] : null,
            'filters' => $request->only(['period_id', 'grade_id']),
        ]);
    }

    /**
     * Exportar a PDF
     */
    public function exportPDF(Request $request)
    {
        $periodId = $request->get('period_id');
        $gradeId = $request->get('grade_id');

        return $this->exportService->exportToPDF($periodId, $gradeId);
    }

    /**
     * Exportar a Excel
     */
    public function exportExcel(Request $request)
    {
        $periodId = $request->get('period_id');
        $gradeId = $request->get('grade_id');

        return $this->exportService->exportToExcel($periodId, $gradeId);
    }
}