<?php
namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = Auth::user();
        
        // ✅ Obtener grupos del usuario con información completa para notificaciones
        $userGroups = [];
        
        if ($user) {
            // Obtener el primer rol del usuario
            $roles = $user->roles->pluck('name')->toArray();
            $primaryRole = !empty($roles) ? $roles[0] : null;
            
                if ($primaryRole === 'estudiante') {
                $userGroups = DB::table('group_user')
                    ->join('groups', 'group_user.group_id', '=', 'groups.id')
                    ->join('subject_group', 'groups.id', '=', 'subject_group.group_id')
                    ->join('subjects', 'subject_group.subject_id', '=', 'subjects.id')
                    ->join('users', 'subject_group.user_id', '=', 'users.id')
                    ->where('group_user.user_id', $user->id)
                    ->select(
                        'groups.id',
                        'groups.nombre as group_name',     // ← aquí está el cambio importante
                        'subjects.id as subject_id',
                        'subjects.name as subject_name',
                        'users.name as teacher_name'
                    )
                    ->distinct()
                    ->get()
                    ->toArray();
          } elseif ($primaryRole === 'profesor') {
                // Para profesores: obtener grupos donde enseña
                // ✅ CORREGIDO: usando grade_name en lugar de name
                $userGroups = DB::table('subject_group')
                    ->join('groups', 'subject_group.group_id', '=', 'groups.id')
                    ->join('subjects', 'subject_group.subject_id', '=', 'subjects.id')
                    ->where('subject_group.user_id', $user->id)
                    ->select(
                        'groups.id',
                        'groups.nombre as group_name', // ✅ Corregido
                        'subjects.id as subject_id',
                        'subjects.name as subject_name'
                    )
                    ->distinct()
                    ->get()
                    ->toArray();
            }
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user
                    ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'last_name' => $user->last_name,
                        'email' => $user->email,
                        'photo' => $user->photo,
                        'document_type' => $user->document_type,
                        'document_number' => $user->document_number,
                        'phone' => $user->phone,
                        'address' => $user->address,
                        'birth_date' => $user->birth_date,
                        'is_active' => $user->is_active,
                        'roles' => $user->roles->pluck('name'),
                        // ✅ CRÍTICO: Agregar grupos para notificaciones globales
                        'groups' => $userGroups,
                    ]
                    : null,
            ],
        ]);
    }
}