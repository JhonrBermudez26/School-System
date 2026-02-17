<?php
namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ActivityLog::class);

        $query = ActivityLog::with(['user'])
            ->orderBy('created_at', 'desc');

        // Filtros
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('model_type', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $logs = $query->paginate(50)->through(function ($log) {
            return [
                'id' => $log->id,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : null,
                'action' => $log->action,
                'model_type' => $log->model_type ? class_basename($log->model_type) : null,
                'model_id' => $log->model_id,
                'description' => $log->getActionDescription(),
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $log->created_at->diffForHumans(),
            ];
        });

        // Usuarios que tienen logs (ahora funcionará con la relación)
        $users = User::select('id', 'name', 'email')
            ->whereHas('activityLogs')
            ->orderBy('name')
            ->get();

        // Acciones únicas
        $actions = ActivityLog::distinct()
            ->pluck('action')
            ->filter()
            ->values();

        // Modelos únicos (nombres cortos)
        $modelTypes = ActivityLog::distinct()
            ->pluck('model_type')
            ->filter()
            ->map(fn($type) => class_basename($type))
            ->unique()
            ->values();

        // Estadísticas básicas
        $stats = [
            'total' => ActivityLog::count(),
            'securityAlerts' => ActivityLog::whereIn('action', ['failed_login', 'delete', 'suspend'])
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
            'activeUsers' => ActivityLog::distinct('user_id')
                ->where('created_at', '>=', now()->subDays(30))
                ->count('user_id'),
            'errorRate' => $this->calculateErrorRate(),
        ];

        return Inertia::render('Rector/Auditoria', [
            'logs' => $logs,
            'users' => $users,
            'actions' => $actions,
            'modelTypes' => $modelTypes,
            'stats' => $stats,
            'filters' => $request->only(['search', 'user_id', 'action', 'model_type', 'start_date', 'end_date']),
        ]);
    }

    private function calculateErrorRate()
    {
        $total = ActivityLog::where('created_at', '>=', now()->subDays(30))->count();
        
        if ($total === 0) {
            return 0;
        }

        $errors = ActivityLog::whereIn('action', ['failed_login', 'error', 'failed'])
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return round(($errors / $total) * 100, 2);
    }

    public function show($id)
    {
        $log = ActivityLog::with(['user'])->findOrFail($id);
        
        $this->authorize('view', $log);

        return response()->json([
            'log' => [
                'id' => $log->id,
                'user' => $log->user,
                'action' => $log->action,
                'model_type' => $log->model_type,
                'model_id' => $log->model_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at,
            ],
            'changes' => $log->getChanges(),
            'description' => $log->getActionDescription(),
        ]);
    }

    public function statistics(Request $request)
    {
        $this->authorize('viewAny', ActivityLog::class);

        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $logs = ActivityLog::whereBetween('created_at', [$startDate, $endDate]);

        $stats = [
            'total_actions' => (clone $logs)->count(),
            'by_action' => (clone $logs)
                ->select('action', \DB::raw('count(*) as count'))
                ->groupBy('action')
                ->pluck('count', 'action'),
            'by_user' => (clone $logs)
                ->with('user:id,name')
                ->select('user_id', \DB::raw('count(*) as count'))
                ->groupBy('user_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(function($item) {
                    return [
                        'user_name' => $item->user ? $item->user->name : 'Sistema',
                        'count' => $item->count
                    ];
                }),
            'by_model' => (clone $logs)
                ->select('model_type', \DB::raw('count(*) as count'))
                ->groupBy('model_type')
                ->get()
                ->mapWithKeys(function($item) {
                    return [class_basename($item->model_type) => $item->count];
                }),
            'by_day' => (clone $logs)
                ->select(
                    \DB::raw('DATE(created_at) as day'),
                    \DB::raw('count(*) as count')
                )
                ->groupBy('day')
                ->orderBy('day', 'asc')
                ->get(),
        ];

        return response()->json($stats);
    }

    public function export(Request $request)
    {
        $this->authorize('viewAny', ActivityLog::class);

        // Aquí implementarías la exportación real (CSV, Excel, PDF)
        // Por ahora retorno JSON como placeholder
        
        $query = ActivityLog::with(['user'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $logs = $query->get();

        // Aquí deberías generar el archivo (CSV/Excel/PDF)
        // Ejemplo con CSV:
        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            
            // Headers
            fputcsv($handle, [
                'ID', 'Usuario', 'Email', 'Acción', 'Modelo', 
                'IP', 'Fecha', 'Descripción'
            ]);

            // Data
            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->id,
                    $log->user?->name ?? 'Sistema',
                    $log->user?->email ?? 'N/A',
                    $log->action,
                    class_basename($log->model_type ?? 'N/A'),
                    $log->ip_address,
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->getActionDescription(),
                ]);
            }

            fclose($handle);
        }, 'auditoria-' . now()->format('Y-m-d') . '.csv');
    }

    public function recentActivity()
    {
        $this->authorize('viewAny', ActivityLog::class);

        $recentLogs = ActivityLog::with(['user'])
            ->where('created_at', '>=', now()->subDay())
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'recent_logs' => $recentLogs,
            'count' => $recentLogs->count(),
        ]);
    }
}