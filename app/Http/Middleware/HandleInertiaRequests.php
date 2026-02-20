<?php
namespace App\Http\Middleware;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\SchoolSetting;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = Auth::user();
        
        $userGroups = [];
        
        if ($user) {
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
                        'groups.nombre as group_name',
                        'subjects.id as subject_id',
                        'subjects.name as subject_name',
                        'users.name as teacher_name'
                    )
                    ->distinct()
                    ->get()
                    ->toArray();
            } elseif ($primaryRole === 'profesor') {
                $userGroups = DB::table('subject_group')
                    ->join('groups', 'subject_group.group_id', '=', 'groups.id')
                    ->join('subjects', 'subject_group.subject_id', '=', 'subjects.id')
                    ->where('subject_group.user_id', $user->id)
                    ->select(
                        'groups.id',
                        'groups.nombre as group_name',
                        'subjects.id as subject_id',
                        'subjects.name as subject_name'
                    )
                    ->distinct()
                    ->get()
                    ->toArray();
            }
        }

        // Logo del colegio para favicon y navbar
        $school = SchoolSetting::first();

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
                        'must_change_password' => $user->must_change_password,
                        'roles' => $user->roles->pluck('name'),
                        'groups' => $userGroups,
                    ]
                    : null,
            ],
            'school' => $school ? [
                'logo' => $school->logo_path ? '/storage/' . $school->logo_path : null,
                'nombre' => $school->nombre_colegio,
                'abreviacion' => $school->abreviacion,
            ] : null,
        ]);
    }
}