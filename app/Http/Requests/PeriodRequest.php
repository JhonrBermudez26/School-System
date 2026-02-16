<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class PeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()->hasRole('coordinadora');
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'year' => 'nullable|integer|min:2000|max:2100',
            'status' => 'nullable|string|in:draft,active,closed,archived',
            'habilitado' => 'nullable|boolean',
            'directrices' => 'nullable|string|max:1000',
            'porcentaje' => 'required|numeric|min:0|max:100', // ⭐ AHORA ES OBLIGATORIO
            'password' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del periodo es obligatorio',
            'start_date.required' => 'La fecha de inicio es obligatoria',
            'end_date.required' => 'La fecha de fin es obligatoria',
            'end_date.after' => 'La fecha de fin debe ser posterior a la fecha de inicio',
            'porcentaje.required' => 'El porcentaje es obligatorio para calcular las notas finales',
            'porcentaje.numeric' => 'El porcentaje debe ser un número',
            'porcentaje.min' => 'El porcentaje no puede ser negativo',
            'porcentaje.max' => 'El porcentaje no puede exceder el 100%',
        ];
    }
}