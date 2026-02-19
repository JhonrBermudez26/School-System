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
            'name' => [
                'required',
                'string',
                'max:100',
                'unique:roles,name,' . $roleId,
                'regex:/^[a-z_]+$/', // ✅ Solo minúsculas y guiones bajos
            ],
            'guard_name' => 'nullable|string|in:web',
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'El nombre del rol solo puede contener letras minúsculas y guiones bajos',
        ];
    }
}