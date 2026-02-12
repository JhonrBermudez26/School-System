<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Horario - {{ $group->nombre }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #10B981; padding-bottom: 10px; }
        .title { font-size: 22px; font-weight: bold; color: #111827; }
        .subtitle { color: #4B5563; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: center; }
        th { background-color: blue; color: white; font-weight: bold; }
        .time-col { background-color: #F3F4F6; font-weight: 600; }
        .subject { font-weight: bold; color: blue; }
        .teacher { font-size: 9px; color: #6B7280; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Horario Escolar</div>
        <div class="subtitle">{{ $group->nombre }} - {{ $group->grade->nombre ?? '' }} {{ $group->course->nombre ?? '' }}</div>
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
                                <div class="teacher">
                                    {{ $grid[$day][$slot->id]->teacher_name ?? '' }} 
                                    {{ $grid[$day][$slot->id]->teacher_last_name ?? '' }}
                                </div>
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