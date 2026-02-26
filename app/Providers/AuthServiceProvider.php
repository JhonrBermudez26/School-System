<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
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
use App\Models\Folder;
use App\Models\ClassFile;
use App\Models\Conversation;
use App\Models\Message;
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
use App\Policies\ConversationPolicy;
use App\Policies\MessagePolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Mapeo de modelos a sus Policies.
     * Cada modelo con {id} en rutas DEBE tener una Policy aquí.
     */
    protected $policies = [
        // Académico
        Subject::class       => SubjectPolicy::class,
        Group::class         => GroupPolicy::class,
        Schedule::class      => SchedulePolicy::class,
        AcademicPeriod::class => AcademicPeriodPolicy::class,
        Attendance::class    => AttendancePolicy::class,
        DisciplineRecord::class => DisciplineRecordPolicy::class,
        ManualGrade::class   => ManualGradePolicy::class,

        // Contenido de clase
        Task::class          => TaskPolicy::class,
        TaskSubmission::class => TaskSubmissionPolicy::class,
        Post::class          => PostPolicy::class,
        Meeting::class       => MeetingPolicy::class,
        Folder::class        => FolderPolicy::class,
        ClassFile::class     => ClassFilePolicy::class,

        // Chat — NUEVO
        Conversation::class  => ConversationPolicy::class,
        Message::class       => MessagePolicy::class,

        // Administración
        ActivityLog::class   => ActivityLogPolicy::class,
        SchoolSetting::class => InstitutionPolicy::class,
        Role::class          => RolePolicy::class,
        User::class          => UserPolicy::class,

        // Reportes
        Boletin::class       => BoletinPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        /**
         * Gate::before — El rector bypasea todas las policies.
         * EXCEPCIÓN: acciones destructivas sobre el propio rector
         * se manejan dentro de cada Policy individualmente.
         */
        Gate::before(function (User $user, string $ability) {
            if ($user->hasRole('rector')) {
                return true;
            }
        });

        /**
         * Gate: acceso a una clase específica (subject + group).
         * Usado para verificar que un profesor o estudiante
         * pertenece a la clase antes de ver su contenido.
         */
        Gate::define('access-class', function (User $user, int $subjectId, int $groupId) {
            if ($user->hasAnyRole(['rector', 'coordinadora'])) {
                return true;
            }

            if ($user->hasRole('profesor')) {
                // subjectId === 0: solo validar grupo (caso simplificado en tareas)
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

        /**
         * Gate: acceso a grupo de asistencia (supervisión coordinadora).
         * Separa el acceso de la coordinadora al grupo específico.
         */
        Gate::define('view-group-attendance', function (User $user, Group $group) {
            return $user->hasAnyRole(['rector', 'coordinadora'])
                && $user->hasPermissionTo('attendance.view_all');
        });
    }
}