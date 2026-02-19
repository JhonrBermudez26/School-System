<?php

namespace App\Policies;

use App\Models\TaskSubmission;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TaskSubmissionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the submission.
     */
    public function view(User $user, TaskSubmission $submission): bool
    {
        if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
            return true;
        }

        // El profesor que creó la tarea puede verla
        if ($user->hasRole('profesor')) {
            return $submission->task->teacher_id === $user->id;
        }

        // El estudiante que creó la entrega o es miembro del grupo puede verla
        if ($user->hasRole('estudiante')) {
            if ($submission->student_id === $user->id) {
                return true;
            }

            return $submission->members()->where('student_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update (submit/edit) the submission.
     */
    public function update(User $user, TaskSubmission $submission): bool
    {
        if (!$user->hasRole('estudiante') || $submission->student_id !== $user->id) {
            return false;
        }

        // No se puede editar si ya está calificada o si la tarea cerró
        if ($submission->status === 'graded' || $submission->task->isClosed()) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can delete the submission.
     */
    public function delete(User $user, TaskSubmission $submission): bool
    {
        return $this->update($user, $submission);
    }
}
