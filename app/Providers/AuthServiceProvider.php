<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Group;
use App\Models\Schedule;
use App\Policies\Secretaria\UserPolicy;
use App\Policies\GradePolicy;
use App\Policies\Secretaria\SubjectPolicy;
use App\Policies\Secretaria\GroupPolicy;
use App\Policies\SchedulePolicy;


class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Grade::class => GradePolicy::class,
        Subject::class => SubjectPolicy::class,
        Group::class => GroupPolicy::class,
        Schedule::class => SchedulePolicy::class,
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