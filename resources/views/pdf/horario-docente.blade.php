<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Horario - {{ $teacher->name }} {{ $teacher->last_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; background: #fff; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #2563EB; padding-bottom: 12px; }
        .title { font-size: 22px; font-weight: bold; color: #1E40AF; }
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
        th, td { border: 1px solid #BFDBFE; padding: 8px; text-align: center; }
        thead th {
            background-color: #1D4ED8;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: white;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        thead th.time-col {
            background-color: #1E40AF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: white;
        }
        tbody td.time-col {
            background-color: #EFF6FF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: 600;
            color: #1D4ED8;
            border-color: #BFDBFE;
        }
        .subject { font-weight: bold; color: #2563EB; }
        .group { font-size: 9px; color: #6B7280; margin-top: 2px; }
        .empty-cell { color: #CBD5E1; }
        tbody tr:nth-child(even) td:not(.time-col) {
            background-color: #F0F9FF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Horario del Docente</div>
        <div class="subtitle">{{ $teacher->name }} {{ $teacher->last_name }}</div>
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
                                <div class="group">{{ $grid[$day][$slot->id]->group_name ?? '' }}</div>
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