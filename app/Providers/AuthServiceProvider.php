<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Models\ManualGrade;
use App\Models\Subject;
use App\Models\Group;
use App\Models\Schedule;
use App\Models\AcademicPeriod;
use App\Models\Attendance;
use App\Models\DisciplineRecord;
use App\Models\ActivityLog;
use App\Models\SchoolSetting;
use App\Models\Boletin;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\Post;
use App\Models\Meeting;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use App\Policies\ManualGradePolicy;
use App\Policies\Secretaria\SubjectPolicy;
use App\Policies\Secretaria\GroupPolicy;
use App\Policies\SchedulePolicy;
use App\Policies\AcademicPeriodPolicy;
use App\Policies\AttendancePolicy;
use App\Policies\DisciplineRecordPolicy;
use App\Policies\ActivityLogPolicy;
use App\Policies\InstitutionPolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use App\Policies\BoletinPolicy;
use App\Policies\TaskPolicy;
use App\Policies\TaskSubmissionPolicy;
use App\Policies\PostPolicy;
use App\Policies\MeetingPolicy;
use App\Policies\FolderPolicy;
use App\Policies\ClassFilePolicy;
use App\Models\Folder;
use App\Models\ClassFile;


class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Subject::class => SubjectPolicy::class,
        Group::class => GroupPolicy::class,
        Schedule::class => SchedulePolicy::class,
        AcademicPeriod::class => AcademicPeriodPolicy::class,
        Attendance::class => AttendancePolicy::class,
        DisciplineRecord::class => DisciplineRecordPolicy::class,
        ManualGrade::class => ManualGradePolicy::class,
        ActivityLog::class => ActivityLogPolicy::class,
        SchoolSetting::class => InstitutionPolicy::class,
        Role::class => RolePolicy::class,
        User::class => UserPolicy::class,
        Boletin::class => BoletinPolicy::class,
        Task::class => TaskPolicy::class,
        TaskSubmission::class => TaskSubmissionPolicy::class,
        Post::class => PostPolicy::class,
        Meeting::class => MeetingPolicy::class,
        Folder::class => FolderPolicy::class,
        ClassFile::class => ClassFilePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Gates personalizados (opcional)
        Gate::before(function (User $user, string $ability) {
            // El rector tiene todos los permisos
            if ($user->hasRole('rector')) {
                return true;
            }
        });


        // Verificar si un usuario tiene acceso a una clase (sujeto + grupo)
        Gate::define('access-class', function (User $user, int $subjectId, int $groupId) {
            if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
                return true;
            }

            if ($user->hasRole('profesor')) {
                // Si subjectId es 0, solo validar grupo (usado en EstudianteTaskController para simplificar)
                if ($subjectId === 0) {
                    return DB::table('subject_group')
                        ->where('user_id', $user->id)
                        ->where('group_id', $groupId)
                        ->exists();
                }

                return DB::table('subject_group')
                    ->where('user_id', $user->id)
                    ->where('subject_id', $subjectId)
                    ->where('group_id', $groupId)
                    ->exists();
            }

            if ($user->hasRole('estudiante')) {
                return DB::table('group_user')
                    ->where('group_id', $groupId)
                    ->where('user_id', $user->id)
                    ->exists();
            }

            return false;
        });
    }
}