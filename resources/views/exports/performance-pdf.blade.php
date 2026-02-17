{{-- resources/views/exports/performance-pdf.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Rendimiento Institucional</title>
    <style>
        @page {
            margin: 2cm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 15px;
        }
        .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 24pt;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            background-color: #4F46E5;
            color: white;
            padding: 8px 12px;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .kpi-card {
            border: 2px solid #E5E7EB;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        .kpi-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .kpi-value {
            font-size: 20pt;
            font-weight: bold;
            color: #4F46E5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th {
            background-color: #F3F4F6;
            padding: 8px;
            text-align: left;
            font-size: 9pt;
            text-transform: uppercase;
            border-bottom: 2px solid #D1D5DB;
        }
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 10pt;
        }
        tr:hover {
            background-color: #F9FAFB;
        }
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 8pt;
            color: #999;
            border-top: 1px solid #E5E7EB;
            padding-top: 10px;
        }
        .risk-tag {
            background-color: #FEE2E2;
            color: #DC2626;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8pt;
            display: inline-block;
            margin: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $school->nombre_colegio ?? 'Institución Educativa' }}</h1>
        <p><strong>Reporte de Rendimiento Institucional</strong></p>
        <p>Periodo: {{ $period->name }}</p>
        <p>Generado: {{ $generated_at->format('d/m/Y H:i') }}</p>
    </div>

    <!-- KPIs Principales -->
    <div class="section">
        <div class="section-title">Indicadores Generales</div>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Promedio Institucional</div>
                <div class="kpi-value">{{ $data['kpis']['institutional_average'] }}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Tasa de Aprobación</div>
                <div class="kpi-value">{{ $data['kpis']['approval_rate'] }}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Tasa de Reprobación</div>
                <div class="kpi-value">{{ $data['kpis']['failure_rate'] }}%</div>
            </div>
        </div>
    </div>

    <!-- Rendimiento por Grado -->
    <div class="section">
        <div class="section-title">Rendimiento por Grado</div>
        <table>
            <thead>
                <tr>
                    <th>Grado</th>
                    <th>Promedio</th>
                    <th>Total Estudiantes</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['by_grade'] as $grade)
                <tr>
                    <td>{{ $grade['grade'] }}</td>
                    <td><strong>{{ $grade['average'] }}</strong></td>
                    <td>{{ $grade['student_count'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Rendimiento por Grupo -->
    <div class="section">
        <div class="section-title">Rendimiento por Grupo</div>
        <table>
            <thead>
                <tr>
                    <th>Grupo</th>
                    <th>Promedio</th>
                    <th>% Reprobación</th>
                    <th>Estudiantes</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['by_group'] as $group)
                <tr>
                    <td>{{ $group['group_name'] }}</td>
                    <td><strong>{{ $group['average'] }}</strong></td>
                    <td>{{ $group['failed_percentage'] }}%</td>
                    <td>{{ $group['student_count'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Rendimiento por Asignatura -->
    <div class="section">
        <div class="section-title">Rendimiento por Asignatura</div>
        <table>
            <thead>
                <tr>
                    <th>Asignatura</th>
                    <th>Docente</th>
                    <th>Promedio</th>
                    <th>% Reprobación</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['by_subject'] as $subject)
                <tr>
                    <td>{{ $subject['subject_name'] }}</td>
                    <td>{{ $subject['teacher_name'] }}</td>
                    <td><strong>{{ $subject['average'] }}</strong></td>
                    <td>{{ $subject['failure_rate'] }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Estudiantes en Riesgo -->
    @if(count($data['at_risk']) > 0)
    <div class="section">
        <div class="section-title">Estudiantes en Riesgo Académico ({{ count($data['at_risk']) }})</div>
        <table>
            <thead>
                <tr>
                    <th>Estudiante</th>
                    <th>Grupo</th>
                    <th>Promedio</th>
                    <th>Factores de Riesgo</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['at_risk'] as $student)
                <tr>
                    <td>{{ $student['student_name'] }}</td>
                    <td>{{ $student['group_name'] }}</td>
                    <td><strong>{{ $student['average'] }}</strong></td>
                    <td>
                        @foreach($student['risk_reasons'] as $reason)
                        <span class="risk-tag">{{ $reason }}</span>
                        @endforeach
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>{{ $school->nombre_colegio ?? 'Institución Educativa' }} - Reporte Generado Automáticamente</p>
        <p>Página {PAGENO} de {nb}</p>
    </div>
</body>
</html>