<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Horario - {{ $teacher->name }} {{ $teacher->last_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #0D9488; padding-bottom: 10px; }
        .title { font-size: 22px; font-weight: bold; color: #111827; }
        .subtitle { color: #4B5563; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: center; }
        th { background-color: #0D9488; color: white; font-weight: bold; }
        .time-col { background-color: #F3F4F6; font-weight: 600; }
        .subject { font-weight: bold; color: #0F766E; }
        .group { font-size: 9px; color: #6B7280; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Horario del Docente</div>
        <div class="subtitle">{{ $teacher->name }} {{ $teacher->last_name }}</div>
        <div class="subtitle">Año {{ $current_year }}</div>
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
                    <td class="time-col">{{ $slot->start_time }} - {{ $slot->end_time }}</td>
                    @foreach ($days as $day)
                        <td>
                            @if (isset($grid[$day][$slot->id]))
                                <div class="subject">{{ $grid[$day][$slot->id]->subject_name ?? '—' }}</div>
                                <div class="group">{{ $grid[$day][$slot->id]->group_name ?? '' }}</div>
                            @else
                                —
                            @endif
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>