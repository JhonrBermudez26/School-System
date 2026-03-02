<?php
// app/Observers/UserObserver.php
namespace App\Observers;
use App\Models\User;
use App\Models\ActivityLog;

class UserObserver
{
    public function deleted(User $user): void
    {
        ActivityLog::record(
            userId: auth()->id() ?? 0,
            action: 'deleted',
            model: $user,
            oldValues: [
                'name'  => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(),
            ],
            newValues: []
        );
    }

    public function updated(User $user): void
    {
        // Solo auditar suspensión/activación, no cualquier update
        if ($user->wasChanged('suspended_at')) {
            $action = $user->suspended_at ? 'suspended' : 'unsuspended';
            ActivityLog::record(
                userId: auth()->id() ?? 0,
                action: $action,
                model: $user,
                oldValues: ['suspended_at' => $user->getOriginal('suspended_at')],
                newValues: ['suspended_at' => $user->suspended_at]
            );
        }

        if ($user->wasChanged('is_active')) {
            $action = $user->is_active ? 'activated' : 'deactivated';
            ActivityLog::record(
                userId: auth()->id() ?? 0,
                action: $action,
                model: $user,
                oldValues: ['is_active' => $user->getOriginal('is_active')],
                newValues: ['is_active' => $user->is_active]
            );
        }
    }
}