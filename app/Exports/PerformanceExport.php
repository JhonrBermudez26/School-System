<?php
// app/Exports/PerformanceExport.php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PerformanceExport implements WithMultipleSheets
{
    protected $data;
    protected $period;

    public function __construct($data, $period)
    {
        $this->data = $data;
        $this->period = $period;
    }

    public function sheets(): array
    {
        return [
            new KPIsSheet($this->data['kpis'], $this->period),
            new GroupsSheet($this->data['by_group']),
            new SubjectsSheet($this->data['by_subject']),
            new AtRiskSheet($this->data['at_risk']),
        ];
    }
}

// Hoja de KPIs
class KPIsSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected $kpis;
    protected $period;

    public function __construct($kpis, $period)
    {
        $this->kpis = $kpis;
        $this->period = $period;
    }

    public function collection()
    {
        return collect([
            [
                'Promedio Institucional',
                $this->kpis['institutional_average'],
                '',
                '',
            ],
            [
                'Tasa de Aprobación',
                $this->kpis['approval_rate'] . '%',
                '',
                '',
            ],
            [
                'Tasa de Reprobación',
                $this->kpis['failure_rate'] . '%',
                '',
                '',
            ],
            [
                'Total Estudiantes',
                $this->kpis['total_students'],
                '',
                '',
            ],
            [
                'Estudiantes Aprobados',
                $this->kpis['approved_students'],
                '',
                '',
            ],
            [
                'Estudiantes Reprobados',
                $this->kpis['failed_students'],
                '',
                '',
            ],
        ]);
    }

    public function headings(): array
    {
        return [
            ['INDICADORES GENERALES'],
            ['Periodo: ' . $this->period->name],
            ['Indicador', 'Valor', '', ''],
        ];
    }

    public function title(): string
    {
        return 'Indicadores Generales';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 16]],
            3 => ['font' => ['bold' => true]],
        ];
    }
}

// Hoja de Grupos
class GroupsSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize
{
    protected $groups;

    public function __construct($groups)
    {
        $this->groups = $groups;
    }

    public function collection()
    {
        return collect($this->groups)->map(function($group) {
            return [
                $group['group_name'],
                $group['grade'],
                $group['average'],
                $group['failed_percentage'] . '%',
                $group['highest_grade'],
                $group['lowest_grade'],
                $group['student_count'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Grupo',
            'Grado',
            'Promedio',
            '% Reprobación',
            'Nota Más Alta',
            'Nota Más Baja',
            'Total Estudiantes',
        ];
    }

    public function title(): string
    {
        return 'Rendimiento por Grupo';
    }
}

// Hoja de Asignaturas
class SubjectsSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize
{
    protected $subjects;

    public function __construct($subjects)
    {
        $this->subjects = $subjects;
    }

    public function collection()
    {
        return collect($this->subjects)->map(function($subject) {
            return [
                $subject['subject_name'],
                $subject['subject_code'],
                $subject['teacher_name'],
                $subject['average'],
                $subject['failure_rate'] . '%',
                $subject['previous_average'] ?? 'N/A',
                $subject['variation'] ? $subject['variation'] . '%' : 'N/A',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Asignatura',
            'Código',
            'Docente',
            'Promedio Actual',
            '% Reprobación',
            'Promedio Anterior',
            'Variación',
        ];
    }

    public function title(): string
    {
        return 'Rendimiento por Asignatura';
    }
}

// Hoja de Estudiantes en Riesgo
class AtRiskSheet implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize
{
    protected $students;

    public function __construct($students)
    {
        $this->students = $students;
    }

    public function collection()
    {
        return collect($this->students)->map(function($student) {
            return [
                $student['student_name'],
                $student['document_number'],
                $student['group_name'],
                $student['average'],
                $student['failed_subjects'],
                $student['absence_rate'] . '%',
                implode(', ', $student['risk_reasons']),
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Estudiante',
            'Documento',
            'Grupo',
            'Promedio',
            'Materias Perdidas',
            '% Inasistencia',
            'Factores de Riesgo',
        ];
    }

    public function title(): string
    {
        return 'Estudiantes en Riesgo';
    }
}