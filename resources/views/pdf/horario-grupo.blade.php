<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Horario - {{ $group->nombre }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #4F46E5; padding-bottom: 12px; }
        .title { font-size: 22px; font-weight: bold; color: #1E1B4B; }
        .subtitle { color: #4B5563; margin-top: 5px; font-size: 13px; }
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #2563EB, #4F46E5);
            color: white;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            margin-top: 6px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #C7D2FE; padding: 8px; text-align: center; }
        thead th {
            background-color: #3730A3;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: white;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        thead th.time-col {
            background-color: #312E81;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: white;
        }
        tbody td.time-col {
            background-color: #EEF2FF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 600;
            color: #3730A3;
            border-color: #C7D2FE;
        }
        .subject { font-weight: bold; color: #2563EB; }
        .teacher { font-size: 9px; color: #6B7280; margin-top: 2px; }
        .empty-cell { color: #CBD5E1; }
        tbody tr:nth-child(even) td:not(.time-col) {
            background-color: #F5F3FF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Horario Escolar</div>
        <div class="subtitle">{{ $group->nombre }} — {{ $group->grade->nombre ?? '' }} {{ $group->course->nombre ?? '' }}</div>
        <div class="subtitle">Año {{ $current_year }}</div>
        <div><span class="badge">Año Académico {{ $current_year }}</span></div>
    </div>
    <table>
        <thead>
            <tr>
                <th class="time-col">Hora</th>
                @foreach ($days as $day)
                    <th>{{ $day }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($time_slots as $slot)
                <tr>
                    <td class="time-col">{{ $slot->start_time }} – {{ $slot->end_time }}</td>
                    @foreach ($days as $day)
                        <td>
                            @if (isset($grid[$day][$slot->id]))
                                <div class="subject">{{ $grid[$day][$slot->id]->subject_name ?? '—' }}</div>
                                <div class="teacher">
                                    {{ $grid[$day][$slot->id]->teacher_name ?? '' }}
                                    {{ $grid[$day][$slot->id]->teacher_last_name ?? '' }}
                                </div>
                            @else
                                <span class="empty-cell">—</span>
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>