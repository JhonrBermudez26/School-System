<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EstudiantesExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected $estudiantes;

    public function __construct($estudiantes)
    {
        $this->estudiantes = $estudiantes;
    }

    public function collection()
    {
        return $this->estudiantes;
    }

    public function headings(): array
    {
        return [
            'Nombre Completo',
            'Correo',
            'Documento',
            'Teléfono',
            'Grupo',
            'Estado',
        ];
    }

    public function map($estudiante): array
    {
        return [
            trim("{$estudiante->name} {$estudiante->last_name}"),
            $estudiante->email ?? '—',
            $estudiante->document_number ?? '—',
            $estudiante->phone ?? '—',
            $estudiante->group ? $estudiante->group->nombre : 'Sin grupo',
            $estudiante->is_active ? 'Activo' : 'Inactivo',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Estilo de cabecera
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF10B981'], // verde emerald
                ],
                'fontColor' => ['argb' => 'FFFFFFFF'],
            ],
            // Ajuste automático de columnas
            'A:G' => ['alignment' => ['horizontal' => 'left']],
        ];
    }
}