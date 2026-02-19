<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class InstitutionUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasRole('rector');
    }

    public function rules(): array
    {
        return [
            'nombre_colegio' => 'required|string|max:255',
            'abreviacion' => 'required|string|max:20',
            'lema' => 'nullable|string|max:500',
            'direccion' => 'nullable|string|max:255',
            'ciudad' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:20',
            'celular' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'logo' => 'nullable|image|max:2048',
            'min_grade' => 'required|numeric|min:0|max:10',
            'max_grade' => 'required|numeric|min:0|max:10|gt:min_grade',
            'passing_grade' => 'required|numeric|min:0|max:10|lte:max_grade|gte:min_grade',
            'attendance_threshold' => 'required|integer|min:0|max:100',
        ];
    }
}
