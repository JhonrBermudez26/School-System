<?php
// app/Services/PerformanceExportService.php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\SchoolSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Collection;

class PerformanceExportService
{
    protected $analytics;

    public function __construct(PerformanceAnalyticsService $analytics)
    {
        $this->analytics = $analytics;
    }

    /**
     * Exportar a PDF
     */
    public function exportToPDF($periodId, $gradeId = null)
    {
        $period = AcademicPeriod::findOrFail($periodId);
        $school = SchoolSetting::first();
        $data = $this->analytics->getExportData($periodId, $gradeId);

        $pdf = PDF::loadView('exports.performance-pdf', [
            'period' => $period,
            'school' => $school,
            'data' => $data,
            'generated_at' => now(),
        ]);

        $filename = "rendimiento-institucional-{$period->name}-" . now()->format('Y-m-d') . ".pdf";

        return $pdf->download($filename);
    }

    /**
     * Exportar a Excel
     */
    public function exportToExcel($periodId, $gradeId = null)
    {
        $period = AcademicPeriod::findOrFail($periodId);
        $data = $this->analytics->getExportData($periodId, $gradeId);

        $filename = "rendimiento-institucional-{$period->name}-" . now()->format('Y-m-d') . ".xlsx";

        return Excel::download(
            new PerformanceExport($data, $period),
            $filename
        );
    }
}