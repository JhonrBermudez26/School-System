<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Group;
use App\Models\Schedule;
use App\Models\AcademicPeriod;
use App\Models\Attendance;
use App\Models\DisciplineRecord;
use App\Models\ActivityLog;
use App\Models\SchoolSetting;
use Spatie\Permission\Models\Role;
use App\Policies\GradePolicy;
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


class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Grade::class => GradePolicy::class,
        Subject::class => SubjectPolicy::class,
        Group::class => GroupPolicy::class,
        Schedule::class => SchedulePolicy::class,
        AcademicPeriod::class => AcademicPeriodPolicy::class,
        Attendance::class => AttendancePolicy::class,
        DisciplineRecord::class => DisciplineRecordPolicy::class,
        ManualGrade::class => GradePolicy::class,
        ActivityLog::class => ActivityLogPolicy::class,
        SchoolSetting::class => InstitutionPolicy::class,
        Role::class => RolePolicy::class,
        User::class => UserPolicy::class,
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
    }
}