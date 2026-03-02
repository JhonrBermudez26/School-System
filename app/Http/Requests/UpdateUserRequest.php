<?php
// Crear: app/Http/Requests/UpdateUserRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.update');
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id;

        return [
            'name'      => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users')->ignore($userId)],
            'role'      => 'required|string|in:estudiante,profesor,secretaria,coordinadora,rector',
            'password'  => 'nullable|string|min:8',
            'is_active' => 'boolean',
        ];
    }
}