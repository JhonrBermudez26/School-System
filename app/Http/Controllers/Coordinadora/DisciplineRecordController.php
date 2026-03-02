<?php
namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Http\Requests\DisciplineRecordRequest;
use App\Models\DisciplineRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DisciplineRecordController extends Controller
{
    protected $activityLog;

    public function __construct(\App\Services\ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * Lista de registros disciplinarios
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', DisciplineRecord::class);

        $query = DisciplineRecord::with(['student', 'creator'])->recent();

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('student', function ($sq) use ($searchTerm) {
                    $sq->where('name', 'like', "%{$searchTerm}%")
                       ->orWhere('last_name', 'like', "%{$searchTerm}%")
                       ->orWhere('document_number', 'like', "%{$searchTerm}%")
                       ->orWhere('email', 'like', "%{$searchTerm}%");
                })
                ->orWhere('description', 'like', "%{$searchTerm}%")
                ->orWhere('type', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->filled('student_id')) $query->where('student_id', $request->student_id);
        if ($request->filled('type'))       $query->where('type', $request->type);
        if ($request->filled('status'))     $query->where('status', $request->status);
        if ($request->filled('severity'))   $query->where('severity', $request->severity);
        if ($request->filled('start_date')) $query->where('date', '>=', $request->start_date);
        if ($request->filled('end_date'))   $query->where('date', '<=', $request->end_date);

        $records = $query->paginate(20);

        $records->getCollection()->transform(function ($record) {
            $group = $record->student->groups()->first();
            $record->student->current_group = $group ? ['id' => $group->id, 'nombre' => $group->nombre] : null;
            return $record;
        });

        $students = User::role('estudiante')
            ->with('groups')
            ->orderBy('name')->orderBy('last_name')
            ->get()
            ->map(function ($student) {
                $group = $student->groups->first();
                return [
                    'id'              => $student->id,
                    'name'            => $student->name,
                    'last_name'       => $student->last_name ?? '',
                    'full_name'       => trim($student->name . ' ' . ($student->last_name ?? '')),
                    'email'           => $student->email,
                    'document_number' => $student->document_number,
                    'group'           => $group ? ['id' => $group->id, 'nombre' => $group->nombre] : null,
                ];
            });

        $stats = [
            'total'     => DisciplineRecord::count(),
            'open'      => DisciplineRecord::open()->count(),
            'critical'  => DisciplineRecord::where('severity', 'critical')->count(),
            'thisMonth' => DisciplineRecord::whereMonth('date', now()->month)
                ->whereYear('date', now()->year)->count(),
        ];

        return Inertia::render('Coordinadora/Disciplina', [
            'records'  => $records,
            'students' => $students,
            'stats'    => $stats,
            'filters'  => $request->only(['search', 'student_id', 'type', 'status', 'severity', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Crear un registro disciplinario
     */
 public function store(DisciplineRecordRequest $request)
{
    $this->authorize('create', DisciplineRecord::class);

    $record = DisciplineRecord::create($request->validated());

    // Campos protegidos — asignados explícitamente por el sistema, no por el request
    $record->forceFill([
        'created_by' => auth()->id(),
        'status'     => 'open',
    ])->save();

    $this->activityLog->log($record, 'created', null, $record->toArray());

    return redirect()->route('coordinadora.disciplina')
        ->with('success', 'Registro disciplinario creado correctamente');
}

    /**
     * Actualizar un registro disciplinario
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $record)
     */
    public function update(DisciplineRecordRequest $request, DisciplineRecord $disciplineRecord)
    {
        $this->authorize('update', $disciplineRecord);

        $oldValues = $disciplineRecord->toArray();
        $disciplineRecord->update($request->validated());

        $this->activityLog->log($disciplineRecord, 'updated', $oldValues, $disciplineRecord->getChanges());

        return redirect()->route('coordinadora.disciplina')
            ->with('success', 'Registro actualizado correctamente');
    }

    /**
     * Cerrar un registro disciplinario
     * ✅ FIX IDOR: Route Model Binding + authorize('close', $record)
     */
    public function close(DisciplineRecord $disciplineRecord)
    {
        $this->authorize('close', $disciplineRecord);

        $oldValues = $disciplineRecord->toArray();

        if ($disciplineRecord->close()) {
            $this->activityLog->log($disciplineRecord, 'closed', $oldValues, $disciplineRecord->getChanges());

            return redirect()->route('coordinadora.disciplina')
                ->with('success', 'Registro cerrado correctamente');
        }

        return back()->withErrors(['error' => 'No se pudo cerrar el registro']);
    }

    /**
     * Reabrir un registro cerrado
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $record)
     */
    public function reopen(DisciplineRecord $disciplineRecord)
    {
        $this->authorize('update', $disciplineRecord);

        $oldValues = $disciplineRecord->toArray();

        if ($disciplineRecord->reopen()) {
            $this->activityLog->log($disciplineRecord, 'reopened', $oldValues, $disciplineRecord->getChanges());

            return redirect()->route('coordinadora.disciplina')
                ->with('success', 'Registro reabierto correctamente');
        }

        return back()->withErrors(['error' => 'No se pudo reabrir el registro']);
    }

    /**
     * Eliminar un registro disciplinario
     * ✅ FIX IDOR: Route Model Binding + authorize('delete', $record)
     */
    public function destroy(DisciplineRecord $disciplineRecord)
    {
        $this->authorize('delete', $disciplineRecord);

        $oldValues = $disciplineRecord->toArray();
        $disciplineRecord->delete();

        $this->activityLog->log($disciplineRecord, 'deleted', $oldValues, null);

        return redirect()->route('coordinadora.disciplina')
            ->with('success', 'Registro eliminado correctamente');
    }

    /**
     * Historial disciplinario de un estudiante
     * ✅ FIX IDOR: Route Model Binding en $student + validate role
     */
    public function studentHistory(User $student)
    {
        $this->authorize('viewAny', DisciplineRecord::class);

        if (!$student->hasRole('estudiante')) {
            return response()->json(['error' => 'El usuario no es un estudiante'], 400);
        }

        $student->load('groups');
        $group = $student->groups->first();

        $history = DisciplineRecord::with('creator')
            ->forStudent($student->id)
            ->recent()
            ->get();

        $stats = [
            'total_records'  => $history->count(),
            'open_records'   => $history->where('status', 'open')->count(),
            'closed_records' => $history->where('status', 'closed')->count(),
            'by_type'        => $history->groupBy('type')->map->count(),
            'by_severity'    => $history->groupBy('severity')->map->count(),
        ];

        return response()->json([
            'student' => [
                'id'              => $student->id,
                'name'            => $student->name,
                'last_name'       => $student->last_name ?? '',
                'full_name'       => trim($student->name . ' ' . ($student->last_name ?? '')),
                'email'           => $student->email,
                'document_number' => $student->document_number,
                'group'           => $group ? ['id' => $group->id, 'nombre' => $group->nombre] : null,
            ],
            'history'    => $history,
            'statistics' => $stats,
        ]);
    }

    /**
     * Estadísticas globales de disciplina
     */
    public function statistics(Request $request)
    {
        $this->authorize('viewAny', DisciplineRecord::class);

        $startDate = $request->get('start_date', now()->startOfYear()->format('Y-m-d'));
        $endDate   = $request->get('end_date', now()->endOfYear()->format('Y-m-d'));

        $query = DisciplineRecord::whereBetween('date', [$startDate, $endDate]);

        $stats = [
            'total_records'  => $query->count(),
            'open_records'   => (clone $query)->open()->count(),
            'closed_records' => (clone $query)->closed()->count(),
            'by_type'        => (clone $query)->select('type', \DB::raw('count(*) as count'))
                                    ->groupBy('type')->pluck('count', 'type'),
            'by_severity'    => (clone $query)->select('severity', \DB::raw('count(*) as count'))
                                    ->groupBy('severity')->pluck('count', 'severity'),
            'by_month'       => (clone $query)->select(
                                    \DB::raw('YEAR(date) as year'),
                                    \DB::raw('MONTH(date) as month'),
                                    \DB::raw('count(*) as count')
                                )->groupBy('year', 'month')->orderBy('year')->orderBy('month')->get(),
            'top_students'   => DisciplineRecord::select('student_id', \DB::raw('count(*) as record_count'))
                                    ->whereBetween('date', [$startDate, $endDate])
                                    ->with('student:id,name,last_name,email')
                                    ->groupBy('student_id')->orderByDesc('record_count')->limit(10)->get(),
        ];

        return response()->json($stats);
    }
}