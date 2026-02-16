<?php

namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditController extends Controller
{
    /**
     * Vista principal de auditoría
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ActivityLog::class);

        $query = ActivityLog::with(['user', 'model'])
            ->recent();

        // Filtros
        if ($request->filled('user_id')) {
            $query->byUser($request->user_id);
        }

        if ($request->filled('action')) {
            $query->byAction($request->action);
        }

        if ($request->filled('model_type')) {
            $query->byModel($request->model_type);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        $logs = $query->paginate(50);

        // Usuarios para selector
        $users = User::select('id', 'name', 'email')
            ->whereHas('activityLogs')
            ->distinct()
            ->get();

        // Acciones únicas
        $actions = ActivityLog::distinct()->pluck('action');

        // Modelos únicos
        $modelTypes = ActivityLog::distinct()->pluck('model_type');

        return Inertia::render('Rector/Auditoria', [
            'logs' => $logs,
            'users' => $users,
            'actions' => $actions,
            'model_types' => $modelTypes,
            'filters' => $request->only(['user_id', 'action', 'model_type', 'start_date', 'end_date']),
        ]);
    }

    public function show($id)
    {
        $log = ActivityLog::with(['user', 'model'])->findOrFail($id);

        $this->authorize('view', $log);

        return response()->json([
            'log' => $log,
            'changes' => $log->getChanges(),
            'description' => $log->getActionDescription(),
        ]);
    }

    public function statistics(Request $request)
    {
        $this->authorize('viewAny', ActivityLog::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        $logs = ActivityLog::byDateRange($startDate, $endDate);

        $stats = [
            'total_actions' => $logs->count(),
            'by_action' => (clone $logs)->select('action', \DB::raw('count(*) as count'))
                ->groupBy('action')
                ->pluck('count', 'action'),
            'by_user' => (clone $logs)->with('user:id,name')
                ->select('user_id', \DB::raw('count(*) as count'))
                ->groupBy('user_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),
            'by_model' => (clone $logs)->select('model_type', \DB::raw('count(*) as count'))
                ->groupBy('model_type')
                ->pluck('count', 'model_type'),
            'by_day' => (clone $logs)->select(
                    \DB::raw('DATE(created_at) as day'),
                    \DB::raw('count(*) as count')
                )
                ->groupBy('day')
                ->orderBy('day', 'asc')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Exportar logs de auditoría
     */
    public function export(Request $request)
    {
        $this->authorize('viewAny', ActivityLog::class);

        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = ActivityLog::with(['user', 'subject']);

        if ($startDate && $endDate) {
            $query->byDateRange($startDate, $endDate);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        // Aquí implementarías la lógica de exportación
        return response()->json([
            'message' => 'Exportación preparada',
            'records' => $logs->count(),
            'data' => $logs,
        ]);
    }

    public function recentActivity()
    {
        $this->authorize('viewAny', ActivityLog::class);

        $recentLogs = ActivityLog::with(['user', 'model'])
            ->where('created_at', '>=', now()->subDay())
            ->recent()
            ->limit(100)
            ->get();

        return response()->json([
            'recent_logs' => $recentLogs,
            'count' => $recentLogs->count(),
        ]);
    }
}
