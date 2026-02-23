<?php
namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\DisciplineRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EstudianteDisciplinaController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $records = DisciplineRecord::with(['creator:id,name,last_name'])
            ->where('student_id', $user->id)
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('type', 'like', "%{$search}%")
                      ->orWhere('sanction', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'total'      => DisciplineRecord::where('student_id', $user->id)->count(),
            'open'       => DisciplineRecord::where('student_id', $user->id)->where('status', 'open')->count(),
            'closed'     => DisciplineRecord::where('student_id', $user->id)->where('status', 'closed')->count(),
            'thisMonth'  => DisciplineRecord::where('student_id', $user->id)
                                ->whereMonth('date', now()->month)
                                ->whereYear('date', now()->year)
                                ->count(),
        ];

        return Inertia::render('Estudiante/MiDisciplina', [
            'records' => $records,
            'stats'   => $stats,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }
}