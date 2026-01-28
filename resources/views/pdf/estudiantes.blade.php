<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lista de Estudiantes - {{ date('d/m/Y') }}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #10B981; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #111827; }
        .subtitle { color: #4B5563; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Lista de Estudiantes</div>
        <div class="subtitle">Fecha: {{ date('d/m/Y') }}</div>
        @if (!empty($filters))
            <div style="margin-top: 10px; font-size: 12px;">
                Filtros aplicados:
                @if (!empty($filters['search'])) Búsqueda: "{{ $filters['search'] }}" | @endif
                @if (!empty($filters['group_id']) && $filters['group_id'] !== 'todos') Grupo: {{ $filters['group_id'] }} | @endif
                @if (!empty($filters['estado']) && $filters['estado'] !== 'todos') Estado: {{ ucfirst($filters['estado']) }} @endif
            </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Grupo</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($estudiantes as $estudiante)
                <tr>
                    <td>{{ trim($estudiante->name . ' ' . $estudiante->last_name) }}</td>
                    <td>{{ $estudiante->email ?? '—' }}</td>
                    <td>{{ $estudiante->document_number ?? '—' }}</td>
                    <td>{{ $estudiante->phone ?? '—' }}</td>
                    <td>{{ $estudiante->group ? $estudiante->group->nombre : 'Sin grupo' }}</td>
                    <td>{{ $estudiante->is_active ? 'Activo' : 'Inactivo' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>