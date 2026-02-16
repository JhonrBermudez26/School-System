<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasRole('rector');
    }

    public function rules(): array
    {
        $roleId = $this->route('id');
        return [
            'name' => 'required|string|max:100|unique:roles,name,' . $roleId,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ];
    }
}
