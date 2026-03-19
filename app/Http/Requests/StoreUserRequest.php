<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.create');
    }

    public function rules(): array
    {
        return [
        'name'            => 'required|string|max:255',   // ← asegúrate que sigue aquí
        'last_name'       => 'required|string|max:255',   // ← ídem
        'email'           => 'required|email|unique:users,email',
        'role'            => 'required|in:estudiante,profesor,secretaria,coordinadora,rector',
        'document_type'   => 'required|string|in:CC,TI,CE',
        'document_number' => 'required|string|unique:users,document_number',
        'phone'           => 'nullable|string|max:15',
        'address'         => 'nullable|string|max:255',
        'birth_date'      => 'nullable|date',
        'password'        => 'required|min:8',
        ];
    }
}